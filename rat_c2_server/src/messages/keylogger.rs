use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// "keystrokes": self.keys,
// "statistics": {
//     "total_keys": sum(self.key_count.values()),
//     "key_frequency": {k: v for k, v in self.key_count.most_common(10)},
//     "window_activity": dict(self.window_activity),
//     "duration": time.time() - self.start_time
// }

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KeylogDataEnvelope {
  pub is_active: bool,
  pub data:      KeylogData,
}

// Update this in your messages/keylogger.rs file
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeylogData {
  pub keystrokes: Vec<String>,
  pub statistics: KeylogStatistics,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeylogStatistics {
  pub total_keys:      i32,
  pub key_frequency:   HashMap<String, i32>,
  pub window_activity: HashMap<String, i32>,
  pub duration:        f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KeyloggerResponse {
  pub status:  String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_active: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub message: Option<String>,
}
