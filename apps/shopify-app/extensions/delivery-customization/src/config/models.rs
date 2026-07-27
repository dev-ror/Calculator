use shopify_function::prelude::*;

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct Configuration {
    pub shop: ShopConfiguration,
    pub test_mode: bool,
    pub customizations: Vec<Customization>,
    pub rate_rules: Vec<RateRule>,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct ShopConfiguration {
    pub id: String,
    pub shop_domain: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct Customization {
    pub id: String,
    pub shop_id: String,
    pub name: String,
    pub r#type: String,
    pub status: String,
    pub parameter_set: i32,
    pub condition_match: String,
    pub shipment_scope: String,
    pub version: i32,
    pub created_at: String,
    pub updated_at: String,
    pub conditions: Vec<CustomizationCondition>,
    pub methods: Vec<CustomizationMethod>,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct CustomizationCondition {
    pub id: String,
    pub shop_id: String,
    pub customization_id: String,
    pub position: i32,
    pub field: String,
    pub operator: Option<String>,
    pub key: Option<String>,
    pub value: Option<String>,
    pub product_match: Option<String>,
    pub match_value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct CustomizationMethod {
    pub id: String,
    pub shop_id: String,
    pub customization_id: String,
    pub position: i32,
    pub value: String,
    pub replacement_value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct RateRule {
    pub id: String,
    pub shop_id: String,
    pub name: String,
    pub priority: i32,
    pub status: String,
    pub condition_match: String,
    pub exclusivity: String,
    pub version: i32,
    pub created_at: String,
    pub updated_at: String,
    pub conditions: Vec<RateCondition>,
    pub rates: Vec<RateDefinition>,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct RateCondition {
    pub id: String,
    pub shop_id: String,
    pub rate_rule_id: String,
    pub position: i32,
    pub field: String,
    pub subfield: Option<String>,
    pub key: Option<String>,
    pub operator: String,
    pub value: Option<String>,
    pub quantity_check: Option<String>,
    pub quantity_value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[shopify_function(rename_all = "camelCase")]
pub struct RateDefinition {
    pub id: String,
    pub shop_id: String,
    pub rate_rule_id: String,
    pub position: i32,
    pub zone_key: String,
    pub name: String,
    pub calculation: String,
    pub price: Option<f64>,
    pub description: Option<String>,
    pub minimum_days: Option<i32>,
    pub maximum_days: Option<i32>,
    pub currency_code: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}
