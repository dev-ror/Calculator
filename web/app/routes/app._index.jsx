import { useLoaderData, useNavigate } from "react-router";
import PropTypes from "prop-types";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../backend.server";
import prisma from "../db.server";
import styles from "../app.module.css";

function StatIcon({ type }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "rates" && (
        <>
          <path d="M4 11.5V5a1 1 0 0 1 1-1h6.5L20 12.5 12.5 20 4 11.5Z" />
          <circle cx="8.5" cy="8.5" r="1.25" />
        </>
      )}
      {type === "customizations" && (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="11" cy="17" r="2" />
        </>
      )}
      {type === "zones" && (
        <>
          <path d="M12 21s7-6.1 7-11A7 7 0 1 0 5 10c0 4.9 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.25" />
        </>
      )}
    </svg>
  );
}

StatIcon.propTypes = {
  type: PropTypes.oneOf(["rates", "customizations", "zones"]).isRequired,
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const [rates, customizations, zones, settings] = await Promise.all([
    prisma.rateRule.count({ where: { shopId: shop.id } }),
    prisma.customization.count({ where: { shopId: shop.id } }),
    prisma.zone.count({ where: { shopId: shop.id } }),
    prisma.shopConfiguration.findUnique({ where: { shopId: shop.id } }),
  ]);

  const checks = [
    { label: "Sync shipping zones", complete: Boolean(settings?.zonesLastSyncedAt || zones > 0), href: "/app/settings" },
    { label: "Sync products", complete: Boolean(settings?.productsLastSyncedAt), href: "/app/settings" },
    { label: "Test mode enabled", complete: !settings?.shippingRatesEnabled, href: "/app/settings" },
    { label: "Create your first rule", complete: rates > 0, href: "/app/rates/new" },
  ];

  return { rates, customizations, zones, checks };
};

export default function Index() {
  const navigate = useNavigate();
  const { rates, customizations, zones, checks } = useLoaderData();
  const completed = checks.filter((check) => check.complete).length;

  return (
    <s-page inlineSize="large">
      <div className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <h1>Overview</h1>
          <p>Manage your shipping rates and checkout customizations with ShipFlux.</p>
        </header>

        <div className={styles.dashboardHeroGrid}>
          <section className={styles.setupCard}>
            <div className={styles.setupCopy}>
              <h2>Set up your store</h2>
              <p>Get ShipFlux ready in a few quick steps.</p>
              <div className={styles.progressRing} style={{ "--progress": `${(completed / checks.length) * 360}deg` }}>
                <span>{completed}/{checks.length}</span>
              </div>
            </div>
            <div className={styles.checkList}>
              {checks.map((check) => (
                <button key={check.label} className={styles.checkItem} onClick={() => navigate(check.href)}>
                  <span className={`${styles.checkIcon} ${check.complete ? styles.checkComplete : ""}`}>{check.complete ? "✓" : ""}</span>
                  <span>{check.label}</span>
                </button>
              ))}
            </div>
          </section>

          <button className={styles.createHero} onClick={() => navigate("/app/rates/new")}>
            <span>
              <strong>Start creating your<br />shipping rules</strong>
              <small>Set custom rates or control which<br />shipping methods customers see.</small>
            </span>
            <span className={styles.heroMark} aria-hidden="true">»</span>
          </button>
        </div>

        <div className={styles.statGrid}>
          <button className={styles.statCard} onClick={() => navigate("/app/rates")}>
            <span className={styles.statIcon} aria-hidden="true"><StatIcon type="rates" /></span>
            <span className={styles.statContent}><strong>Shipping Rates</strong><b>{rates}</b><small>rules created</small></span>
            <i className={styles.statArrow} aria-hidden="true">›</i>
          </button>
          <button className={styles.statCard} onClick={() => navigate("/app/customizations")}>
            <span className={styles.statIcon} aria-hidden="true"><StatIcon type="customizations" /></span>
            <span className={styles.statContent}><strong>Customizations</strong><b>{customizations}</b><small>rules created</small></span>
            <i className={styles.statArrow} aria-hidden="true">›</i>
          </button>
          <button className={styles.statCard} onClick={() => navigate("/app/zones")}>
            <span className={styles.statIcon} aria-hidden="true"><StatIcon type="zones" /></span>
            <span className={styles.statContent}><strong>Shipping Zones</strong><b>{zones}</b><small>zones synced</small></span>
            <i className={styles.statArrow} aria-hidden="true">›</i>
          </button>
        </div>

        <section className={styles.quickActions}>
          <h2>Quick actions</h2>
          <div>
            <button className={styles.primaryAction} onClick={() => navigate("/app/rates/new")}><span>＋</span>Create shipping rate</button>
            <button className={styles.secondaryAction} onClick={() => navigate("/app/customizations/new")}><span>＋</span>Create customization</button>
          </div>
        </section>
      </div>
    </s-page>
  );
}
