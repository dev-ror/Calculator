export const blankCondition = () => ({
  field: "Product Tag",
  subfield: "Product Tag",
  key: "",
  operator: "Equals",
  value: "",
  quantityCheck: "atLeastOne",
  quantityValue: "",
});
export const cartProductFields = [
  "Product Title",
  "Variant Title",
  "Product Tag",
  "SKU",
  "Product Barcode",
  "Product Vendor",
  "Product Price",
  "Product Compare-at Price",
  "Product Quantity",
  "Product Type",
  "Product Weight",
  "Line item property",
  "Product Metafield",
  "Variant Metafield",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product Volume",
];
export const isCartProductCondition = (field) =>
  ["Cart Contains", "Cart Does Not Contain"].includes(field);
export const effectiveConditionField = (condition) =>
  isCartProductCondition(condition.field)
    ? condition.subfield
    : condition.field;
export const isKeyedCondition = (condition) =>
  effectiveConditionField(condition).includes("Metafield") ||
  effectiveConditionField(condition) === "Line item property";
export const blankRate = () => ({
  name: "",
  description: "",
  minimumDays: "",
  maximumDays: "",
  currency: "Default Store Currency",
  calculation: "Fixed rate",
  price: "",
  roundUp: false,
  metafieldKey: "",
  increasePerItem: false,
  defaultRate: "",
  rateType: "Range",
  rangeStart: "",
  rangeEnd: "",
  basePrice: "",
  incrementalPrice: "",
  perEach: "",
  startFrom: "",
  priceCalculation: "Number of items",
  secondRangeStart: "",
  secondRangeEnd: "",
  googleMapsApiKey: "",
  originLocation: "Default Shopify Location",
  originCountry: "US",
  originPostcode: "",
  distanceMethod: "Driving",
  carrierApiKey: "",
  carrierSecret: "",
  carrierAccount: "",
  carrierEmail: "",
  carrierPassword: "",
  carrierSchedule: "Retail",
  ratesToShow: "All rates",
  hideDeliveryDates: false,
  packagingDistribution: "By items count",
  packages: [{ limit: "", length: "", width: "", height: "", weight: "" }],
  discount: "",
  handlingPercent: "",
  handlingFixed: "",
  carrierRateType: "Item",
  fuelLevy: false,
  packageType: "Parcel",
  signatureRequired: "No",
  insured: "No",
  selectedServices: [],
  tags: "",
});
export const currencyCodes = {
  "Default Store Currency": "USD",
  "United Arab Emirates Dirham": "AED",
  "Australian Dollars": "AUD",
  "Canadian Dollars": "CAD",
  Euro: "EUR",
  "United Kingdom Pounds": "GBP",
  "Indian Rupees": "INR",
  "Japanese Yen": "JPY",
  "New Zealand Dollars": "NZD",
  "United States Dollars": "USD",
  "South African Rand": "ZAR",
  "Hong Kong Dollars": "HKD",
  "Swiss Francs": "CHF",
  "Polish Zlotych": "PLN",
};
export const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countryOptions =
  `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`
    .split(" ")
    .map((code) => ({ code, name: regionNames.of(code) || code }))
    .sort((a, b) => a.name.localeCompare(b.name));
