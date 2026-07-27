function copy(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (seen.has(value)) return seen.get(value);

  const cloned = Array.isArray(value) ? [] : {};
  seen.set(value, cloned);

  for (const [key, nestedValue] of Object.entries(value)) {
    cloned[key] = copy(nestedValue, seen);
  }

  return cloned;
}

function freeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);

  for (const nestedValue of Object.values(value)) {
    freeze(nestedValue, seen);
  }

  return Object.freeze(value);
}

function number(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : Number.MAX_SAFE_INTEGER;
}

function compareRates(left, right) {
  return (
    number(left.rule?.priority) - number(right.rule?.priority) ||
    number(left.position) - number(right.position) ||
    String(left.name ?? "").localeCompare(String(right.name ?? "")) ||
    String(left.id ?? "").localeCompare(String(right.id ?? ""))
  );
}

export function format(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new TypeError("Shipping Engine response must be an object");
  }

  const rates = response.visibleRates ?? response.rates ?? [];
  const matchedCustomizations = response.matchedCustomizations ?? [];
  const matchedRateRules = response.matchedRateRules ?? [];

  if (![rates, matchedCustomizations, matchedRateRules].every(Array.isArray)) {
    throw new TypeError("Shipping Engine response collections must be arrays");
  }

  return freeze({
    rates: copy(rates).sort(compareRates),
    matchedCustomizations: copy(matchedCustomizations),
    matchedRateRules: copy(matchedRateRules),
  });
}
