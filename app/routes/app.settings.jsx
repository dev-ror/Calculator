import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";
export default function Settings() {
  const shopify = useAppBridge();
  const [enabled, setEnabled] = useState(true);
  return (
    <s-page inlineSize="large">
      <AppPageHeader title="Settings" />
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => shopify.toast.show("Settings saved")}
      >
        Save
      </s-button>
      <div className={styles.pageContent}>
        <s-section heading="General settings">
          <div className={styles.formGrid}>
            <s-text-field
              label="App display name"
              value="ShipMagic"
            ></s-text-field>
            <s-email-field
              label="Support email"
              value="support@shipmagic.app"
            ></s-email-field>
            <s-select label="Default currency" value="USD">
              <s-option value="USD">USD — US Dollar</s-option>
              <s-option value="GBP">GBP — British Pound</s-option>
              <s-option value="EUR">EUR — Euro</s-option>
            </s-select>
            <s-select label="Weight unit" value="kg">
              <s-option value="kg">Kilograms</s-option>
              <s-option value="lb">Pounds</s-option>
            </s-select>
          </div>
        </s-section>
        <s-section heading="Checkout">
          <s-switch
            label="Enable ShipMagic rates at checkout"
            checked={enabled}
            onChange={() => setEnabled(!enabled)}
          ></s-switch>
          <s-paragraph tone="neutral">
            When disabled, none of this app’s shipping rules will be applied.
          </s-paragraph>
        </s-section>
      </div>
    </s-page>
  );
}
