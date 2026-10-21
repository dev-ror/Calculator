const PRODUCT_FIELDS = new Set([
  "producttitle",
  "varianttitle",
  "producttag",
  "producttype",
  "productweight",
  "productvendor",
  "productprice",
  "productcompareatprice",
  "productquantity",
  "productcollection",
  "productbarcode",
  "sku",
  "variantmetafield",
  "productmetafield",
  "lineitemproperty",
  "productlength",
  "productwidth",
  "productheight",
  "productvolume",
  "shopifyvariantid",
  "shopifyproductid",
  "issubscriptionproduct",
]);

function normalizedKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function lineItems(request) {
  const items = firstDefined(
    request.lineItems,
    request.items,
    request.products,
    request.cart?.lineItems,
    request.cart?.lines,
    request.cart?.items,
  );

  return Array.isArray(items) ? items : [];
}

function keyedValue(container, key) {
  if (!container || typeof container !== "object" || !key) return undefined;
  return container[key];
}

function productValue(item, field, key) {
  const product = item.product ?? item;
  const variant = item.variant ?? product.variant ?? {};

  switch (field) {
    case "producttitle": return firstDefined(product.title, item.productTitle, item.title);
    case "varianttitle": return firstDefined(variant.title, item.variantTitle);
    case "producttag": return firstDefined(product.tags, item.tags);
    case "producttype": return firstDefined(product.type, product.productType, item.productType);
    case "productweight": return firstDefined(item.weight, variant.weight, product.weight);
    case "productvendor": return firstDefined(product.vendor, item.vendor);
    case "productprice": return firstDefined(item.price, variant.price, product.price);
    case "productcompareatprice":
      return firstDefined(item.compareAtPrice, variant.compareAtPrice, product.compareAtPrice);
    case "productquantity": return firstDefined(item.quantity, 0);
    case "productcollection":
      return firstDefined(product.collections, product.collectionIds, item.collections);
    case "productbarcode": return firstDefined(variant.barcode, item.barcode);
    case "sku": return firstDefined(variant.sku, item.sku);
    case "variantmetafield": return keyedValue(variant.metafields ?? item.variantMetafields, key);
    case "productmetafield": return keyedValue(product.metafields ?? item.productMetafields, key);
    case "lineitemproperty": return keyedValue(item.properties, key);
    case "productlength": return firstDefined(item.length, variant.length, product.length);
    case "productwidth": return firstDefined(item.width, variant.width, product.width);
    case "productheight": return firstDefined(item.height, variant.height, product.height);
    case "productvolume": return firstDefined(item.volume, variant.volume, product.volume);
    case "shopifyvariantid": return firstDefined(variant.id, item.variantId);
    case "shopifyproductid": return firstDefined(product.id, item.productId);
    case "issubscriptionproduct":
      return firstDefined(item.isSubscription, item.subscription, item.sellingPlanId != null);
    default: return undefined;
  }
}

function scalarValue(request, field, key) {
  const cart = request.cart ?? request;
  const destination = request.destination ?? request.shippingAddress ?? request.address ?? {};
  const customer = request.customer ?? {};
  const items = lineItems(request);

  switch (field) {
    case "always": return true;
    case "cartsubtotal":
    case "cartsubtotaltotalbeforediscount":
      return firstDefined(cart.subtotal, cart.subtotalPrice, request.subtotal);
    case "carttotaltotalafterdiscount":
      return firstDefined(cart.total, cart.totalPrice, request.total);
    case "cartquantity":
      return firstDefined(cart.quantity, request.quantity, items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0));
    case "cartweight":
      return firstDefined(cart.weight, request.weight, items.reduce((sum, item) => sum + Number(item.weight ?? 0) * Number(item.quantity ?? 1), 0));
    case "cartvolume": return firstDefined(cart.volume, request.volume);
    case "cartlocale": return firstDefined(cart.locale, request.locale);
    case "cartattribute": return keyedValue(cart.attributes ?? request.attributes, key);
    case "zipcodepostcode": return firstDefined(destination.zip, destination.postcode, destination.postalCode);
    case "provincestatecode": return firstDefined(destination.provinceCode, destination.province, destination.stateCode);
    case "countrycode": return firstDefined(destination.countryCode, destination.country);
    case "addressline1": return firstDefined(destination.address1, destination.addressLine1);
    case "addressisapobox": return firstDefined(destination.isPoBox, request.isPoBox);
    case "addressisnotapobox": {
      const isPoBox = firstDefined(destination.isPoBox, request.isPoBox);
      return isPoBox === undefined ? undefined : !isPoBox;
    }
    case "timeofday":
    case "timeoftheday": return firstDefined(request.timeOfDay, request.time);
    case "dayoftheweek": return firstDefined(request.dayOfWeek, request.day);
    case "warehousezipcodepostcode":
      return firstDefined(request.warehouse?.zip, request.warehouse?.postcode, request.origin?.postcode);
    case "customertag": return firstDefined(customer.tags, request.customerTags);
    case "customerfirstname": return firstDefined(customer.firstName, request.customerFirstName);
    case "customerlastname": return firstDefined(customer.lastName, request.customerLastName);
    case "customerloggedin": return firstDefined(customer.loggedIn, request.customerLoggedIn);
    case "customercompany": return firstDefined(customer.company?.name, customer.company, request.customerCompany);
    case "customermetafield": return keyedValue(customer.metafields, key);
    case "companymetafield": return keyedValue(customer.company?.metafields, key);
    case "companylocationmetafield": return keyedValue(customer.companyLocation?.metafields, key);
    case "shippingmethodname": return firstDefined(request.shippingMethod?.name, request.shippingMethodName);
    case "shippingrate": return firstDefined(request.shippingMethod?.price, request.shippingRate);
    case "numberofvendors": {
      const vendors = items.map((item) => productValue(item, "productvendor")).filter(Boolean);
      return new Set(vendors.map((vendor) => String(vendor).toLowerCase())).size;
    }
    default: return firstDefined(request[field], cart[field]);
  }
}

