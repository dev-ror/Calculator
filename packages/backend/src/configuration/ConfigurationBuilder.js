function compareValues(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function byPosition(left, right) {
  return (left.position ?? 0) - (right.position ?? 0) || compareValues(left.id, right.id);
}

function orderedChildren(items = []) {
  return [...items].sort(byPosition);
}

function orderedCustomizations(customizations = []) {
  return [...customizations]
    .sort((left, right) => compareValues(left.id, right.id))
    .map((customization) => ({
      ...customization,
      conditions: orderedChildren(customization.conditions),
      methods: orderedChildren(customization.methods).map((method) => ({
        ...method,
        replacementValue: method.replacementValue ?? null,
      })),
      schedules: orderedChildren(customization.schedules),
    }));
}

function orderedRateRules(rateRules = []) {
  return [...rateRules]
    .sort(
      (left, right) =>
        (left.priority ?? 0) - (right.priority ?? 0) ||
        compareValues(left.id, right.id),
    )
    .map((rateRule) => ({
      ...rateRule,
      conditions: orderedChildren(rateRule.conditions),
      rates: orderedChildren(rateRule.rates),
      schedules: orderedChildren(rateRule.schedules),
    }));
}

function normalizedField(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function conditionTags(customizations = [], expectedField) {
  return [
    ...new Set(
      customizations.flatMap((customization) =>
        (customization.conditions ?? [])
          .filter(({ field }) => normalizedField(field) === expectedField)
          .flatMap(({ value, matchValue }) =>
            String(value ?? matchValue ?? "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
      ),
    ),
  ].sort(compareValues);
}

export function build({ shop, customizations, rateRules }) {
  if (!shop) {
    throw new TypeError("Shop was not found");
  }

  return {
    shop: { ...shop },
    testMode: shop.configuration?.customizationsEnabled !== true,
    customerTags: conditionTags(customizations, "customer_tag"),
    productTags: conditionTags(customizations, "product_tag"),
    customizations: orderedCustomizations(customizations),
    rateRules: orderedRateRules(rateRules),
  };
}
