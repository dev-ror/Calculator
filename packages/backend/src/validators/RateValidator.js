const STATUSES = new Set(["DRAFT", "ACTIVE"]);
const CONDITION_MATCHES = new Set(["ALL", "ANY"]);
const EXCLUSIVITIES = new Set(["INCLUSIVE", "EXCLUSIVE"]);
const SCHEDULE_ACTIONS = new Set(["ACTIVATE", "DEACTIVATE"]);
const QUANTITY_CHECKS = new Set([
  "atLeastOne",
  "moreProducts",
  "lessProducts",
  "moreAmount",
  "lessAmount",
]);
const CURRENCY_CODES = new Map([
  ["Default Store Currency", "USD"],
  ["United Arab Emirates Dirham", "AED"],
  ["Australian Dollars", "AUD"],
  ["Canadian Dollars", "CAD"],
  ["Euro", "EUR"],
  ["United Kingdom Pounds", "GBP"],
  ["Indian Rupees", "INR"],
  ["Japanese Yen", "JPY"],
  ["New Zealand Dollars", "NZD"],
  ["United States Dollars", "USD"],
  ["South African Rand", "ZAR"],
  ["Hong Kong Dollars", "HKD"],
  ["Swiss Francs", "CHF"],
  ["Polish Zlotych", "PLN"],
]);
const VALID_CURRENCY_CODES = new Set(CURRENCY_CODES.values());
const NON_NEGATIVE_RATE_FIELDS = [
  "price",
  "defaultRate",
  "rangeStart",
  "rangeEnd",
  "basePrice",
  "incrementalPrice",
  "perEach",
  "startFrom",
  "secondRangeStart",
  "secondRangeEnd",
  "discount",
  "handlingPercent",
  "handlingFixed",
];
const BOOLEAN_RATE_FIELDS = [
  "roundUp",
  "increasePerItem",
  "hideDeliveryDates",
  "fuelLevy",
];

function requireObject(value, field = "Rate data") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
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

function optionalString(value, field, maximumLength = 2000) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }

  return normalized || null;
}

function integer(value, field, minimum, required = true) {
  if (!required && (value === undefined || value === null || value === "")) {
    return null;
  }

  const normalized = typeof value === "string" && value.trim() ? Number(value) : value;

  if (!Number.isInteger(normalized)) {
    throw new TypeError(`${field} must be an integer`);
  }

  if (normalized < minimum) {
    throw new RangeError(`${field} must be ${minimum} or greater`);
  }

  return normalized;
}

function enumValue(value, field, values, fallback) {
  const normalized = requireString(value ?? fallback, field).toUpperCase();

  if (!values.has(normalized)) {
    throw new TypeError(`${field} must be one of: ${[...values].join(", ")}`);
  }

  return normalized;
}

function validatePositions(items, field) {
  const positions = new Set();

  for (const item of items) {
    if (positions.has(item.position)) {
      throw new TypeError(`${field} contains duplicate position ${item.position}`);
    }
    positions.add(item.position);
  }
}

function validateConditions(conditions) {
  if (!Array.isArray(conditions)) {
    throw new TypeError("conditions must be an array");
  }

  if (conditions.length > 100) {
    throw new RangeError("conditions must contain 100 items or fewer");
  }

  const normalized = conditions.map((condition, index) => {
    requireObject(condition, `conditions[${index}]`);

    const quantityCheck = optionalString(
      condition.quantityCheck,
      `conditions[${index}].quantityCheck`,
      50,
    );

    if (quantityCheck && !QUANTITY_CHECKS.has(quantityCheck)) {
      throw new TypeError(
        `conditions[${index}].quantityCheck must be one of: ${[...QUANTITY_CHECKS].join(", ")}`,
      );
    }

    return {
      position: integer(condition.position ?? index, `conditions[${index}].position`, 0),
      field: requireString(condition.field, `conditions[${index}].field`),
      subfield: optionalString(condition.subfield, `conditions[${index}].subfield`, 255),
      key: optionalString(condition.key, `conditions[${index}].key`, 255),
      operator: requireString(condition.operator, `conditions[${index}].operator`, 100),
      value: optionalString(condition.value, `conditions[${index}].value`),
      quantityCheck,
      quantityValue: optionalString(
        condition.quantityValue,
        `conditions[${index}].quantityValue`,
      ),
    };
  });

  validatePositions(normalized, "conditions");
  return normalized;
}

