import { BlockStack, Text } from "@shopify/polaris";

export default function SelectConfigurationStep() {
  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Select Configuration
      </Text>

      <Text tone="subdued">
        Choose which settings should be copied.
      </Text>
    </BlockStack>
  );
}