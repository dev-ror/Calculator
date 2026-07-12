import { useNavigate } from "react-router";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";

export default function CustomizationsIndex() {
  const navigate = useNavigate();
  const createCustomization = () => navigate("/app/customizations/new");

  return (
    <s-page inlineSize="large">
      <div className={styles.rateTitleRow}>
        <AppPageHeader title="Shipping Customizations" />
        <button
          className={styles.darkButton}
          type="button"
          onClick={createCustomization}
        >
          Create Customization
        </button>
      </div>

      <div className={styles.customizationsPage}>
        <div className={styles.customizationsEmptyCard}>
          <div className={styles.customizationsEmptyState}>
            <div className={styles.emptyDocument} aria-hidden="true">
              <span></span>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <strong>You haven&apos;t created any customizations yet.</strong>
            <button
              className={styles.darkButton}
              type="button"
              onClick={createCustomization}
            >
              Create Customization
            </button>
          </div>
        </div>

        <p className={styles.ratesHelp}>
          <a href="#learn">Learn more</a> about Shipping Customizations |{" "}
          <a href="#troubleshoot">Troubleshoot</a> Shipping Customizations
        </p>
      </div>
    </s-page>
  );
}
