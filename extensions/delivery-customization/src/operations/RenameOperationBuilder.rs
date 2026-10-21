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

    matching_renames(customizations, &delivery_options)
        .into_iter()
        .map(|(delivery_option_handle, title)| {
            schema::Operation::DeliveryOptionRename(schema::DeliveryOptionRenameOperation {
                delivery_option_handle,
                title,
            })
        })
        .collect()
}

fn matching_renames(
    customizations: &[Customization],
    delivery_options: &[(String, String)],
) -> Vec<(String, String)> {
    let mut renamed_handles = BTreeSet::new();
    let mut renames = Vec::new();

    for customization in customizations {
        if !customization.status.eq_ignore_ascii_case("ACTIVE")
            || !customization.r#type.eq_ignore_ascii_case("RENAME")
        {
            continue;
        }

        for method in &customization.methods {
            let source_name = method.value.trim();
            let Some(replacement_name) = method.replacement_value.as_deref().map(str::trim) else {
                continue;
            };

            if source_name.is_empty() || replacement_name.is_empty() {
                continue;
            }

            for (handle, title) in delivery_options {
                if title.eq_ignore_ascii_case(source_name) && renamed_handles.insert(handle.clone())
                {
                    renames.push((handle.clone(), replacement_name.to_string()));
                }
            }
        }
    }

    renames
}

#[cfg(test)]
mod tests {
    use super::matching_renames;
    use crate::config::{Customization, CustomizationMethod};

    fn customization(
        id: &str,
        status: &str,
        customization_type: &str,
        methods: &[(&str, Option<&str>)],
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
                .map(
                    |(position, (value, replacement_value))| CustomizationMethod {
                        id: format!("{id}-{position}"),
                        shop_id: "shop-1".to_string(),
                        customization_id: id.to_string(),
                        position: position as i32,
                        value: (*value).to_string(),
                        replacement_value: replacement_value.map(str::to_string),
                        created_at: String::new(),
                        updated_at: String::new(),
                    },
                )
                .collect(),
        }
    }

    #[test]
    fn creates_case_insensitive_renames_in_configuration_and_delivery_order() {
        let customizations = vec![
            customization(
                "first",
                "ACTIVE",
                "RENAME",
                &[
                    ("express", Some("Priority Delivery")),
                    ("standard", Some("Economy Delivery")),
                ],
            ),
            customization(
                "second",
                "ACTIVE",
                "RENAME",
                &[("EXPRESS", Some("Ignored Duplicate"))],
            ),
        ];
        let delivery_options = vec![
            ("express-handle".to_string(), "Express".to_string()),
            ("standard-handle".to_string(), "Standard".to_string()),
        ];

        assert_eq!(
            matching_renames(&customizations, &delivery_options),
            vec![
                (
                    "express-handle".to_string(),
                    "Priority Delivery".to_string()
                ),
                (
                    "standard-handle".to_string(),
                    "Economy Delivery".to_string()
                ),
            ]
        );
    }

    #[test]
    fn ignores_inactive_non_rename_missing_empty_and_unknown_methods() {
        let customizations = vec![
            customization(
                "inactive",
                "INACTIVE",
                "RENAME",
                &[("Express", Some("Priority"))],
            ),
            customization("hide", "ACTIVE", "HIDE", &[("Express", Some("Priority"))]),
            customization("missing", "ACTIVE", "RENAME", &[("Express", None)]),
            customization("empty-source", "ACTIVE", "RENAME", &[(" ", Some("Name"))]),
            customization(
                "empty-target",
                "ACTIVE",
                "RENAME",
                &[("Express", Some(" "))],
            ),
            customization(
                "unknown",
                "ACTIVE",
                "RENAME",
                &[("Overnight", Some("Priority"))],
            ),
        ];
        let delivery_options = vec![("express".to_string(), "Express".to_string())];

        assert!(matching_renames(&customizations, &delivery_options).is_empty());
    }
}