function values(value) {
  if (Array.isArray(value)) return value.flatMap(values);
  if (value && typeof value === "object") {
    return [firstDefined(value.value, value.id, value.handle, value.title, value.name)];
  }
  return [value];
}

function expectedValues(value) {
  if (Array.isArray(value)) return value.flatMap(expectedValues);
  if (typeof value !== "string") return [value];
  return value.split(/[;,]/).map((part) => part.trim()).filter(Boolean);
}

function equals(actual, expected) {
  if (typeof actual === "boolean") {
    const normalized = String(expected).trim().toLowerCase();
    return actual === ["true", "1", "yes"].includes(normalized);
  }

  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  if (actual !== "" && expected !== "" && Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
    return actualNumber === expectedNumber;
  }

  return String(actual ?? "").trim().toLowerCase() === String(expected ?? "").trim().toLowerCase();
}

function compare(actualValue, operator, expectedValue) {
  const actual = values(actualValue);
  const expected = expectedValues(expectedValue);
  const normalizedOperator = normalizedKey(operator);
  const anyEqual = actual.some((left) => expected.some((right) => equals(left, right)));
  const anyContains = actual.some((left) =>
    expected.some((right) => String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase())),
  );

  switch (normalizedOperator) {
    case "equals": return anyEqual;
    case "notequals": case "doesnotequal": return !anyEqual;
    case "contains": return anyContains;
    case "doesnotcontain": case "doesnotcontains": return !anyContains;
    case "includesinlist": return anyEqual;
    case "notincludesinlist": return !anyEqual;
    case "isempty": return actual.every((value) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0));
    case "isnotempty": return actual.some((value) => value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0));
    case "true": return actual.some((value) => equals(value, true));
    case "false": return actual.some((value) => equals(value, false));
    case "greaterthan": return actual.some((value) => Number(value) > Number(expectedValue));
    case "greaterthanorequal": return actual.some((value) => Number(value) >= Number(expectedValue));
    case "lessthan": return actual.some((value) => Number(value) < Number(expectedValue));
    case "lessthanorequal": return actual.some((value) => Number(value) <= Number(expectedValue));
    default: return false;
  }
}

function productMatch(condition, request, field) {
  const items = lineItems(request);
  const matches = items.filter((item) => compare(productValue(item, field, condition.key), condition.operator, condition.value));
  const quantity = matches.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0);
  const amount = matches.reduce((sum, item) => sum + Number(item.price ?? item.variant?.price ?? 0) * Number(item.quantity ?? 1), 0);
  const threshold = Number(condition.matchValue ?? condition.quantityValue ?? 0);
  const mode = condition.productMatch ?? condition.quantityCheck ?? "atLeastOne";

  switch (normalizedKey(mode)) {
    case "allproducts": return items.length > 0 && matches.length === items.length;
    case "exactquantity": return quantity === threshold;
    case "morequantity": case "moreproducts": return quantity > threshold;
    case "notmorequantity": return quantity <= threshold;
    case "lessproducts": return quantity < threshold;
    case "moreamount": return amount > threshold;
    case "notmoreamount": return amount <= threshold;
    case "lessamount": return amount < threshold;
    default: return matches.length > 0;
  }
}

export function matchesCondition(condition, request) {
  if (!condition || typeof condition !== "object" || !request || typeof request !== "object") {
    return false;
  }

  const field = normalizedKey(condition.subfield || condition.field);
  if (PRODUCT_FIELDS.has(field)) return productMatch(condition, request, field);

  if (["cartcontains", "cartdoesnotcontain"].includes(normalizedKey(condition.field))) {
    const matched = productMatch(condition, request, normalizedKey(condition.subfield));
    return normalizedKey(condition.field) === "cartdoesnotcontain" ? !matched : matched;
  }

  return compare(scalarValue(request, field, condition.key), condition.operator, condition.value);
}
