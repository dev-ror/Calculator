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
  Divider,
  FormLayout,
  TextField,
  Select,
  RadioButton,
  Checkbox,
  Button,
  Banner,
  Modal,
  ActionList,
  InlineGrid,
  Popover,
  Tooltip,
  Icon,
  Badge,
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  MenuHorizontalIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
import {
  blankCondition,
  blankRate,
  carrierNames,
  cartProductFields,
  conditionBehavior,
  countryOptions,
  currencyCodes,
  effectiveConditionField,
  isCartProductCondition,
  isKeyedCondition,
  uspsDomesticServices,
  uspsInternationalServices,
} from "../constants/shippingRates";
import { authenticate } from "../shopify.server";
import { createRate, ensureShop, loadRateData } from "../backend.server";
import prisma from "../db.server";
import { ensureDefaultZones, getShopZoneDefaults } from "../zones.server";

function zoneIdForStoredKey(zoneKey, zones) {
  const normalizedKey = String(zoneKey).toLowerCase();
  if (normalizedKey === "domestic") {
    return zones.find((zone) => zone.name === "Domestic" && !zone.isRestOfWorld)?.id ?? null;
  }
  if (normalizedKey === "international") {
    return zones.find((zone) => zone.isRestOfWorld)?.id ?? null;
  }
  return zones.find((zone) => zone.id === zoneKey)?.id ?? null;
}

function groupStoredRates(definitions, zones) {
  return definitions.reduce((grouped, definition) => {
    const zoneId = zoneIdForStoredKey(definition.zoneKey, zones);
    const groupKey = zoneId ?? definition.zoneKey;
    const zoneRates = grouped[groupKey] ?? [];
    zoneRates.push({
      ...blankRate(),
      name: definition.name,
      calculation: definition.calculation,
      price: definition.price === null ? "" : String(definition.price),
      description: definition.description ?? "",
      minimumDays:
        definition.minimumDays === null ? "" : String(definition.minimumDays),
      maximumDays:
        definition.maximumDays === null ? "" : String(definition.maximumDays),
      tags: definition.tags ?? "",
      currency:
        Object.keys(currencyCodes).find(
          (label) => currencyCodes[label] === definition.currencyCode,
        ) ?? "Default Store Currency",
      status: definition.status,
      persistedZoneKey: definition.zoneKey,
    });
    grouped[groupKey] = zoneRates;
    return grouped;
  }, {});
}

function storedZoneRates(zoneRates) {
  return Object.entries(zoneRates).reduce((stored, [zoneKey, rates]) => {
    for (const rate of rates) {
      const storedKey = rate.persistedZoneKey ?? zoneKey;
      const definition = { ...rate };
      delete definition.persistedZoneKey;
      (stored[storedKey] ??= []).push(definition);
    }
    return stored;
  }, {});
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const id = new URL(request.url).searchParams.get("id");
  const shop = await ensureShop(session.shop);
  const shopDefaults = await getShopZoneDefaults(admin);
  await ensureDefaultZones(shop.id, shopDefaults);
  const storedZones = await prisma.zone.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "asc" },
  });
  storedZones.sort((left, right) => Number(left.isRestOfWorld) - Number(right.isRestOfWorld));
  const zones = storedZones.map(({ id: zoneId, name, isRestOfWorld }) => ({
    id: zoneId,
    name,
    isRestOfWorld,
  }));

  if (!id) return { rate: null, zones };

  try {
    const { rates } = await loadRateData(session.shop, admin);
    const rate = rates.find((item) => item.id === id);

    if (!rate) {
      throw new Response("Rate rule not found", { status: 404 });
    }

    return { rate, zones };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response("Unable to load rate rule", { status: 500 });
  }
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    const submission = await request.json();
    const rate = await createRate(session.shop, submission, admin);

    return Response.json({ ok: true, rate }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (error?.code === "P2002") {
      return Response.json(
        { ok: false, error: "Priority is already used by another shipping rate rule." },
        { status: 400 },
      );
    }

    return Response.json(
      { ok: false, error: "Unable to submit rate rule." },
      { status: 500 },
    );
  }
};

// Grouped options for the "Condition field" Select (mirrors the original <optgroup> markup)
const conditionFieldOptions = [
  {
    title: "Product",
    options: [
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
      "Product Metafield",
      "Variant Metafield",
      "Line item property",
      "Product Length",
      "Product Width",
      "Product Height",
      "Product Volume",
      "Shopify Variant ID",
      "Shopify Product ID",
    ].map((label) => ({ label, value: label })),
  },
  {
    title: "Cart",
    options: [
      "Cart Quantity",
      "Cart Subtotal (total before discount)",
      "Cart Total (total after discount)",
      "Cart Weight",
      "Cart Volume",
      "Cart Contains",
      "Cart Does Not Contain",
      "Cart Locale",
    ].map((label) => ({ label, value: label })),
  },
  {
    title: "Shipping",
    options: [
      "Zipcode / Postcode",
      "Province / State Code",
      "Address Line 1",
      "Country Code",
      "Time of the Day",
      "Day of the Week",
      "Warehouse Zipcode / Postcode",
    ].map((label) => ({ label, value: label })),
  },
  {
    title: "Customer",
    options: [
      "Customer Tag",
      "Customer First Name",
      "Customer Last Name",
    ].map((label) => ({ label, value: label })),
  },
];

const cartProductFieldOptions = cartProductFields.map((label) => ({
  label,
  value: label,
}));

const currencyOptions = [
  "Default Store Currency",
  "United Arab Emirates Dirham",
  "Australian Dollars",
  "Canadian Dollars",
  "Euro",
  "United Kingdom Pounds",
  "Indian Rupees",
  "Japanese Yen",
  "New Zealand Dollars",
  "United States Dollars",
  "South African Rand",
  "Hong Kong Dollars",
  "Swiss Francs",
  "Polish Zlotych",
].map((label) => ({ label, value: label }));

