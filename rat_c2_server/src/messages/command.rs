// src/messages/command.rs
use serde::{Deserialize, Serialize};

/// Command to be executed on the RAT
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliCommand {
  pub command:  String,
  pub priority: u8,
}

/// Response from executing a command
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliResponse {
  pub stdout:      String,
  pub stderr:      String,
  pub return_code: i32,
}

/// Reverse shell connection request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReverseShell {
  pub ip:   String,
  pub port: u16,
}
