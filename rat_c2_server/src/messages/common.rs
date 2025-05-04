// src/messages/common.rs
use serde::{Deserialize, Serialize};

/// Base message envelope used for communication between components
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MessageEnvelope {
  pub version: u32,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub rat_id:  Option<i32>,
  pub message: MessageType,
}

/// The primary message type differentiating between Rat-to-C2 and C2-to-Rat messages
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum MessageType {
  /// Rat-to-C2 messages (from Rat to Command & Control server)
  R2C(super::rat::R2CMessageType),
  /// C2-to-Rat messages (from Command & Control server to Rat)
  C2R(super::rat::C2RMessageType),
  /// Backend-to-Server messages (from Backend to Server)
  Backend(super::backend::BackendMessageType),
}

/// Status responses used throughout the system
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ResponseStatus {
  /// Operation completed successfully with response data
  Success(super::backend::ResponseType),
  /// Operation failed
  Failure,
  /// Operation is still in progress
  InProgress,
}

/// Basic metadata about the system where the RAT is running
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

/// Metadata with RAT ID included for backend use
#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MetadataWithId {
  pub ratId:        i32,
  pub connected:     bool,
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

/// Helper method to convert from Metadata to MetadataWithId
impl MetadataWithId {
  pub fn from_metadata(metadata: Metadata, rat_id: i32) -> Self {
    Self {
      ratId:        rat_id,
      connected:    MetadataWithId::default().connected,
      os:           metadata.os,
      cpu:          metadata.cpu,
      cpu_usage:    metadata.cpu_usage,
      memory:       metadata.memory,
      memory_usage: metadata.memory_usage,
      storage:      metadata.storage,
      used_storage: metadata.used_storage,
      user:         metadata.user,
      timestamp:    metadata.timestamp,
      ip:           metadata.ip,
      location:     metadata.location,
      hostname:     metadata.hostname,
    }
    }
  }
  
  impl Default for MetadataWithId {
    fn default() -> Self {
      Self {
        ratId: 0,
        connected: true,
        os: String::new(),
        cpu: 0,
        cpu_usage: 0.0,
        memory: 0,
        memory_usage: 0.0,
        storage: 0,
        used_storage: 0,
        user: String::new(),
        timestamp: 0,
        ip: String::new(),
        location: String::new(),
        hostname: String::new(),
      }
    }
  }
