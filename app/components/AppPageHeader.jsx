import { useNavigate } from "react-router";
import styles from "../app.module.css";

// The project uses JSX files without a runtime prop-types dependency.
// eslint-disable-next-line react/prop-types
export default function AppPageHeader({ title }) {
  const navigate = useNavigate();
  return (
    <div className={styles.appPageHeader}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label={`Go back from ${title}`}
      >
        ←
      </button>
      <h1>{title}</h1>
    </div>
  );
}
