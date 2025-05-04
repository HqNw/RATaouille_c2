// src/messages/file.rs
use serde::{Deserialize, Serialize};
use std::time;

/// Represents a file download request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileRequest {
  pub file_path: String,
}

/// Status of a file download operation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FileDownloadStatus {
  InProgress(FileDownloadStatusData),
  Complete(FileDownloadStatusData),
  Failed,
}

/// Detailed information about a file download
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct FileDownloadStatusData {
  pub download_id:      u32,
  pub rat_id:           i32,
  pub file_path:        String,
  pub timestamp:        u64,
  pub downloadedchunks: u32,
  pub totalchunks:      u32,
}

/// A chunk of a file being transferred
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileTransferChunk {
  pub transfer_id:  u32,
  pub file_name:    String,
  pub chunk_number: u32,
  pub total_chunks: u32,
  pub data:         String,
}

/// Result of a file transfer operation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileTransferResult {
  pub transfer_id: u32,
  pub status:      FileDownloadStatus,
  pub message:     String,
}

/// Directory listing request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListDir {
  pub path:  String,
  pub depth: u8,
}

/// Information about items in a directory
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DirItem {
  pub files: Vec<FileNode>,
}

/// Information about a file
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileItem {
  pub size:     u64,
  pub modified: u64,
}

/// Combined file/directory node data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNodeData {
  pub name:     String,
  pub path:     String,
  pub filetype: String,
  pub node:     FileNode,
}

/// Enum representing either a file or directory
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FileNode {
  File(FileItem),
  Directory(DirItem),
}

/// Screenshot data and metadata
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
      timestamp: time::SystemTime::now().duration_since(time::UNIX_EPOCH).unwrap().as_secs(),
    }
  }
}
