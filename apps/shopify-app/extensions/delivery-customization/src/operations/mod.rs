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
    let mut operations = hide_operation_builder::build(customizations, delivery_groups);
    operations.extend(rename_operation_builder::build(
        customizations,
        delivery_groups,
    ));
    operations.extend(reorder_operation_builder::build(
        customizations,
        delivery_groups,
    ));
    let hidden_handles = operations
        .iter()
        .filter_map(|operation| match operation {
            schema::Operation::DeliveryOptionHide(operation) => {
                Some(operation.delivery_option_handle.clone())
            }
            _ => None,
        })
        .collect::<BTreeSet<_>>();
    operations.extend(only_show_operation_builder::build(
        customizations,
        delivery_groups,
        &hidden_handles,
    ));
    operations
}
