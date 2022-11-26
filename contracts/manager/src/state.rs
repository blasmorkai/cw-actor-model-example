use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cw_storage_plus::Map;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub count: i32,         // Mimic the value of the counter in the 
    pub address: String
}

// (&MAP_KEY, &contract) - MAP_KEY is a constant
pub const CONTRACTS: Map<(&str, &str), State> = Map::new("contracts");
