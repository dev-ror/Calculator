import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";

const emptyCondition = () => ({
  field: "Cart Subtotal",
  operator: "Equals",
  key: "",
  value: "",
  productMatch: "at-least-one",
  matchValue: "",
});

const emptyParameter2Condition = () => ({
  ...emptyCondition(),
  field: "SKU",
});

const productTagMatchOptions = [
  ["at-least-one", "At least one product meets the condition."],
  ["all-products", "All products meet the condition."],
  ["exact-quantity", "Cart has exactly specified quantity."],
  ["more-quantity", "Cart has more than specified quantity."],
  ["not-more-quantity", "Cart has not more than specified quantity."],
  ["more-amount", "Cart has more than specified total price."],
  ["not-more-amount", "Cart has not more than total price."],
];

const quantityMatches = new Set([
  "exact-quantity",
  "more-quantity",
  "not-more-quantity",
]);

const amountMatches = new Set(["more-amount", "not-more-amount"]);

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

const hasProductMatchOptions = (field) => productFields.has(field);

const getConditionOperators = (field, parameterSet) => {
  if (field === "Is subscription product") {
    return ["True", "False"];
  }

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

  if (
    field === "SKU" ||
    field === "Province / State Code"
  ) {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Includes in list",
      "Not includes in list",
    ];
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

  if (field === "Zipcode / Postcode") {
    return ["Equals", "Not equals"];
  }

  if (field === "Country Code") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Includes in list",
      "Not includes in list",
    ];
  }

  if (field === "Address Line 1" || field === "Shipping Method Name") {
    return ["Contains", "Does not contains"];
  }

  if (field === "Shipping Rate" || field === "Number Of Vendors") {
    return [
      "Equals",
      "Not equals",
      "Greater than",
      "Less than",
      "Greater than or equal",
      "Less than or equal",
    ];
  }

  if (field === "Customer Logged In") {
    return ["True", "False"];
  }

  if (field === "Customer Company") {
    return ["Contains", "Does not contains", "Is empty", "Is not empty"];
  }

  if (field === "Customer First Name") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Includes in list",
      "Not includes in list",
    ];
  }

  if (field === "Customer Tag") {
    return ["Equals", "Not equals"];
  }

  if (textProductFields.has(field)) {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Includes in list",
      "Not includes in list",
    ];
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
    return [
      "Equals",
      "Not equals",
      "Greater than",
      "Less than",
      "Greater than or equal",
      "Less than or equal",
      "Is empty",
      "Is not empty",
    ];
  }

  if (field === "Product Tag" || field === "Product Collection") {
    return ["Equals", "Not equals"];
  }

  return [
    "Equals",
    "Not equals",
    "Greater than",
    "Less than",
    "Greater than or equal",
    "Less than or equal",
  ];
};

const DeleteIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M7.5 3.5h5M4.5 6h11M6 6l.7 10h6.6L14 6M8.5 8.5v5M11.5 8.5v5" />
  </svg>
);

