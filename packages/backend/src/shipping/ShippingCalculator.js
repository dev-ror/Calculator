import { apply } from "./CustomizationApplier.js";
import { generate } from "./RateGenerator.js";

export function calculate({ matchedCustomizations = [], matchedRateRules = [] } = {}) {
  const rates = generate(matchedRateRules);
  const customizationResult = apply(rates, matchedCustomizations);

  return { rates, ...customizationResult };
}
