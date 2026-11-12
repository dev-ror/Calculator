import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import {
  Page,
  Card,
  Banner,
  List,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Link,
  Badge,
  Icon,
  IndexTable,
  Modal,
  useIndexResourceState,
} from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";
import { getCustomizationTypeLabel } from "../constants/shippingCustomizations";
import { authenticate } from "../shopify.server";
import {
  deleteCustomization,
  loadCustomizations,
  updateCustomization,
} from "../backend.server";

async function actionPayload(request) {
  if (request.headers.get("content-type")?.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  const data = formData.get("data");

  return {
    intent: formData.get("intent"),
    id: formData.get("id"),
    ids: formData.getAll("ids"),
    data: typeof data === "string" && data ? JSON.parse(data) : undefined,
  };
}

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }

  return value.trim();
}

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  try {
    const payload = await actionPayload(request);
    const intent = requiredString(payload.intent, "intent");

    if (intent === "update") {
      const id = requiredString(payload.id, "id");
      const customization = await updateCustomization(session.shop, id, payload.data);
      return Response.json({ ok: true, customization });
    }

    if (intent === "delete") {
      const ids = Array.isArray(payload.ids) && payload.ids.length
        ? payload.ids.map((id) => requiredString(id, "id"))
        : [requiredString(payload.id, "id")];

      await Promise.all(ids.map((id) => deleteCustomization(session.shop, id)));
      return Response.json({ ok: true, ids });
    }

    return Response.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError || error instanceof SyntaxError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json(
      { ok: false, error: "Unable to update customization" },
      { status: 500 },
    );
  }
};

function titleCase(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—";
}

function conditionSummary(condition) {
  return [condition.field, condition.operator, condition.value]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .join(" ");
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  try {
    return { customizations: await loadCustomizations(session.shop) };
  } catch {
    throw new Response("Unable to load customizations", { status: 500 });
  }
};

