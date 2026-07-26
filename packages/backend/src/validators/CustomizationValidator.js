const CUSTOMIZATION_TYPES = new Set(["hide", "show", "only_show", "reorder", "rename"]);
const STATUSES = new Set(["DRAFT", "ACTIVE"]);
const CONDITION_MATCHES = new Set(["ALL", "ANY"]);
const SHIPMENT_SCOPES = new Set(["ALL", "FIRST"]);
const SCHEDULE_ACTIONS = new Set(["ACTIVATE", "DEACTIVATE"]);
const PRODUCT_MATCHES = new Set([
  "at-least-one",
  "all-products",
  "exact-quantity",
  "more-quantity",
  "not-more-quantity",
  "more-amount",
  "not-more-amount",
]);
const CUSTOMIZATION_TYPE_ALIASES = new Map([
  ["hide shipping rates", "hide"],
  ["show shipping rates", "show"],
  ["only show specified shipping rates and hide rest", "only_show"],
  ["reorder shipping rates", "reorder"],
  ["rename shipping rates", "rename"],
]);
const CONDITION_FIELDS = {
  1: new Set([
    "Cart Subtotal",
    "Cart Quantity",
    "Cart Weight",
    "Product Tag",
    "Product Title",
    "Product Type",
    "Product Weight",
    "Product Vendor",
    "Variant Title",
    "Line Item Property",
    "Product Price",
    "Product Collection",
    "Customer Tag",
    "Customer Logged In",
    "Customer Company",
    "Customer First Name",
    "Zipcode / Postcode",
    "Country Code",
    "Address Line 1",
    "Address is a PO Box",
    "Address is not a PO Box",
    "Shipping Method Name",
    "Shipping Rate",
    "Always",
    "Number Of Vendors",
  ]),
  2: new Set([
    "Cart Attribute",
    "SKU",
    "Product Tag",
    "Variant Metafield",
    "Is subscription product",
    "Province / State Code",
    "Country Code",
    "Address Line 1",
    "Address is a PO Box",
    "Address is not a PO Box",
    "Customer Tag",
    "Customer Metafield",
    "Company Metafield",
    "Customer First Name",
  ]),
  3: new Set([
    "Cart Subtotal",
    "Cart Weight",
    "Company Location Metafield",
    "Customer First Name",
    "Zipcode / Postcode",
  ]),
};

function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Customization data must be an object");
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

function requireInteger(value, field, minimum, maximum) {
  const normalized = typeof value === "string" && value.trim() ? Number(value) : value;

  if (!Number.isInteger(normalized)) {
    throw new TypeError(`${field} must be an integer`);
  }

  if (normalized < minimum || normalized > maximum) {
    throw new RangeError(`${field} must be between ${minimum} and ${maximum}`);
  }

  return normalized;
}

function requireEnum(value, field, allowedValues, normalize) {
  const normalized = normalize(requireString(value, field));

  if (!allowedValues.has(normalized)) {
    throw new TypeError(`${field} must be one of: ${[...allowedValues].join(", ")}`);
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

function validateConditions(conditionsBySet, parameterSet) {
  requireObject(conditionsBySet);

  const conditions = conditionsBySet[String(parameterSet)];

  if (!Array.isArray(conditions)) {
    throw new TypeError(`conditionsBySet.${parameterSet} must be an array`);
  }

  if (conditions.length > 100) {
    throw new RangeError("conditions must contain 100 items or fewer");
  }

  return conditions.map((condition, position) => {
    requireObject(condition);

    const field = requireString(condition.field, `conditions[${position}].field`);

    if (!CONDITION_FIELDS[parameterSet].has(field)) {
      throw new TypeError(
        `conditions[${position}].field is not valid for parameter set ${parameterSet}`,
      );
    }

    const productMatch = optionalString(
      condition.productMatch,
      `conditions[${position}].productMatch`,
      50,
    );

    if (productMatch && !PRODUCT_MATCHES.has(productMatch)) {
      throw new TypeError(
        `conditions[${position}].productMatch must be one of: ${[...PRODUCT_MATCHES].join(", ")}`,
      );
    }

    return {
      position,
      field,
      operator: optionalString(condition.operator, `conditions[${position}].operator`, 100),
      key: optionalString(condition.key, `conditions[${position}].key`),
      value: optionalString(condition.value, `conditions[${position}].value`),
      productMatch,
      matchValue: optionalString(condition.matchValue, `conditions[${position}].matchValue`),
    };
  });
}

function validateMethods(methods, customizationType) {
  if (!Array.isArray(methods)) {
    throw new TypeError("methods must be an array");
  }

  if (methods.length > 100) {
    throw new RangeError("methods must contain 100 items or fewer");
  }

  const normalizedMethods = methods
    .map((method, index) => {
      if (typeof method === "string") {
        const value = optionalString(method, `methods[${index}]`, 255);

        if (!value) return null;
        if (customizationType === "rename") {
          throw new TypeError(`methods[${index}].replacementValue is required`);
        }

        return { value, replacementValue: null };
      }

      requireObject(method);
      const value = optionalString(method.value, `methods[${index}].value`, 255);
      if (!value) return null;

      const replacementValue =
        method.replacementValue === undefined || method.replacementValue === null
          ? null
          : requireString(
              method.replacementValue,
              `methods[${index}].replacementValue`,
              255,
            );

      if (customizationType === "rename" && !replacementValue) {
        throw new TypeError(`methods[${index}].replacementValue is required`);
      }

      return { value, replacementValue };
    })
    .filter(Boolean);

  if (normalizedMethods.length === 0) {
    throw new TypeError("methods must contain at least one shipping method");
  }

  return normalizedMethods.map((method, position) => ({ position, ...method }));
}

function validateSchedules(schedules = []) {
  if (!Array.isArray(schedules)) {
    throw new TypeError("schedules must be an array");
  }

  if (schedules.length > 100) {
    throw new RangeError("schedules must contain 100 items or fewer");
  }

  return schedules.map((schedule, position) => {
    requireObject(schedule);
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
      action: requireEnum(
        schedule.action,
        `schedules[${position}].action`,
        SCHEDULE_ACTIONS,
        (value) => value.toUpperCase(),
      ),
      scheduledAt,
      timezone: requireString(schedule.timezone, `schedules[${position}].timezone`, 100),
    };
  });
}

function normalizeCustomizationType(value) {
  const normalized = value.toLowerCase();
  return CUSTOMIZATION_TYPE_ALIASES.get(normalized) ?? normalized;
}

export function validateCustomization(data) {
  requireObject(data);

  const parameterSet = requireInteger(data.parameterSet, "parameterSet", 1, 3);
  const type = requireEnum(data.type, "type", CUSTOMIZATION_TYPES, normalizeCustomizationType);

  return {
    ...data,
    shopId: requireString(data.shopId, "shopId"),
    name: requireString(data.name, "name"),
    type,
    status: requireEnum(data.status ?? "DRAFT", "status", STATUSES, (value) => value.toUpperCase()),
    parameterSet,
    conditionMatch: requireEnum(
      data.conditionMatch ?? "ALL",
      "conditionMatch",
      CONDITION_MATCHES,
      (value) => value.toUpperCase(),
    ),
    shipmentScope: requireEnum(
      data.shipmentScope ?? "ALL",
      "shipmentScope",
      SHIPMENT_SCOPES,
      (value) => value.toUpperCase(),
    ),
    conditions: validateConditions(data.conditionsBySet, parameterSet),
    methods: validateMethods(data.methods, type),
    schedules: validateSchedules(data.schedules),
  };
}
