import { useState } from "react";
import { Page, Card, TextField, Text, BlockStack, Checkbox, Banner } from "@shopify/polaris";
import { useNavigate, useNavigation, useSubmit } from "react-router";
import RegionPicker from "./RegionPicker";

export default function ZoneForm({ zone, taken, rowHolder, error, isNew }) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [name, setName] = useState(zone.name);
  const [isRow, setIsRow] = useState(zone.isRestOfWorld);
  const [regions, setRegions] = useState(zone.regions || {});

  const rowLocked = !!rowHolder; // dusre zone ke paas ROW hai
  const saving = navigation.state === "submitting";

  const save = () =>
    submit(
      {
        intent: "save",
        name,
        isRestOfWorld: String(isRow),
        regions: JSON.stringify(isRow ? {} : regions),
      },
      { method: "post" }
    );

  const remove = () => {
    if (confirm(`Delete zone "${zone.name}"?`)) {
      submit({ intent: "delete" }, { method: "post" });
    }
  };

  return (
    <Page
      title={isNew ? "Add zone" : zone.name}
      backAction={{ content: "Zones", onAction: () => navigate("/app/zones") }}
      primaryAction={{ content: "Save", onAction: save, loading: saving }}
      secondaryActions={
        isNew ? [] : [{ content: "Delete zone", destructive: true, onAction: remove }]
      }
    >
      <BlockStack gap="500">
        {error && <Banner tone="critical">{error}</Banner>}

        <Card>
          <TextField
            label="Zone name"
            value={name}
            onChange={setName}
            autoComplete="off"
            helpText="Shown on your shipping rate rules. Customers don't see zone names."
          />
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingSm">Regions</Text>

            <Checkbox
              label="Rest of world"
              checked={isRow}
              disabled={rowLocked}
              onChange={setIsRow}
              helpText={
                rowLocked
                  ? `"${rowHolder.name}" is already your Rest of world zone.`
                  : "Covers every country and province that isn't in another zone."
              }
            />

            {!isRow && (
              <RegionPicker value={regions} onChange={setRegions} taken={taken} />
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}