use crate::config::CustomizationCondition;
use crate::schema;
use crate::schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::lines::Merchandise;

pub fn match_condition(
    condition: &CustomizationCondition,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> bool {
    let Some(expected) = condition
        .value
        .as_deref()
        .or(condition.match_value.as_deref())
    else {
        return false;
    };
    let operator = normalize(&condition.operator.as_deref().unwrap_or("equals"));

    let values = values_for(&condition.field, input);
    if values.is_empty() {
        return false;
    }

    if matches!(operator.as_str(), "not_equals" | "not_contains") {
        values
            .iter()
            .all(|actual| compare(actual, expected, &operator))
    } else {
        values
            .iter()
            .any(|actual| compare(actual, expected, &operator))
    }
}

fn values_for(
    field: &str,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> Vec<String> {
    match normalize(field).as_str() {
        "delivery_method_name" | "delivery_method" | "shipping_method" => input
            .cart()
            .delivery_groups()
            .iter()
            .flat_map(|group| group.delivery_options())
            .filter_map(|option| option.title().cloned())
            .collect(),
        "country" | "country_code" => input
            .cart()
            .delivery_groups()
            .iter()
            .filter_map(|group| group.delivery_address())
            .filter_map(|address| address.country_code().map(|code| format!("{code:?}")))
            .collect(),
        "province" | "province_code" => input
            .cart()
            .delivery_groups()
            .iter()
            .filter_map(|group| group.delivery_address())
            .filter_map(|address| address.province_code().cloned())
            .collect(),
        "postal_code" | "postcode" | "zip" => input
            .cart()
            .delivery_groups()
            .iter()
            .filter_map(|group| group.delivery_address())
            .filter_map(|address| address.zip().cloned())
            .collect(),
        "customer_tag" | "customer_tags" => input
            .cart()
            .buyer_identity()
            .and_then(|identity| identity.customer())
            .map(|customer| {
                customer
                    .has_tags()
                    .iter()
                    .filter(|tag| *tag.has_tag())
                    .map(|tag| tag.tag().to_string())
                    .collect()
            })
            .unwrap_or_default(),
        "product_tag" | "product_tags" => input
            .cart()
            .lines()
            .iter()
            .filter_map(|line| match line.merchandise() {
                Merchandise::ProductVariant(variant) => Some(variant),
                _ => None,
            })
            .flat_map(|variant| variant.product().has_tags())
            .filter(|tag| *tag.has_tag())
            .map(|tag| tag.tag().to_string())
            .collect(),
        "cart_subtotal" | "subtotal" => vec![input
            .cart()
            .cost()
            .subtotal_amount()
            .amount()
            .as_f64()
            .to_string()],
        "cart_quantity" | "quantity" => vec![input
            .cart()
            .lines()
            .iter()
            .map(|line| i64::from(*line.quantity()))
            .sum::<i64>()
            .to_string()],
        _ => vec![],
    }
}

fn compare(actual: &str, expected: &str, operator: &str) -> bool {
    let actual = actual.trim().to_lowercase();
    let expected = expected.trim().to_lowercase();

    match operator {
        "equals" => actual == expected,
        "not_equals" => actual != expected,
        "contains" => actual.contains(&expected),
        "not_contains" => !actual.contains(&expected),
        "starts_with" => actual.starts_with(&expected),
        "ends_with" => actual.ends_with(&expected),
        _ => false,
    }
}

fn normalize(value: &str) -> String {
    value
        .trim()
        .chars()
        .flat_map(char::to_lowercase)
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character
            } else {
                '_'
            }
        })
        .collect::<String>()
        .split('_')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("_")
}

#[cfg(test)]
mod tests {
    use super::{compare, normalize};

    #[test]
    fn supports_persisted_operators() {
        assert!(compare("Express Shipping", "express", "contains"));
        assert!(compare("Express Shipping", "standard", "not_contains"));
        assert!(compare("Express Shipping", "express", "starts_with"));
        assert!(compare("Express Shipping", "shipping", "ends_with"));
        assert!(compare("Express", "express", "equals"));
        assert!(compare("Express", "standard", "not_equals"));
    }

    #[test]
    fn normalizes_persisted_labels() {
        assert_eq!(normalize("Delivery Method Name"), "delivery_method_name");
        assert_eq!(normalize("not-equals"), "not_equals");
    }
}
