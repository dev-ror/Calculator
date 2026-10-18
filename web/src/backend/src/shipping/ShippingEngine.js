import { calculate } from "./ShippingCalculator.js";

export function evaluate({ matchedCustomizations = [], matchedRateRules = [], configuration } = {}) {
  return {
    matchedCustomizations,
    matchedRateRules,
    ...calculate({ matchedCustomizations, matchedRateRules, configuration }),
  };
}