const calculationOptionGroups = [
  {
    title: "Fixed Rates",
    options: [
      "Fixed rate",
      "Percentage of total price",
      "Product Metafield",
      "Variant Metafield",
    ].map((label) => ({ label, value: label })),
  },
  {
    title: "Dynamic Rates",
    options: [
      "Total weight of items",
      "Total price of items",
      "Number of items",
      "Sum Of Product Metafield",
      "Sum Of Variant Metafield",
      "Distance",
    ].map((label) => ({ label, value: label })),
  },
  {
    title: "Carrier Rates",
    options: carrierNames.map((label) => ({ label, value: label })),
  },
];

const stallionPackageTypeOptions = [
  "Parcel",
  "Legal Flat Rate Envelope",
  "Flat Rate Padded Envelope",
  "Small Flat Rate Box",
  "Medium Flat Rate Box 1",
  "Medium Flat Rate Box 2",
  "Large Flat Rate Box",
  "Regional Rate Box A1",
  "Regional Rate Box A2",
  "Regional Rate Box B1",
  "Regional Rate Box B2",
  "Letter",
  "Large Envelope Or Flat",
  "Thick Envelope",
].map((label) => ({ label, value: label }));

const cartContainsQuantityChecks = [
  ["atLeastOne", "Cart contains at least one product"],
  ["moreProducts", "Cart contains more than X products"],
  ["lessProducts", "Cart contains less than X products"],
  ["moreAmount", "Cart contains more than X amount"],
  ["lessAmount", "Cart contains less than X amount"],
];

const rateTypeOptions = [
  "Range",
  "Incremental",
  "Range + Incremental",
  "Range + Range",
];

