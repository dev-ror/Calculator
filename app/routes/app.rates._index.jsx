import { useNavigate } from "react-router";
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
} from "@shopify/polaris";

export default function RatesIndex() {
  const navigate = useNavigate();
  const addRule = () => navigate("/app/rates/new");

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
        <Card padding="0">
          <BlockStack>
            {/* CCS Warning Banner */}
            <Box padding="400">
              <Banner tone="critical" title="CCS is not enabled for your store.">
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
            </Box>

            {/* Empty State */}
            <EmptyState
              heading="You haven't created any rules yet."
              action={{
                content: "Add Rule",
                onAction: addRule,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            />
          </BlockStack>
        </Card>

        {/* Footer Help Links */}
        <Box paddingBlockEnd="400">
          <InlineStack align="center" gap="100">
            <Text as="span" variant="bodyMd">
              <Link url="#learn">Learn</Link> more about Shipping Rates |{" "}
              <Link url="#troubleshoot">Troubleshoot</Link> Shipping Rates
            </Text>
          </InlineStack>
        </Box>
      </BlockStack>
    </Page>
  );
}