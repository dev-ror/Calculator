function compareValues(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function byPosition(left, right) {
  return (left.position ?? 0) - (right.position ?? 0) || compareValues(left.id, right.id);
}

function orderedChildren(items = []) {
  return [...items].sort(byPosition);
}

function scheduleInstant(schedule) {
  const instant = new Date(schedule?.scheduledAt).getTime();
  return Number.isFinite(instant) ? instant : null;
}

function byScheduleTime(left, right) {
  return (
    scheduleInstant(left) - scheduleInstant(right) ||
    byPosition(left, right)
  );
}

export function resolveEffectiveStatus(customization, asOf) {
  const effectiveAt = new Date(asOf).getTime();

  if (!Number.isFinite(effectiveAt)) {
    throw new TypeError("Effective configuration time must be a valid date");
  }

  const lastDueSchedule = [...(customization.schedules ?? [])]
    .filter((schedule) => {
      const instant = scheduleInstant(schedule);
      const action = String(schedule?.action ?? "").toUpperCase();
      return (
        instant !== null &&
        instant <= effectiveAt &&
        (action === "ACTIVATE" || action === "DEACTIVATE")
      );
    })
    .sort(byScheduleTime)
    .at(-1);

  if (!lastDueSchedule) {
    return customization.status;
  }

  return String(lastDueSchedule.action).toUpperCase() === "ACTIVATE"
    ? "ACTIVE"
    : "INACTIVE";
}

function orderedCustomizations(customizations = [], asOf) {
  return [...customizations]
    .sort((left, right) => compareValues(left.id, right.id))
    .map((customization) => ({
      ...customization,
      status: resolveEffectiveStatus(customization, asOf),
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

export function build({ shop, customizations, rateRules, asOf = new Date() }) {
  if (!shop) {
    throw new TypeError("Shop was not found");
  }

  const liveCustomizationPlans = new Set(["STARTER", "PRO", "PRO_PLUS"]);
  const customizationEntitled = liveCustomizationPlans.has(
    String(shop.configuration?.plan ?? "SANDBOX").toUpperCase(),
  );

  return {
    shop: { ...shop },
    testMode:
      !customizationEntitled || shop.configuration?.customizationsEnabled !== true,
    customerTags: conditionTags(customizations, "customer_tag"),
    productTags: conditionTags(customizations, "product_tag"),
    customizations: orderedCustomizations(customizations, asOf),
    rateRules: orderedRateRules(rateRules),
  };
}
