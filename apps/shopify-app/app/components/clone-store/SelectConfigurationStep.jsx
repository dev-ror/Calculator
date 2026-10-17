import { BlockStack, Checkbox, Text } from "@shopify/polaris";

export default function SelectConfigurationStep({ selectedConfigurations, setSelectedConfigurations }) {
  const toggle = (value, checked) => setSelectedConfigurations(
    checked
      ? [...new Set([...selectedConfigurations, value])]
      : selectedConfigurations.filter((item) => item !== value),
  );
  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Select Configuration
      </Text>

      <Text tone="subdued">
        Choose which settings should be copied.
      </Text>
      <Checkbox label="Shipping rates" checked={selectedConfigurations.includes("rates")} onChange={(checked) => toggle("rates", checked)} />
      <Checkbox label="Shipping customizations" checked={selectedConfigurations.includes("customizations")} onChange={(checked) => toggle("customizations", checked)} />
      <Checkbox label="Settings" checked={selectedConfigurations.includes("settings")} onChange={(checked) => toggle("settings", checked)} />
    </BlockStack>
  );
}
