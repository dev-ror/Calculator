import PropTypes from "prop-types";
import styles from "../app.module.css";

export default function CustomizationSidebar({
  status,
  setStatus,
  shipmentScope,
  setShipmentScope,
}) {
  return (
    <aside className={styles.ruleAside}>
      <section className={styles.ruleCard}>
        <h2>Status</h2>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>Active</option>
          <option>Draft</option>
        </select>
      </section>
      <section className={styles.ruleCard}>
        <h2>Advanced</h2>
        <p>Apply rule to:</p>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="shipment-scope"
            checked={shipmentScope === "all"}
            onChange={() => setShipmentScope("all")}
          />
          All shipments
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="shipment-scope"
            checked={shipmentScope === "first"}
            onChange={() => setShipmentScope("first")}
          />
          Only the first shipment
        </label>
        <p className={styles.customizationAsideHelp}>
          Select this if you sell subscriptions and want the rule to apply only
          to the first shipment&apos;s shipping method.
        </p>
      </section>
    </aside>
  );
}

CustomizationSidebar.propTypes = {
  status: PropTypes.string.isRequired,
  setStatus: PropTypes.func.isRequired,
  shipmentScope: PropTypes.string.isRequired,
  setShipmentScope: PropTypes.func.isRequired,
};
