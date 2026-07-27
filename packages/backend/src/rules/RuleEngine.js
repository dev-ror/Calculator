import { matchCustomizations } from "./CustomizationMatcher.js";
import { matchRateRules } from "./RateMatcher.js";

export function evaluate(input = {}, configuration) {
  const { customizations = [], rateRules = [], request } = configuration
    ? { ...configuration, request: input }
    : input;

  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("Shipping request must be an object");
  }

  return {
    matchedCustomizations: matchCustomizations(customizations, request),
    matchedRateRules: matchRateRules(rateRules, request),
  };
}
