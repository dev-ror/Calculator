import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
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
  Modal,
  Badge,
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
import { authenticate } from "../shopify.server";
import { createCustomization, loadCustomizations } from "../backend.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const id = new URL(request.url).searchParams.get("id");

  if (!id) return { customization: null };

  try {
    const customizations = await loadCustomizations(session.shop);
    const customization = customizations.find((item) => item.id === id);

    if (!customization) {
      throw new Response("Customization not found", { status: 404 });
    }

    return { customization };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response("Unable to load customization", { status: 500 });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  try {
    const submission = await request.json();
    const customization = await createCustomization(session.shop, submission);

    return Response.json({ ok: true, customization }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json(
      { ok: false, error: "Unable to submit customization." },
      { status: 500 },
    );
  }
};

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

function editableCondition(condition, parameterSet) {
  const fallback =
    parameterSet === 2 ? emptyParameter2Condition() : emptyCustomizationCondition();

  return {
    ...fallback,
    field: condition.field,
    operator: condition.operator ?? fallback.operator,
    key: condition.key ?? "",
    value: condition.value ?? "",
    productMatch: condition.productMatch ?? fallback.productMatch,
    matchValue: condition.matchValue ?? "",
  };
}

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function localDateValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatSchedule(schedule) {
  const scheduledAt = new Date(schedule.scheduledAt);

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: schedule.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(scheduledAt);
    const value = (type) => parts.find((part) => part.type === type)?.value;
    return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
  } catch {
    return scheduledAt.toISOString().slice(0, 16).replace("T", " ");
  }
}