function validateCurrency(rate, field) {
  const currencyCode = rate.currencyCode
    ? requireString(rate.currencyCode, `${field}.currencyCode`).toUpperCase()
    : CURRENCY_CODES.get(rate.currency);

  if (!currencyCode || !VALID_CURRENCY_CODES.has(currencyCode)) {
    throw new TypeError(`${field}.currency must be a supported currency`);
  }

  return currencyCode;
}

function validateRateSafetyFields(rate, field) {
  for (const key of NON_NEGATIVE_RATE_FIELDS) {
    if (rate[key] === undefined || rate[key] === null || rate[key] === "") continue;

    const value = Number(rate[key]);
    if (!Number.isFinite(value)) {
      throw new TypeError(`${field}.${key} must be a number`);
    }
    if (value < 0) {
      throw new RangeError(`${field}.${key} must be zero or greater`);
    }
  }

  for (const key of BOOLEAN_RATE_FIELDS) {
    if (rate[key] !== undefined && typeof rate[key] !== "boolean") {
      throw new TypeError(`${field}.${key} must be a boolean`);
    }
  }
}

function validateDefinitions(zoneRates, ruleStatus) {
  requireObject(zoneRates, "zoneRates");

  const entries = Object.entries(zoneRates).flatMap(([zoneKey, rates]) =>
    (Array.isArray(rates) ? rates : [rates]).map((rate) => [zoneKey, rate]),
  );
  if (entries.length > 100) {
    throw new RangeError("zoneRates must contain 100 entries or fewer");
  }

  const definitions = entries.map(([zoneKey, rate], index) => {
    const field = `zoneRates.${zoneKey}`;
    requireObject(rate, field);
    validateRateSafetyFields(rate, field);

    const minimumDays = integer(rate.minimumDays, `${field}.minimumDays`, 0, false);
    const maximumDays = integer(rate.maximumDays, `${field}.maximumDays`, 0, false);

    if (minimumDays !== null && maximumDays !== null && maximumDays < minimumDays) {
      throw new RangeError(`${field}.maximumDays must be greater than or equal to minimumDays`);
    }

    return {
      position: integer(rate.position ?? index, `${field}.position`, 0),
      zoneKey: requireString(zoneKey, `${field}.zoneKey`),
      name: requireString(rate.name, `${field}.name`),
      calculation: requireString(
        rate.calculation ?? "Fixed rate",
        `${field}.calculation`,
      ),
      price:
        rate.price === undefined || rate.price === null || rate.price === ""
          ? null
          : Number(rate.price),
      description: optionalString(rate.description, `${field}.description`),
      minimumDays,
      maximumDays,
      currencyCode: validateCurrency(rate, field),
      status: enumValue(rate.status ?? ruleStatus, `${field}.status`, STATUSES, "DRAFT"),
    };
  });

  validatePositions(definitions, "rate definitions");
  return definitions;
}

function validateSchedules(schedules = []) {
  if (!Array.isArray(schedules)) {
    throw new TypeError("schedules must be an array");
  }

  if (schedules.length > 100) {
    throw new RangeError("schedules must contain 100 items or fewer");
  }

  return schedules.map((schedule, position) => {
    requireObject(schedule, `schedules[${position}]`);
    const scheduledAtValue = requireString(
      schedule.scheduledAt,
      `schedules[${position}].scheduledAt`,
    );
    const scheduledAt = new Date(scheduledAtValue);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new TypeError(`schedules[${position}].scheduledAt must be a valid date and time`);
    }

    return {
      position,
      action: enumValue(
        schedule.action,
        `schedules[${position}].action`,
        SCHEDULE_ACTIONS,
        "ACTIVATE",
      ),
      scheduledAt,
      timezone: requireString(schedule.timezone, `schedules[${position}].timezone`, 100),
    };
  });
}

export function validateRate(data) {
  requireObject(data);

  const status = enumValue(data.status, "status", STATUSES, "DRAFT");

  return {
    rule: {
      shopId: requireString(data.shopId, "shopId"),
      name: requireString(data.name, "name"),
      priority: integer(data.priority, "priority", 0),
      status,
      conditionMatch: enumValue(
        data.conditionMatch,
        "conditionMatch",
        CONDITION_MATCHES,
        "ALL",
      ),
      exclusivity: enumValue(
        data.exclusivity,
        "exclusivity",
        EXCLUSIVITIES,
        "INCLUSIVE",
      ),
    },
    conditions: validateConditions(data.conditions),
    definitions: validateDefinitions(data.zoneRates, status),
    schedules: validateSchedules(data.schedules),
  };
}
