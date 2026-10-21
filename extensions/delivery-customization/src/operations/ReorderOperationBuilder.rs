use crate::config::Customization;
use crate::schema;
use std::collections::BTreeSet;

pub fn build(
    customizations: &[Customization],
    delivery_groups: &[schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::DeliveryGroups],
) -> Vec<schema::Operation> {
    let mut moved_handles = BTreeSet::new();
    let mut operations = Vec::new();

    for group in delivery_groups {
        let delivery_options = group
            .delivery_options()
            .iter()
            .filter_map(|option| {
                option
                    .title()
                    .map(|title| (option.handle().to_string(), title.to_string()))
            })
            .collect::<Vec<_>>();

        for (delivery_option_handle, index) in
            matching_moves(customizations, &delivery_options, &mut moved_handles)
        {
            operations.push(schema::Operation::DeliveryOptionMove(
                schema::DeliveryOptionMoveOperation {
                    delivery_option_handle,
                    index,
                },
            ));
        }
    }

    operations
}

fn matching_moves(
    customizations: &[Customization],
    delivery_options: &[(String, String)],
    moved_handles: &mut BTreeSet<String>,
) -> Vec<(String, i32)> {
    let mut matches = Vec::new();

    for (customization_position, customization) in customizations.iter().enumerate() {
        if !customization.status.eq_ignore_ascii_case("ACTIVE")
            || !customization.r#type.eq_ignore_ascii_case("REORDER")
        {
            continue;
        }

        let mut methods = customization.methods.iter().enumerate().collect::<Vec<_>>();
        methods.sort_by_key(|(existing_position, method)| (method.position, *existing_position));

        for (method_order, (_, method)) in methods.into_iter().enumerate() {
            let configured_name = method.value.trim();
            if configured_name.is_empty() {
                continue;
            }

            for (delivery_option_position, (handle, title)) in delivery_options.iter().enumerate() {
                if title.eq_ignore_ascii_case(configured_name) && !moved_handles.contains(handle) {
                    matches.push((
                        customization_position,
                        method.position,
                        method_order,
                        delivery_option_position,
                        handle.clone(),
                    ));
                }
            }
        }
    }

    matches.sort_by_key(
        |(customization_position, method_position, method_order, delivery_option_position, _)| {
            (
                *customization_position,
                *method_position,
                *method_order,
                *delivery_option_position,
            )
        },
    );

    matches
        .into_iter()
        .filter_map(|(_, _, _, _, handle)| {
            if moved_handles.insert(handle.clone()) {
                Some(handle)
            } else {
                None
            }
        })
        .enumerate()
        .map(|(index, handle)| (handle, index as i32))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::matching_moves;
    use crate::config::{Customization, CustomizationMethod};
    use std::collections::BTreeSet;

    fn customization(
        id: &str,
        status: &str,
        customization_type: &str,
        methods: &[(i32, &str)],
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
                    |(existing_position, (position, value))| CustomizationMethod {
                        id: format!("{id}-{existing_position}"),
                        shop_id: "shop-1".to_string(),
                        customization_id: id.to_string(),
                        position: *position,
                        value: (*value).to_string(),
                        replacement_value: None,
                        created_at: String::new(),
                        updated_at: String::new(),
                    },
                )
                .collect(),
        }
    }

    #[test]
    fn orders_moves_by_customization_method_and_delivery_option_position() {
        let customizations = vec![
            customization(
                "first",
                "ACTIVE",
                "REORDER",
                &[(2, "Standard"), (1, "Express")],
            ),
            customization("second", "ACTIVE", "REORDER", &[(1, "Local Pickup")]),
        ];
        let delivery_options = vec![
            ("standard".to_string(), "Standard".to_string()),
            ("express".to_string(), "Express".to_string()),
            ("pickup".to_string(), "Local Pickup".to_string()),
        ];

        assert_eq!(
            matching_moves(&customizations, &delivery_options, &mut BTreeSet::new()),
            vec![
                ("express".to_string(), 0),
                ("standard".to_string(), 1),
                ("pickup".to_string(), 2),
            ]
        );
    }

    #[test]
    fn ignores_inactive_non_reorder_empty_unknown_and_duplicate_methods() {
        let customizations = vec![
            customization("inactive", "INACTIVE", "REORDER", &[(1, "Express")]),
            customization("rename", "ACTIVE", "RENAME", &[(1, "Express")]),
            customization(
                "valid",
                "ACTIVE",
                "REORDER",
                &[(1, ""), (2, "Unknown"), (3, "express"), (4, "EXPRESS")],
            ),
        ];
        let delivery_options = vec![
            ("standard".to_string(), "Standard".to_string()),
            ("express".to_string(), "Express".to_string()),
        ];

        assert_eq!(
            matching_moves(&customizations, &delivery_options, &mut BTreeSet::new()),
            vec![("express".to_string(), 0)]
        );
    }

    #[test]
    fn prevents_duplicate_moves_across_delivery_groups() {
        let customizations = vec![customization(
            "reorder",
            "ACTIVE",
            "REORDER",
            &[(1, "Express")],
        )];
        let delivery_options = vec![("express".to_string(), "Express".to_string())];
        let mut moved_handles = BTreeSet::new();

        assert_eq!(
            matching_moves(&customizations, &delivery_options, &mut moved_handles),
            vec![("express".to_string(), 0)]
        );
        assert!(matching_moves(&customizations, &delivery_options, &mut moved_handles).is_empty());
    }
}
