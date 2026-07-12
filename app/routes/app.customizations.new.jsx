import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";
import CustomizationActionCard from "../components/CustomizationActionCard";
import CustomizationSidebar from "../components/CustomizationSidebar";
import DeleteIcon from "../components/DeleteIcon";
import {
  amountMatches,
  emptyCustomizationCondition,
  emptyParameter2Condition,
  getConditionOperators,
  getCustomizationActionLabel,
  getDefaultConditionOperator,
  hasProductMatchOptions,
  productMatchOptions,
  quantityMatches,
} from "../constants/shippingCustomizations";

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
    1: [emptyCustomizationCondition()],
    2: [emptyParameter2Condition()],
    3: [emptyCustomizationCondition()],
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

  const actionLabel = getCustomizationActionLabel(type);

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
                                operator: getDefaultConditionOperator(field),
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
                        ).map((operator) => (
                          <option key={operator}>{operator}</option>
                        ))}
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
                      {productMatchOptions.map(([value, label]) => (
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
              onClick={() =>
                setConditions([...conditions, emptyCustomizationCondition()])
              }
            >
              ＋ Add another condition
            </button>
          </section>

          <CustomizationActionCard
            actionLabel={actionLabel}
            methods={methods}
            setMethods={setMethods}
          />
        </main>

        <CustomizationSidebar
          status={status}
          setStatus={setStatus}
          shipmentScope={shipmentScope}
          setShipmentScope={setShipmentScope}
        />
      </div>

      <p className={styles.ruleFooter}>
        Reach out to live chat support for set up assistance or feature
        requests.
      </p>
    </s-page>
  );
}
