import { useState, useCallback, useEffect } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Page,
  Select,
  Text,
  TextField,
  Spinner,
  Modal,
  FormLayout
} from "@shopify/polaris";
import { ClipboardIcon, PlusIcon, ViewIcon, HideIcon, DeleteIcon } from "@shopify/polaris-icons";
import styles from "../app.module.css";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { ensureShop, syncFunctionConfiguration } from "../backend.server";
import { ensureDefaultZones, getShopZoneDefaults } from "../zones.server";
import { entitlementsFor, persistBillingState, resolveBillingPlan } from "../plans.server";
import {
  createApiSecret,
  decryptApiSecret,
  encryptApiSecret,
  hashApiSecret,
} from "../settings-secret.server";

const PRODUCTS_COUNT_QUERY = `#graphql
  query SettingsProductsCount { productsCount { count } }
`;

function json(value, fallback) {
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

async function configurationFor(shopId) {
  let configuration = await prisma.shopConfiguration.findUnique({ where: { shopId } });
  if (!configuration?.apiSecretEncrypted) {
    const secret = createApiSecret();
    configuration = await prisma.shopConfiguration.upsert({
      where: { shopId },
      create: { shopId, apiSecretHash: hashApiSecret(secret), apiSecretEncrypted: encryptApiSecret(secret) },
      update: { apiSecretHash: hashApiSecret(secret), apiSecretEncrypted: encryptApiSecret(secret) },
    });
  }
  return configuration;
}

export async function loader({ request }) {
  const { billing, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const previous = await prisma.shopConfiguration.findUnique({ where: { shopId: shop.id } });
  const billingState = await resolveBillingPlan(billing);
  const billingConfiguration = await persistBillingState(shop.id, billingState);
  if (
    previous?.plan !== billingState.plan ||
    previous?.customizationsEnabled !== billingConfiguration.customizationsEnabled
  ) {
    await syncFunctionConfiguration(shop.id).catch(() => null);
  }
  const configuration = await configurationFor(shop.id);
  return {
    settings: configuration,
    apiSecret: decryptApiSecret(configuration.apiSecretEncrypted),
    entitlements: entitlementsFor(billingState.plan),
  };
}

export async function action({ request }) {
  const { admin, billing, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const billingState = await resolveBillingPlan(billing);
  const configuration = await persistBillingState(shop.id, billingState);
  const permissions = entitlementsFor(billingState.plan);
  const data = await request.formData();
  const intent = String(data.get("intent") ?? "save");

  if (intent === "syncZones") {
    const defaults = await getShopZoneDefaults(admin);
    await ensureDefaultZones(shop.id, defaults);
    const updated = await prisma.shopConfiguration.update({ where: { shopId: shop.id }, data: { zonesLastSyncedAt: new Date() } });
    return { ok: true, intent, syncedAt: updated.zonesLastSyncedAt };
  }
  if (intent === "syncProducts") {
    const response = await admin.graphql(PRODUCTS_COUNT_QUERY);
    const payload = await response.json();
    if (payload.errors?.length) return { ok: false, error: "Unable to sync products." };
    const updated = await prisma.shopConfiguration.update({ where: { shopId: shop.id }, data: { productsLastSyncedAt: new Date() } });
    return { ok: true, intent, syncedAt: updated.productsLastSyncedAt, count: payload.data?.productsCount?.count ?? 0 };
  }
  if (intent === "regenerateSecret") {
    const secret = createApiSecret();
    await prisma.shopConfiguration.update({
      where: { shopId: shop.id },
      data: { apiSecretHash: hashApiSecret(secret), apiSecretEncrypted: encryptApiSecret(secret) },
    });
    return { ok: true, intent, apiSecret: secret };
  }

  const shippingRatesEnabled = data.get("shippingRatesEnabled") === "true";
  const customizationsEnabled = data.get("customizationsEnabled") === "true";
  if (shippingRatesEnabled && !permissions.shippingRatesLive) return { ok: false, error: "The Pro plan is required for live Shipping Rates." };
  if (customizationsEnabled && !permissions.customizationsLive) return { ok: false, error: "The Starter plan or higher is required for live Shipping Customizations." };
  const blendMode = String(data.get("blendMode") ?? "add");
  if (!["add", "lowest", "highest"].includes(blendMode)) return { ok: false, error: "Invalid blending mode." };
  const contactEmail = String(data.get("contactEmail") ?? "").trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { ok: false, error: "Enter a valid contact email." };

  await prisma.shopConfiguration.update({
    where: { shopId: shop.id },
    data: {
      shippingRatesEnabled,
      customizationsEnabled,
      autoProductSyncEnabled: data.get("autoProductSyncEnabled") === "true",
      blendMode,
      contactEmail: contactEmail || null,
      basicBlendLimits: json(data.get("basicBlendLimits"), null),
      advancedBlendRules: json(data.get("advancedBlendRules"), []),
      version: { increment: 1 },
    },
  });
  if (configuration.customizationsEnabled !== customizationsEnabled) {
    await syncFunctionConfiguration(shop.id);
  }
  return { ok: true, intent: "save" };
}

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(/,/g, "");
};

const blendTypeLabels = {
  add: "Add",
  lowest: "Lowest",
  highest: "Highest",
};

function Toggle({ checked, onChange, label }) {
  return (
    <label className={styles.settingsToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <span aria-hidden="true" />
    </label>
  );
}

function SettingsRow({ children, control }) {
  return (
    <Box padding="400">
      <InlineStack align="space-between" blockAlign="center" gap="400" wrap={false}>
        <Box>{children}</Box>
        {control}
      </InlineStack>
    </Box>
  );
}

export default function SettingsPage() {
  const loaded = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [shippingRates, setShippingRates] = useState(loaded.settings.shippingRatesEnabled);
  const [shippingCustomizations, setShippingCustomizations] = useState(loaded.settings.customizationsEnabled);
  const [autoProductSync, setAutoProductSync] = useState(loaded.settings.autoProductSyncEnabled);
  const [blendMode, setBlendMode] = useState(loaded.settings.blendMode);
  const [secretVisible, setSecretVisible] = useState(false);
  const [contactEmail, setContactEmail] = useState(loaded.settings.contactEmail ?? "");
  const [apiSecret, setApiSecret] = useState(loaded.apiSecret);
  const [copied, setCopied] = useState(false);

  // --- SYNCING STATES ---
  const [isSyncingZones, setIsSyncingZones] = useState(false);
  const [zonesDate, setZonesDate] = useState(loaded.settings.zonesLastSyncedAt ? formatDate(loaded.settings.zonesLastSyncedAt) : "Not synced yet");
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [productsDate, setProductsDate] = useState(loaded.settings.productsLastSyncedAt ? formatDate(loaded.settings.productsLastSyncedAt) : "Not synced yet");

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBlendType, setModalBlendType] = useState("add");

  // --- ADD BLENDING RULE FORM FIELDS (previously unwired) ---
  const [blendTags, setBlendTags] = useState("");
  const [blendMax, setBlendMax] = useState("");
  const [blendMin, setBlendMin] = useState("");
  const [rateName, setRateName] = useState("");
  const [rateDescription, setRateDescription] = useState("");
  const [deliveryMin, setDeliveryMin] = useState("");
  const [deliveryMax, setDeliveryMax] = useState("");

  // --- SAVED ADVANCED BLENDING RULES ---
  const [advancedRules, setAdvancedRules] = useState(loaded.settings.advancedBlendRules ?? []);

  // --- DYNAMIC ROWS STATES (Basic Blending) ---
  const [limitRatesToggle, setLimitRatesToggle] = useState(Boolean(loaded.settings.basicBlendLimits));
  const [rateRows, setRateRows] = useState(loaded.settings.basicBlendLimits ?? [{ name: "", max: "", min: "" }]);

  // --- HANDLERS ---
  const handleSyncZones = () => {
    setIsSyncingZones(true);
    fetcher.submit({ intent: "syncZones" }, { method: "post" });
  };

  const handleSyncProducts = () => {
    setIsSyncingProducts(true);
    fetcher.submit({ intent: "syncProducts" }, { method: "post" });
  };

  const resetBlendForm = () => {
    setModalBlendType("add");
    setBlendTags("");
    setBlendMax("");
    setBlendMin("");
    setRateName("");
    setRateDescription("");
    setDeliveryMin("");
    setDeliveryMax("");
  };

  const openBlendModal = useCallback(() => {
    resetBlendForm();
    setIsModalOpen(true);
  }, []);

  const closeBlendModal = useCallback(() => setIsModalOpen(false), []);

  const canSaveBlendingRule = Boolean(
    blendTags.trim() && (modalBlendType !== "add" || rateName.trim()),
  );

  const saveBlendingRule = () => {
    if (!canSaveBlendingRule) return;
    setAdvancedRules((rules) => [
      ...rules,
      {
        id: Date.now(),
        blendType: modalBlendType,
        tags: blendTags,
        max: blendMax,
        min: blendMin,
        rateName,
        description: rateDescription,
        deliveryMin,
        deliveryMax,
      },
    ]);
    closeBlendModal();
  };

  const removeAdvancedRule = (id) =>
    setAdvancedRules((rules) => rules.filter((rule) => rule.id !== id));

  const copySecret = async () => {
    await navigator.clipboard?.writeText(apiSecret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    setIsSyncingZones(false);
    setIsSyncingProducts(false);
    if (fetcher.data.error) shopify.toast.show(fetcher.data.error, { isError: true });
    if (fetcher.data.ok) shopify.toast.show(fetcher.data.intent === "save" ? "Settings saved" : "Completed successfully");
    if (fetcher.data.intent === "syncZones") setZonesDate(formatDate(fetcher.data.syncedAt));
    if (fetcher.data.intent === "syncProducts") setProductsDate(formatDate(fetcher.data.syncedAt));
    if (fetcher.data.apiSecret) { setApiSecret(fetcher.data.apiSecret); setSecretVisible(true); }
  }, [fetcher.data, fetcher.state, shopify]);

  const saveSettings = () => fetcher.submit({
    intent: "save",
    shippingRatesEnabled: String(shippingRates),
    customizationsEnabled: String(shippingCustomizations),
    autoProductSyncEnabled: String(autoProductSync),
    blendMode,
    contactEmail,
    basicBlendLimits: JSON.stringify(limitRatesToggle ? rateRows : null),
    advancedBlendRules: JSON.stringify(advancedRules),
  }, { method: "post" });

  const setRatesMode = (enabled) => {
    if (enabled && !loaded.entitlements.shippingRatesLive) {
      shopify.toast.show("Upgrade to Pro to enable live Shipping Rates.", { isError: true });
      return;
    }
    setShippingRates(enabled);
  };

  const setCustomizationsMode = (enabled) => {
    if (enabled && !loaded.entitlements.customizationsLive) {
      shopify.toast.show("Upgrade to Starter to enable live Shipping Customizations.", { isError: true });
      return;
    }
    setShippingCustomizations(enabled);
  };

  // Logic to add/remove/update rows
  const addRow = () => setRateRows([...rateRows, { name: "", max: "", min: "" }]);
  const removeRow = (index) => setRateRows(rateRows.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => {
    const updated = [...rateRows];
    updated[index][field] = value;
    setRateRows(updated);
  };

  return (
    <>
      <Page
        title="Settings"
        backAction={{ content: "Back", onAction: () => navigate(-1) }}
        primaryAction={{ content: "Save", onAction: saveSettings, loading: fetcher.state !== "idle" }}
        secondaryActions={[{ content: "Cancel", onAction: () => navigate(-1) }]}
      >
        <BlockStack gap="500">

          {/* APP MODES */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">App Modes</Text>
            <Card padding="0">
              <SettingsRow control={<Toggle checked={shippingRates} onChange={setRatesMode} label="Enable Shipping Rates" />}>
                <BlockStack gap="050">
                  <Text as="p" variant="headingSm">Shipping Rates</Text>
                  <Text as="p" tone="subdued">To test, use "shipmagic" as first name at checkout.</Text>
                  <Text as="p" tone="subdued">To go live, <a href="/app/billing">upgrade</a> to "Pro" plan.</Text>
                </BlockStack>
              </SettingsRow>
              <Divider />
              <SettingsRow control={<Toggle checked={shippingCustomizations} onChange={setCustomizationsMode} label="Enable Shipping Customizations" />}>
                <BlockStack gap="050">
                  <Text as="p" variant="headingSm">Shipping Customizations</Text>
                  <Text as="p" tone="subdued">To test, use "shipmagic" as first name at checkout.</Text>
                  <Text as="p" tone="subdued">To go live, <a href="/app/billing">upgrade</a> to "Starter" plan.</Text>
                </BlockStack>
              </SettingsRow>
            </Card>
          </BlockStack>

          {/* SYNCING */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">Syncing</Text>
            <Card padding="0">
              <SettingsRow>
                <BlockStack gap="200">
                  <Text as="p" variant="headingSm">Shipping Zones</Text>
                  <Box>
                    <Button onClick={handleSyncZones} disabled={isSyncingZones}>
                      {isSyncingZones ? <Spinner size="small" /> : "Sync now"}
                    </Button>
                  </Box>
                  <Text as="p" tone="subdued">Last synced: {zonesDate}</Text>
                </BlockStack>
              </SettingsRow>
              <Divider />
              <SettingsRow>
                <BlockStack gap="200">
                  <Text as="p" variant="headingSm">Products</Text>
                  <Text as="p" tone="subdued">[Optional] You need to sync products only if you want to create shipping rate rules based on tags, title, type or barcode.</Text>
                  <Box>
                    <Button onClick={handleSyncProducts} disabled={isSyncingProducts}>
                      {isSyncingProducts ? <Spinner size="small" /> : "Sync now"}
                    </Button>
                  </Box>
                  <Text as="p" tone="subdued">Last synced: {productsDate}</Text>
                </BlockStack>
              </SettingsRow>
              <Divider />
              <SettingsRow control={<Toggle checked={autoProductSync} onChange={setAutoProductSync} label="Enable Auto Product Sync" />}>
                <BlockStack gap="050">
                  <Text as="p" variant="headingSm">Auto Product Sync</Text>
                  <Text as="p">Enable this to auto sync new products with the app.</Text>
                </BlockStack>
              </SettingsRow>
            </Card>
          </BlockStack>

          {/* BLENDING */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">Blending</Text>
            <Card padding="0">
              <Box padding="400">
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="p" variant="headingSm">Basic</Text>
                    <Text as="p" tone="subdued">Choose how you want to blend rates with same name.</Text>
                  </BlockStack>
                  <Select
                    label="Blend rates"
                    labelHidden
                    options={[
                      { label: "Add rates", value: "add" },
                      { label: "Show the lowest rate only", value: "lowest" },
                      { label: "Show the highest rate only", value: "highest" },
                    ]}
                    value={blendMode}
                    onChange={setBlendMode}
                  />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p">Set limits while adding rates</Text>
                    <Toggle checked={limitRatesToggle} onChange={setLimitRatesToggle} label="Set limits while adding rates" />
                  </InlineStack>

                  {/* DYNAMIC ROWS FOR BASIC BLENDING */}
                  {limitRatesToggle && (
                    <BlockStack gap="200">
                      {rateRows.map((row, index) => (
                        <InlineStack gap="200" blockAlign="end" key={index} wrap={false}>
                          <div style={{ flex: 1 }}>
                            <TextField label="Rate name" labelHidden placeholder="Rate name" value={row.name} onChange={(v) => updateRow(index, 'name', v)} autoComplete="off" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField label="Max limit" labelHidden placeholder="Max limit" value={row.max} onChange={(v) => updateRow(index, 'max', v)} autoComplete="off" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField label="Min limit" labelHidden placeholder="Min limit" value={row.min} onChange={(v) => updateRow(index, 'min', v)} autoComplete="off" />
                          </div>
                          <Button icon={DeleteIcon} tone="critical" onClick={() => removeRow(index)} />
                        </InlineStack>
                      ))}
                      <Box><Button icon={PlusIcon} onClick={addRow}>Add</Button></Box>
                    </BlockStack>
                  )}
                </BlockStack>
              </Box>
              <Divider />
              <Box padding="400">
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="p" variant="headingSm">Advanced</Text>
                    <Text as="p" tone="subdued">Choose how you want to blend rates with different names (based on tags).</Text>
                  </BlockStack>

                  {advancedRules.length === 0 ? (
                    <Banner tone="info">No advanced blending rules created yet.</Banner>
                  ) : (
                    <BlockStack gap="200">
                      {advancedRules.map((rule) => (
                        <Card key={rule.id} background="bg-surface-secondary">
                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="050">
                              <Text as="p" variant="headingSm">
                                {rule.rateName || rule.tags}
                              </Text>
                              <Text as="p" tone="subdued">
                                {blendTypeLabels[rule.blendType]} · Tags: {rule.tags}
                                {rule.max ? ` · Max: ${rule.max}` : ""}
                                {rule.min ? ` · Min: ${rule.min}` : ""}
                              </Text>
                            </BlockStack>
                            <Button
                              icon={DeleteIcon}
                              tone="critical"
                              accessibilityLabel={`Delete blending rule ${rule.rateName || rule.tags}`}
                              onClick={() => removeAdvancedRule(rule.id)}
                            />
                          </InlineStack>
                        </Card>
                      ))}
                    </BlockStack>
                  )}

                  <Box><Button icon={PlusIcon} onClick={openBlendModal}>Add</Button></Box>
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>

          {/* ADVANCED MODAL */}
          <Modal
            open={isModalOpen}
            onClose={closeBlendModal}
            title="Add blending rule"
            primaryAction={{ content: 'Done', onAction: saveBlendingRule, disabled: !canSaveBlendingRule }}
            secondaryActions={[{ content: 'Cancel', onAction: closeBlendModal }]}
          >
            <Modal.Section>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Blending</Text>
                  <FormLayout>
                    <Select
                      label="Blend type"
                      requiredIndicator
                      options={[
                        { label: 'Add', value: 'add' },
                        { label: 'Lowest', value: 'lowest' },
                        { label: 'Highest', value: 'highest' }
                      ]}
                      value={modalBlendType}
                      onChange={setModalBlendType}
                    />
                    <TextField
                      label="Tags"
                      requiredIndicator
                      helpText="Comma separated values are allowed."
                      value={blendTags}
                      onChange={setBlendTags}
                      autoComplete="off"
                    />
                    <TextField
                      label="Maximum"
                      value={blendMax}
                      onChange={setBlendMax}
                      autoComplete="off"
                    />
                    <TextField
                      label="Minimum"
                      value={blendMin}
                      onChange={setBlendMin}
                      autoComplete="off"
                    />
                  </FormLayout>
                </BlockStack>
                {modalBlendType === 'add' && (
                  <>
                    <Divider />
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">Details</Text>
                      <Text tone="subdued">Enter details which customers should see when rates with different names are added.</Text>
                      <FormLayout>
                        <TextField
                          label="Rate name"
                          requiredIndicator
                          value={rateName}
                          onChange={setRateName}
                          autoComplete="off"
                        />
                        <TextField
                          label="Description"
                          value={rateDescription}
                          onChange={setRateDescription}
                          autoComplete="off"
                        />
                        <InlineStack gap="400" wrap={false}>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Delivery time"
                              suffix="days"
                              value={deliveryMin}
                              onChange={setDeliveryMin}
                              autoComplete="off"
                            />
                          </div>
                          <div style={{ flex: 1, paddingTop: '28px' }}>
                            <TextField
                              label="Delivery time max"
                              labelHidden
                              suffix="days"
                              value={deliveryMax}
                              onChange={setDeliveryMax}
                              autoComplete="off"
                            />
                          </div>
                        </InlineStack>
                      </FormLayout>
                    </BlockStack>
                  </>
                )}
              </BlockStack>
            </Modal.Section>
          </Modal>

          {/* API SECRET */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">API Secret</Text>
            <Card>
              <BlockStack gap="300">
                <Text as="p" variant="headingSm">Your Store API Secret</Text>
                <div className={styles.secretRow}>
                  <TextField
                    label="Store API secret"
                    labelHidden
                    value={secretVisible ? apiSecret : "••••••••••••••••••••••••"}
                    readOnly
                    autoComplete="off"
                  />
                  <Button
                    icon={secretVisible ? HideIcon : ViewIcon}
                    onClick={() => setSecretVisible((visible) => !visible)}
                  />
                  <Button icon={ClipboardIcon} onClick={copySecret} />
                </div>
                <Text as="p" tone="subdued">{copied ? "Secret copied." : "Share this secret with other stores to allow them to clone your configuration."}</Text>
                <Box><Button variant="primary" tone="critical" onClick={() => fetcher.submit({ intent: "regenerateSecret" }, { method: "post" })}>Regenerate Secret</Button></Box>
              </BlockStack>
            </Card>
          </BlockStack>

          {/* CLONE SETUP */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">Clone Setup</Text>
            <Card>
              <BlockStack gap="300">
                <Text as="p" variant="headingSm">Clone Configuration</Text>
                <Text as="p" tone="subdued">Copy shipping rates, customizations, and settings from another store using its API Secret.</Text>
                <Box><Button variant="primary" onClick={() => navigate("/app/clone-setup")}>Clone from another store</Button></Box>
              </BlockStack>
            </Card>
          </BlockStack>

          {/* OTHER */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">Other</Text>
            <Card>
              <TextField
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={setContactEmail}
                autoComplete="email"
                helpText="This will be used only for important communication. No Spam we promise!"
              />
            </Card>
          </BlockStack>

          <Box paddingBlockEnd="800" />
        </BlockStack>
      </Page>
    </>
  );
}
