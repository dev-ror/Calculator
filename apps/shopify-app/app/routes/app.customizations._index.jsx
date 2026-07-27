import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Card,
  EmptyState,
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
                Enter the first name as <Text as="span" fontWeight="semibold">shipmagic</Text>{" "}
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
            <EmptyState
              heading="You haven't created any customizations yet."
              action={{
                content: "Create Customization",
                onAction: createCustomization,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            />
          )}
        </Card>

        {/* Footer Links */}
        <Box paddingBlock="400">
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
        </Box>
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
