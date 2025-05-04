// src/messages/heartbeat.rs
use super::common::Metadata;
use serde::{Deserialize, Serialize};

/// First heartbeat sent by a RAT when it connects
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FirstBeat {
  pub version: u32,
  pub rat_id:  Option<i32>,
  pub key:     String,
}

/// Types of heartbeats that can be exchanged
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum HeartbeatType {
  First(FirstBeat),
  Regular(Metadata),
}
