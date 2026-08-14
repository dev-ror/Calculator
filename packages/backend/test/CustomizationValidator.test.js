import assert from "node:assert/strict";
import test from "node:test";

import { validateCustomization } from "../src/validators/CustomizationValidator.js";

function submission(condition) {
  return {
    shopId: "shop-1",
    name: "QA customization",
    type: "hide",
    status: "ACTIVE",
    parameterSet: 1,
    conditionMatch: "ALL",
    shipmentScope: "ALL",
    conditionsBySet: { 1: [condition] },
    methods: [{ value: "Express" }],
    schedules: [],
  };
}

test("rejects an empty value for an operator that requires one", () => {
  assert.throws(
    () =>
      validateCustomization(
        submission({ field: "Cart Subtotal", operator: "Greater than", value: "" }),
      ),
    /conditions\[0\]\.value is required/,
  );
});

test("allows valueless and empty-value operators", () => {
  assert.doesNotThrow(() =>
    validateCustomization(submission({ field: "Always", operator: "", value: "" })),
  );
  assert.doesNotThrow(() =>
    validateCustomization(
      submission({ field: "Customer Company", operator: "Is empty", value: "" }),
    ),
  );
});

test("requires thresholds for quantitative product matching modes", () => {
  assert.throws(
    () =>
      validateCustomization(
        submission({
          field: "Product Tag",
          operator: "Equals",
          value: "sale",
          productMatch: "exact-quantity",
          matchValue: "",
        }),
      ),
    /conditions\[0\]\.matchValue is required/,
  );
});