export default function NewCustomization() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { customization } = useLoaderData();
  const [type, setType] = useState(customization?.type ?? "hide");
  const [name, setName] = useState(customization?.name ?? "");
  const [status, setStatus] = useState(
    customization
      ? `${customization.status.charAt(0)}${customization.status.slice(1).toLowerCase()}`
      : "Active",
  );
  const [match, setMatch] = useState(customization?.conditionMatch.toLowerCase() ?? "all");
  const [parameterSet, setParameterSet] = useState(customization?.parameterSet ?? 1);
  const [shipmentScope, setShipmentScope] = useState(
    customization?.shipmentScope.toLowerCase() ?? "all",
  );
  const [conditionsBySet, setConditionsBySet] = useState(() => ({
    1:
      customization?.parameterSet === 1
        ? customization.conditions.map((condition) => editableCondition(condition, 1))
        : [emptyCustomizationCondition()],
    2:
      customization?.parameterSet === 2
        ? customization.conditions.map((condition) => editableCondition(condition, 2))
        : [emptyParameter2Condition()],
    3:
      customization?.parameterSet === 3
        ? customization.conditions.map((condition) => editableCondition(condition, 3))
        : [emptyCustomizationCondition()],
  }));
  const [methods, setMethods] = useState(
    customization
      ? customization.methods.map((method) => ({
          value: method.value,
          replacementValue: method.replacementValue ?? "",
        }))
      : [{ value: "", replacementValue: "" }],
  );
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedules, setSchedules] = useState(customization?.schedules ?? []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleAction, setScheduleAction] = useState("ACTIVATE");
  const [scheduleDate, setScheduleDate] = useState(localDateValue);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");

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

  const canSave =
    name.trim() &&
    methods.some((method) => method.value.trim()) &&
    (type !== "rename" ||
      methods.every(
        (method) => !method.value.trim() || method.replacementValue.trim(),
      ));
  const save = () => {
    if (!canSave) return;
    const submission = {
      type,
      name,
      status,
      conditionMatch: match,
      parameterSet,
      shipmentScope,
      conditionsBySet,
      methods: methods.map((method) => ({
        value: method.value,
        replacementValue:
          type === "rename" ? method.replacementValue : null,
      })),
      schedules,
    };
    fetcher.submit(
      customization
        ? { intent: "update", id: customization.id, data: submission }
        : submission,
      {
        method: "post",
        encType: "application/json",
        ...(customization ? { action: "/app/customizations?index" } : {}),
      },
    );
  };

  const deleteCustomizationRule = () => {
    if (!customization) return;
    setDeleting(true);
    fetcher.submit(
      { intent: "delete", id: customization.id },
      {
        method: "post",
        encType: "application/json",
        action: "/app/customizations?index",
      },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      shopify.toast.show(
        deleting ? "Shipping customization deleted" : "Shipping customization saved",
      );
      navigate("/app/customizations");
      return;
    }

    shopify.toast.show(
      fetcher.data.error ||
        (deleting ? "Unable to delete customization" : "Unable to submit customization"),
      { isError: true },
    );
    setDeleting(false);
  }, [deleting, fetcher.data, navigate, shopify]);

  const updateMethod = (index, field, value) =>
    setMethods(
      methods.map((method, itemIndex) =>
        itemIndex === index ? { ...method, [field]: value } : method,
      ),
    );
  const removeMethod = (index) =>
    setMethods(methods.filter((_, itemIndex) => itemIndex !== index));
  const addMethod = () =>
    setMethods([...methods, { value: "", replacementValue: "" }]);

  const openScheduleModal = () => {
    setScheduleAction("ACTIVATE");
    setScheduleDate(localDateValue());
    setScheduleTime("09:00");
    setScheduleTimezone(browserTimezone());
    setScheduleModalOpen(true);
  };

  const addSchedule = () => {
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);

    if (!scheduleDate || !scheduleTime || Number.isNaN(scheduledAt.getTime())) {
      shopify.toast.show("Select a valid schedule date and time", { isError: true });
      return;
    }

    setSchedules([
      ...schedules,
      {
        action: scheduleAction,
        scheduledAt: scheduledAt.toISOString(),
        timezone: scheduleTimezone,
      },
    ]);
    setScheduleModalOpen(false);
  };

  const actionLabel = getCustomizationActionLabel(type);

  return (
    <Page
      title={customization ? "Edit customization rule" : "Create customization rule"}
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      secondaryActions={customization ? [
        {
          content: "Delete",
          destructive: true,
          onAction: () => setDeleteConfirmationOpen(true),
        },
      ] : []}
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
                    {type === "rename" ? (
                      <>
                        <Box width="100%">
                          <TextField
                            label="Original Method"
                            placeholder="e.g. Express Shipping"
                            value={method.value}
                            onChange={(value) => updateMethod(index, "value", value)}
                            autoComplete="off"
                          />
                        </Box>
                        <Box width="100%">
                          <TextField
                            label="Replacement Method"
                            placeholder="e.g. Priority Delivery"
                            value={method.replacementValue}
                            onChange={(value) =>
                              updateMethod(index, "replacementValue", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                      </>
                    ) : (
                      <Box width="100%">
                        <TextField
                          label={`Method ${index + 1}`}
                          labelHidden
                          placeholder="e.g. Express Shipping"
                          value={method.value}
                          onChange={(value) => updateMethod(index, "value", value)}
                          autoComplete="off"
                        />
                      </Box>
                    )}
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

            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="100" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Schedule
                    </Text>
                    <Tooltip content="Activate or deactivate this customization automatically at a scheduled time.">
                      <Icon source={InfoIcon} />
                    </Tooltip>
                  </InlineStack>
                  <Button icon={PlusIcon} onClick={openScheduleModal}>
                    Add schedule
                  </Button>
                </InlineStack>

                {schedules.length > 0 ? (
                  schedules.map((schedule, index) => (
                    <InlineStack
                      key={`${schedule.scheduledAt}-${index}`}
                      align="space-between"
                      blockAlign="center"
                      wrap={false}
                    >
                      <InlineStack gap="200" blockAlign="center" wrap={false}>
                        <Badge tone="info">
                          {schedule.action === "ACTIVATE" ? "Activate" : "Deactivate"}
                        </Badge>
                        <Text as="span">{formatSchedule(schedule)}</Text>
                      </InlineStack>
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="plain"
                        accessibilityLabel={`Delete schedule ${index + 1}`}
                        onClick={() =>
                          setSchedules(
                            schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
                          )
                        }
                      />
                    </InlineStack>
                  ))
                ) : (
                  <Text as="p" tone="subdued">
                    No schedules added.
                  </Text>
                )}
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

      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Add schedule"
        primaryAction={{
          content: "Save",
          onAction: addSchedule,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setScheduleModalOpen(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="p">Action</Text>
              <RadioButton
                label="Activate"
                name="schedule-action"
                checked={scheduleAction === "ACTIVATE"}
                onChange={() => setScheduleAction("ACTIVATE")}
              />
              <RadioButton
                label="Deactivate"
                name="schedule-action"
                checked={scheduleAction === "DEACTIVATE"}
                onChange={() => setScheduleAction("DEACTIVATE")}
              />
            </BlockStack>
            <TextField
              label="Date"
              type="date"
              value={scheduleDate}
              onChange={setScheduleDate}
              autoComplete="off"
            />
            <TextField
              label="Time"
              type="time"
              value={scheduleTime}
              onChange={setScheduleTime}
              autoComplete="off"
              helpText={`Timezone: ${scheduleTimezone}`}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        title="Delete customization rule?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: deleting && fetcher.state !== "idle",
          onAction: deleteCustomizationRule,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteConfirmationOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            This will permanently delete {customization?.name || "this customization rule"}.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
