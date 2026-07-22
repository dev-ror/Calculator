import { BlockStack, Text, TextField } from "@shopify/polaris";

export default function EnterSecretStep({
  sourceSecret,
  setSourceSecret,
}) {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd">
          Enter Source Store Secret
        </Text>

        <Text tone="subdued">
          Enter the API secret from the source store.
          You can find it in Settings → Clone Setup.
        </Text>
      </BlockStack>

      <TextField
        label="Source Store Secret"
        value={sourceSecret}
        onChange={setSourceSecret}
        placeholder="Paste the secret here"
        autoComplete="off"
      />
    </BlockStack>
  );
}