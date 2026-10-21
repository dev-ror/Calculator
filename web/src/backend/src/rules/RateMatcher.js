import { matchesCondition } from "./ConditionMatcher.js";

function matchesAll(conditions, request, mode) {
  if (conditions.length === 0) return true;
  return String(mode).toUpperCase() === "ANY"
    ? conditions.some((condition) => matchesCondition(condition, request))
    : conditions.every((condition) => matchesCondition(condition, request));
}

export function matchRateRules(rateRules, request) {
  if (!Array.isArray(rateRules)) return [];

  return rateRules.filter((rateRule) =>
    String(rateRule.status).toUpperCase() === "ACTIVE" &&
    matchesAll(rateRule.conditions ?? [], request, rateRule.conditionMatch),
  );
}
