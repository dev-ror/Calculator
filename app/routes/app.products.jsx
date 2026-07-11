import { useState } from "react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";
const data = [
  {
    name: "Classic T-shirt",
    sku: "TS-001",
    weight: "0.25 kg",
    group: "Apparel",
  },
  { name: "Leather backpack", sku: "BG-204", weight: "1.2 kg", group: "Bags" },
  { name: "Ceramic mug", sku: "MG-110", weight: "0.45 kg", group: "Home" },
  { name: "Running shoes", sku: "SH-090", weight: "0.8 kg", group: "Footwear" },
];
export default function Products() {
  const [q, setQ] = useState("");
  const shown = data.filter((x) =>
    `${x.name} ${x.sku}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <s-page inlineSize="large">
      <AppPageHeader title="Products" />
      <div className={styles.pageContent}>
        <s-section heading="Shipping product data">
          <div className={styles.toolbar}>
            <s-search-field
              label="Search products"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search by product or SKU"
              value={q}
              onInput={(e) => setQ(e.currentTarget.value)}
            ></s-search-field>
            <s-button
              onClick={() => window.shopify?.toast?.show("Products synced")}
            >
              Sync products
            </s-button>
          </div>
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header>SKU</s-table-header>
              <s-table-header>Weight</s-table-header>
              <s-table-header>Shipping group</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {shown.map((x) => (
                <s-table-row key={x.sku}>
                  <s-table-cell>{x.name}</s-table-cell>
                  <s-table-cell>{x.sku}</s-table-cell>
                  <s-table-cell>{x.weight}</s-table-cell>
                  <s-table-cell>{x.group}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
          {!shown.length && (
            <div className={styles.empty}>No matching products found.</div>
          )}
        </s-section>
      </div>
    </s-page>
  );
}
