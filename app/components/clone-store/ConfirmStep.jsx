import { BlockStack, Text } from "@shopify/polaris";

export default function ConfirmStep() {
  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Confirm
      </Text>

      <Text tone="subdued">
        Review all selected options before cloning.
      </Text>
    </BlockStack>
  );
}