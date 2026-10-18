const STATUSES = new Set(["DRAFT", "ACTIVE"]);
const CONDITION_MATCHES = new Set(["ALL", "ANY"]);
const EXCLUSIVITIES = new Set(["INCLUSIVE", "EXCLUSIVE"]);

function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Rule data must be an object");
  }
}

function requireString(value, field, maximumLength = 255) {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new TypeError(`${field} is required`);
  }

  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }

  return normalized;
}

function requireNonNegativeInteger(value, field) {
  const normalized = typeof value === "string" && value.trim() ? Number(value) : value;

  if (!Number.isInteger(normalized)) {
    throw new TypeError(`${field} must be an integer`);
  }

  if (normalized < 0) {
    throw new RangeError(`${field} must be zero or greater`);
  }

  return normalized;
}

function requireEnum(value, field, allowedValues) {
  const normalized = requireString(value, field).toUpperCase();

  if (!allowedValues.has(normalized)) {
    throw new TypeError(`${field} must be one of: ${[...allowedValues].join(", ")}`);
  }

  return normalized;
}

export function validateRule(data) {
  requireObject(data);

  return {
    ...data,
    shopId: requireString(data.shopId, "shopId"),
    name: requireString(data.name, "name"),
    priority: requireNonNegativeInteger(data.priority, "priority"),
    status: requireEnum(data.status ?? "DRAFT", "status", STATUSES),
    conditionMatch: requireEnum(
      data.conditionMatch ?? "ALL",
      "conditionMatch",
      CONDITION_MATCHES,
    ),
    exclusivity: requireEnum(
      data.exclusivity ?? "INCLUSIVE",
      "exclusivity",
      EXCLUSIVITIES,
    ),
  };
}
