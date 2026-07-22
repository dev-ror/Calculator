import { matchesCondition } from "./ConditionMatcher.js";

function matchesAll(conditions, request, mode) {
  if (conditions.length === 0) return true;
  return String(mode).toUpperCase() === "ANY"
    ? conditions.some((condition) => matchesCondition(condition, request))
    : conditions.every((condition) => matchesCondition(condition, request));
}

export function matchCustomizations(customizations, request) {
  if (!Array.isArray(customizations)) return [];

  return customizations.filter((customization) =>
    String(customization.status).toUpperCase() === "ACTIVE" &&
    matchesAll(customization.conditions ?? [], request, customization.conditionMatch),
  );
}