export default function NewCustomization() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [type, setType] = useState("Hide shipping rates");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [match, setMatch] = useState("all");
  const [parameterSet, setParameterSet] = useState(1);
  const [shipmentScope, setShipmentScope] = useState("all");
  const [conditionsBySet, setConditionsBySet] = useState({
    1: [emptyCondition()],
    2: [emptyParameter2Condition()],
    3: [emptyCondition()],
  });
  const [methods, setMethods] = useState([""]);

  const conditions = conditionsBySet[parameterSet];
  const setConditions = (nextConditions) =>
    setConditionsBySet((current) => ({
      ...current,
      [parameterSet]:
        typeof nextConditions === "function"
          ? nextConditions(current[parameterSet])
          : nextConditions,
    }));

  const nextParameterSet = parameterSet === 3 ? 1 : parameterSet + 1;

  const updateCondition = (index, key, value) =>
    setConditions(
      conditions.map((condition, itemIndex) =>
        itemIndex === index ? { ...condition, [key]: value } : condition,
      ),
    );

  const canSave = name.trim() && methods.some((method) => method.trim());
  const save = () => {
    if (!canSave) return;
    shopify.toast.show("Shipping customization saved");
    navigate("/app/customizations");
  };

  const actionLabel =
    type === "Hide shipping rates"
      ? "Hide the following shipping methods"
      : type === "Rename shipping rates"
        ? "Rename the following shipping methods"
        : "Reorder the following shipping methods";

  return (
    <s-page inlineSize="large">
      <div className={styles.ruleTitleRow}>
        <AppPageHeader title="Create customization rule" />
        <button
          type="button"
          className={styles.saveRuleButton}
          disabled={!canSave}
          onClick={save}
        >
          Save
        </button>
      </div>

      <div className={styles.ruleLayout}>
        <main className={styles.ruleMain}>
          <section className={styles.ruleCard}>
            <label>
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="hide">Hide shipping rates</option>
                <option value="show">Show shipping rates</option>
                <option value="only_show">
                  Only show specified shipping rates and hide rest
                </option>
                <option value="reorder">Reorder shipping rates</option>
                <option value="rename">Rename shipping rates</option>
              </select>
            </label>
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Hide free shipping for heavy items"
              />
            </label>
          </section>

          <section className={styles.ruleCard}>
            <div className={styles.customizationCardHeading}>
              <h2>Conditions</h2>
              <button
                type="button"
                onClick={() => setParameterSet(nextParameterSet)}
              >
                Switch to parameter set {nextParameterSet}
                <span aria-hidden="true">ⓘ</span>
              </button>
            </div>
            <p>Rule must match:</p>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customization-match"
                checked={match === "all"}
                onChange={() => setMatch("all")}
              />
              All conditions
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customization-match"
                checked={match === "any"}
                onChange={() => setMatch("any")}
              />
              Any condition
            </label>

            {conditions.map((condition, index) => (
              <div className={styles.conditionBlock} key={index}>
                <label>Condition {index + 1}</label>
                <div
                  className={`${styles.conditionRow} ${
                    condition.field === "Line Item Property" ||
                    condition.field === "Shipping Rate" ||
                    condition.field === "Cart Attribute" ||
                    condition.field === "Variant Metafield" ||
                    condition.field === "Customer Metafield" ||
                    condition.field === "Company Metafield" ||
                    condition.field === "Company Location Metafield"
                      ? styles.metafieldConditionRow
                      : condition.field === "Address is a PO Box" ||
                          condition.field === "Address is not a PO Box" ||
                          condition.field === "Always"
                        ? styles.conditionOnlyRow
                        : ""
                  }`}
                >
                  <select
                    value={condition.field}
                    onChange={(event) => {
                      const field = event.target.value;
                      setConditions(
                        conditions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                field,
                                operator:
                                  field === "Customer Logged In"
                                    ? "True"
                                    : field === "Is subscription product"
                                      ? "True"
                                      : field === "Customer Company"
                                        ? "Contains"
                                        : field === "Address Line 1" ||
                                            field === "Shipping Method Name"
                                          ? "Contains"
                                          : "Equals",
                                key: "",
                                productMatch: "at-least-one",
                                matchValue: "",
                              }
                            : item,
                        ),
                      );
                    }}
                  >
                    {parameterSet === 2 ? (
                      <>
                        <optgroup label="Cart">
                          <option>Cart Attribute</option>
                        </optgroup>
                        <optgroup label="Product">
                          <option>SKU</option>
                          <option>Product Tag</option>
                          <option>Variant Metafield</option>
                          <option>Is subscription product</option>
                        </optgroup>
                        <optgroup label="Shipping">
                          <option>Province / State Code</option>
                          <option>Country Code</option>
                          <option>Address Line 1</option>
                          <option>Address is a PO Box</option>
                          <option>Address is not a PO Box</option>
                        </optgroup>
                        <optgroup label="Customer">
                          <option>Customer Tag</option>
                          <option>Customer Metafield</option>
                          <option>Company Metafield</option>
                          <option>Customer First Name</option>
                        </optgroup>
                      </>
                    ) : parameterSet === 3 ? (
                      <>
                        <optgroup label="Cart">
                          <option>Cart Subtotal</option>
                          <option>Cart Weight</option>
                        </optgroup>
                        <optgroup label="Customer">
                          <option>Company Location Metafield</option>
                          <option>Customer First Name</option>
                        </optgroup>
                        <optgroup label="Shipping">
                          <option>Zipcode / Postcode</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <optgroup label="Cart">
                          <option>Cart Subtotal</option>
                          <option>Cart Quantity</option>
                          <option>Cart Weight</option>
                        </optgroup>
                        <optgroup label="Product">
                          <option>Product Tag</option>
                          <option>Product Title</option>
                          <option>Product Type</option>
                          <option>Product Weight</option>
                          <option>Product Vendor</option>
                          <option>Variant Title</option>
                          <option>Line Item Property</option>
                          <option>Product Price</option>
                          <option>Product Collection</option>
                        </optgroup>
                        <optgroup label="Customer">
                          <option>Customer Tag</option>
                          <option>Customer Logged In</option>
                          <option>Customer Company</option>
                          <option>Customer First Name</option>
                        </optgroup>
                        <optgroup label="Shipping">
                          <option>Zipcode / Postcode</option>
                          <option>Country Code</option>
                          <option>Address Line 1</option>
                          <option>Address is a PO Box</option>
                          <option>Address is not a PO Box</option>
                          <option>Shipping Method Name</option>
                          <option>Shipping Rate</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option>Always</option>
                          <option>Number Of Vendors</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                  {(condition.field === "Line Item Property" ||
                    condition.field === "Shipping Rate" ||
                    condition.field === "Cart Attribute" ||
                    condition.field === "Variant Metafield" ||
                    condition.field === "Customer Metafield" ||
                    condition.field === "Company Metafield" ||
                    condition.field === "Company Location Metafield") && (
                    <input
                      aria-label={
                        condition.field === "Shipping Rate"
                          ? "Shipping rate name"
                          : `${condition.field} key`
                      }
                      placeholder={
                        condition.field === "Shipping Rate"
                          ? "Shipping Rate Name"
                          : condition.field === "Variant Metafield" ||
                              condition.field === "Company Location Metafield"
                            ? "namespace.key"
                            : "Key"
                      }
                      value={condition.key}
                      onChange={(event) =>
                        updateCondition(index, "key", event.target.value)
                      }
                    />
                  )}
                  {condition.field !== "Address is a PO Box" &&
                    condition.field !== "Address is not a PO Box" &&
                    condition.field !== "Always" && (
                      <select
                        value={condition.operator}
                        onChange={(event) =>
                          updateCondition(index, "operator", event.target.value)
                        }
                      >
                        {getConditionOperators(
                          condition.field,
                          parameterSet,
                        ).map(
                          (operator) => (
                            <option key={operator}>{operator}</option>
                          ),
                        )}
                      </select>
                    )}
                  <button
                    type="button"
                    aria-label={`Delete condition ${index + 1}`}
                    onClick={() =>
                      setConditions(
                        conditions.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    <DeleteIcon />
                  </button>
                </div>
                {condition.field !== "Customer Logged In" &&
                  condition.field !== "Is subscription product" &&
                  condition.field !== "Address is a PO Box" &&
                  condition.field !== "Address is not a PO Box" &&
                  condition.field !== "Always" && (
                    <input
                      value={condition.value}
                      onChange={(event) =>
                        updateCondition(index, "value", event.target.value)
                      }
                    />
                  )}
                {condition.field === "Customer Tag" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    You can enter multiple values separated by comma (,).
                  </p>
                )}
                {condition.field === "Zipcode / Postcode" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    Enter postcodes separated by commas. You can use asterisk
                    (*) for wildcard. You can also use enter hyphen separated
                    values for range. For e.g. AB14*, 444001-444099
                  </p>
                )}
                {condition.field === "Province / State Code" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    Enter two-letter province codes used by Shopify. You can
                    find them{" "}
                    <a
                      href="https://help.shopify.com/en/manual/international/managing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      here
                    </a>
                    .
                  </p>
                )}
                {condition.field === "Country Code" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    Enter two-letter country codes used by Shopify. You can find
                    them{" "}
                    <a
                      href="https://www.iban.com/country-codes"
                      target="_blank"
                      rel="noreferrer"
                    >
                      here
                    </a>
                    .
                  </p>
                )}
                {condition.field === "Address is a PO Box" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    This condition will try to find any mention of PO Box in the
                    address entered by customer.
                  </p>
                )}
                {condition.field === "Address is not a PO Box" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    This condition will check that the address does NOT contain
                    any mention of PO Box.
                  </p>
                )}
                {(condition.field === "Shipping Method Name" ||
                  condition.field === "Shipping Rate") && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    Enter part of the full shipping method name.
                  </p>
                )}
                {condition.field === "Always" && (
                  <p className={`${styles.fieldHelp} ${styles.productTagHelp}`}>
                    This rule will be always true
                  </p>
                )}
                {hasProductMatchOptions(condition.field) && (
                  <>
                    {condition.field === "Product Tag" && (
                      <p
                        className={`${styles.fieldHelp} ${styles.productTagHelp}`}
                      >
                        You can enter multiple values separated by comma (,).
                      </p>
                    )}
                    {condition.field === "Product Collection" && (
                      <p
                        className={`${styles.fieldHelp} ${styles.productTagHelp}`}
                      >
                        Enter IDs of collections. Click{" "}
                        <a
                          href="https://help.shopify.com/en/manual/products/collections"
                          target="_blank"
                          rel="noreferrer"
                        >
                          here
                        </a>{" "}
                        to find IDs. Comma separated multiple values are
                        allowed.
                      </p>
                    )}
                    <div className={styles.quantityCheck}>
                      <p>Condition must match:</p>
                      {productTagMatchOptions.map(([value, label]) => (
                        <label className={styles.radioLabel} key={value}>
                          <input
                            type="radio"
                            name={`product-tag-match-${index}`}
                            checked={condition.productMatch === value}
                            onChange={() =>
                              setConditions(
                                conditions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        productMatch: value,
                                        matchValue: "",
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {(quantityMatches.has(condition.productMatch) ||
                      amountMatches.has(condition.productMatch)) && (
                      <label className={styles.quantityValueField}>
                        {quantityMatches.has(condition.productMatch)
                          ? "Quantity"
                          : "Amount"}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={condition.matchValue}
                          onChange={(event) =>
                            updateCondition(
                              index,
                              "matchValue",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => setConditions([...conditions, emptyCondition()])}
            >
              ＋ Add another condition
            </button>
          </section>

          <section className={styles.ruleCard}>
            <h2>Action</h2>
            <p className={styles.customizationActionLabel}>
              {actionLabel} <span aria-hidden="true">ⓘ</span>
            </p>
            {methods.map((method, index) => (
              <div className={styles.customizationMethodRow} key={index}>
                <input
                  value={method}
                  onChange={(event) =>
                    setMethods(
                      methods.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder="e.g. Express Shipping"
                />
                <button
                  type="button"
                  aria-label={`Delete shipping method ${index + 1}`}
                  onClick={() =>
                    setMethods(
                      methods.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => setMethods([...methods, ""])}
            >
              ＋ Add another method
            </button>
          </section>
        </main>

        <aside className={styles.ruleAside}>
          <section className={styles.ruleCard}>
            <h2>Status</h2>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Active</option>
              <option>Draft</option>
            </select>
          </section>
          <section className={styles.ruleCard}>
            <h2>Advanced</h2>
            <p>Apply rule to:</p>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="shipment-scope"
                checked={shipmentScope === "all"}
                onChange={() => setShipmentScope("all")}
              />
              All shipments
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="shipment-scope"
                checked={shipmentScope === "first"}
                onChange={() => setShipmentScope("first")}
              />
              Only the first shipment
            </label>
            <p className={styles.customizationAsideHelp}>
              Select this if you sell subscriptions and want the rule to apply
              only to the first shipment&apos;s shipping method.
            </p>
          </section>
        </aside>
      </div>

      <p className={styles.ruleFooter}>
        Reach out to live chat support for set up assistance or feature
        requests.
      </p>
    </s-page>
  );
}
