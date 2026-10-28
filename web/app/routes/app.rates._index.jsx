import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Card,
  EmptyState,
  Banner,
  List,
  Link,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Badge,
  Icon,
  IndexTable,
  Modal,
  useIndexResourceState,
} from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { deleteRate, loadRateData, updateRate } from "../backend.server";

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
  const { admin, session } = await authenticate.admin(request);

  try {
    const payload = await actionPayload(request);
    const intent = requiredString(payload.intent, "intent");

    if (intent === "update") {
      const id = requiredString(payload.id, "id");
      const rate = await updateRate(session.shop, id, payload.data, admin);
      return Response.json({ ok: true, rate });
    }

    if (intent === "delete") {
      const ids = Array.isArray(payload.ids) && payload.ids.length
        ? payload.ids.map((id) => requiredString(id, "id"))
        : [requiredString(payload.id, "id")];

      await Promise.all(ids.map((id) => deleteRate(session.shop, id)));
      return Response.json({ ok: true, ids });
    }

    return Response.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError || error instanceof SyntaxError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (error?.code === "P2002") {
      return Response.json(
        { ok: false, error: "Priority is already used by another shipping rate rule." },
        { status: 400 },
      );
    }

    return Response.json({ ok: false, error: "Unable to update rate" }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    return await loadRateData(session.shop, admin);
  } catch {
    throw new Response("Unable to load rate data", { status: 500 });
  }
};

function titleCase(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—";
}

function conditionField(condition) {
  if (["Cart Contains", "Cart Does Not Contain"].includes(condition.field)) {
    return condition.subfield || condition.field;
  }

  return condition.field;
}

function conditionSummary(condition) {
  return [conditionField(condition), condition.operator, condition.value]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .join(" ");
}

export default function RatesIndex() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { rates, carrierService, settings } = useLoaderData();
  const [pendingDelete, setPendingDelete] = useState([]);
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(rates);
  const addRule = () => navigate("/app/rates/new");

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      shopify.toast.show(
        fetcher.data.ids?.length > 1
          ? "Shipping rate rules deleted"
          : "Shipping rate rule deleted",
      );
      setPendingDelete([]);
      clearSelection();
      return;
    }

    shopify.toast.show(fetcher.data.error || "Unable to delete rate rule", {
      isError: true,
    });
  }, [clearSelection, fetcher.data, shopify]);

  const confirmDelete = () => {
    if (!pendingDelete.length) return;
    fetcher.submit(
      { intent: "delete", ids: pendingDelete.map((rate) => rate.id) },
      { method: "post", encType: "application/json" },
    );
  };

  const deleteSelectedRates = () => {
    const selectedRates = allResourcesSelected
      ? rates
      : rates.filter((rate) => selectedResources.includes(rate.id));
    setPendingDelete(selectedRates);
  };

  return (
    <Page
      title="Shipping Rates"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      primaryAction={{
        content: "Add Rule",
        onAction: addRule,
      }}
    >
      <BlockStack gap="400">
        {(!settings?.shippingRatesEnabled ||
          !["PRO", "PRO_PLUS"].includes(String(settings?.plan ?? "SANDBOX").toUpperCase())) && (
          <Banner title="App is running in test mode" tone="warning">
            <List>
              <List.Item>
                Enter the first name as <Text as="span" fontWeight="semibold">shipflux</Text>{" "}
                on the checkout page to see your shipping rates in action.
              </List.Item>
              <List.Item>
                To go live, enable Shipping Rates on the Settings page with a Pro or Pro+ plan.
              </List.Item>
            </List>
          </Banner>
        )}
   
        {!carrierService?.available && (
          <Banner
            title="CCS is not enabled for your store."
            tone="critical"
          >
            <List>
              <List.Item>
                CCS is required to show shipping rates from all shipping rate apps in Shopify.
              </List.Item>
              <List.Item>
                Click{" "}
                <Link
                  url="https://help.shopify.com/en/manual/shipping/setting-up-and-managing-your-shipping/enabling-shipping-carriers"
                  external
                >
                  here
                </Link>{" "}
                to know more about CCS and how to enable it.
              </List.Item>
            </List>
          </Banner>
        )}



        <Card padding="0">
          {rates.length > 0 ? (
            <IndexTable
              resourceName={{ singular: "rate rule", plural: "rate rules" }}
              itemCount={rates.length}
              selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              promotedBulkActions={[
                {
                  content: "Delete",
                  destructive: true,
                  onAction: deleteSelectedRates,
                },
              ]}
              headings={[
                { title: "Name" },
                { title: "Status" },
                { title: "Priority" },
                { title: "Condition" },
              ]}
            >
              {rates.map((rate, index) => (
                <IndexTable.Row
                  id={rate.id}
                  key={rate.id}
                  position={index}
                  selected={selectedResources.includes(rate.id)}
                  accessibilityLabel={`Edit ${rate.name}`}
                  onClick={() => navigate(`/app/rates/new?id=${rate.id}`)}
                >
                  <IndexTable.Cell>
                    <Text as="span" fontWeight="semibold">
                      {rate.name}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack gap="100" blockAlign="center" wrap={false}>
                      <Badge tone={rate.status === "ACTIVE" ? "success" : undefined}>
                        {titleCase(rate.status)}
                      </Badge>
                      {rate.schedules?.length > 0 && (
                        <Box
                          background="bg-fill-caution-secondary"
                          borderRadius="full"
                          minWidth="32px"
                          paddingBlock="050"
                          paddingInline="100"
                        >
                          <InlineStack align="center" blockAlign="center">
                            <Icon
                              source={ClockIcon}
                              tone="caution"
                              accessibilityLabel="Scheduled"
                            />
                          </InlineStack>
                        </Box>
                      )}
                    </InlineStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{rate.priority}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <BlockStack gap="050">
                      <Text as="span">
                        Match{" "}
                        <Text as="span" fontWeight="semibold">
                          {String(rate.matchMode || "ALL").toUpperCase() === "ALL" ? "All" : "Any"}
                        </Text>{" "}
                        conditions
                      </Text>
                      {rate.conditions?.length ? (
                        rate.conditions.map((condition) => (
                          <Text as="span" key={condition.id}>
                            {conditionSummary(condition)}
                          </Text>
                        ))
                      ) : (
                        <Text as="span" tone="subdued">
                          No conditions
                        </Text>
                      )}
                    </BlockStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          ) : (
            <EmptyState
              heading="You haven't created any rules yet."
              action={{
                content: "Add Rule",
                onAction: addRule,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            />
          )}
        </Card>

        {/* Footer Help Links */}
        {/* <Box paddingBlockEnd="400">
          <InlineStack align="center" gap="100">
            <Text as="span" variant="bodyMd">
              <Link url="#learn">Learn</Link> more about Shipping Rates |{" "}
              <Link url="#troubleshoot">Troubleshoot</Link> Shipping Rates
            </Text>
          </InlineStack>
        </Box> */}
      </BlockStack>

      <Modal
        open={pendingDelete.length > 0}
        onClose={() => setPendingDelete([])}
        title={pendingDelete.length > 1 ? "Delete rate rules?" : "Delete rate rule?"}
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
              ? `This will permanently delete ${pendingDelete.length} rate rules.`
              : `This will permanently delete ${pendingDelete[0]?.name || "this rate rule"}.`}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
