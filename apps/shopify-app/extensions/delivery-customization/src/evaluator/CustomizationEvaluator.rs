use super::match_condition;
use crate::config::{Configuration, Customization};
use crate::schema;

pub fn evaluate(
    configuration: &Configuration,
    input: &schema::cart_delivery_options_transform_run::CartDeliveryOptionsTransformRunInput,
) -> Vec<Customization> {
    configuration
        .customizations
        .iter()
        .filter(|customization| {
            let results = customization
                .conditions
                .iter()
                .map(|condition| match_condition(condition, input))
                .collect::<Vec<_>>();

            should_include(
                &customization.status,
                &customization.condition_match,
                &results,
            )
        })
        .cloned()
        .collect()
}

fn should_include(status: &str, match_mode: &str, results: &[bool]) -> bool {
    if !status.eq_ignore_ascii_case("ACTIVE") {
        return false;
    }

    if match_mode.eq_ignore_ascii_case("ANY") {
        results.iter().any(|result| *result)
    } else {
        results.iter().all(|result| *result)
    }
}

#[cfg(test)]
mod tests {
    use super::should_include;

    #[test]
    fn filters_inactive_customizations() {
        assert!(!should_include("INACTIVE", "ALL", &[true]));
    }

    #[test]
    fn evaluates_all_and_any_match_modes() {
        assert!(should_include("ACTIVE", "ALL", &[true, true]));
        assert!(!should_include("ACTIVE", "ALL", &[true, false]));
        assert!(should_include("ACTIVE", "ANY", &[false, true]));
        assert!(!should_include("ACTIVE", "ANY", &[false, false]));
    }

    #[test]
    fn filtering_preserves_configuration_order() {
        let configurations = [
            ("first", "ACTIVE", "ALL", vec![true]),
            ("second", "INACTIVE", "ALL", vec![true]),
            ("third", "ACTIVE", "ANY", vec![false, true]),
        ];

        let matched = configurations
            .iter()
            .filter(|(_, status, mode, results)| should_include(status, mode, results))
            .map(|(name, _, _, _)| *name)
            .collect::<Vec<_>>();

        assert_eq!(matched, vec!["first", "third"]);
    }
}
