use shopify_function::prelude::*;
use shopify_function::scalars::JsonValue;
use std::process;

pub mod cart_delivery_options_transform_run;
pub mod config;
pub mod evaluator;
pub mod operations;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/cart_delivery_options_transform_run.graphql", custom_scalar_overrides = {
        "CartDeliveryOptionsTransformRunInput.deliveryCustomization.metafield.jsonValue" => super::JsonValue,
    })]
    pub mod cart_delivery_options_transform_run {}
}

fn main() {
    log!("Please invoke a named export.");
    process::abort();
}
