import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../backend.server";
import prisma from "../db.server";
import styles from "../app.module.css";

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
            <span className={styles.statIcon}>⌁</span><span><strong>Shipping Rates</strong><b>{rates}</b><small>rules created</small></span><i>›</i>
          </button>
          <button className={styles.statCard} onClick={() => navigate("/app/customizations")}>
            <span className={styles.statIcon}>☷</span><span><strong>Customizations</strong><b>{customizations}</b><small>rules created</small></span><i>›</i>
          </button>
          <button className={styles.statCard} onClick={() => navigate("/app/zones")}>
            <span className={styles.statIcon}>⌖</span><span><strong>Shipping Zones</strong><b>{zones}</b><small>zones synced</small></span><i>›</i>
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
