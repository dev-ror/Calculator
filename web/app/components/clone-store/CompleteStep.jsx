import { BlockStack, Text } from "@shopify/polaris";

export default function CompleteStep() {
  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Complete
      </Text>

      <Text tone="success">
        Clone completed successfully.
      </Text>
    </BlockStack>
  );
}