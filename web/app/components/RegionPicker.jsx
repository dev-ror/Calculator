import { useMemo, useState } from "react";
import {
  Box, Checkbox, TextField, Text, Button, InlineStack, BlockStack, Collapsible,
} from "@shopify/polaris";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { REGIONS, provinceLabel } from "../constants/regions";
import { Icon } from "@shopify/polaris";
const SearchIconWrapper = () => <Icon source={SearchIcon} />;

/**
 * value:    { US: ["CA","NY"], PK: [] }
 * onChange: (newValue) => void
 * taken:    { US: { zoneName: "Domestic", provinces: null | ["CA", ...] } }
 *           provinces === null -> entire country belongs to another zone
 */
export default function RegionPicker({ value, onChange, taken = {} }) {
const [query, setQuery] = useState("");
const [open, setOpen] = useState({});
const [initialSelected] = useState(() => new Set(Object.keys(value)));

const list = useMemo(() => {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? REGIONS.filter((r) => r.name.toLowerCase().includes(q))
    : REGIONS;

  // Selected countries upar (sirf pehli baar load par ki selection se)
  return [...filtered].sort((a, b) => {
    const aSel = initialSelected.has(a.code) ? 0 : 1;
    const bSel = initialSelected.has(b.code) ? 0 : 1;
    return aSel - bSel; // sort stable hai, baqi alphabetical rehta hai
  });
}, [query, initialSelected]);

  const takenProvinces = (code) => taken[code]?.provinces || [];
  const isCountryTaken = (code) => taken[code] && taken[code].provinces === null;

  const selectableProvinces = (r) =>
    r.provinces.map((p) => p.code).filter((c) => !takenProvinces(r.code).includes(c));

  const toggleCountry = (r) => {
  const next = { ...value };
  if (next[r.code]) {
    delete next[r.code];
  } else {
    const provs = selectableProvinces(r);
    // country mein provinces hain lekin sab dusre zone mein: select na karo
    if (r.provinces.length > 0 && provs.length === 0) return;
    next[r.code] = provs;
  }
  onChange(next);
};

  const toggleProvince = (r, pCode) => {
    const next = { ...value };
    const cur = new Set(next[r.code] || []);
    cur.has(pCode) ? cur.delete(pCode) : cur.add(pCode);
    if (cur.size === 0) delete next[r.code];
    else next[r.code] = [...cur];
    onChange(next);
  };

 const countryState = (r) => {
  const sel = value[r.code];
  if (!sel) return false;
  if (r.provinces.length === 0) return true;
  const total = selectableProvinces(r).length;
  if (total === 0) return false; // sab provinces dusre zone mein hain
  return sel.length === total ? true : "indeterminate";
};

  return (
    <div style={{ border: "1px solid var(--p-color-border)", borderRadius: "var(--p-border-radius-200)", overflow: "hidden" }}>
      <Box padding="300" borderBlockEndWidth="025" borderColor="border">
        <TextField
          label="Search countries and regions"
          labelHidden
          placeholder="Search countries and regions"
          prefix={<span style={{ display: "flex" }}><SearchIconWrapper /></span>}
          value={query}
          onChange={setQuery}
          autoComplete="off"
          clearButton
          onClearButtonClick={() => setQuery("")}
        />
      </Box>

      <div style={{ maxHeight: 440, overflowY: "auto" }}>
        {list.map((r) => {
          const disabled = isCountryTaken(r.code);
          const hasProvinces = r.provinces.length > 0;
          const selectedCount = value[r.code]?.length || 0;
          const isOpen = !!open[r.code];

          return (
            <div key={r.code} style={{ borderBottom: "1px solid var(--p-color-border-secondary)", background: disabled ? "var(--p-color-bg-surface-secondary)" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
                <Checkbox
                  label={r.name}
                  labelHidden
                  checked={countryState(r)}
                  disabled={disabled}
                  onChange={() => toggleCountry(r)}
                />
                <label
                  style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: disabled ? "default" : "pointer" }}
                  onClick={() => !disabled && toggleCountry(r)}
                >
                  <span aria-hidden style={{ fontSize: 20, width: 24 }}>{r.flag}</span>
                  <Text as="p" tone={disabled ? "subdued" : undefined}>{r.name}</Text>
                </label>

                {disabled && (
                  <Text as="p" tone="subdued">In "{taken[r.code].zoneName}"</Text>
                )}
                {!disabled && hasProvinces && (
                  <>
                    <Text as="p" tone="subdued">
                      {selectedCount} of {r.provinces.length} {provinceLabel(r.code)}
                    </Text>
                    <Button
                      variant="tertiary"
                      icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
                      accessibilityLabel={`Show ${provinceLabel(r.code)} in ${r.name}`}
                      onClick={() => setOpen((o) => ({ ...o, [r.code]: !o[r.code] }))}
                    />
                  </>
                )}
              </div>

              {hasProvinces && !disabled && (
                <Collapsible open={isOpen} id={`prov-${r.code}`}>
                  <Box paddingInlineStart="1000" paddingBlockEnd="200">
                    <BlockStack gap="100">
                      {r.provinces.map((p) => {
                        const pTaken = takenProvinces(r.code).includes(p.code);
                        return (
                          <InlineStack key={p.code} gap="200" blockAlign="center">
                            <Checkbox
                              label={p.name}
                              checked={!!value[r.code]?.includes(p.code)}
                              disabled={pTaken}
                              onChange={() => toggleProvince(r, p.code)}
                            />
                            {pTaken && (
                              <Text as="span" tone="subdued">In "{taken[r.code].zoneName}"</Text>
                            )}
                          </InlineStack>
                        );
                      })}
                    </BlockStack>
                  </Box>
                </Collapsible>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
