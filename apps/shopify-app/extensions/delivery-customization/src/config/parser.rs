use super::models::{
    Configuration, Customization, CustomizationCondition, CustomizationMethod, RateCondition,
    RateDefinition, RateRule, ShopConfiguration,
};
use shopify_function::scalars::JsonValue;
use std::collections::BTreeMap;

#[derive(Clone, Debug, PartialEq)]
pub enum ParseError {
    ExpectedObject(&'static str),
    ExpectedArray(&'static str),
    MissingField(&'static str),
    InvalidField(&'static str),
}

type Object = BTreeMap<String, JsonValue>;

pub fn has_valid_top_level_structure(configuration: &JsonValue) -> bool {
    let JsonValue::Object(configuration) = configuration else {
        return false;
    };

    matches!(configuration.get("shop"), Some(JsonValue::Object(_)))
        && matches!(
            configuration.get("customizations"),
            Some(JsonValue::Array(_))
        )
        && matches!(configuration.get("rateRules"), Some(JsonValue::Array(_)))
}

pub fn parse_configuration(configuration: &JsonValue) -> Result<Configuration, ParseError> {
    let configuration = object(configuration, "configuration")?;

    Ok(Configuration {
        test_mode: boolean(configuration, "testMode")?,
        shop: parse_shop(required(configuration, "shop")?)?,
        customizations: parse_array(
            required(configuration, "customizations")?,
            "customizations",
            parse_customization,
        )?,
        rate_rules: parse_array(
            required(configuration, "rateRules")?,
            "rateRules",
            parse_rate_rule,
        )?,
    })
}

fn parse_shop(value: &JsonValue) -> Result<ShopConfiguration, ParseError> {
    let value = object(value, "shop")?;

    Ok(ShopConfiguration {
        id: string(value, "id")?,
        shop_domain: string(value, "shopDomain")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
    })
}

fn parse_customization(value: &JsonValue) -> Result<Customization, ParseError> {
    let value = object(value, "customization")?;

    Ok(Customization {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        name: string(value, "name")?,
        r#type: string(value, "type")?,
        status: string(value, "status")?,
        parameter_set: integer(value, "parameterSet")?,
        condition_match: string(value, "conditionMatch")?,
        shipment_scope: string(value, "shipmentScope")?,
        version: integer(value, "version")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
        conditions: parse_array(
            required(value, "conditions")?,
            "customization.conditions",
            parse_customization_condition,
        )?,
        methods: parse_array(
            required(value, "methods")?,
            "customization.methods",
            parse_customization_method,
        )?,
    })
}

fn parse_customization_condition(value: &JsonValue) -> Result<CustomizationCondition, ParseError> {
    let value = object(value, "customization condition")?;

    Ok(CustomizationCondition {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        customization_id: string(value, "customizationId")?,
        position: integer(value, "position")?,
        field: string(value, "field")?,
        operator: optional_string(value, "operator")?,
        key: optional_string(value, "key")?,
        value: optional_string(value, "value")?,
        product_match: optional_string(value, "productMatch")?,
        match_value: optional_string(value, "matchValue")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
    })
}

fn parse_customization_method(value: &JsonValue) -> Result<CustomizationMethod, ParseError> {
    let value = object(value, "customization method")?;

    Ok(CustomizationMethod {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        customization_id: string(value, "customizationId")?,
        position: integer(value, "position")?,
        value: string(value, "value")?,
        replacement_value: optional_string(value, "replacementValue")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
    })
}

fn parse_rate_rule(value: &JsonValue) -> Result<RateRule, ParseError> {
    let value = object(value, "rate rule")?;

    Ok(RateRule {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        name: string(value, "name")?,
        priority: integer(value, "priority")?,
        status: string(value, "status")?,
        condition_match: string(value, "conditionMatch")?,
        exclusivity: string(value, "exclusivity")?,
        version: integer(value, "version")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
        conditions: parse_array(
            required(value, "conditions")?,
            "rateRule.conditions",
            parse_rate_condition,
        )?,
        rates: parse_array(
            required(value, "rates")?,
            "rateRule.rates",
            parse_rate_definition,
        )?,
    })
}

fn parse_rate_condition(value: &JsonValue) -> Result<RateCondition, ParseError> {
    let value = object(value, "rate condition")?;

    Ok(RateCondition {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        rate_rule_id: string(value, "rateRuleId")?,
        position: integer(value, "position")?,
        field: string(value, "field")?,
        subfield: optional_string(value, "subfield")?,
        key: optional_string(value, "key")?,
        operator: string(value, "operator")?,
        value: optional_string(value, "value")?,
        quantity_check: optional_string(value, "quantityCheck")?,
        quantity_value: optional_string(value, "quantityValue")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
    })
}

fn parse_rate_definition(value: &JsonValue) -> Result<RateDefinition, ParseError> {
    let value = object(value, "rate definition")?;

    Ok(RateDefinition {
        id: string(value, "id")?,
        shop_id: string(value, "shopId")?,
        rate_rule_id: string(value, "rateRuleId")?,
        position: integer(value, "position")?,
        zone_key: string(value, "zoneKey")?,
        name: string(value, "name")?,
        calculation: string(value, "calculation")?,
        price: optional_number(value, "price")?,
        description: optional_string(value, "description")?,
        minimum_days: optional_integer(value, "minimumDays")?,
        maximum_days: optional_integer(value, "maximumDays")?,
        currency_code: string(value, "currencyCode")?,
        status: string(value, "status")?,
        created_at: string(value, "createdAt")?,
        updated_at: string(value, "updatedAt")?,
    })
}

fn object<'a>(value: &'a JsonValue, name: &'static str) -> Result<&'a Object, ParseError> {
    match value {
        JsonValue::Object(value) => Ok(value),
        _ => Err(ParseError::ExpectedObject(name)),
    }
}

fn parse_array<T>(
    value: &JsonValue,
    name: &'static str,
    parser: fn(&JsonValue) -> Result<T, ParseError>,
) -> Result<Vec<T>, ParseError> {
    let JsonValue::Array(values) = value else {
        return Err(ParseError::ExpectedArray(name));
    };

    values.iter().map(parser).collect()
}

fn required<'a>(value: &'a Object, key: &'static str) -> Result<&'a JsonValue, ParseError> {
    value.get(key).ok_or(ParseError::MissingField(key))
}

fn string(value: &Object, key: &'static str) -> Result<String, ParseError> {
    match required(value, key)? {
        JsonValue::String(value) => Ok(value.clone()),
        _ => Err(ParseError::InvalidField(key)),
    }
}

fn boolean(value: &Object, key: &'static str) -> Result<bool, ParseError> {
    match required(value, key)? {
        JsonValue::Boolean(value) => Ok(*value),
        _ => Err(ParseError::InvalidField(key)),
    }
}

fn optional_string(value: &Object, key: &'static str) -> Result<Option<String>, ParseError> {
    match value.get(key) {
        None | Some(JsonValue::Null) => Ok(None),
        Some(JsonValue::String(value)) => Ok(Some(value.clone())),
        _ => Err(ParseError::InvalidField(key)),
    }
}

fn integer(value: &Object, key: &'static str) -> Result<i32, ParseError> {
    match required(value, key)? {
        JsonValue::Number(value)
            if value.fract() == 0.0 && *value >= i32::MIN as f64 && *value <= i32::MAX as f64 =>
        {
            Ok(*value as i32)
        }
        _ => Err(ParseError::InvalidField(key)),
    }
}

fn optional_integer(value: &Object, key: &'static str) -> Result<Option<i32>, ParseError> {
    match value.get(key) {
        None | Some(JsonValue::Null) => Ok(None),
        Some(JsonValue::Number(value))
            if value.fract() == 0.0 && *value >= i32::MIN as f64 && *value <= i32::MAX as f64 =>
        {
            Ok(Some(*value as i32))
        }
        _ => Err(ParseError::InvalidField(key)),
    }
}

fn optional_number(value: &Object, key: &'static str) -> Result<Option<f64>, ParseError> {
    match value.get(key) {
        None | Some(JsonValue::Null) => Ok(None),
        Some(JsonValue::Number(value)) if value.is_finite() => Ok(Some(*value)),
        _ => Err(ParseError::InvalidField(key)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_configuration() -> JsonValue {
        JsonValue::Object(Object::from([
            ("testMode".to_string(), JsonValue::Boolean(true)),
            (
                "shop".to_string(),
                JsonValue::Object(Object::from([
                    ("id".to_string(), JsonValue::String("shop-1".to_string())),
                    (
                        "shopDomain".to_string(),
                        JsonValue::String("example.myshopify.com".to_string()),
                    ),
                    (
                        "createdAt".to_string(),
                        JsonValue::String("2026-07-26T00:00:00.000Z".to_string()),
                    ),
                    (
                        "updatedAt".to_string(),
                        JsonValue::String("2026-07-26T00:00:00.000Z".to_string()),
                    ),
                ])),
            ),
            ("customizations".to_string(), JsonValue::Array(vec![])),
            ("rateRules".to_string(), JsonValue::Array(vec![])),
        ]))
    }

    #[test]
    fn parses_valid_configuration() {
        let configuration = parse_configuration(&valid_configuration()).unwrap();

        assert!(configuration.test_mode);
        assert_eq!(configuration.shop.id, "shop-1");
        assert!(configuration.customizations.is_empty());
        assert!(configuration.rate_rules.is_empty());
    }

    #[test]
    fn rejects_invalid_configuration() {
        let result = parse_configuration(&JsonValue::String("invalid".to_string()));

        assert!(matches!(
            result,
            Err(ParseError::ExpectedObject("configuration"))
        ));
    }
}
