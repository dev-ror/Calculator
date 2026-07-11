import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import AppPageHeader from "../components/AppPageHeader";

const plans = [
  {
    name: "Sandbox / Test",
    description: "Try the full app in test mode. No charges.",
    monthly: 0,
    yearly: 0,
    current: true,
    features: [
      [false, "Use Shipping Rates in Live Mode"],
      [false, "Use Shipping Customizations in Live Mode"],
      [true, "Configure rules & preview behavior in test mode only"],
      [true, "Hero Support"],
    ],
  },
  {
    name: "Starter",
    description: "For Shipping Customizations only",
    monthly: 14,
    yearly: 140,
    features: [
      [false, "Use Shipping Rates in Live Mode"],
      [true, "Use Shipping Customizations in Live Mode"],
      [true, "14-day free trial"],
      [true, "Hero support"],
    ],
  },
  {
    name: "Pro",
    description: "For Shipping Rates and Shipping Customizations",
    monthly: 29,
    yearly: 290,
    features: [
      [true, "Use Shipping Rates in Live Mode"],
      [true, "Use Shipping Customizations in Live Mode"],
      [true, "14-day free trial"],
      [true, "Hero support"],
    ],
  },
];

export default function Billing() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const shopify = useAppBridge();

  return (
    <s-page inlineSize="large">
      <AppPageHeader title="Billing" />
      <div className={styles.billingPage}>
        <div
          className={styles.billingToggle}
          role="tablist"
          aria-label="Billing cycle"
        >
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "monthly"}
            className={
              billingCycle === "monthly" ? styles.activeBillingTab : ""
            }
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "yearly"}
            className={billingCycle === "yearly" ? styles.activeBillingTab : ""}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
          </button>
        </div>

        <p className={styles.yearlyOffer}>
          Get 2 months FREE when you pay yearly!
        </p>

        <div className={styles.pricingGrid}>
          {plans.map((plan) => (
            <article className={styles.pricingCard} key={plan.name}>
              <div>
                <h2>{plan.name}</h2>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.planPrice}>
                <span>${plan[billingCycle]}</span>
                <small>
                  / per {billingCycle === "monthly" ? "month" : "year"}
                </small>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map(([included, feature]) => (
                  <li key={feature}>
                    <span
                      className={included ? styles.included : styles.excluded}
                      aria-hidden="true"
                    >
                      {included ? "✓" : "×"}
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={
                  plan.current ? styles.currentPlanButton : styles.buyButton
                }
                disabled={plan.current}
                onClick={() =>
                  shopify.toast.show(
                    `${plan.name} ${billingCycle} plan selected`,
                  )
                }
              >
                {plan.current ? "Current Plan" : "Buy Now"}
              </button>
            </article>
          ))}
        </div>

        <p className={styles.planHelp}>
          Not sure which plan to choose? Click{" "}
          <a href="mailto:support@shipmagic.app">here</a>
        </p>
      </div>
    </s-page>
  );
}
