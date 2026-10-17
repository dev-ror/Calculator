import assert from "node:assert/strict";
import test from "node:test";
import { blendRates } from "../src/shipping/RateBlender.js";

const rates = [
  { id: "a", name: "Standard", price: 10, tags: "cold" },
  { id: "b", name: "Standard", price: 15, tags: "heavy" },
];

test("basic blending adds, selects lowest, and selects highest rates", () => {
  assert.equal(blendRates(rates, { blendMode: "add" })[0].price, 25);
  assert.equal(blendRates(rates, { blendMode: "lowest" })[0].price, 10);
  assert.equal(blendRates(rates, { blendMode: "highest" })[0].price, 15);
});

test("basic blending applies configured numeric limits", () => {
  assert.equal(blendRates(rates, { blendMode: "add", basicBlendLimits: [{ name: "standard", max: "20", min: "5" }] })[0].price, 20);
});

test("advanced blending combines differently named tagged rates", () => {
  const result = blendRates(
    [{ id: "a", name: "A", price: 10, tags: "bundle" }, { id: "b", name: "B", price: 5, tags: "bundle" }],
    { advancedBlendRules: [{ blendType: "add", tags: "BUNDLE", rateName: "Combined" }] },
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Combined");
  assert.equal(result[0].price, 15);
});
