import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Box,
  Text,
  FormLayout,
  TextField,
  Select,
  Tooltip,
  RadioButton,
  Button,
  Icon,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, InfoIcon } from "@shopify/polaris-icons";
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

// Exactly mirrors the original <option> markup for the Type select
const typeOptions = [
  { label: "Hide shipping rates", value: "hide" },
  { label: "Show shipping rates", value: "show" },
  {
    label: "Only show specified shipping rates and hide rest",
    value: "only_show",
  },
  { label: "Reorder shipping rates", value: "reorder" },
  { label: "Rename shipping rates", value: "rename" },
];

// Exactly mirrors the original <optgroup> structures per parameter set
const fieldGroupsByParameterSet = {
  1: [
    { title: "Cart", options: ["Cart Subtotal", "Cart Quantity", "Cart Weight"] },
    {
      title: "Product",
      options: [
        "Product Tag",
        "Product Title",
        "Product Type",
        "Product Weight",
        "Product Vendor",
        "Variant Title",
        "Line Item Property",
        "Product Price",
        "Product Collection",
      ],
    },
    {
      title: "Customer",
      options: [
        "Customer Tag",
        "Customer Logged In",
        "Customer Company",
        "Customer First Name",
      ],
    },
    {
      title: "Shipping",
      options: [
        "Zipcode / Postcode",
        "Country Code",
        "Address Line 1",
        "Address is a PO Box",
        "Address is not a PO Box",
        "Shipping Method Name",
        "Shipping Rate",
      ],
    },
    { title: "Other", options: ["Always", "Number Of Vendors"] },
  ],
  2: [
    { title: "Cart", options: ["Cart Attribute"] },
    {
      title: "Product",
      options: ["SKU", "Product Tag", "Variant Metafield", "Is subscription product"],
    },
    {
      title: "Shipping",
      options: [
        "Province / State Code",
        "Country Code",
        "Address Line 1",
        "Address is a PO Box",
        "Address is not a PO Box",
      ],
    },
    {
      title: "Customer",
      options: ["Customer Tag", "Customer Metafield", "Company Metafield", "Customer First Name"],
    },
  ],
  3: [
    { title: "Cart", options: ["Cart Subtotal", "Cart Weight"] },
    { title: "Customer", options: ["Company Location Metafield", "Customer First Name"] },
    { title: "Shipping", options: ["Zipcode / Postcode"] },
  ],
};

const conditionFieldOptionsFor = (parameterSet) =>
  fieldGroupsByParameterSet[parameterSet].map((group) => ({
    title: group.title,
    options: group.options.map((label) => ({ label, value: label })),
  }));

const keyedConditionFields = new Set([
  "Line Item Property",
  "Shipping Rate",
  "Cart Attribute",
  "Variant Metafield",
  "Customer Metafield",
  "Company Metafield",
  "Company Location Metafield",
]);

const operatorlessConditionFields = new Set([
  "Address is a PO Box",
  "Address is not a PO Box",
  "Always",
]);