export default function CustomizationsIndex() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { customizations } = useLoaderData();
  const [pendingDelete, setPendingDelete] = useState([]);
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(customizations);
  const createCustomization = () => navigate("/app/customizations/new");

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      shopify.toast.show(
        fetcher.data.ids?.length > 1
          ? "Shipping customizations deleted"
          : "Shipping customization deleted",
      );
      setPendingDelete([]);
      clearSelection();
      return;
    }

    shopify.toast.show(fetcher.data.error || "Unable to delete customization", {
      isError: true,
    });
  }, [clearSelection, fetcher.data, shopify]);

  const confirmDelete = () => {
    if (!pendingDelete.length) return;
    fetcher.submit(
      { intent: "delete", ids: pendingDelete.map((customization) => customization.id) },
      { method: "post", encType: "application/json" },
    );
  };

  const deleteSelectedCustomizations = () => {
    const selectedCustomizations = allResourcesSelected
      ? customizations
      : customizations.filter((customization) =>
        selectedResources.includes(customization.id),
      );
    setPendingDelete(selectedCustomizations);
  };

  return (
    <Page
      title="Shipping Customizations"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      primaryAction={{
        content: "Create Customization",
        onAction: createCustomization,
      }}
    >
      <BlockStack gap="400">
        {customizations.length > 0 && (
          <Banner tone="warning" title="App is running in test mode">
            <List>
              <List.Item>
                Enter the first name as <Text as="span" fontWeight="semibold">shipflux</Text>{" "}
                on the checkout page to see the customizations in action.
              </List.Item>
              <List.Item>
                To go in live mode, enable the{" "}
                <Link url="/app/settings">Shipping Customizations</Link> toggle on the
                settings page.
              </List.Item>
            </List>
          </Banner>
        )}

        <Card padding="0">
          {customizations.length > 0 ? (
            <IndexTable
              resourceName={{ singular: "customization", plural: "customizations" }}
              itemCount={customizations.length}
              selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              promotedBulkActions={[
                {
                  content: "Delete",
                  destructive: true,
                  onAction: deleteSelectedCustomizations,
                },
              ]}
              headings={[
                { title: "Name" },
                { title: "Status" },
                { title: "Condition" },
                { title: "Action" },
              ]}
            >
              {customizations.map((customization, index) => (
                <IndexTable.Row
                  id={customization.id}
                  key={customization.id}
                  position={index}
                  selected={selectedResources.includes(customization.id)}
                  accessibilityLabel={`Edit ${customization.name}`}
                  onClick={() =>
                    navigate(`/app/customizations/new?id=${customization.id}`)
                  }
                >
                  <IndexTable.Cell>
                    <Text as="span" fontWeight="semibold">
                      {customization.name}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack gap="100" blockAlign="center" wrap={false}>
                      <Badge tone={customization.status === "ACTIVE" ? "success" : undefined}>
                        {titleCase(customization.status)}
                      </Badge>
                      {customization.schedules?.length > 0 && (
                        <Box
                          background="bg-fill-caution-secondary"
                          borderRadius="full"
                          minWidth="32px"
                          paddingBlock="050"
                          paddingInline="50"
                        >
                          <Icon
                            source={ClockIcon}
                            tone="caution"
                            accessibilityLabel="Scheduled"
                          />
                        </Box>
                      )}
                    </InlineStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <BlockStack gap="050">
                      <Text as="span">
                        Match{" "}
                        <Text as="span" fontWeight="semibold">
                          {customization.conditionMatch === "ALL" ? "All" : "Any"}
                        </Text>{" "}
                        conditions below:
                      </Text>
                      {customization.conditions?.length ? (
                        customization.conditions.map((condition, conditionIndex) => (
                          <Text as="span" key={condition.id}>
                            {conditionIndex + 1}. {conditionSummary(condition)}
                          </Text>
                        ))
                      ) : (
                        <Text as="span" tone="subdued">No conditions</Text>
                      )}
                    </BlockStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <BlockStack gap="050">
                      <Text as="span">{getCustomizationTypeLabel(customization.type)}</Text>
                      {customization.methods.map((method, methodIndex) => (
                        <Text as="span" key={method.id}>
                          {methodIndex + 1}. {method.value}
                        </Text>
                      ))}
                    </BlockStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          ) : (
            <div className={styles.customizationsEmptyState}>
              <svg
                className={styles.customizationsEmptyIllustration}
                viewBox="0 0 420 220"
                role="img"
                aria-label="Shipping methods customization illustration"
              >
                <circle cx="210" cy="111" r="94" fill="#fff0f2" />
                <rect
                  x="88"
                  y="27"
                  width="244"
                  height="169"
                  rx="18"
                  fill="#ffffff"
                  stroke="#d9dde5"
                  strokeWidth="4"
                />
                <circle cx="108" cy="48" r="5" fill="#cfd4dc" />
                <circle cx="126" cy="48" r="5" fill="#cfd4dc" />
                <circle cx="144" cy="48" r="5" fill="#cfd4dc" />
                <line x1="88" y1="67" x2="332" y2="67" stroke="#e5e7eb" strokeWidth="3" />
                <rect x="108" y="83" width="204" height="29" rx="10" fill="#f5f6f8" />
                <rect x="108" y="120" width="204" height="29" rx="10" fill="#f5f6f8" />
                <rect x="108" y="157" width="204" height="29" rx="10" fill="#f5f6f8" />
                <text x="124" y="102" fill="#3f4858" fontSize="13" fontWeight="600">Express Shipping</text>
                <text x="124" y="139" fill="#3f4858" fontSize="13" fontWeight="600">Standard Shipping</text>
                <text x="124" y="176" fill="#3f4858" fontSize="13" fontWeight="600">Free Shipping</text>
                <path d="M274 94l14 10m-14 0l14-10" stroke="#5e6674" strokeWidth="3" strokeLinecap="round" />
                <path d="M278 130h16m-16 7h16" stroke="#5e6674" strokeWidth="3" strokeLinecap="round" />
                <path d="M278 168l5 5 10-12" fill="none" stroke="#f21b35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M345 24l8-12m4 18l13-7m-7 17h14" stroke="#f21b35" strokeWidth="5" strokeLinecap="round" />
              </svg>
              <h2 className={styles.shippingRatesEmptyHeading}>No customizations yet</h2>
              <p className={`${styles.shippingRatesEmptyDescription} ${styles.customizationsEmptyDescription}`}>
                Create rules to hide, rename, or sort shipping methods at checkout.
              </p>
              <div className={styles.customizationsEmptyFeatures}>
                <div className={styles.customizationsFeatureCard}>
                  <span className={styles.customizationsFeatureIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                      <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M6.7 6.7C4.5 8 3.3 10 3 12c1.1 4 4.6 6 9 6 1.1 0 2.1-.2 3-.5M14.7 5.1c3.3.9 5.5 3.1 6.3 6.9-.2.8-.6 1.6-1.1 2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3>Hide rates</h3>
                    <p>Remove specific shipping methods from checkout.</p>
                  </div>
                </div>
                <div className={styles.customizationsFeatureCard}>
                  <span className={styles.customizationsFeatureIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                      <path d="M14 4l6 6-10 10H4v-6L14 4zM13 5l6 6M4 20l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3>Rename rates</h3>
                    <p>Change how shipping methods are displayed.</p>
                  </div>
                </div>
                <div className={styles.customizationsFeatureCard}>
                  <span className={styles.customizationsFeatureIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01M5 8V4m0 0L3 6m2-2l2 2M5 16v4m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3>Sort rates</h3>
                    <p>Control the order of shipping methods.</p>
                  </div>
                </div>
              </div>
              <button type="button" className={styles.customizationsCreateButton} onClick={createCustomization}>
                <span aria-hidden="true">+</span>
                Create customization
              </button>
            </div>
          )}
        </Card>

        {/* Footer Links */}
        {/* <Box paddingBlock="400">
          <InlineStack align="center" gap="100">
            <Text as="span" variant="bodyMd" tone="subdued">
              <Link url="#learn" removeUnderline>
                Learn more
              </Link>{" "}
              about Shipping Customizations |{" "}
              <Link url="#troubleshoot" removeUnderline>
                Troubleshoot
              </Link>{" "}
              Shipping Customizations
            </Text>
          </InlineStack>
        </Box> */}
      </BlockStack>

      <Modal
        open={pendingDelete.length > 0}
        onClose={() => setPendingDelete([])}
        title={pendingDelete.length > 1 ? "Delete customizations?" : "Delete customization?"}
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: fetcher.state !== "idle",
          onAction: confirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setPendingDelete([]) }]}
      >
        <Modal.Section>
          <Text as="p">
            {pendingDelete.length > 1
              ? `This will permanently delete ${pendingDelete.length} customizations.`
              : `This will permanently delete ${pendingDelete[0]?.name || "this customization"}.`}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
