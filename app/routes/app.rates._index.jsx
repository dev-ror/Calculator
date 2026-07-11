import { useNavigate } from "react-router";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";

export default function RatesIndex() {
  const navigate = useNavigate();
  const addRule = () => navigate("/app/rates/new");

  return (
    <s-page inlineSize="large">
      <div className={styles.rateTitleRow}>
        <AppPageHeader title="Shipping Rates" />
        <button className={styles.darkButton} type="button" onClick={addRule}>
          Add Rule
        </button>
      </div>
      <div className={styles.ratesPage}>
        <div className={styles.ratesEmptyCard}>
          <div className={styles.ccsWarning}>
            <span className={styles.warningIcon}>◇</span>
            <div>
              <strong>CCS is not enabled for your store.</strong>
              <ul>
                <li>
                  CCS is required to show shipping rates from all shipping rate
                  apps in Shopify.
                </li>
                <li>
                  Click{" "}
                  <a
                    href="https://help.shopify.com/en/manual/shipping/setting-up-and-managing-your-shipping/enabling-shipping-carriers"
                    target="_blank"
                    rel="noreferrer"
                  >
                    here
                  </a>{" "}
                  to know more about CCS and how to enable it.
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.rulesEmptyState}>
            <div className={styles.emptyDocument} aria-hidden="true">
              <span></span>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <strong>You haven&apos;t created any rules yet.</strong>
            <button
              className={styles.darkButton}
              type="button"
              onClick={addRule}
            >
              Add Rule
            </button>
          </div>
        </div>
        <p className={styles.ratesHelp}>
          <a href="#learn">Learn</a> more about Shipping Rates |{" "}
          <a href="#troubleshoot">Troubleshoot</a> Shipping Rates
        </p>
      </div>
    </s-page>
  );
}
