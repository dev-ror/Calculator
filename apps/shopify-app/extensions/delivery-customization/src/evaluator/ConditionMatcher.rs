use crate::config::CustomizationCondition;
use crate::schema;
use crate::schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::lines::Merchandise;

pub fn match_condition(
    condition: &CustomizationCondition,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> bool {
    let field = normalize(&condition.field);
    if field == "always" {
        return true;
    }
    if field == "address_is_a_po_box" || field == "address_is_not_a_po_box" {
        let addresses = address_values(input);
        if addresses.is_empty() {
            return false;
        }
        let is_po_box = addresses.iter().any(|value| is_po_box(value));
        return if field == "address_is_a_po_box" {
            is_po_box
        } else {
            !is_po_box
        };
    }

    let expected = condition.value.as_deref().unwrap_or("");
    let mut operator = normalize(condition.operator.as_deref().unwrap_or("equals"));
    if is_numeric_field(&field) {
        operator = match operator.as_str() {
            "equals" => "numeric_equals".to_string(),
            "not_equals" => "numeric_not_equals".to_string(),
            _ => operator,
        };
    }
    let product_field = is_product_field(&field);

    if product_field {
        return match_product_condition(condition, input, expected, &operator);
    }

    let values = values_for(condition, &field, input);
    compare_values(&values, expected, &operator)
}

fn match_product_condition(
    condition: &CustomizationCondition,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
    expected: &str,
    operator: &str,
) -> bool {
    let field = normalize(&condition.field);
    let lines: Vec<_> = input.cart().lines().iter().collect();
    if lines.is_empty() {
        return false;
    }
    let matches: Vec<bool> = lines
        .iter()
        .map(|line| compare_values(&line_values(&field, line), expected, operator))
        .collect();
    let mode = normalize(condition.product_match.as_deref().unwrap_or("at-least-one"));
    let threshold = condition
        .match_value
        .as_deref()
        .and_then(|value| value.trim().parse::<f64>().ok());
    let matched_quantity: i64 = lines
        .iter()
        .zip(matches.iter())
        .filter(|(_, matches)| **matches)
        .map(|(line, _)| i64::from(*line.quantity()))
        .sum();
    let matched_amount: f64 = lines
        .iter()
        .zip(matches.iter())
        .filter(|(_, matches)| **matches)
        .map(|(line, _)| line.cost().subtotal_amount().amount().as_f64())
        .sum();

    match mode.as_str() {
        "all_products" => matches.iter().all(|matches| *matches),
        "exact_quantity" => threshold.is_some_and(|value| matched_quantity as f64 == value),
        "more_quantity" => threshold.is_some_and(|value| matched_quantity as f64 > value),
        "not_more_quantity" => threshold.is_some_and(|value| matched_quantity as f64 <= value),
        "more_amount" => threshold.is_some_and(|value| matched_amount > value),
        "not_more_amount" => threshold.is_some_and(|value| matched_amount <= value),
        _ => matches.iter().any(|matches| *matches),
    }
}

fn values_for(
    condition: &CustomizationCondition,
    field: &str,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> Vec<String> {
    match field {
        "shipping_method_name" | "delivery_method_name" | "delivery_method" | "shipping_method" => {
            delivery_options(input)
                .filter_map(|option| option.title().cloned())
                .collect()
        }
        "shipping_rate" => delivery_options(input)
            .filter(|option| {
                condition.key.as_deref().is_none_or(|method_name| {
                    option
                        .title()
                        .is_some_and(|title| title.trim().eq_ignore_ascii_case(method_name.trim()))
                })
            })
            .map(|option| option.cost().amount().as_f64().to_string())
            .collect(),
        "country_code" => addresses(input)
            .filter_map(|address| address.country_code().map(|code| format!("{code:?}")))
            .collect(),
        "province_state_code" | "province_code" => addresses(input)
            .filter_map(|address| address.province_code().cloned())
            .collect(),
        "zipcode_postcode" | "postal_code" | "postcode" | "zip" => addresses(input)
            .filter_map(|address| address.zip().cloned())
            .collect(),
        "address_line_1" => address_values(input),
        "customer_tag" => input
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
        "customer_logged_in" => vec![input
            .cart()
            .buyer_identity()
            .map(|identity| *identity.is_authenticated())
            .unwrap_or(false)
            .to_string()],
        "customer_company" => input
            .cart()
            .buyer_identity()
            .and_then(|identity| identity.purchasing_company())
            .map(|purchasing_company| vec![purchasing_company.company().name().to_string()])
            .unwrap_or_default(),
        "customer_first_name" => addresses(input)
            .filter_map(|address| address.first_name().cloned())
            .collect(),
        "cart_subtotal" => vec![input
            .cart()
            .cost()
            .subtotal_amount()
            .amount()
            .as_f64()
            .to_string()],
        "cart_quantity" => vec![input
            .cart()
            .lines()
            .iter()
            .map(|line| i64::from(*line.quantity()))
            .sum::<i64>()
            .to_string()],
        "cart_weight" => vec![input
            .cart()
            .lines()
            .iter()
            .map(|line| {
                let weight = match line.merchandise() {
                    Merchandise::ProductVariant(variant) => {
                        variant.weight().copied().unwrap_or(0.0)
                    }
                    _ => 0.0,
                };
                weight * f64::from(*line.quantity())
            })
            .sum::<f64>()
            .to_string()],
        "number_of_vendors" => {
            let mut vendors: Vec<String> = input
                .cart()
                .lines()
                .iter()
                .filter_map(|line| match line.merchandise() {
                    Merchandise::ProductVariant(variant) => {
                        variant.product().vendor().map(|value| normalize(value))
                    }
                    _ => None,
                })
                .collect();
            vendors.sort();
            vendors.dedup();
            vec![vendors.len().to_string()]
        }
        _ => vec![],
    }
}

fn line_values(
    field: &str,
    line: &schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::Lines,
) -> Vec<String> {
    let Merchandise::ProductVariant(variant) = line.merchandise() else {
        return vec![];
    };
    match field {
        "product_tag" => variant
            .product()
            .has_tags()
            .iter()
            .filter(|tag| *tag.has_tag())
            .map(|tag| tag.tag().to_string())
            .collect(),
        "product_title" => vec![variant.product().title().to_string()],
        "product_type" => variant
            .product()
            .product_type()
            .cloned()
            .map(|value| vec![value])
            .unwrap_or_default(),
        "product_vendor" => variant
            .product()
            .vendor()
            .cloned()
            .map(|value| vec![value])
            .unwrap_or_default(),
        "variant_title" => variant
            .title()
            .cloned()
            .map(|value| vec![value])
            .unwrap_or_default(),
        "sku" => variant
            .sku()
            .cloned()
            .map(|value| vec![value])
            .unwrap_or_default(),
        "product_weight" => variant
            .weight()
            .map(|value| vec![value.to_string()])
            .unwrap_or_default(),
        "product_price" => vec![line
            .cost()
            .amount_per_quantity()
            .amount()
            .as_f64()
            .to_string()],
        "product_collection" => vec![],
        "is_subscription_product" => vec![line.selling_plan_allocation().is_some().to_string()],
        _ => vec![],
    }
}

fn compare_values(values: &[String], expected: &str, operator: &str) -> bool {
    if operator == "is_empty" {
        return values.is_empty() || values.iter().all(|value| value.trim().is_empty());
    }
    if operator == "is_not_empty" {
        return values.iter().any(|value| !value.trim().is_empty());
    }
    if operator == "true" || operator == "false" {
        let wanted = operator == "true";
        return values
            .iter()
            .any(|value| value.eq_ignore_ascii_case(&wanted.to_string()));
    }
    if expected.trim().is_empty() {
        return false;
    }
    let negative = matches!(
        operator,
        "not_equals"
            | "numeric_not_equals"
            | "does_not_contain"
            | "does_not_contains"
            | "not_contains"
            | "not_included"
            | "not_includes_in_list"
    );
    if values.is_empty() {
        return negative;
    }
    if negative {
        values
            .iter()
            .all(|actual| compare(actual, expected, operator))
    } else {
        values
            .iter()
            .any(|actual| compare(actual, expected, operator))
    }
}

fn compare(actual: &str, expected: &str, operator: &str) -> bool {
    let actual = actual.trim();
    let expected = expected.trim();
    let actual_lower = actual.to_lowercase();
    let expected_lower = expected.to_lowercase();
    let expected_list: Vec<_> = expected
        .split(',')
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty())
        .collect();
    match operator {
        "equals" => {
            actual_lower == expected_lower
                || (expected_list.len() > 1 && expected_list.contains(&actual_lower))
        }
        "not_equals" => {
            actual_lower != expected_lower
                && (expected_list.len() <= 1 || !expected_list.contains(&actual_lower))
        }
        "contains" => actual_lower.contains(&expected_lower),
        "does_not_contain" | "does_not_contains" | "not_contains" => {
            !actual_lower.contains(&expected_lower)
        }
        "includes" | "included" | "includes_in_list" => expected_list.contains(&actual_lower),
        "not_included" | "not_includes_in_list" => !expected_list.contains(&actual_lower),
        "starts_with" => actual_lower.starts_with(&expected_lower),
        "ends_with" => actual_lower.ends_with(&expected_lower),
        "numeric_equals" => numeric(actual, expected, |left, right| left == right),
        "numeric_not_equals" => numeric(actual, expected, |left, right| left != right),
        "greater_than" => numeric(actual, expected, |left, right| left > right),
        "greater_than_or_equal" => numeric(actual, expected, |left, right| left >= right),
        "less_than" => numeric(actual, expected, |left, right| left < right),
        "less_than_or_equal" => numeric(actual, expected, |left, right| left <= right),
        _ => false,
    }
}

fn numeric(actual: &str, expected: &str, predicate: impl Fn(f64, f64) -> bool) -> bool {
    match (actual.trim().parse::<f64>(), expected.trim().parse::<f64>()) {
        (Ok(actual), Ok(expected)) => predicate(actual, expected),
        _ => false,
    }
}

fn is_product_field(field: &str) -> bool {
    matches!(
        field,
        "product_tag"
            | "product_title"
            | "product_type"
            | "product_weight"
            | "product_vendor"
            | "variant_title"
            | "product_price"
            | "product_collection"
            | "sku"
            | "is_subscription_product"
    )
}

fn is_numeric_field(field: &str) -> bool {
    matches!(
        field,
        "cart_subtotal"
            | "cart_quantity"
            | "cart_weight"
            | "product_weight"
            | "product_price"
            | "shipping_rate"
            | "number_of_vendors"
    )
}

fn delivery_options(input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput) -> impl Iterator<Item = &schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::delivery_groups::DeliveryOptions>{
    input
        .cart()
        .delivery_groups()
        .iter()
        .flat_map(|group| group.delivery_options())
}
fn addresses(input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput) -> impl Iterator<Item = &schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::delivery_groups::DeliveryAddress>{
    input
        .cart()
        .delivery_groups()
        .iter()
        .filter_map(|group| group.delivery_address())
}
fn address_values(
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> Vec<String> {
    addresses(input)
        .filter_map(|address| address.address_1().cloned())
        .collect()
}
fn is_po_box(value: &str) -> bool {
    let compact: String = value
        .to_lowercase()
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .collect();
    compact.contains("pobox") || compact.contains("postofficebox")
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
    use super::{compare, compare_values, is_numeric_field, is_po_box, normalize};
    #[test]
    fn supports_string_operators() {
        assert!(compare("Express Shipping", "express", "contains"));
        assert!(compare("Express Shipping", "standard", "does_not_contain"));
        assert!(compare("Express", "STANDARD", "not_equals"));
        assert!(compare("Express", "express,standard", "includes_in_list"));
        assert!(compare("Express", "standard,economy", "not_included"));
        assert!(compare("Express", "standard, express", "equals"));
        assert!(compare("Express", "exp", "starts_with"));
        assert!(compare("Express", "press", "ends_with"));
    }
    #[test]
    fn numeric_comparison_is_numeric() {
        assert!(compare("10", "2", "greater_than"));
        assert!(compare("10", "10", "greater_than_or_equal"));
        assert!(compare("2", "10", "less_than"));
        assert!(compare("10", "10", "less_than_or_equal"));
        assert!(compare("10", "2", "numeric_not_equals"));
        assert!(!compare("bad", "2", "greater_than"));
        assert!(compare("10.0", "10", "numeric_equals"));
    }

    #[test]
    fn supports_empty_and_boolean_operators() {
        assert!(compare_values(&[], "", "is_empty"));
        assert!(compare_values(&["".into()], "", "is_empty"));
        assert!(compare_values(&["Express".into()], "", "is_not_empty"));
        assert!(compare_values(&["true".into()], "", "true"));
        assert!(compare_values(&["false".into()], "", "false"));
        assert!(!compare_values(&[], "", "true"));
        assert!(!compare_values(&["Express".into()], "", "contains"));
        assert!(!compare_values(&["Express".into()], "", "not_equals"));
    }
    #[test]
    fn negative_matching_requires_all_values() {
        assert!(!compare_values(
            &["elite".into(), "sale".into()],
            "elite",
            "not_equals"
        ));
    }
    #[test]
    fn detects_po_boxes() {
        assert!(is_po_box("P.O. Box 123"));
        assert!(is_po_box("Post Office Box 7"));
        assert!(!is_po_box("123 Main St"));
    }
    #[test]
    fn normalizes_ui_labels() {
        assert_eq!(normalize("Province / State Code"), "province_state_code");
        assert_eq!(normalize("Greater than or equal"), "greater_than_or_equal");
    }

    #[test]
    fn identifies_only_numeric_condition_fields() {
        assert!(is_numeric_field("cart_subtotal"));
        assert!(is_numeric_field("shipping_rate"));
        assert!(!is_numeric_field("sku"));
    }
}
