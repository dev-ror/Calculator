import PropTypes from "prop-types";
import styles from "../app.module.css";
import DeleteIcon from "./DeleteIcon";

export default function CustomizationActionCard({
  actionLabel,
  methods,
  setMethods,
}) {
  return (
    <section className={styles.ruleCard}>
      <h2>Action</h2>
      <p className={styles.customizationActionLabel}>
        {actionLabel} <span aria-hidden="true">ⓘ</span>
      </p>
      {methods.map((method, index) => (
        <div className={styles.customizationMethodRow} key={index}>
          <input
            value={method}
            onChange={(event) =>
              setMethods(
                methods.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
            placeholder="e.g. Express Shipping"
          />
          <button
            type="button"
            aria-label={`Delete shipping method ${index + 1}`}
            onClick={() =>
              setMethods(methods.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            <DeleteIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.outlineButton}
        onClick={() => setMethods([...methods, ""])}
      >
        ＋ Add another method
      </button>
    </section>
  );
}

CustomizationActionCard.propTypes = {
  actionLabel: PropTypes.string.isRequired,
  methods: PropTypes.arrayOf(PropTypes.string).isRequired,
  setMethods: PropTypes.func.isRequired,
};
