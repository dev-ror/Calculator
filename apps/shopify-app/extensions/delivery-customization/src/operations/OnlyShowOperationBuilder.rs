use crate::config::Customization;
use crate::schema;
use std::collections::BTreeSet;

pub fn build(
    customizations: &[Customization],
    delivery_groups: &[schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::DeliveryGroups],
    already_hidden: &BTreeSet<String>,
) -> Vec<schema::Operation> {
    let visible_names = visible_method_names(customizations);
    let Some(visible_names) = visible_names else {
        return vec![];
    };

    let mut hidden_handles = already_hidden.clone();
    let mut operations = Vec::new();

    for group in delivery_groups {
        for option in group.delivery_options() {
            let Some(title) = option.title() else {
                continue;
            };

            let is_visible = visible_names
                .iter()
                .any(|visible_name| title.eq_ignore_ascii_case(visible_name));

            if !is_visible && hidden_handles.insert(option.handle().to_string()) {
                operations.push(schema::Operation::DeliveryOptionHide(
                    schema::DeliveryOptionHideOperation {
                        delivery_option_handle: option.handle().to_string(),
                    },
                ));
            }
        }
    }

    operations
}

fn visible_method_names(customizations: &[Customization]) -> Option<Vec<String>> {
    let mut has_only_show_customization = false;
    let mut seen = BTreeSet::new();
    let mut visible_names = Vec::new();

    for customization in customizations {
        if !customization.status.eq_ignore_ascii_case("ACTIVE")
            || !customization.r#type.eq_ignore_ascii_case("ONLY_SHOW")
        {
            continue;
        }

        has_only_show_customization = true;

        for method in &customization.methods {
            let visible_name = method.value.trim();
            if visible_name.is_empty() {
                continue;
            }

            let normalized_name = visible_name.to_lowercase();
            if seen.insert(normalized_name) {
                visible_names.push(visible_name.to_string());
            }
        }
    }

    has_only_show_customization.then_some(visible_names)
}

#[cfg(test)]
fn hidden_delivery_options(
    customizations: &[Customization],
    delivery_options: &[(String, String)],
    already_hidden: &BTreeSet<String>,
) -> Vec<String> {
    let Some(visible_names) = visible_method_names(customizations) else {
        return vec![];
    };
    let mut hidden_handles = already_hidden.clone();

    delivery_options
        .iter()
        .filter_map(|(handle, title)| {
            let is_visible = visible_names
                .iter()
                .any(|visible_name| title.eq_ignore_ascii_case(visible_name));

            if !is_visible && hidden_handles.insert(handle.clone()) {
                Some(handle.clone())
            } else {
                None
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{hidden_delivery_options, visible_method_names};
    use crate::config::{Customization, CustomizationMethod};
    use std::collections::BTreeSet;

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

    fn delivery_options() -> Vec<(String, String)> {
        vec![
            ("standard".to_string(), "Standard".to_string()),
            ("express".to_string(), "Express".to_string()),
            ("economy".to_string(), "Economy".to_string()),
            ("pickup".to_string(), "Pickup".to_string()),
        ]
    }

    #[test]
    fn keeps_one_visible_method_and_hides_the_rest_in_delivery_order() {
        let customizations = vec![customization("only", "ACTIVE", "ONLY_SHOW", &[" express "])];

        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new()),
            vec!["standard", "economy", "pickup"]
        );
    }

    #[test]
    fn keeps_multiple_visible_methods_case_insensitively() {
        let customizations = vec![customization(
            "only",
            "ACTIVE",
            "ONLY_SHOW",
            &["EXPRESS", "pickup"],
        )];

        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new()),
            vec!["standard", "economy"]
        );
    }

    #[test]
    fn blank_and_unknown_values_are_ignored() {
        let customizations = vec![customization(
            "only",
            "ACTIVE",
            "ONLY_SHOW",
            &[" ", "Unknown", "Express"],
        )];

        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new()),
            vec!["standard", "economy", "pickup"]
        );
    }

    #[test]
    fn prevents_duplicate_hides_from_existing_builders() {
        let customizations = vec![customization("only", "ACTIVE", "ONLY_SHOW", &["Express"])];
        let already_hidden = BTreeSet::from(["standard".to_string(), "pickup".to_string()]);

        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &already_hidden),
            vec!["economy"]
        );
    }

    #[test]
    fn ignores_inactive_and_non_only_show_customizations() {
        let customizations = vec![
            customization("inactive", "INACTIVE", "ONLY_SHOW", &["Express"]),
            customization("hide", "ACTIVE", "HIDE", &["Express"]),
        ];

        assert!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new())
                .is_empty()
        );
    }

    #[test]
    fn aggregates_visible_methods_in_customization_and_method_order() {
        let customizations = vec![
            customization("first", "ACTIVE", "ONLY_SHOW", &["Pickup", "Express"]),
            customization("second", "ACTIVE", "ONLY_SHOW", &["Standard", "pickup"]),
        ];

        assert_eq!(
            visible_method_names(&customizations),
            Some(vec![
                "Pickup".to_string(),
                "Express".to_string(),
                "Standard".to_string(),
            ])
        );
        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new()),
            vec!["economy"]
        );
    }

    #[test]
    fn empty_visible_list_hides_every_delivery_option() {
        let customizations = vec![customization("only", "ACTIVE", "ONLY_SHOW", &[])];

        assert_eq!(
            hidden_delivery_options(&customizations, &delivery_options(), &BTreeSet::new()),
            vec!["standard", "express", "economy", "pickup"]
        );
    }
}
