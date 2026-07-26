use crate::config::Customization;
use crate::schema;
use std::collections::BTreeSet;

pub fn build(
    customizations: &[Customization],
    delivery_groups: &[schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::DeliveryGroups],
) -> Vec<schema::Operation> {
    let delivery_options = delivery_groups
        .iter()
        .flat_map(|group| group.delivery_options())
        .filter_map(|option| {
            option
                .title()
                .map(|title| (option.handle().to_string(), title.to_string()))
        })
        .collect::<Vec<_>>();

    matching_handles(customizations, &delivery_options)
        .into_iter()
        .map(|delivery_option_handle| {
            schema::Operation::DeliveryOptionHide(schema::DeliveryOptionHideOperation {
                delivery_option_handle,
            })
        })
        .collect()
}

fn matching_handles(
    customizations: &[Customization],
    delivery_options: &[(String, String)],
) -> Vec<String> {
    let mut seen = BTreeSet::new();
    let mut handles = Vec::new();

    for customization in customizations {
        if !customization.status.eq_ignore_ascii_case("ACTIVE")
            || !customization.r#type.eq_ignore_ascii_case("HIDE")
        {
            continue;
        }

        for method in &customization.methods {
            let configured_name = method.value.trim().to_lowercase();
            if configured_name.is_empty() {
                continue;
            }

            for (handle, title) in delivery_options {
                if title.to_lowercase().contains(&configured_name) && seen.insert(handle.clone()) {
                    handles.push(handle.clone());
                }
            }
        }
    }

    handles
}

#[cfg(test)]
mod tests {
    use super::matching_handles;
    use crate::config::{Customization, CustomizationMethod};

    fn customization(
        id: &str,
        status: &str,
        customization_type: &str,
        methods: &[&str],
    ) -> Customization {
        Customization {
            id: id.to_string(),
            shop_id: "shop-1".to_string(),
            name: id.to_string(),
            r#type: customization_type.to_string(),
            status: status.to_string(),
            parameter_set: 1,
            condition_match: "ALL".to_string(),
            shipment_scope: "ALL".to_string(),
            version: 1,
            created_at: String::new(),
            updated_at: String::new(),
            conditions: vec![],
            methods: methods
                .iter()
                .enumerate()
                .map(|(position, value)| CustomizationMethod {
                    id: format!("{id}-{position}"),
                    shop_id: "shop-1".to_string(),
                    customization_id: id.to_string(),
                    position: position as i32,
                    value: (*value).to_string(),
                    replacement_value: None,
                    created_at: String::new(),
                    updated_at: String::new(),
                })
                .collect(),
        }
    }

    #[test]
    fn creates_ordered_unique_handles_for_active_hide_customizations() {
        let customizations = vec![
            customization("first", "ACTIVE", "HIDE", &["Express"]),
            customization("duplicate", "ACTIVE", "hide", &["Express"]),
            customization("inactive", "INACTIVE", "HIDE", &["Standard"]),
            customization("rename", "ACTIVE", "RENAME", &["Standard"]),
        ];
        let delivery_options = vec![
            ("express-handle".to_string(), "Express Shipping".to_string()),
            ("standard-handle".to_string(), "Standard".to_string()),
        ];

        assert_eq!(
            matching_handles(&customizations, &delivery_options),
            vec!["express-handle"]
        );
    }

    #[test]
    fn ignores_unknown_delivery_methods() {
        let customizations = vec![customization("unknown", "ACTIVE", "HIDE", &["Overnight"])];
        let delivery_options = vec![("express".to_string(), "Express".to_string())];

        assert!(matching_handles(&customizations, &delivery_options).is_empty());
    }
}
