import { useNavigate } from "react-router";
import {
  Page,
  Card,
  EmptyState,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Link,
} from "@shopify/polaris";

export default function CustomizationsIndex() {
  const navigate = useNavigate();
  const createCustomization = () => navigate("/app/customizations/new");

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
        <Card padding="0">
          <EmptyState
            heading="You haven't created any customizations yet."
            action={{
              content: "Create Customization",
              onAction: createCustomization,
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          />
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
    </Page>
  );
}