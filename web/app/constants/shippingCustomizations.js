export const emptyCustomizationCondition = () => ({
  field: "Cart Subtotal",
  operator: "Equals",
  key: "",
  value: "",
  productMatch: "at-least-one",
  matchValue: "",
});

export const emptyParameter2Condition = () => ({
  ...emptyCustomizationCondition(),
  field: "SKU",
});

export const productMatchOptions = [
  ["at-least-one", "At least one product meets the condition."],
  ["all-products", "All products meet the condition."],
  ["exact-quantity", "Cart has exactly specified quantity."],
  ["more-quantity", "Cart has more than specified quantity."],
  ["not-more-quantity", "Cart has not more than specified quantity."],
  ["more-amount", "Cart has more than specified total price."],
  ["not-more-amount", "Cart has not more than total price."],
];

export const quantityMatches = new Set([
  "exact-quantity",
  "more-quantity",
  "not-more-quantity",
]);

export const amountMatches = new Set(["more-amount", "not-more-amount"]);

const productFields = new Set([
  "Product Tag",
  "Product Title",
  "Product Type",
  "Product Weight",
  "Product Vendor",
  "Variant Title",
  "Line Item Property",
  "Product Price",
  "Product Collection",
  "SKU",
  "Variant Metafield",
  "Is subscription product",
]);

const textProductFields = new Set([
  "Product Title",
  "Product Type",
  "Product Vendor",
  "Variant Title",
]);

const numericProductFields = new Set(["Product Weight", "Product Price"]);

export const unsupportedCheckoutConditionFields = new Set([
  "Cart Attribute",
  "Line Item Property",
  "Product Collection",
  "Variant Metafield",
  "Customer Metafield",
  "Company Metafield",
  "Company Location Metafield",
]);

const textOperators = [
  "Equals",
  "Not equals",
  "Contains",
  "Does not contains",
  "Starts with",
  "Ends with",
];

const textAndListOperators = [
  ...textOperators,
  "Includes in list",
  "Not includes in list",
];

export const hasProductMatchOptions = (field) => productFields.has(field);

export const getConditionOperators = (field, parameterSet) => {
  if (field === "Is subscription product") return ["True", "False"];

  if (field === "Cart Attribute") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
    ];
  }

  if (field === "SKU" || field === "Province / State Code") {
    return textAndListOperators;
  }

  if (field === "Variant Metafield") {
    return ["Equals", "Not equals", "Contains", "Does not contains"];
  }

  if (field === "Company Metafield") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
      "Includes in list",
      "Not includes in list",
    ];
  }

  if (field === "Company Location Metafield" && parameterSet === 3) {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
      "Includes in list",
      "Not includes in list",
    ];
  }

  if (
    field === "Customer Metafield" ||
    field === "Company Location Metafield"
  ) {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
    ];
  }

  if (field === "Zipcode / Postcode") return ["Equals", "Not equals"];

  if (field === "Country Code") {
    return textAndListOperators;
  }

  if (field === "Address Line 1" || field === "Shipping Method Name") {
    return textOperators;
  }

  if (field === "Shipping Rate" || field === "Number Of Vendors") {
    return numericOperators;
  }

  if (field === "Customer Logged In") return ["True", "False"];

  if (field === "Customer Company") {
    return [...textOperators, "Is empty", "Is not empty"];
  }

  if (field === "Customer First Name") {
    return textAndListOperators;
  }

  if (field === "Customer Tag") return ["Equals", "Not equals"];

  if (textProductFields.has(field)) {
    return textAndListOperators;
  }

  if (field === "Line Item Property") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
    ];
  }

  if (numericProductFields.has(field)) {
    return [...numericOperators, "Is empty", "Is not empty"];
  }

  if (field === "Product Tag" || field === "Product Collection") {
    return ["Equals", "Not equals"];
  }

  return numericOperators;
};

const numericOperators = [
  "Equals",
  "Not equals",
  "Greater than",
  "Less than",
  "Greater than or equal",
  "Less than or equal",
];

export const getDefaultConditionOperator = (field) => {
  if (field === "Customer Logged In" || field === "Is subscription product") {
    return "True";
  }
  if (
    field === "Customer Company" ||
    field === "Address Line 1" ||
    field === "Shipping Method Name"
  ) {
    return "Contains";
  }
  return "Equals";
};

export const getCustomizationActionLabel = (type) => {
  const normalizedType = String(type || "").trim().toLowerCase();
  if (normalizedType === "hide" || normalizedType === "hide shipping rates") {
    return "Hide the following shipping methods";
  }
  if (normalizedType === "show" || normalizedType === "show shipping rates") {
    return "Show the following shipping methods";
  }
  if (
    normalizedType === "only_show" ||
    normalizedType === "only show specified shipping rates and hide rest"
  ) {
    return "Only show the following shipping methods and hide the rest";
  }
  if (normalizedType === "rename" || normalizedType === "rename shipping rates") {
    return "Rename the following shipping methods";
  }
  return "Reorder the following shipping methods";
};

export const getCustomizationTypeLabel = (type) => {
  const normalizedType = String(type || "").trim().toLowerCase();
  const typeLabels = {
    hide: "Hide shipping rates",
    show: "Show shipping rates",
    only_show: "Only show specified shipping rates and hide rest",
    reorder: "Reorder shipping rates",
    rename: "Rename shipping rates",
  };

  return typeLabels[normalizedType] || type || "Unknown customization type";
};