const valuelessConditionFields = new Set([
  "Customer Logged In",
  "Is subscription product",
  "Address is a PO Box",
  "Address is not a PO Box",
  "Always",
]);

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

  const updateMethod = (index, value) =>
    setMethods(methods.map((method, itemIndex) => (itemIndex === index ? value : method)));
  const removeMethod = (index) =>
    setMethods(methods.filter((_, itemIndex) => itemIndex !== index));
  const addMethod = () => setMethods([...methods, ""]);

  const actionLabel = getCustomizationActionLabel(type);

  return (
    <Page
      title="Create customization rule"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      primaryAction={{ content: "Save", onAction: save, disabled: !canSave }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <FormLayout>
                <Select
                  label="Type"
                  options={typeOptions}
                  value={type}
                  onChange={setType}
                />
                <TextField
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Hide free shipping for heavy items"
                  autoComplete="off"
                />
              </FormLayout>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Conditions
                  </Text>
                  <InlineStack gap="100" blockAlign="center" wrap={false}>
                    <Button variant="plain" onClick={() => setParameterSet(nextParameterSet)}>
                      <Text as="span">Switch to parameter set {nextParameterSet}</Text>
                    </Button>
                    <Tooltip dismissOnMouseOut content="Three parameter sets are available for creating conditions. A rule may use parameters from only one set.">
                      <Icon source={InfoIcon} />
                    </Tooltip>
                  </InlineStack>
                </InlineStack>

                <BlockStack gap="200">
                  <Text as="p">Rule must match:</Text>
                  <RadioButton
                    label="All conditions"
                    name="customization-match"
                    checked={match === "all"}
                    onChange={() => setMatch("all")}
                  />
                  <RadioButton
                    label="Any condition"
                    name="customization-match"
                    checked={match === "any"}
                    onChange={() => setMatch("any")}
                  />
                </BlockStack>

                {conditions.map((condition, index) => {
                  const isKeyed = keyedConditionFields.has(condition.field);
                  const hasOperator = !operatorlessConditionFields.has(condition.field);
                  const hasValue = !valuelessConditionFields.has(condition.field);
                  const hasMatchOptions = hasProductMatchOptions(condition.field);

                  return (
                    <Card key={index} background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="h3" variant="headingSm">
                            Condition {index + 1}
                          </Text>
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            variant="plain"
                            accessibilityLabel={`Delete condition ${index + 1}`}
                            onClick={() =>
                              setConditions(
                                conditions.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                          />
                        </InlineStack>

                        <InlineStack gap="300" wrap blockAlign="start">
                          <Box minWidth="220px">
                            <Select
                              label="Field"
                              labelHidden
                              options={conditionFieldOptionsFor(parameterSet)}
                              value={condition.field}
                              onChange={(field) =>
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
                                )
                              }
                            />
                          </Box>

                          {isKeyed && (
                            <Box minWidth="200px">
                              <TextField
                                label={
                                  condition.field === "Shipping Rate"
                                    ? "Shipping rate name"
                                    : `${condition.field} key`
                                }
                                labelHidden
                                placeholder={
                                  condition.field === "Shipping Rate"
                                    ? "Shipping Rate Name"
                                    : condition.field === "Variant Metafield" ||
                                      condition.field === "Company Location Metafield"
                                      ? "namespace.key"
                                      : "Key"
                                }
                                value={condition.key}
                                onChange={(value) => updateCondition(index, "key", value)}
                                autoComplete="off"
                              />
                            </Box>
                          )}

                          {hasOperator && (
                            <Box minWidth="200px">
                              <Select
                                label="Operator"
                                labelHidden
                                options={getConditionOperators(condition.field, parameterSet)}
                                value={condition.operator}
                                onChange={(value) => updateCondition(index, "operator", value)}
                              />
                            </Box>
                          )}
                        </InlineStack>

                        {hasValue && (
                          <TextField
                            label="Value"
                            labelHidden
                            value={condition.value}
                            onChange={(value) => updateCondition(index, "value", value)}
                            autoComplete="off"
                          />
                        )}

                        {condition.field === "Customer Tag" && (
                          <Text as="p" tone="subdued">
                            You can enter multiple values separated by comma (,).
                          </Text>
                        )}
                        {condition.field === "Zipcode / Postcode" && (
                          <Text as="p" tone="subdued">
                            Enter postcodes separated by commas. You can use asterisk (*)
                            for wildcard. You can also use enter hyphen separated values for
                            range. For e.g. AB14*, 444001-444099
                          </Text>
                        )}
                        {condition.field === "Province / State Code" && (
                          <Text as="p" tone="subdued">
                            Enter two-letter province codes used by Shopify. You can find
                            them{" "}
                            <a
                              href="https://help.shopify.com/en/manual/international/managing"
                              target="_blank"
                              rel="noreferrer"
                            >
                              here
                            </a>
                            .
                          </Text>
                        )}
                        {condition.field === "Country Code" && (
                          <Text as="p" tone="subdued">
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
                          </Text>
                        )}
                        {condition.field === "Address is a PO Box" && (
                          <Text as="p" tone="subdued">
                            This condition will try to find any mention of PO Box in the
                            address entered by customer.
                          </Text>
                        )}
                        {condition.field === "Address is not a PO Box" && (
                          <Text as="p" tone="subdued">
                            This condition will check that the address does NOT contain any
                            mention of PO Box.
                          </Text>
                        )}
                        {(condition.field === "Shipping Method Name" ||
                          condition.field === "Shipping Rate") && (
                            <Text as="p" tone="subdued">
                              Enter part of the full shipping method name.
                            </Text>
                          )}
                        {condition.field === "Always" && (
                          <Text as="p" tone="subdued">
                            This rule will be always true
                          </Text>
                        )}

                        {hasMatchOptions && (
                          <BlockStack gap="300">
                            {condition.field === "Product Tag" && (
                              <Text as="p" tone="subdued">
                                You can enter multiple values separated by comma (,).
                              </Text>
                            )}
                            {condition.field === "Product Collection" && (
                              <Text as="p" tone="subdued">
                                Enter IDs of collections. Click{" "}
                                <a
                                  href="https://help.shopify.com/en/manual/products/collections"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  here
                                </a>{" "}
                                to find IDs. Comma separated multiple values are allowed.
                              </Text>
                            )}
                            <BlockStack gap="150">
                              <Text as="p">Condition must match:</Text>
                              {productMatchOptions.map(([value, label]) => (
                                <RadioButton
                                  key={value}
                                  label={label}
                                  name={`product-tag-match-${index}`}
                                  checked={condition.productMatch === value}
                                  onChange={() =>
                                    setConditions(
                                      conditions.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, productMatch: value, matchValue: "" }
                                          : item,
                                      ),
                                    )
                                  }
                                />
                              ))}
                            </BlockStack>
                            {(quantityMatches.has(condition.productMatch) ||
                              amountMatches.has(condition.productMatch)) && (
                                <Box maxWidth="220px">
                                  <TextField
                                    label={
                                      quantityMatches.has(condition.productMatch)
                                        ? "Quantity"
                                        : "Amount"
                                    }
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={condition.matchValue}
                                    onChange={(value) =>
                                      updateCondition(index, "matchValue", value)
                                    }
                                    autoComplete="off"
                                  />
                                </Box>
                              )}
                          </BlockStack>
                        )}
                      </BlockStack>
                    </Card>
                  );
                })}

                <Box>
                  <Button
                    icon={PlusIcon}
                    onClick={() =>
                      setConditions([...conditions, emptyCustomizationCondition()])
                    }
                  >
                    Add another condition
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Action
                </Text>
                <InlineStack gap="100" blockAlign="center">
                  <Text as="p">{actionLabel}</Text>
                  <Tooltip dismissOnMouseOut content="You can enter part of the shipping method name to match multiple options. For example, to match 'Express Shipping' and 'Express Delivery' both, enter 'Express'.">
                    <Icon source={InfoIcon} />
                  </Tooltip>
                </InlineStack>
                {methods.map((method, index) => (
                  <InlineStack gap="200" wrap={false} blockAlign="center" key={index}>
                    <Box width="100%">
                      <TextField
                        label={`Method ${index + 1}`}
                        labelHidden
                        placeholder="e.g. Express Shipping"
                        value={method}
                        onChange={(value) => updateMethod(index, value)}
                        autoComplete="off"
                      />
                    </Box>
                    <Button
                      icon={DeleteIcon}
                      accessibilityLabel={`Delete method ${index + 1}`}
                      onClick={() => removeMethod(index)}
                    />
                  </InlineStack>
                ))}
                <Box>
                  <Button icon={PlusIcon} onClick={addMethod}>
                    Add another method
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Status
                </Text>
                <Select
                  label="Status"
                  labelHidden
                  options={["Active", "Draft"]}
                  value={status}
                  onChange={setStatus}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Advanced
                </Text>
                <Text as="p">Apply rule to:</Text>
                <RadioButton
                  label="All shipments"
                  name="shipment-scope"
                  checked={shipmentScope === "all"}
                  onChange={() => setShipmentScope("all")}
                />
                <RadioButton
                  label="Only the first shipment"
                  name="shipment-scope"
                  checked={shipmentScope === "first"}
                  onChange={() => setShipmentScope("first")}
                  helpText="Select this if you sell subscriptions and want the rule to apply only to the first shipment's shipping method."
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Box paddingBlockStart="500" paddingBlockEnd="500">
        <Text as="p" alignment="center" tone="subdued">
          Reach out to live chat support for set up assistance or feature requests.
        </Text>
      </Box>
    </Page>
  );
}
