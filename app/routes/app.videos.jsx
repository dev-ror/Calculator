import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";
const videos = [
  ["Create your first shipping rate", "4:12"],
  ["Set up cart-value conditions", "6:08"],
  ["Rename and reorder methods", "3:45"],
  ["Handle multiple shipping origins", "7:21"],
];
export default function Videos() {
  return (
    <s-page inlineSize="large">
      <AppPageHeader title="Example Setup Videos" />
      <div className={styles.pageContent}>
        <s-section heading="Learn ShipMagic">
          <s-paragraph>
            Short walkthroughs using example stores and common shipping
            scenarios.
          </s-paragraph>
          <div className={styles.videoGrid}>
            {videos.map(([name, time]) => (
              <div className={styles.video} key={name}>
                <div className={styles.videoThumb}>▶</div>
                <div className={styles.videoBody}>
                  <s-heading>{name}</s-heading>
                  <p className={styles.muted}>{time} · Beginner</p>
                  <s-button
                    onClick={() =>
                      window.shopify?.toast?.show("Opening example video")
                    }
                  >
                    Watch video
                  </s-button>
                </div>
              </div>
            ))}
          </div>
        </s-section>
      </div>
    </s-page>
  );
}
