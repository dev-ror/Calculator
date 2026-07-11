import PropTypes from "prop-types";
import styles from "../app.module.css";

export default function RateValueField({
  label,
  required,
  value,
  onChange,
  suffix,
  help,
}) {
  return (
    <label>
      <span className={required ? styles.requiredLabel : undefined}>
        {label} {required && <b>*</b>}
      </span>
      <span className={styles.dynamicRateInput}>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={onChange}
        />
        {suffix && <i>{suffix}</i>}
      </span>
      {help && <small>{help}</small>}
    </label>
  );
}

RateValueField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  suffix: PropTypes.string,
  help: PropTypes.string,
};
