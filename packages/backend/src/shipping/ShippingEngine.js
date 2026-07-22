import { calculate } from "./ShippingCalculator.js";

export function evaluate({ matchedCustomizations = [], matchedRateRules = [] } = {}) {
  return {
    matchedCustomizations,
    matchedRateRules,
    ...calculate({ matchedCustomizations, matchedRateRules }),
  };
}
