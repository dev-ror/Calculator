use super::config::{has_valid_top_level_structure, parse_configuration};
use super::evaluator::evaluate;
use super::operations;
use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function]
fn cart_delivery_options_transform_run(
    input: schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> Result<schema::CartDeliveryOptionsTransformRunResult> {
    let no_changes = schema::CartDeliveryOptionsTransformRunResult { operations: vec![] };

    let configuration = match input.delivery_customization().metafield() {
        Some(metafield) => metafield.json_value(),
        None => return Ok(no_changes),
    };

    if !has_valid_top_level_structure(configuration) {
        return Ok(no_changes);
    }

    let configuration = match parse_configuration(configuration) {
        Ok(configuration) => configuration,
        Err(_) => return Ok(no_changes),
    };

    if configuration.test_mode && !has_test_checkout_name(&input) {
        return Ok(no_changes);
    }

    let matched_customizations = evaluate(&configuration, &input);
    let operations = operations::build(&matched_customizations, input.cart().delivery_groups());

    Ok(schema::CartDeliveryOptionsTransformRunResult { operations })
}

fn has_test_checkout_name(
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> bool {
    input
        .cart()
        .delivery_groups()
        .iter()
        .filter_map(|group| group.delivery_address())
        .filter_map(|address| address.first_name())
        .any(|first_name| is_test_name(first_name))
}

fn is_test_name(first_name: &str) -> bool {
    first_name.trim().eq_ignore_ascii_case("shipflux")
}

#[cfg(test)]
mod tests {
    use super::is_test_name;

    #[test]
    fn accepts_only_the_shipflux_test_name() {
        assert!(is_test_name("shipflux"));
        assert!(is_test_name(" ShipFlux "));
        assert!(!is_test_name("Muhammad"));
        assert!(!is_test_name(""));
    }
}
