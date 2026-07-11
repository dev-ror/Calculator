import { useState } from "react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";
const seed = [
  { name: "Move free shipping to top", type: "Reorder", status: true },
  { name: "Rename Economy to Standard", type: "Rename", status: true },
  { name: "Hide express for PO boxes", type: "Hide", status: false },
];
export default function Customizations() {
  const [items, setItems] = useState(seed);
  return (
    <s-page inlineSize="large">
      <AppPageHeader title="Shipping Customizations" />
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() =>
          setItems([
            ...items,
            {
              name: `New customization ${items.length + 1}`,
              type: "Reorder",
              status: false,
            },
          ])
        }
      >
        Create customization
      </s-button>
      <div className={styles.pageContent}>
        <s-section heading="Delivery option rules">
          <s-paragraph>
            Rename, hide, and reorder the delivery methods shown during
            checkout.
          </s-paragraph>
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Name</s-table-header>
              <s-table-header>Type</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {items.map((x, i) => (
                <s-table-row key={x.name}>
                  <s-table-cell>{x.name}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone="info">{x.type}</s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-switch
                      label={x.status ? "Active" : "Inactive"}
                      checked={x.status}
                      onChange={() =>
                        setItems(
                          items.map((v, j) =>
                            j === i ? { ...v, status: !v.status } : v,
                          ),
                        )
                      }
                    ></s-switch>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      </div>
    </s-page>
  );
}