function editableRateCondition(condition) {
  return {
    ...blankCondition(),
    field: condition.field,
    subfield: condition.subfield ?? "Product Tag",
    key: condition.key ?? "",
    operator: condition.operator,
    value: condition.value ?? "",
    quantityCheck: condition.quantityCheck ?? "atLeastOne",
    quantityValue: condition.quantityValue ?? "",
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

export default function NewShippingRateRule() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { rate, zones } = useLoaderData();
  const [name, setName] = useState(rate?.name ?? "");
  const [priority, setPriority] = useState(rate ? String(rate.priority) : "");
  const [status, setStatus] = useState(
    rate ? `${rate.status.charAt(0)}${rate.status.slice(1).toLowerCase()}` : "Active",
  );
  const [match, setMatch] = useState(rate?.conditionMatch.toLowerCase() ?? "all");
  const [exclusivity, setExclusivity] = useState(rate?.exclusivity.toLowerCase() ?? "inclusive");
  const [conditions, setConditions] = useState(
    rate?.conditions.length
      ? rate.conditions.map(editableRateCondition)
      : [blankCondition()],
  );
  const [zoneRates, setZoneRates] = useState(() =>
    groupStoredRates(rate?.rates ?? [], zones),
  );
  const [activeZone, setActiveZone] = useState(null);
  const [activeRateIndex, setActiveRateIndex] = useState(null);
  const [activeRateMenu, setActiveRateMenu] = useState(null);
  const [rateDraft, setRateDraft] = useState(blankRate());
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedules, setSchedules] = useState(rate?.schedules ?? []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleAction, setScheduleAction] = useState("ACTIVATE");
  const [scheduleDate, setScheduleDate] = useState(localDateValue);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");

  const openRateModal = (zone, rateIndex = null) => {
    setActiveZone(zone);
    setActiveRateIndex(rateIndex);
    setRateDraft(
      rateIndex === null ? blankRate() : zoneRates[zone][rateIndex],
    );
    setActiveRateMenu(null);
  };
  const closeRateModal = () => {
    setActiveZone(null);
    setActiveRateIndex(null);
  };
  const updateRate = (key, value) =>
    setRateDraft({ ...rateDraft, [key]: value });
  const updatePackage = (index, key, value) =>
    updateRate(
      "packages",
      rateDraft.packages.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  const addPackage = () =>
    updateRate("packages", [
      ...rateDraft.packages,
      { limit: "", length: "", width: "", height: "", weight: "" },
    ]);
  const removePackage = (index) =>
    updateRate(
      "packages",
      rateDraft.packages.filter((_, itemIndex) => itemIndex !== index),
    );
  const toggleCarrierService = (service) =>
    updateRate(
      "selectedServices",
      rateDraft.selectedServices.includes(service)
        ? rateDraft.selectedServices.filter((item) => item !== service)
        : [...rateDraft.selectedServices, service],
    );
  const isMetafieldRate = ["Product Metafield", "Variant Metafield"].includes(
    rateDraft.calculation,
  );
  const isDynamicRate = [
    "Total weight of items",
    "Total price of items",
    "Number of items",
    "Sum Of Product Metafield",
    "Sum Of Variant Metafield",
    "Distance",
  ].includes(rateDraft.calculation);
  const isSumMetafieldRate = [
    "Sum Of Product Metafield",
    "Sum Of Variant Metafield",
  ].includes(rateDraft.calculation);
  const isCarrierRate = carrierNames.includes(rateDraft.calculation);
  const currencyCode = currencyCodes[rateDraft.currency] || "USD";
  const parameterSuffix =
    rateDraft.calculation === "Distance"
      ? "kms"
      : rateDraft.calculation === "Total weight of items"
        ? "lb"
        : rateDraft.calculation === "Total price of items"
          ? currencyCode
          : "";
  const priceCalculationSuffix =
    rateDraft.priceCalculation === "Total weight of items"
      ? "lb"
      : rateDraft.priceCalculation === "Total price of items"
        ? currencyCode
        : "";
  const incrementalParameterSuffix = rateDraft.rateType.includes("+")
    ? priceCalculationSuffix
    : parameterSuffix;
  const canSaveRate = Boolean(
    rateDraft.name.trim() &&
    (isCarrierRate
      ? true
      : isDynamicRate
        ? rateDraft.calculation === "Distance"
          ? rateDraft.googleMapsApiKey.trim() &&
            (rateDraft.originLocation !== "Custom Location" ||
              rateDraft.originPostcode.trim())
          : !isSumMetafieldRate || rateDraft.metafieldKey.trim()
        : isMetafieldRate
          ? rateDraft.metafieldKey.trim()
          : rateDraft.price.trim()),
  );
  const saveRate = () => {
    if (!canSaveRate) return;
    const rates = [...(zoneRates[activeZone] ?? [])];

    if (activeRateIndex === null) {
      rates.push(rateDraft);
    } else {
      rates[activeRateIndex] = rateDraft;
    }

    setZoneRates({ ...zoneRates, [activeZone]: rates });
    closeRateModal();
  };
  const removeZoneRate = (zone, rateIndex) => {
    setZoneRates({
      ...zoneRates,
      [zone]: zoneRates[zone].filter((_, index) => index !== rateIndex),
    });
    setActiveRateMenu(null);
  };

  const renderPackagingFields = (parcel = false) => (
    <BlockStack gap="300">
      <Select
        label={parcel ? "Parcel distribution" : "Packaging box distribution"}
        options={["By items count", "By items volume"]}
        value={rateDraft.packagingDistribution}
        onChange={(value) => updateRate("packagingDistribution", value)}
      />
      {rateDraft.packages.map((item, index) => (
        <Card key={index} background="bg-surface-secondary">
          <BlockStack gap="300">
            <InlineStack gap="300" wrap>
              {rateDraft.packagingDistribution === "By items count" && (
                <Box minWidth="140px">
                  <TextField
                    label={`${parcel ? "Parcel" : "Box"} Max Limit`}
                    type="number"
                    suffix="items"
                    value={item.limit}
                    onChange={(value) => updatePackage(index, "limit", value)}
                    autoComplete="off"
                  />
                </Box>
              )}
              {[
                ["length", "Length", "mm"],
                ["width", "Width", "mm"],
                ["height", "Height", "mm"],
                ["weight", "Weight (Optional)", "g"],
              ].map(([key, label, suffix]) => (
                <Box minWidth="140px" key={key}>
                  <TextField
                    label={`${parcel ? "Parcel" : "Box"} ${label}`}
                    type="number"
                    suffix={suffix}
                    value={item[key]}
                    onChange={(value) => updatePackage(index, key, value)}
                    autoComplete="off"
                  />
                </Box>
              ))}
              <Box paddingBlockStart="600">
                <Button
                  icon={DeleteIcon}
                  tone="critical"
                  accessibilityLabel={`Delete package ${index + 1}`}
                  onClick={() => removePackage(index)}
                />
              </Box>
            </InlineStack>
          </BlockStack>
        </Card>
      ))}
      <Box>
        <Button icon={PlusIcon} onClick={addPackage}>
          Add
        </Button>
      </Box>
      <Text as="p" tone="subdued">
        Add packages from smallest to largest max limit value.
      </Text>
    </BlockStack>
  );

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
    const submission = {
      name,
      priority,
      status,
      conditionMatch: match,
      exclusivity,
      conditions,
      zoneRates: storedZoneRates(zoneRates),
      schedules,
    };
    fetcher.submit(
      rate ? { intent: "update", id: rate.id, data: submission } : submission,
      {
        method: "post",
        encType: "application/json",
        ...(rate ? { action: "/app/rates?index" } : {}),
      },
    );
  };

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

  const deleteRule = () => {
    if (!rate) return;
    setDeleting(true);
    fetcher.submit(
      { intent: "delete", id: rate.id },
      {
        method: "post",
        encType: "application/json",
        action: "/app/rates?index",
      },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      shopify.toast.show(
        deleting ? "Shipping rate rule deleted" : "Shipping rate rule saved",
      );
      navigate("/app/rates");
      return;
    }

    shopify.toast.show(
      fetcher.data.error ||
        (deleting ? "Unable to delete rate rule" : "Unable to submit rate rule"),
      {
      isError: true,
      },
    );
    setDeleting(false);
  }, [deleting, fetcher.data, navigate, shopify]);

  return (
    <Page
      title={rate ? "Edit shipping rate rule" : "Add Shipping Rate Rule"}
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      secondaryActions={rate ? [
        {
          content: "Delete",
          destructive: true,
          onAction: () => setDeleteConfirmationOpen(true),
        },
      ] : []}
      primaryAction={{
        content: "Save",
        onAction: save,
        disabled: !canSave,
        loading: fetcher.state !== "idle",
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <FormLayout>
                <TextField
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Heavy products rule"
                  autoComplete="off"
                />
                <TextField
                  label="Priority"
                  type="number"
                  min={1}
                  value={priority}
                  onChange={setPriority}
                  placeholder="e.g. 1"
                  autoComplete="off"
                  helpText="Rules are evaluated in ascending order of priority. No two rules can share the same priority."
                />
              </FormLayout>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Conditions
                </Text>
                <BlockStack gap="200">
                  <Text as="p">Rule must match:</Text>
                  <RadioButton
                    label="All conditions"
                    name="match"
                    checked={match === "all"}
                    onChange={() => setMatch("all")}
                  />
                  <RadioButton
                    label="Any condition"
                    name="match"
                    checked={match === "any"}
                    onChange={() => setMatch("any")}
                  />
                </BlockStack>

                {conditions.map((condition, index) => {
                  const behavior = conditionBehavior(
                    effectiveConditionField(condition),
                  );
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
                                conditions.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                          />
                        </InlineStack>

                        <InlineStack gap="300" wrap blockAlign="start">
                          <Box minWidth="220px">
                            <Select
                              label="Field"
                              labelHidden
                              options={conditionFieldOptions}
                              value={condition.field}
                              onChange={(value) =>
                                changeConditionField(index, value)
                              }
                            />
                          </Box>
                          {isCartProductCondition(condition.field) && (
                            <Box minWidth="200px">
                              <Select
                                label="Product field"
                                labelHidden
                                options={cartProductFieldOptions}
                                value={condition.subfield}
                                onChange={(value) =>
                                  changeCartProductField(index, value)
                                }
                              />
                            </Box>
                          )}
                          {isKeyedCondition(condition) && (
                            <Box minWidth="180px">
                              <TextField
                                label={`${effectiveConditionField(condition)} key`}
                                labelHidden
                                value={condition.key}
                                placeholder={
                                  effectiveConditionField(condition) ===
                                  "Variant Metafield"
                                    ? "Namespace.Key"
                                    : "Key"
                                }
                                onChange={(value) =>
                                  updateCondition(index, "key", value)
                                }
                                autoComplete="off"
                              />
                            </Box>
                          )}
                          <Box minWidth="200px">
                            <Select
                              label="Operator"
                              labelHidden
                              options={behavior.operators}
                              value={condition.operator}
                              onChange={(value) =>
                                updateCondition(index, "operator", value)
                              }
                            />
                          </Box>
                        </InlineStack>

                        <InlineStack gap="200" blockAlign="end" wrap={false}>
                          <Box width="100%">
                            <TextField
                              label="Value"
                              labelHidden
                              type={
                                behavior.type === "time"
                                  ? "time"
                                  : behavior.type === "number"
                                    ? "number"
                                    : "text"
                              }
                              min={behavior.currency ? 0 : undefined}
                              step={behavior.currency ? 1 : undefined}
                              value={condition.value}
                              onChange={(value) =>
                                updateCondition(index, "value", value)
                              }
                              suffix={
                                behavior.currency || behavior.unit
                                  ? behavior.unit || "USD"
                                  : ["Time of the Day", "Day of the Week"].includes(
                                        effectiveConditionField(condition),
                                      )
                                    ? "America/New_York"
                                    : undefined
                              }
                              autoComplete="off"
                            />
                          </Box>
                        </InlineStack>

                        {behavior.help && (
                          <Text as="p" tone="subdued">
                            {behavior.help}
                          </Text>
                        )}

                        {condition.field === "Cart Locale" && (
                          <BlockStack gap="100">
                            <Text as="p" tone="subdued">
                              Enter the locale code used by Shopify. You can
                              find them{" "}
                              <a
                                href="https://shopify.dev/docs/api/liquid/objects/localization"
                                target="_blank"
                                rel="noreferrer"
                              >
                                here
                              </a>
                              .
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also enter multiple values separated by
                              semi-colon (;).
                            </Text>
                          </BlockStack>
                        )}

                        {[
                          "Zipcode / Postcode",
                          "Warehouse Zipcode / Postcode",
                        ].includes(condition.field) && (
                          <BlockStack gap="100">
                            <Text as="p" tone="subdued">
                              You can use asterisk (*) for wildcard (For e.g.
                              AB14*).
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also use hyphen to enter range of
                              postcodes (For e.g. 90209-90231).
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also enter multiple values separated by
                              comma (,).
                            </Text>
                          </BlockStack>
                        )}

                        {condition.field === "Province / State Code" && (
                          <BlockStack gap="100">
                            <Text as="p" tone="subdued">
                              Enter two-letter province codes used by
                              Shopify. You can find them{" "}
                              <a
                                href="https://en.wikipedia.org/wiki/ISO_3166-2"
                                target="_blank"
                                rel="noreferrer"
                              >
                                here
                              </a>
                              .
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also enter multiple values separated by
                              comma (,).
                            </Text>
                          </BlockStack>
                        )}

                        {condition.field === "Country Code" && (
                          <BlockStack gap="100">
                            <Text as="p" tone="subdued">
                              Enter two-letter country codes used by Shopify.
                              You can find them{" "}
                              <a
                                href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2"
                                target="_blank"
                                rel="noreferrer"
                              >
                                here
                              </a>
                              .
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also enter multiple values separated by
                              semi-colon (;).
                            </Text>
                          </BlockStack>
                        )}

                        {condition.field === "Day of the Week" && (
                          <BlockStack gap="100">
                            <Text as="p" tone="subdued">
                              Enter full names of the day like Monday,
                              Tuesday, etc.
                            </Text>
                            <Text as="p" tone="subdued">
                              You can also enter multiple values separated by
                              comma (,).
                            </Text>
                          </BlockStack>
                        )}

                        {condition.field === "Cart Contains" && (
                          <BlockStack gap="200">
                            <Text as="p">Quantity / amount check:</Text>
                            {cartContainsQuantityChecks.map(([value, label]) => (
                              <RadioButton
                                key={value}
                                label={label}
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
                            ))}
                            {condition.quantityCheck !== "atLeastOne" && (
                              <TextField
                                label={
                                  condition.quantityCheck.includes("Amount")
                                    ? "Amount"
                                    : "Quantity"
                                }
                                type="number"
                                min={0}
                                step={1}
                                placeholder={
                                  condition.quantityCheck.includes("Amount")
                                    ? "Enter amount"
                                    : "Enter quantity"
                                }
                                suffix={
                                  condition.quantityCheck.includes("Amount")
                                    ? "USD"
                                    : undefined
                                }
                                value={condition.quantityValue}
                                onChange={(value) =>
                                  updateCondition(
                                    index,
                                    "quantityValue",
                                    value,
                                  )
                                }
                                autoComplete="off"
                              />
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
                    onClick={() => setConditions([...conditions, blankCondition()])}
                  >
                    Add another condition
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Shipping zones
                </Text>
                {zones.map((zone) => (
                  <Card key={zone.id} background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingSm">
                          {zone.name}
                        </Text>
                        <Button
                          variant="plain"
                          onClick={() => openRateModal(zone.id)}
                        >
                          Add rate
                        </Button>
                      </InlineStack>
                      {(zoneRates[zone.id] ?? []).length === 0 ? (
                        <Banner tone="warning">
                          No rates. Customers in this zone won&apos;t see
                          shipping rates from ShipFlux app.
                        </Banner>
                      ) : (
                        <BlockStack gap="0">
                          <Box paddingBlock="200">
                            <InlineGrid columns="2fr 2fr 1fr auto" gap="300" alignItems="center">
                              <Text as="span" fontWeight="semibold">Rate name</Text>
                              <Text as="span" fontWeight="semibold">Condition</Text>
                              <Text as="span" fontWeight="semibold">Price</Text>
                              <Box minWidth="32px" />
                            </InlineGrid>
                          </Box>
                          {(zoneRates[zone.id] ?? []).map((shippingRate, rateIndex) => {
                            const menuKey = `${zone.id}-${rateIndex}`;

                            return (
                              <Box key={menuKey} paddingBlock="300">
                                <InlineGrid columns="2fr 2fr 1fr auto" gap="300" alignItems="center">
                                  <Text as="span">{shippingRate.name}</Text>
                                  <Text as="span">{shippingRate.calculation || "-"}</Text>
                                  <Text as="span">
                                    {shippingRate.price === "" ? "-" : `$${shippingRate.price}`}
                                  </Text>
                                  <Popover
                                    active={activeRateMenu === menuKey}
                                    activator={
                                      <Button
                                        icon={MenuHorizontalIcon}
                                        variant="plain"
                                        accessibilityLabel={`Actions for ${shippingRate.name}`}
                                        onClick={() =>
                                          setActiveRateMenu(
                                            activeRateMenu === menuKey ? null : menuKey,
                                          )
                                        }
                                      />
                                    }
                                    onClose={() => setActiveRateMenu(null)}
                                  >
                                    <ActionList
                                      items={[
                                        {
                                          content: "Edit",
                                          onAction: () => openRateModal(zone.id, rateIndex),
                                        },
                                        {
                                          content: "Delete",
                                          destructive: true,
                                          onAction: () => removeZoneRate(zone.id, rateIndex),
                                        },
                                      ]}
                                    />
                                  </Popover>
                                </InlineGrid>
                              </Box>
                            );
                          })}
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>
                ))}
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
                  Exclusivity
                </Text>
                <RadioButton
                  label="Inclusive"
                  name="exclusivity"
                  checked={exclusivity === "inclusive"}
                  onChange={() => setExclusivity("inclusive")}
                />
                <RadioButton
                  label="Exclusive"
                  name="exclusivity"
                  checked={exclusivity === "exclusive"}
                  onChange={() => setExclusivity("exclusive")}
                />
                <Text as="p" tone="subdued">
                  If an &apos;Exclusive&apos; rule is satisfied, all
                  lower-priority rules are skipped from evaluation.
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="100" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Schedule
                    </Text>
                    <Tooltip content="Activate or deactivate this shipping rate rule automatically at a scheduled time.">
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
          Reach out to live chat support for set up assistance or feature
          requests.
        </Text>
      </Box>

      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Add schedule"
        primaryAction={{ content: "Save", onAction: addSchedule }}
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
        title="Delete shipping rate rule?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: deleting && fetcher.state !== "idle",
          onAction: deleteRule,
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
            This will permanently delete {rate?.name || "this shipping rate rule"}.
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={Boolean(activeZone)}
        onClose={closeRateModal}
        title={activeRateIndex === null ? "Add rate" : "Edit rate"}
        primaryAction={{
          content: "Done",
          onAction: saveRate,
          disabled: !canSaveRate,
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeRateModal }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Details
              </Text>
              <FormLayout>
                <TextField
                  label="Rate name"
                  requiredIndicator
                  value={rateDraft.name}
                  onChange={(value) => updateRate("name", value)}
                  helpText="This is the shipping rate name customer will see at checkout."
                  autoComplete="off"
                />
                <TextField
                  label="Description"
                  value={rateDraft.description}
                  onChange={(value) => updateRate("description", value)}
                  helpText={`Tip: Use {{today}} to display today's date and {{today+3}} to add 3 days dynamically.`}
                  autoComplete="off"
                />
                <InlineStack gap="400" wrap={false} align="start">
                  <Box width="100%">
                    <TextField
                      label="Delivery time"
                      type="number"
                      min={0}
                      suffix="days"
                      value={rateDraft.minimumDays}
                      onChange={(value) => updateRate("minimumDays", value)}
                      autoComplete="off"
                    />
                  </Box>
                  <Box width="100%" paddingBlockStart="600">
                    <TextField
                      label="Delivery time max"
                      labelHidden
                      type="number"
                      min={0}
                      suffix="days"
                      value={rateDraft.maximumDays}
                      onChange={(value) => updateRate("maximumDays", value)}
                      autoComplete="off"
                    />
                  </Box>
                </InlineStack>
                <Select
                  label="Currency"
                  options={currencyOptions}
                  value={rateDraft.currency}
                  onChange={(value) => updateRate("currency", value)}
                />
              </FormLayout>
            </BlockStack>

            <Divider />

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Rate
              </Text>
              <Select
                label="Calculation parameter"
                requiredIndicator
                options={calculationOptionGroups}
                value={rateDraft.calculation}
                onChange={(value) => updateRate("calculation", value)}
              />

              {isCarrierRate ? (
                <BlockStack gap="300">
                  {rateDraft.calculation === "Australia Post" && (
                    <TextField
                      label="API Key"
                      requiredIndicator
                      value={rateDraft.carrierApiKey}
                      onChange={(value) => updateRate("carrierApiKey", value)}
                      autoComplete="off"
                    />
                  )}

                  {rateDraft.calculation === "USPS" && (
                    <>
                      <InlineStack gap="300" wrap={false}>
                        <Box width="100%">
                          <TextField
                            label="Client ID"
                            value={rateDraft.carrierApiKey}
                            onChange={(value) =>
                              updateRate("carrierApiKey", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                        <Box width="100%">
                          <TextField
                            label="Client Secret"
                            type="password"
                            value={rateDraft.carrierSecret}
                            onChange={(value) =>
                              updateRate("carrierSecret", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                      </InlineStack>
                      <Select
                        label="Rate schedule"
                        options={["Retail", "Commercial"]}
                        value={rateDraft.carrierSchedule}
                        onChange={(value) =>
                          updateRate("carrierSchedule", value)
                        }
                      />
                      <Select
                        label="Select which rates to show"
                        options={["All rates", "lowest rate only", "Highest rate only"]}
                        value={rateDraft.ratesToShow}
                        onChange={(value) => updateRate("ratesToShow", value)}
                      />
                      <BlockStack gap="300">
                        {[
                          ["Domestic Services", uspsDomesticServices],
                          ["International Services", uspsInternationalServices],
                        ].map(([heading, services]) => (
                          <BlockStack gap="150" key={heading}>
                            <Text as="p" fontWeight="semibold">
                              {heading}
                            </Text>
                            {services.map((service) => (
                              <Checkbox
                                key={service}
                                label={service}
                                checked={rateDraft.selectedServices.includes(
                                  service,
                                )}
                                onChange={() => toggleCarrierService(service)}
                              />
                            ))}
                          </BlockStack>
                        ))}
                      </BlockStack>
                    </>
                  )}

                  {rateDraft.calculation === "Fedex" && (
                    <>
                      <InlineStack gap="300" wrap={false}>
                        <Box width="100%">
                          <TextField
                            label="API Key"
                            value={rateDraft.carrierApiKey}
                            onChange={(value) =>
                              updateRate("carrierApiKey", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                        <Box width="100%">
                          <TextField
                            label="Secret Key"
                            type="password"
                            value={rateDraft.carrierSecret}
                            onChange={(value) =>
                              updateRate("carrierSecret", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                      </InlineStack>
                      <TextField
                        label="Account Number"
                        value={rateDraft.carrierAccount}
                        onChange={(value) => updateRate("carrierAccount", value)}
                        autoComplete="off"
                      />
                    </>
                  )}

                  {rateDraft.calculation === "Shiprocket" && (
                    <InlineStack gap="300" wrap={false}>
                      <Box width="100%">
                        <TextField
                          label="Email ID"
                          type="email"
                          value={rateDraft.carrierEmail}
                          onChange={(value) => updateRate("carrierEmail", value)}
                          autoComplete="off"
                        />
                      </Box>
                      <Box width="100%">
                        <TextField
                          label="Password"
                          type="password"
                          value={rateDraft.carrierPassword}
                          onChange={(value) =>
                            updateRate("carrierPassword", value)
                          }
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                  )}

                  {rateDraft.calculation === "Direct Freight Express" && (
                    <>
                      <InlineStack gap="300" wrap={false}>
                        <Box width="100%">
                          <TextField
                            label="API Key"
                            value={rateDraft.carrierApiKey}
                            onChange={(value) =>
                              updateRate("carrierApiKey", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                        <Box width="100%">
                          <TextField
                            label="Account Number"
                            value={rateDraft.carrierAccount}
                            onChange={(value) =>
                              updateRate("carrierAccount", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                      </InlineStack>
                      <Select
                        label="Rate Type"
                        options={["Item", "Pallet", "Skid", "Carton"]}
                        value={rateDraft.carrierRateType}
                        onChange={(value) =>
                          updateRate("carrierRateType", value)
                        }
                      />
                      <Checkbox
                        label="Fuel Levy Charges"
                        helpText="Add fuel levy charges to the final delivery cost"
                        checked={rateDraft.fuelLevy}
                        onChange={(value) => updateRate("fuelLevy", value)}
                      />
                    </>
                  )}

                  {rateDraft.calculation === "Stallion Express" && (
                    <>
                      <TextField
                        label="API Key"
                        value={rateDraft.carrierApiKey}
                        onChange={(value) => updateRate("carrierApiKey", value)}
                        autoComplete="off"
                      />
                      <Select
                        label="Package type"
                        options={stallionPackageTypeOptions}
                        value={rateDraft.packageType}
                        onChange={(value) => updateRate("packageType", value)}
                      />
                    </>
                  )}

                  {rateDraft.calculation === "ShipStation" && (
                    <>
                      <TextField
                        label="API Key"
                        value={rateDraft.carrierApiKey}
                        onChange={(value) => updateRate("carrierApiKey", value)}
                        autoComplete="off"
                      />
                      <TextField
                        label="API Secret"
                        type="password"
                        value={rateDraft.carrierSecret}
                        onChange={(value) => updateRate("carrierSecret", value)}
                        autoComplete="off"
                      />
                      <Box>
                        <Button>Fetch Carriers</Button>
                      </Box>
                      <Text as="h4" variant="headingSm">
                        Box Configuration
                      </Text>
                    </>
                  )}

                  {["Fedex", "Shiprocket"].includes(rateDraft.calculation) && (
                    <Checkbox
                      label="Hide estimated delivery dates"
                      helpText={`Estimated delivery dates are calculated by ${rateDraft.calculation}`}
                      checked={rateDraft.hideDeliveryDates}
                      onChange={(value) =>
                        updateRate("hideDeliveryDates", value)
                      }
                    />
                  )}

                  {rateDraft.calculation === "Shiprocket" && (
                    <Select
                      label="Select which rates to show"
                      options={["All rates", "Lowest rate only", "Highest rate only"]}
                      value={rateDraft.ratesToShow}
                      onChange={(value) => updateRate("ratesToShow", value)}
                    />
                  )}

                  {renderPackagingFields(
                    rateDraft.calculation === "Stallion Express",
                  )}

                  {rateDraft.calculation === "Stallion Express" && (
                    <>
                      <Select
                        label="Signature required"
                        options={["No", "Yes"]}
                        value={rateDraft.signatureRequired}
                        onChange={(value) =>
                          updateRate("signatureRequired", value)
                        }
                      />
                      <Select
                        label="Insured"
                        options={["No", "Yes"]}
                        value={rateDraft.insured}
                        onChange={(value) => updateRate("insured", value)}
                      />
                    </>
                  )}

                  {["USPS", "Fedex", "Stallion Express"].includes(
                    rateDraft.calculation,
                  ) && (
                    <TextField
                      label="Discount (Optional)"
                      type="number"
                      min={0}
                      step={1}
                      value={rateDraft.discount}
                      onChange={(value) => updateRate("discount", value)}
                      helpText="Discount all rates by a specific percentage"
                      autoComplete="off"
                    />
                  )}

                  {rateDraft.calculation === "Fedex" && (
                    <InlineStack gap="300" wrap={false}>
                      <Box width="100%">
                        <TextField
                          label="Handling Fees"
                          type="number"
                          suffix="%"
                          value={rateDraft.handlingPercent}
                          onChange={(value) =>
                            updateRate("handlingPercent", value)
                          }
                          autoComplete="off"
                        />
                      </Box>
                      <Box width="100%">
                        <TextField
                          label="Handling Fees"
                          type="number"
                          suffix={currencyCode}
                          value={rateDraft.handlingFixed}
                          onChange={(value) =>
                            updateRate("handlingFixed", value)
                          }
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                  )}

                  {rateDraft.calculation !== "ShipStation" && (
                    <TextField
                      label={`Default rate${
                        ["Fedex", "Stallion Express"].includes(
                          rateDraft.calculation,
                        )
                          ? " (Optional)"
                          : ""
                      }`}
                      type="number"
                      min={0}
                      step={1}
                      value={rateDraft.defaultRate}
                      onChange={(value) => updateRate("defaultRate", value)}
                      helpText="This rate will be applied if there is no response / rate from the carrier during rate query."
                      autoComplete="off"
                    />
                  )}
                </BlockStack>
              ) : isDynamicRate ? (
                <BlockStack gap="300">
                  {rateDraft.calculation === "Distance" && (
                    <BlockStack gap="300">
                      <TextField
                        label="Google maps API key"
                        requiredIndicator
                        value={rateDraft.googleMapsApiKey}
                        onChange={(value) =>
                          updateRate("googleMapsApiKey", value)
                        }
                        autoComplete="off"
                      />
                      <Divider />
                      <Select
                        label="Origin Location"
                        requiredIndicator
                        options={["Default Shopify Location", "Custom Location"]}
                        value={rateDraft.originLocation}
                        onChange={(value) =>
                          updateRate("originLocation", value)
                        }
                      />
                      {rateDraft.originLocation === "Custom Location" && (
                        <InlineStack gap="300" wrap={false}>
                          <Box width="100%">
                            <Select
                              label="Country"
                              requiredIndicator
                              options={countryOptions.map((country) => ({
                                label: country.name,
                                value: country.code,
                              }))}
                              value={rateDraft.originCountry}
                              onChange={(value) =>
                                updateRate("originCountry", value)
                              }
                            />
                          </Box>
                          <Box width="100%">
                            <TextField
                              label="Postcode"
                              requiredIndicator
                              value={rateDraft.originPostcode}
                              onChange={(value) =>
                                updateRate("originPostcode", value)
                              }
                              autoComplete="off"
                            />
                          </Box>
                        </InlineStack>
                      )}
                      <Divider />
                      <Select
                        label="Distance calculation method (in kilometers)"
                        requiredIndicator
                        options={["Driving", "Straight Line"]}
                        value={rateDraft.distanceMethod}
                        onChange={(value) =>
                          updateRate("distanceMethod", value)
                        }
                      />
                      <Divider />
                    </BlockStack>
                  )}
                  {isSumMetafieldRate && (
                    <>
                      <TextField
                        label={
                          rateDraft.calculation === "Sum Of Variant Metafield"
                            ? "Namespace and key"
                            : "Key"
                        }
                        requiredIndicator
                        placeholder={
                          rateDraft.calculation === "Sum Of Variant Metafield"
                            ? "Namespace.Key"
                            : "Key"
                        }
                        value={rateDraft.metafieldKey}
                        onChange={(value) => updateRate("metafieldKey", value)}
                        autoComplete="off"
                      />
                      <Divider />
                    </>
                  )}

                  <BlockStack gap="150">
                    <Text as="p">Rate Type</Text>
                    {rateTypeOptions.map((type) => (
                      <RadioButton
                        key={type}
                        label={type}
                        name="rate-type"
                        checked={rateDraft.rateType === type}
                        onChange={() => updateRate("rateType", type)}
                      />
                    ))}
                  </BlockStack>

                  {rateDraft.rateType !== "Incremental" && (
                    <InlineStack gap="300" wrap={false}>
                      <Box width="100%">
                        <TextField
                          label="Range Start"
                          requiredIndicator
                          type="number"
                          suffix={parameterSuffix}
                          value={rateDraft.rangeStart}
                          onChange={(value) =>
                            updateRate("rangeStart", value)
                          }
                          autoComplete="off"
                        />
                      </Box>
                      <Box width="100%">
                        <TextField
                          label="Range End"
                          type="number"
                          suffix={parameterSuffix}
                          helpText="Leave empty for unlimited"
                          value={rateDraft.rangeEnd}
                          onChange={(value) => updateRate("rangeEnd", value)}
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                  )}

                  {["Range + Incremental", "Range + Range"].includes(
                    rateDraft.rateType,
                  ) && (
                    <Select
                      label="Price calculation parameter"
                      options={[
                        "Number of items",
                        "Total weight of items",
                        "Total price of items",
                      ]}
                      value={rateDraft.priceCalculation}
                      onChange={(value) =>
                        updateRate("priceCalculation", value)
                      }
                    />
                  )}

                  {["Incremental", "Range + Incremental"].includes(
                    rateDraft.rateType,
                  ) && (
                    <InlineStack gap="300" wrap>
                      <Box minWidth="45%">
                        <TextField
                          label="Base Price"
                          requiredIndicator
                          type="number"
                          suffix={currencyCode}
                          value={rateDraft.basePrice}
                          onChange={(value) => updateRate("basePrice", value)}
                          autoComplete="off"
                        />
                      </Box>
                      <Box minWidth="45%">
                        <TextField
                          label="Incremental price"
                          requiredIndicator
                          type="number"
                          suffix={currencyCode}
                          value={rateDraft.incrementalPrice}
                          onChange={(value) =>
                            updateRate("incrementalPrice", value)
                          }
                          autoComplete="off"
                        />
                      </Box>
                      <Box minWidth="45%">
                        <TextField
                          label="Per each"
                          requiredIndicator
                          type="number"
                          suffix={incrementalParameterSuffix}
                          value={rateDraft.perEach}
                          onChange={(value) => updateRate("perEach", value)}
                          autoComplete="off"
                        />
                      </Box>
                      <Box minWidth="45%">
                        <TextField
                          label="Start From"
                          type="number"
                          suffix={incrementalParameterSuffix}
                          helpText="Leave empty for default value"
                          value={rateDraft.startFrom}
                          onChange={(value) => updateRate("startFrom", value)}
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                  )}

                  {rateDraft.rateType === "Range" && (
                    <TextField
                      label="Price"
                      requiredIndicator
                      type="number"
                      suffix={currencyCode}
                      value={rateDraft.price}
                      onChange={(value) => updateRate("price", value)}
                      autoComplete="off"
                    />
                  )}

                  {rateDraft.rateType === "Range + Range" && (
                    <>
                      <InlineStack gap="300" wrap={false}>
                        <Box width="100%">
                          <TextField
                            label="Range Start"
                            requiredIndicator
                            type="number"
                            suffix={priceCalculationSuffix}
                            value={rateDraft.secondRangeStart}
                            onChange={(value) =>
                              updateRate("secondRangeStart", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                        <Box width="100%">
                          <TextField
                            label="Range End"
                            type="number"
                            suffix={priceCalculationSuffix}
                            value={rateDraft.secondRangeEnd}
                            onChange={(value) =>
                              updateRate("secondRangeEnd", value)
                            }
                            autoComplete="off"
                          />
                        </Box>
                      </InlineStack>
                      <TextField
                        label="Price"
                        requiredIndicator
                        type="number"
                        suffix={currencyCode}
                        value={rateDraft.price}
                        onChange={(value) => updateRate("price", value)}
                        autoComplete="off"
                      />
                    </>
                  )}
                </BlockStack>
              ) : isMetafieldRate ? (
                <BlockStack gap="300">
                  <TextField
                    label={
                      rateDraft.calculation === "Variant Metafield"
                        ? "Namespace and key"
                        : "Key"
                    }
                    requiredIndicator
                    placeholder={
                      rateDraft.calculation === "Variant Metafield"
                        ? "Namespace.Key"
                        : "Key"
                    }
                    value={rateDraft.metafieldKey}
                    onChange={(value) => updateRate("metafieldKey", value)}
                    autoComplete="off"
                  />
                  <Checkbox
                    label="Increase rate per item"
                    checked={rateDraft.increasePerItem}
                    onChange={(value) => updateRate("increasePerItem", value)}
                  />
                  <Divider />
                  <TextField
                    label="Default rate"
                    type="number"
                    min={0}
                    step={1}
                    value={rateDraft.defaultRate}
                    onChange={(value) => updateRate("defaultRate", value)}
                    autoComplete="off"
                  />
                  <Text as="p" tone="subdued">
                    This rate will be applied if there is no value present in
                    metafield for a
                    {rateDraft.calculation === "Variant Metafield"
                      ? "n SKU"
                      : " product"}
                    .
                  </Text>
                </BlockStack>
              ) : (
                <TextField
                  label={
                    rateDraft.calculation === "Percentage of total price"
                      ? "Percentage"
                      : "Price"
                  }
                  requiredIndicator
                  type="number"
                  min={0}
                  step={1}
                  suffix={
                    rateDraft.calculation === "Percentage of total price"
                      ? `%${currencyCodes[rateDraft.currency] || "USD"}`
                      : currencyCodes[rateDraft.currency] || "USD"
                  }
                  value={rateDraft.price}
                  onChange={(value) => updateRate("price", value)}
                  autoComplete="off"
                />
              )}

              {!isMetafieldRate &&
                rateDraft.calculation === "Percentage of total price" && (
                  <Checkbox
                    label="Round up to nearest integer"
                    helpText="For e.g. $2.67 will rounded up to $3"
                    checked={rateDraft.roundUp}
                    onChange={(value) => updateRate("roundUp", value)}
                  />
                )}
            </BlockStack>

            <Divider />

            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Advanced
              </Text>
              <TextField
                label="Tags"
                value={rateDraft.tags}
                onChange={(value) => updateRate("tags", value)}
                helpText="Comma separated values are allowed."
                autoComplete="off"
              />
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
