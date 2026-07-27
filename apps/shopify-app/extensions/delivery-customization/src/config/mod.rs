mod models;
mod parser;

pub use models::{
    Configuration, Customization, CustomizationCondition, CustomizationMethod, RateCondition,
    RateDefinition, RateRule, ShopConfiguration,
};
pub use parser::{has_valid_top_level_structure, parse_configuration, ParseError};