export const carrierNames = [
  "Australia Post",
  "USPS",
  "Fedex",
  "Shiprocket",
  "Direct Freight Express",
  "Stallion Express",
  "ShipStation",
];
export const uspsDomesticServices = [
  "Priority Mail",
  "Priority Mail Flat Rate Envelope",
  "Priority Mail Small Flat Rate Box",
  "Priority Mail Medium Flat Rate Box",
  "Priority Mail Large Flat Rate Box",
  "Priority Mail Padded Flat Rate Envelope",
  "Priority Mail Legal Flat Rate Envelope",
  "Priority Mail Window Flat Rate Envelope",
  "Priority Mail Express",
  "Priority Mail Express Flat Rate Envelope",
  "Priority Mail Express Padded Flat Rate Envelope",
  "First-Class Mail",
  "Ground Advantage",
  "Media Mail Parcel",
  "Library Mail Parcel",
];
export const uspsInternationalServices = [
  "Priority Mail International",
  "Priority Mail International Flat Rate Envelope",
  "Priority Mail International Small Flat Rate Box",
  "Priority Mail International Medium Flat Rate Box",
  "Priority Mail International Large Flat Rate Box",
  "Priority Mail Express International",
  "First-Class Package International",
  "Global Express Guaranteed",
  "Global Express Guaranteed - Envelopes",
];
export const textFields = new Set([
  "Product Title",
  "Variant Title",
  "SKU",
  "Product Barcode",
  "Product Vendor",
  "Product Type",
  "Line item property",
  "Address Line 1",
  "Customer First Name",
  "Customer Last Name",
]);
export const numericFields = new Set([
  "Product Price",
  "Product Compare-at Price",
  "Product Quantity",
  "Product Weight",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product Volume",
  "Cart Quantity",
  "Cart Subtotal (total before discount)",
  "Cart Total (total after discount)",
  "Cart Weight",
  "Cart Volume",
]);
export const idFields = new Set(["Shopify Variant ID", "Shopify Product ID"]);
export const shippingHelpFields = new Set([
  "Zipcode / Postcode",
  "Province / State Code",
  "Address Line 1",
  "Country Code",
  "Day of the Week",
  "Warehouse Zipcode / Postcode",
]);

export const conditionBehavior = (field) => {
  if (field === "Product Tag" || field === "Customer Tag")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "You can enter multiple values separated by comma (,).",
      type: "text",
    };
  if (field === "Address Line 1")
    return {
      operators: ["Contains", "Does Not Contain"],
      help: "You can enter multiple values separated by semi-colon (;).",
      type: "text",
    };
  if (textFields.has(field))
    return {
      operators: ["Equals", "Does Not Equal", "Contains", "Does Not Contain"],
      help: ["Customer First Name", "Customer Last Name"].includes(field)
        ? ""
        : "You can enter multiple values separated by semi-colon (;).",
      type: "text",
    };
  if (
    [
      "Product Price",
      "Product Compare-at Price",
      "Cart Subtotal (total before discount)",
      "Cart Total (total after discount)",
    ].includes(field)
  )
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal",
      ],
      help: "",
      type: "number",
      currency: true,
    };
  if (["Product Weight", "Cart Weight"].includes(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal",
      ],
      help: "",
      type: "number",
      unit: "lb",
    };
  if (
    [
      "Product Length",
      "Product Width",
      "Product Height",
      "Product Volume",
      "Cart Volume",
    ].includes(field)
  )
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal",
      ],
      help: "",
      type: "number",
      unit: ["Product Volume", "Cart Volume"].includes(field) ? "mm³" : "mm",
    };
  if (numericFields.has(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal",
      ],
      help: "Enter a numeric value for this condition.",
      type: "number",
    };
  if (idFields.has(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "You can also enter multiple values separated by semi-colon (;).",
      type: "text",
    };
  if (field.includes("Metafield"))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Contains",
        "Greater Than",
        "Less Than",
        "Greater Than or Equal",
        "Less Than or Equal",
        "Is True",
        "Is False",
        ...(field === "Variant Metafield" ? ["Is Empty", "Is Not Empty"] : []),
      ],
      help: "You can enter multiple values separated by semi-colon (;).",
      type: "text",
    };
  if (["Zipcode / Postcode", "Warehouse Zipcode / Postcode"].includes(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text",
    };
  if (["Province / State Code", "Country Code"].includes(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text",
    };
  if (field === "Day of the Week")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text",
    };
  if (field === "Cart Locale")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text",
    };
  if (["Cart Contains", "Cart Does Not Contain"].includes(field))
    return {
      operators: [
        "Product",
        "Variant",
        "Collection",
        "Product Type",
        "Vendor",
        "Tag",
      ],
      help: "Enter the item value that should be checked in the cart.",
      type: "text",
    };
  if (field === "Time of the Day")
    return {
      operators: [
        "Less Than",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than or Equal",
      ],
      help: "",
      type: "time",
    };
  return {
    operators: ["Equals", "Does Not Equal", "Contains", "Does Not Contain"],
    help: "You can enter multiple values separated by comma (,).",
    type: "text",
  };
};
