import { apply } from "./CustomizationApplier.js";
import { generate } from "./RateGenerator.js";
import { blendRates } from "./RateBlender.js";

export function calculate({ matchedCustomizations = [], matchedRateRules = [], configuration } = {}) {
  const rates = blendRates(generate(matchedRateRules), configuration);
  const customizationResult = apply(rates, matchedCustomizations);

  return { rates, ...customizationResult };
}
