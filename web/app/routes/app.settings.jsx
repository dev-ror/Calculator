import { useState, useCallback, useEffect } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
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
import {
  ClipboardIcon,
  PlusIcon,
  ViewIcon,
  HideIcon,
  DeleteIcon,
  SettingsIcon,
  RefreshIcon,
  CollectionIcon,
  TransferIcon,
} from "@shopify/polaris-icons";
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

function settingsSnapshot(values) {
  return JSON.stringify({
    shippingRates: values.shippingRates,
    shippingCustomizations: values.shippingCustomizations,
    autoProductSync: values.autoProductSync,
    blendMode: values.blendMode,
    contactEmail: values.contactEmail,
    advancedRules: values.advancedRules,
    limitRatesToggle: values.limitRatesToggle,
    rateRows: values.rateRows,
  });
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
  const initialSnapshot = settingsSnapshot({
    shippingRates: loaded.settings.shippingRatesEnabled,
    shippingCustomizations: loaded.settings.customizationsEnabled,
    autoProductSync: loaded.settings.autoProductSyncEnabled,
    blendMode: loaded.settings.blendMode,
    contactEmail: loaded.settings.contactEmail ?? "",
    advancedRules: loaded.settings.advancedBlendRules ?? [],
    limitRatesToggle: Boolean(loaded.settings.basicBlendLimits),
    rateRows: loaded.settings.basicBlendLimits ?? [{ name: "", max: "", min: "" }],
  });
  const [shippingRates, setShippingRates] = useState(loaded.settings.shippingRatesEnabled);
  const [shippingCustomizations, setShippingCustomizations] = useState(loaded.settings.customizationsEnabled);
  const [autoProductSync, setAutoProductSync] = useState(loaded.settings.autoProductSyncEnabled);
  const [blendMode, setBlendMode] = useState(loaded.settings.blendMode);
  const [secretVisible, setSecretVisible] = useState(false);
  const [contactEmail, setContactEmail] = useState(loaded.settings.contactEmail ?? "");
  const [apiSecret, setApiSecret] = useState(loaded.apiSecret);
  const [copied, setCopied] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(initialSnapshot);

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
  const [activeTab, setActiveTab] = useState("general");

  const currentSnapshot = settingsSnapshot({
    shippingRates,
    shippingCustomizations,
    autoProductSync,
    blendMode,
    contactEmail,
    advancedRules,
    limitRatesToggle,
    rateRows,
  });
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

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

  const discardChanges = () => {
    const nextValues = {
      shippingRates: loaded.settings.shippingRatesEnabled,
      shippingCustomizations: loaded.settings.customizationsEnabled,
      autoProductSync: loaded.settings.autoProductSyncEnabled,
      blendMode: loaded.settings.blendMode,
      contactEmail: loaded.settings.contactEmail ?? "",
      advancedRules: loaded.settings.advancedBlendRules ?? [],
      limitRatesToggle: Boolean(loaded.settings.basicBlendLimits),
      rateRows: loaded.settings.basicBlendLimits ?? [{ name: "", max: "", min: "" }],
    };
    setShippingRates(nextValues.shippingRates);
    setShippingCustomizations(nextValues.shippingCustomizations);
    setAutoProductSync(nextValues.autoProductSync);
    setBlendMode(nextValues.blendMode);
    setContactEmail(nextValues.contactEmail);
    setAdvancedRules(nextValues.advancedRules);
    setLimitRatesToggle(nextValues.limitRatesToggle);
    setRateRows(nextValues.rateRows);
    setSavedSnapshot(settingsSnapshot(nextValues));
  };

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
    if (fetcher.data.ok) {
      shopify.toast.show(fetcher.data.intent === "save" ? "Settings saved" : "Completed successfully");
      if (fetcher.data.intent === "save") setSavedSnapshot(currentSnapshot);
    }
    if (fetcher.data.intent === "syncZones") setZonesDate(formatDate(fetcher.data.syncedAt));
    if (fetcher.data.intent === "syncProducts") setProductsDate(formatDate(fetcher.data.syncedAt));
    if (fetcher.data.apiSecret) { setApiSecret(fetcher.data.apiSecret); setSecretVisible(true); }
  }, [fetcher.data, fetcher.state, shopify, currentSnapshot]);

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

  const tabs = [
    ["general", SettingsIcon, "General"],
    ["sync", RefreshIcon, "Sync"],
    ["blending", CollectionIcon, "Rate blending"],
    ["transfer", TransferIcon, "Store transfer"],
  ];

  const modeRow = (label, enabled, onChange) => (
    <div className={styles.modeRow}>
      <Text as="p" variant="headingSm">{label} <span className={styles.infoDot}>i</span></Text>
      <div className={styles.modeSwitch}>
        <button className={!enabled ? styles.modeSelected : ""} onClick={() => onChange(false)}>Test</button>
        <button className={enabled ? styles.modeSelected : ""} onClick={() => onChange(true)}>Live</button>
      </div>
    </div>
  );

  return (
    <div className={styles.settingsPage}>
      <SaveBar open={hasUnsavedChanges} discardConfirmation={false}>
        <button type="button" onClick={discardChanges}>Discard</button>
        <button type="button" variant="primary" onClick={saveSettings} disabled={fetcher.state !== "idle"}>
          {fetcher.state === "idle" ? "Save" : "Saving…"}
        </button>
      </SaveBar>
      <header className={styles.settingsHeader}>
        <div><h1>Settings</h1><p>Manage your app preferences, syncing and advanced options.</p></div>
        <button className={styles.settingsSaveButton} onClick={saveSettings} disabled={!hasUnsavedChanges || fetcher.state !== "idle"}>{fetcher.state === "idle" ? "Save" : "Saving…"}</button>
      </header>
      <nav className={styles.settingsTabs} aria-label="Settings categories">
        {tabs.map(([id, Icon, label]) => <button key={id} className={activeTab === id ? styles.activeSettingsTab : ""} onClick={() => setActiveTab(id)}><span className={styles.settingsTabIcon}><Icon /></span>{label}</button>)}
      </nav>

      {activeTab === "general" && <BlockStack gap="500">
        <section className={`${styles.settingsSplitCard} ${styles.appModeCard}`}>
          <div><h2>App mode</h2><p>Choose how ShipFlux runs on your store.</p></div>
          <div className={styles.modePanel}>
            {modeRow("Shipping Rates", shippingRates, setRatesMode)}
            {modeRow("Shipping Customizations", shippingCustomizations, setCustomizationsMode)}
          </div>
        </section>
        <section className={styles.settingsSplitCard}>
          <div><h2>General</h2><p>Basic app preferences for your store.</p></div>
          <div><TextField label="Contact email" type="email" value={contactEmail} onChange={setContactEmail} autoComplete="email" helpText="Used for important app notifications." /></div>
        </section>
      </BlockStack>}

      {activeTab === "sync" && <BlockStack gap="500">
        <section className={styles.settingsSplitCard}><div><h2>Products</h2><p>Sync products used by shipping rules.</p></div><div className={styles.syncSetting}><Text as="p" tone="subdued">Last synced {productsDate}</Text><Button onClick={handleSyncProducts} disabled={isSyncingProducts}>{isSyncingProducts ? <Spinner size="small" /> : "Sync products"}</Button></div></section>
        <section className={styles.settingsSplitCard}><div><h2>Shipping zones</h2><p>Keep your store's shipping regions up to date.</p></div><div className={styles.syncSetting}><Text as="p" tone="subdued">Last synced {zonesDate}</Text><Button onClick={handleSyncZones} disabled={isSyncingZones}>{isSyncingZones ? <Spinner size="small" /> : "Sync zones"}</Button></div></section>
        <section className={styles.settingsSplitCard}><div><h2>Automatic product sync</h2><p>Automatically sync new products with ShipFlux.</p></div><Toggle checked={autoProductSync} onChange={setAutoProductSync} label="Automatic product sync" /></section>
      </BlockStack>}

      {activeTab === "blending" && <BlockStack gap="500">
        <section className={styles.settingsSectionCard}><h2>Basic blending</h2><p>Choose how you want to blend rates with the same name.</p><Select label="Blend rates" options={[{ label: "Add rates", value: "add" }, { label: "Show the lowest rate only", value: "lowest" }, { label: "Show the highest rate only", value: "highest" }]} value={blendMode} onChange={setBlendMode} /><div className={styles.inlineSetting}><Text as="p">Set limits while adding rates</Text><Toggle checked={limitRatesToggle} onChange={setLimitRatesToggle} label="Set limits while adding rates" /></div>{limitRatesToggle && <BlockStack gap="200">{rateRows.map((row, index) => <InlineStack gap="200" blockAlign="end" key={index} wrap={false}><div style={{ flex: 1 }}><TextField label="Rate name" labelHidden placeholder="Rate name" value={row.name} onChange={(v) => updateRow(index, "name", v)} autoComplete="off" /></div><div style={{ flex: 1 }}><TextField label="Max limit" labelHidden placeholder="Max limit" value={row.max} onChange={(v) => updateRow(index, "max", v)} autoComplete="off" /></div><div style={{ flex: 1 }}><TextField label="Min limit" labelHidden placeholder="Min limit" value={row.min} onChange={(v) => updateRow(index, "min", v)} autoComplete="off" /></div><Button icon={DeleteIcon} tone="critical" onClick={() => removeRow(index)} /></InlineStack>)}<Button icon={PlusIcon} onClick={addRow}>Add limit</Button></BlockStack>}</section>
        <section className={styles.settingsSectionCard}><h2>Advanced blending</h2><p>Blend rates with different names based on tags.</p>{advancedRules.length === 0 ? <Banner tone="info">No advanced blending rules created yet.</Banner> : <BlockStack gap="200">{advancedRules.map((rule) => <Card key={rule.id} background="bg-surface-secondary"><InlineStack align="space-between" blockAlign="center"><BlockStack gap="050"><Text as="p" variant="headingSm">{rule.rateName || rule.tags}</Text><Text as="p" tone="subdued">{blendTypeLabels[rule.blendType]} · Tags: {rule.tags}{rule.max ? ` · Max: ${rule.max}` : ""}{rule.min ? ` · Min: ${rule.min}` : ""}</Text></BlockStack><Button icon={DeleteIcon} tone="critical" onClick={() => removeAdvancedRule(rule.id)} /></InlineStack></Card>)}</BlockStack>}<Box paddingBlockStart="300"><Button icon={PlusIcon} onClick={openBlendModal}>Add advanced rule</Button></Box></section>
      </BlockStack>}

      {activeTab === "transfer" && <BlockStack gap="500">
        <section className={styles.settingsSplitCard}><div><h2>Store transfer key</h2><p>Use this key to securely copy ShipFlux configuration to another store.</p></div><div className={styles.transferKey}><div className={styles.secretRow}><TextField label="Store transfer key" labelHidden value={secretVisible ? apiSecret : "••••••••••••••••••••••••"} readOnly autoComplete="off" /><Button icon={secretVisible ? HideIcon : ViewIcon} onClick={() => setSecretVisible((visible) => !visible)} /><Button icon={ClipboardIcon} onClick={copySecret} /></div><Text as="p" tone="subdued">{copied ? "Transfer key copied." : "Keep this key private."}</Text><Button tone="critical" onClick={() => fetcher.submit({ intent: "regenerateSecret" }, { method: "post" })}>Regenerate key</Button></div></section>
        <section className={styles.settingsSplitCard}><div><h2>Store cloning</h2><p>Clone ShipFlux configuration between stores.</p></div><Button variant="primary" onClick={() => navigate("/app/clone-setup")}>Clone another store</Button></section>
      </BlockStack>}

      <Modal open={isModalOpen} onClose={closeBlendModal} title="Add blending rule" primaryAction={{ content: "Done", onAction: saveBlendingRule, disabled: !canSaveBlendingRule }} secondaryActions={[{ content: "Cancel", onAction: closeBlendModal }]}>
        <Modal.Section><BlockStack gap="400"><FormLayout><Select label="Blend type" options={[{ label: "Add", value: "add" }, { label: "Lowest", value: "lowest" }, { label: "Highest", value: "highest" }]} value={modalBlendType} onChange={setModalBlendType} /><TextField label="Tags" helpText="Comma separated values are allowed." value={blendTags} onChange={setBlendTags} autoComplete="off" /><TextField label="Maximum" value={blendMax} onChange={setBlendMax} autoComplete="off" /><TextField label="Minimum" value={blendMin} onChange={setBlendMin} autoComplete="off" /></FormLayout>{modalBlendType === "add" && <><Divider /><FormLayout><TextField label="Rate name" value={rateName} onChange={setRateName} autoComplete="off" /><TextField label="Description" value={rateDescription} onChange={setRateDescription} autoComplete="off" /></FormLayout></>}</BlockStack></Modal.Section>
      </Modal>
    </div>
  );
}
