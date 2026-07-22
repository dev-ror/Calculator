import { BlockStack, Text } from "@shopify/polaris";

export default function MapZonesStep() {
  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Map Shipping Zones
      </Text>

      <Text tone="subdued">
        Match destination zones with source zones.
      </Text>
    </BlockStack>
  );
}