#[path = "HideOperationBuilder.rs"]
mod hide_operation_builder;
#[path = "OnlyShowOperationBuilder.rs"]
mod only_show_operation_builder;
#[path = "RenameOperationBuilder.rs"]
mod rename_operation_builder;
#[path = "ReorderOperationBuilder.rs"]
mod reorder_operation_builder;

use crate::config::Customization;
use crate::schema;
use std::collections::BTreeSet;

pub fn build(
    customizations: &[Customization],
    delivery_groups: &[schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::DeliveryGroups],
) -> Vec<schema::Operation> {
    let mut operations = Vec::new();

    for group in delivery_groups {
        let applicable = customizations
            .iter()
            .filter(|customization| applies_to_group(customization, group))
            .cloned()
            .collect::<Vec<_>>();
        let groups = std::slice::from_ref(group);
        let mut group_operations = hide_operation_builder::build(&applicable, groups);
        group_operations.extend(rename_operation_builder::build(&applicable, groups));
        group_operations.extend(reorder_operation_builder::build(&applicable, groups));
        let hidden_handles = group_operations
            .iter()
            .filter_map(|operation| match operation {
                schema::Operation::DeliveryOptionHide(operation) => {
                    Some(operation.delivery_option_handle.clone())
                }
                _ => None,
            })
            .collect::<BTreeSet<_>>();
        group_operations.extend(only_show_operation_builder::build(
            &applicable,
            groups,
            &hidden_handles,
        ));
        operations.extend(group_operations);
    }

    operations
}

fn applies_to_group(
    customization: &Customization,
    group: &schema::cart_delivery_options_transform_run::cart_delivery_options_transform_run_input::cart::DeliveryGroups,
) -> bool {
    applies_to_group_type(customization, group.group_type())
}

fn applies_to_group_type(
    customization: &Customization,
    group_type: &schema::CartDeliveryGroupType,
) -> bool {
    !customization.shipment_scope.eq_ignore_ascii_case("FIRST")
        || matches!(group_type, schema::CartDeliveryGroupType::OneTimePurchase)
}

#[cfg(test)]
mod tests {
    use super::applies_to_group_type;
    use crate::config::Customization;
    use crate::schema;

    fn customization(scope: &str) -> Customization {
        Customization {
            id: "customization-1".to_string(),
            shop_id: "shop-1".to_string(),
            name: "Scope test".to_string(),
            r#type: "HIDE".to_string(),
            status: "ACTIVE".to_string(),
            parameter_set: 1,
            condition_match: "ALL".to_string(),
            shipment_scope: scope.to_string(),
            version: 1,
            created_at: String::new(),
            updated_at: String::new(),
            conditions: vec![],
            methods: vec![],
        }
    }

    #[test]
    fn all_shipments_applies_to_every_delivery_group_type() {
        let customization = customization("ALL");
        assert!(applies_to_group_type(
            &customization,
            &schema::CartDeliveryGroupType::OneTimePurchase
        ));
        assert!(applies_to_group_type(
            &customization,
            &schema::CartDeliveryGroupType::Subscription
        ));
    }

    #[test]
    fn first_shipment_excludes_future_subscription_groups() {
        let customization = customization("FIRST");
        assert!(applies_to_group_type(
            &customization,
            &schema::CartDeliveryGroupType::OneTimePurchase
        ));
        assert!(!applies_to_group_type(
            &customization,
            &schema::CartDeliveryGroupType::Subscription
        ));
    }
}
