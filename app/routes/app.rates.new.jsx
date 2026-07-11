import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";

const blankCondition = () => ({
  field: "Product Tag",
  subfield: "Product Tag",
  key: "",
  operator: "Equals",
  value: "",
  quantityCheck: "atLeastOne",
  quantityValue: "",
});
const cartProductFields = [
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
const isCartProductCondition = (field) =>
  ["Cart Contains", "Cart Does Not Contain"].includes(field);
const effectiveConditionField = (condition) =>
  isCartProductCondition(condition.field)
    ? condition.subfield
    : condition.field;
const isKeyedCondition = (condition) =>
  effectiveConditionField(condition).includes("Metafield") ||
  effectiveConditionField(condition) === "Line item property";
const blankRate = () => ({
  name: "",
  description: "",
  minimumDays: "",
  maximumDays: "",
  currency: "Default Store Currency",
  calculation: "Fixed rate",
  price: "",
  tags: "",
});
const currencyCodes = {
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
const textFields = new Set([
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
const numericFields = new Set([
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
const idFields = new Set(["Shopify Variant ID", "Shopify Product ID"]);
const shippingHelpFields = new Set([
  "Zipcode / Postcode",
  "Province / State Code",
  "Address Line 1",
  "Country Code",
  "Day of the Week",
  "Warehouse Zipcode / Postcode",
]);

const conditionBehavior = (field) => {
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

export default function NewShippingRateRule() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("Active");
  const [match, setMatch] = useState("all");
  const [exclusivity, setExclusivity] = useState("inclusive");
  const [conditions, setConditions] = useState([blankCondition()]);
  const [zoneRates, setZoneRates] = useState({});
  const [activeZone, setActiveZone] = useState(null);
  const [rateDraft, setRateDraft] = useState(blankRate());
  const lastCondition = conditions[conditions.length - 1];
  const lastConditionHasDynamicLine = lastCondition
    ? Boolean(
        conditionBehavior(effectiveConditionField(lastCondition)).help ||
        lastCondition.field === "Cart Locale" ||
        lastCondition.field === "Cart Contains" ||
        shippingHelpFields.has(lastCondition.field),
      )
    : false;

  const openRateModal = (zone) => {
    setActiveZone(zone);
    setRateDraft(zoneRates[zone] || blankRate());
  };
  const closeRateModal = () => setActiveZone(null);
  const updateRate = (key, value) =>
    setRateDraft({ ...rateDraft, [key]: value });
  const saveRate = () => {
    if (!rateDraft.name.trim() || !rateDraft.price.trim()) return;
    setZoneRates({ ...zoneRates, [activeZone]: rateDraft });
    closeRateModal();
  };

  const updateCondition = (index, key, value) =>
    setConditions(
      conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, [key]: value } : condition,
      ),
    );
  const changeConditionField = (index, field) => {
    const behaviorField = isCartProductCondition(field) ? "Product Tag" : field;
    const { operators } = conditionBehavior(behaviorField);
    setConditions(
      conditions.map((condition, conditionIndex) =>
        conditionIndex === index
          ? {
              ...condition,
              field,
              subfield: "Product Tag",
              key: "",
              operator: operators[0],
              value: "",
              quantityCheck: "atLeastOne",
              quantityValue: "",
            }
          : condition,
      ),
    );
  };
  const changeCartProductField = (index, subfield) => {
    const { operators } = conditionBehavior(subfield);
    setConditions(
      conditions.map((condition, conditionIndex) =>
        conditionIndex === index
          ? {
              ...condition,
              subfield,
              key: "",
              operator: operators[0],
              value: "",
            }
          : condition,
      ),
    );
  };
  const stepConditionPrice = (index, amount) => {
    const current = Number(conditions[index].value || 0);
    updateCondition(index, "value", String(Math.max(0, current + amount)));
  };
  const canSave = name.trim() && priority.trim();
  const save = () => {
    if (!canSave) return;
    shopify.toast.show("Shipping rate rule saved");
    navigate("/app/rates");
  };

  return (
    <s-page inlineSize="large">
      <div className={styles.ruleTitleRow}>
        <AppPageHeader title="Add shipping rate rule" />
        <div className={styles.ruleTopActions}>
          <button
            type="button"
            onClick={() =>
              setName(name ? `${name} copy` : "Cloned shipping rule")
            }
          >
            Clone
          </button>
          <button
            type="button"
            className={styles.saveRuleButton}
            disabled={!canSave}
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>

      <div className={styles.ruleLayout}>
        <main className={styles.ruleMain}>
          <section className={styles.ruleCard}>
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Heavy products rule"
              />
            </label>
            <label>
              Priority
              <input
                type="number"
                min="1"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                placeholder="e.g. 1"
              />
            </label>
            <p className={styles.fieldHelp}>
              Rules are evaluated in ascending order of priority. No two rules
              can share the same priority.
            </p>
          </section>

          <section className={styles.ruleCard}>
            <h2>Conditions</h2>
            <p>Rule must match:</p>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="match"
                checked={match === "all"}
                onChange={() => setMatch("all")}
              />{" "}
              All conditions
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="match"
                checked={match === "any"}
                onChange={() => setMatch("any")}
              />{" "}
              Any condition
            </label>

            {conditions.map((condition, index) => (
              <div className={styles.conditionBlock} key={index}>
                <label>Condition {index + 1}</label>
                <div
                  className={`${styles.conditionRow} ${isKeyedCondition(condition) && !isCartProductCondition(condition.field) ? styles.metafieldConditionRow : ""} ${isCartProductCondition(condition.field) ? styles.cartContainsRow : ""} ${isCartProductCondition(condition.field) && isKeyedCondition(condition) ? styles.cartContainsKeyedRow : ""}`}
                >
                  <select
                    value={condition.field}
                    onChange={(event) =>
                      changeConditionField(index, event.target.value)
                    }
                  >
                    <optgroup label="Product">
                      <option>Product Title</option>
                      <option>Variant Title</option>
                      <option>Product Tag</option>
                      <option>SKU</option>
                      <option>Product Barcode</option>
                      <option>Product Vendor</option>
                      <option>Product Price</option>
                      <option>Product Compare-at Price</option>
                      <option>Product Quantity</option>
                      <option>Product Type</option>
                      <option>Product Weight</option>
                      <option>Product Metafield</option>
                      <option>Variant Metafield</option>
                      <option>Line item property</option>
                      <option>Product Length</option>
                      <option>Product Width</option>
                      <option>Product Height</option>
                      <option>Product Volume</option>
                      <option>Shopify Variant ID</option>
                      <option>Shopify Product ID</option>
                    </optgroup>
                    <optgroup label="Cart">
                      <option>Cart Quantity</option>
                      <option>Cart Subtotal (total before discount)</option>
                      <option>Cart Total (total after discount)</option>
                      <option>Cart Weight</option>
                      <option>Cart Volume</option>
                      <option>Cart Contains</option>
                      <option>Cart Does Not Contain</option>
                      <option>Cart Locale</option>
                    </optgroup>
                    <optgroup label="Shipping">
                      <option>Zipcode / Postcode</option>
                      <option>Province / State Code</option>
                      <option>Address Line 1</option>
                      <option>Country Code</option>
                      <option>Time of the Day</option>
                      <option>Day of the Week</option>
                      <option>Warehouse Zipcode / Postcode</option>
                    </optgroup>
                    <optgroup label="Customer">
                      <option>Customer Tag</option>
                      <option>Customer First Name</option>
                      <option>Customer Last Name</option>
                    </optgroup>
                  </select>
                  {isCartProductCondition(condition.field) && (
                    <select
                      value={condition.subfield}
                      aria-label="Product field"
                      onChange={(event) =>
                        changeCartProductField(index, event.target.value)
                      }
                    >
                      <optgroup label="Product">
                        {cartProductFields.map((field) => (
                          <option key={field}>{field}</option>
                        ))}
                      </optgroup>
                    </select>
                  )}
                  {isKeyedCondition(condition) && (
                    <input
                      value={condition.key}
                      placeholder={
                        effectiveConditionField(condition) ===
                        "Variant Metafield"
                          ? "Namespace.Key"
                          : "Key"
                      }
                      aria-label={`${effectiveConditionField(condition)} key`}
                      onChange={(event) =>
                        updateCondition(index, "key", event.target.value)
                      }
                    />
                  )}
                  <select
                    value={condition.operator}
                    onChange={(event) =>
                      updateCondition(index, "operator", event.target.value)
                    }
                  >
                    {conditionBehavior(
                      effectiveConditionField(condition),
                    ).operators.map((operator) => (
                      <option key={operator}>{operator}</option>
                    ))}
                  </select>
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
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M7.5 3.5h5M4.5 6h11M6 6l.7 10h6.6L14 6M8.5 8.5v5M11.5 8.5v5" />
                    </svg>
                  </button>
                </div>
                <span className={styles.conditionValueInput}>
                  <input
                    className={
                      effectiveConditionField(condition) === "Time of the Day"
                        ? styles.timeConditionInput
                        : undefined
                    }
                    type={
                      conditionBehavior(effectiveConditionField(condition)).type
                    }
                    onClick={(event) => {
                      if (
                        effectiveConditionField(condition) ===
                          "Time of the Day" &&
                        typeof event.currentTarget.showPicker === "function"
                      ) {
                        event.currentTarget.showPicker();
                      }
                    }}
                    min={
                      conditionBehavior(effectiveConditionField(condition))
                        .currency
                        ? "0"
                        : undefined
                    }
                    step={
                      conditionBehavior(effectiveConditionField(condition))
                        .currency
                        ? "1"
                        : undefined
                    }
                    value={condition.value}
                    onChange={(event) =>
                      updateCondition(index, "value", event.target.value)
                    }
                  />
                  {(conditionBehavior(effectiveConditionField(condition))
                    .currency ||
                    conditionBehavior(effectiveConditionField(condition))
                      .unit) && (
                    <>
                      <i
                        className={
                          conditionBehavior(effectiveConditionField(condition))
                            .unit
                            ? styles.unitSuffix
                            : undefined
                        }
                      >
                        {conditionBehavior(effectiveConditionField(condition))
                          .unit || "USD"}
                      </i>
                      {conditionBehavior(effectiveConditionField(condition))
                        .currency && (
                        <span className={styles.currencySpinner}>
                          <button
                            type="button"
                            aria-label="Increase price"
                            onClick={() => stepConditionPrice(index, 1)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            aria-label="Decrease price"
                            onClick={() => stepConditionPrice(index, -1)}
                          >
                            ▼
                          </button>
                        </span>
                      )}
                    </>
                  )}
                  {["Time of the Day", "Day of the Week"].includes(
                    effectiveConditionField(condition),
                  ) && (
                    <i className={styles.timezoneSuffix}>America/New_York</i>
                  )}
                </span>
                {conditionBehavior(effectiveConditionField(condition)).help && (
                  <p className={`${styles.fieldHelp} ${styles.conditionHelp}`}>
                    {conditionBehavior(effectiveConditionField(condition)).help}
                  </p>
                )}
                {condition.field === "Cart Locale" && (
                  <div className={styles.localeHelp}>
                    <p className={styles.fieldHelp}>
                      Enter the locale code used by Shopify. You can find them{" "}
                      <a
                        href="https://shopify.dev/docs/api/liquid/objects/localization"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </a>
                      .
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also enter multiple values separated by semi-colon
                      (;).
                    </p>
                  </div>
                )}
                {[
                  "Zipcode / Postcode",
                  "Warehouse Zipcode / Postcode",
                ].includes(condition.field) && (
                  <div className={styles.shippingFieldHelp}>
                    <p className={styles.fieldHelp}>
                      You can use asterisk (*) for wildcard (For e.g. AB14*).
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also use hyphen to enter range of postcodes (For
                      e.g. 90209-90231).
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also enter multiple values separated by comma (,).
                    </p>
                  </div>
                )}
                {condition.field === "Province / State Code" && (
                  <div className={styles.shippingFieldHelp}>
                    <p className={styles.fieldHelp}>
                      Enter two-letter province codes used by Shopify. You can
                      find them{" "}
                      <a
                        href="https://en.wikipedia.org/wiki/ISO_3166-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </a>
                      .
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also enter multiple values separated by comma (,).
                    </p>
                  </div>
                )}
                {condition.field === "Country Code" && (
                  <div className={styles.shippingFieldHelp}>
                    <p className={styles.fieldHelp}>
                      Enter two-letter country codes used by Shopify. You can
                      find them{" "}
                      <a
                        href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </a>
                      .
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also enter multiple values separated by semi-colon
                      (;).
                    </p>
                  </div>
                )}
                {condition.field === "Day of the Week" && (
                  <div className={styles.shippingFieldHelp}>
                    <p className={styles.fieldHelp}>
                      Enter full names of the day like Monday, Tuesday, etc.
                    </p>
                    <p className={styles.fieldHelp}>
                      You can also enter multiple values separated by comma (,).
                    </p>
                  </div>
                )}
                {condition.field === "Cart Contains" && (
                  <div className={styles.quantityCheck}>
                    <p>Quantity / amount check:</p>
                    {[
                      ["atLeastOne", "Cart contains at least one product"],
                      ["moreProducts", "Cart contains more than X products"],
                      ["lessProducts", "Cart contains less than X products"],
                      ["moreAmount", "Cart contains more than X amount"],
                      ["lessAmount", "Cart contains less than X amount"],
                    ].map(([value, label]) => (
                      <label className={styles.radioLabel} key={value}>
                        <input
                          type="radio"
                          name={`quantity-check-${index}`}
                          checked={condition.quantityCheck === value}
                          onChange={() =>
                            setConditions(
                              conditions.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      quantityCheck: value,
                                      quantityValue: "",
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        {label}
                      </label>
                    ))}
                    {condition.quantityCheck !== "atLeastOne" && (
                      <label className={styles.quantityValueField}>
                        {condition.quantityCheck.includes("Amount")
                          ? "Amount"
                          : "Quantity"}
                        <span className={styles.conditionValueInput}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder={
                              condition.quantityCheck.includes("Amount")
                                ? "Enter amount"
                                : "Enter quantity"
                            }
                            value={condition.quantityValue}
                            onChange={(event) =>
                              updateCondition(
                                index,
                                "quantityValue",
                                event.target.value,
                              )
                            }
                          />
                          {condition.quantityCheck.includes("Amount") && (
                            <i className={styles.unitSuffix}>USD</i>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              className={`${styles.outlineButton} ${lastConditionHasDynamicLine ? styles.outlineButtonNoTopMargin : ""}`}
              type="button"
              onClick={() => setConditions([...conditions, blankCondition()])}
            >
              ＋ Add another condition
            </button>
          </section>

          <section className={`${styles.ruleCard} ${styles.zonesCard}`}>
            <h2>Shipping zones</h2>
            {["Domestic", "International"].map((zone) => (
              <div className={styles.zone} key={zone}>
                <div>
                  <strong>{zone}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      zoneRates[zone]
                        ? setZoneRates({ ...zoneRates, [zone]: undefined })
                        : openRateModal(zone)
                    }
                  >
                    {zoneRates[zone] === undefined ? "Add rate" : "Remove rate"}
                  </button>
                </div>
                {zoneRates[zone] === undefined ? (
                  <p className={styles.zoneWarning}>
                    ⚠ &nbsp; No rates. Customers in this zone won&apos;t see
                    shipping rates from ShipMagic app.
                  </p>
                ) : (
                  <div className={styles.savedRate}>
                    <span>
                      <strong>{zoneRates[zone].name}</strong>
                      <small>{zoneRates[zone].calculation}</small>
                    </span>
                    <button type="button" onClick={() => openRateModal(zone)}>
                      ${zoneRates[zone].price}
                    </button>
                  </div>
                )}
              </div>
            ))}
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
            <h2>Exclusivity</h2>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="exclusivity"
                checked={exclusivity === "inclusive"}
                onChange={() => setExclusivity("inclusive")}
              />{" "}
              Inclusive
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="exclusivity"
                checked={exclusivity === "exclusive"}
                onChange={() => setExclusivity("exclusive")}
              />{" "}
              Exclusive
            </label>
            <p className={styles.fieldHelp}>
              If an &apos;Exclusive&apos; rule is satisfied, all lower-priority
              rules are skipped from evaluation.
            </p>
          </section>
        </aside>
      </div>
      <p className={styles.ruleFooter}>
        Reach out to live chat support for set up assistance or feature
        requests.
      </p>
      {activeZone && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeRateModal()
          }
        >
          <section
            className={styles.rateModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-rate-title"
          >
            <header>
              <h2 id="add-rate-title">Add rate</h2>
              <button
                type="button"
                onClick={closeRateModal}
                aria-label="Close add rate modal"
              >
                ×
              </button>
            </header>
            <div className={styles.rateModalBody}>
              <h3>Details</h3>
              <label>
                <span className={styles.requiredLabel}>
                  Rate name <b>*</b>
                </span>
                <input
                  value={rateDraft.name}
                  onChange={(event) => updateRate("name", event.target.value)}
                />
              </label>
              <p>
                This is the shipping rate name customer will see at checkout.
              </p>
              <label>
                Description
                <input
                  value={rateDraft.description}
                  onChange={(event) =>
                    updateRate("description", event.target.value)
                  }
                />
              </label>
              <p>
                Tip: Use {"{{today}}"} to display today&apos;s date and{" "}
                {"{{today+3}}"} to add 3 days dynamically.
              </p>
              <div className={styles.modalField}>
                <span>Delivery time</span>
                <div className={styles.deliveryInputs}>
                  <span>
                    <input
                      type="number"
                      min="0"
                      value={rateDraft.minimumDays}
                      onChange={(event) =>
                        updateRate("minimumDays", event.target.value)
                      }
                    />
                    <i>days</i>
                  </span>
                  <span>
                    <input
                      type="number"
                      min="0"
                      value={rateDraft.maximumDays}
                      onChange={(event) =>
                        updateRate("maximumDays", event.target.value)
                      }
                    />
                    <i>days</i>
                  </span>
                </div>
              </div>
              <label>
                Currency
                <select
                  value={rateDraft.currency}
                  onChange={(event) =>
                    updateRate("currency", event.target.value)
                  }
                >
                  <option>Default Store Currency</option>
                  <option>United Arab Emirates Dirham</option>
                  <option>Australian Dollars</option>
                  <option>Canadian Dollars</option>
                  <option>Euro</option>
                  <option>United Kingdom Pounds</option>
                  <option>Indian Rupees</option>
                  <option>Japanese Yen</option>
                  <option>New Zealand Dollars</option>
                  <option>United States Dollars</option>
                  <option>South African Rand</option>
                  <option>Hong Kong Dollars</option>
                  <option>Swiss Francs</option>
                  <option>Polish Zlotych</option>
                </select>
              </label>
              <hr />
              <h3>Rate</h3>
              <label>
                <span className={styles.requiredLabel}>
                  Calculation parameter <b>*</b>
                </span>
                <select
                  value={rateDraft.calculation}
                  onChange={(event) =>
                    updateRate("calculation", event.target.value)
                  }
                >
                  <optgroup label="Fixed Rates">
                    <option>Fixed rate</option>
                    <option>Percentage of total price</option>
                    <option>Product Metafield</option>
                    <option>Variant Metafield</option>
                  </optgroup>
                  <optgroup label="Dynamic Rates">
                    <option>Total weight of items</option>
                    <option>Total price of items</option>
                    <option>Number of items</option>
                    <option>Sum Of Product Metafield</option>
                    <option>Sum Of Variant Metafield</option>
                    <option>Distance</option>
                  </optgroup>
                  <optgroup label="Carrier Rates">
                    <option>Australia Post</option>
                    <option>USPS</option>
                    <option>Fedex</option>
                    <option>Shiprocket</option>
                    <option>Direct Freight Express</option>
                    <option>Stallion Express</option>
                    <option>ShipStation</option>
                  </optgroup>
                </select>
              </label>
              <label>
                <span className={styles.requiredLabel}>
                  Price <b>*</b>
                </span>
                <span className={styles.priceInput}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rateDraft.price}
                    onChange={(event) =>
                      updateRate("price", event.target.value)
                    }
                  />
                  <i>{currencyCodes[rateDraft.currency] || "USD"}</i>
                </span>
              </label>
              <hr />
              <h3>Advanced</h3>
              <label>
                Tags
                <input
                  value={rateDraft.tags}
                  onChange={(event) => updateRate("tags", event.target.value)}
                />
              </label>
              <p>Comma separated values are allowed.</p>
            </div>
            <footer>
              <button type="button" onClick={closeRateModal}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.darkButton}
                disabled={!rateDraft.name.trim() || !rateDraft.price.trim()}
                onClick={saveRate}
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      )}
    </s-page>
  );
}
