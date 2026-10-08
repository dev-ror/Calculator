import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import styles from "../app.module.css";
import { Page } from "@shopify/polaris";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import { authenticate, BILLING_PLANS } from "../shopify.server";
import {
  billingPlanName,
  getPlan,
  invalidatePlanCache,
  isBillingTest,
} from "../billing.server";

const planNames = Object.values(BILLING_PLANS);

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  invalidatePlanCache(session.shop);
  return { currentPlan: await getPlan(billing, session) };
};

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const isTest = isBillingTest();

  try {
    if (intent === "purchase") {
      const plan = String(form.get("plan") ?? "");
      const cycle = String(form.get("cycle") ?? "monthly");
      const billingName = billingPlanName(plan, cycle);
      if (!billingName || plan === "sandbox") {
        return { error: "Select a valid plan." };
      }
      await billing.request({
        plan: billingName,
        isTest,
      });
    }

    if (intent === "cancel") {
      const { appSubscriptions } = await billing.check({
        plans: planNames,
        isTest,
      });
      const subscription = appSubscriptions.find(
        (item) => item.status === undefined || item.status === "ACTIVE",
      );
      if (subscription) {
        await billing.cancel({
          subscriptionId: subscription.id,
          isTest,
          prorate: false,
        });
      }
      invalidatePlanCache(session.shop);
      return redirect("/app/billing");
    }

    return { error: "Unsupported billing action." };
  } catch (error) {
    if (error instanceof Response) throw error;
    const billingErrors = Array.isArray(error?.errorData)
      ? error.errorData
          .map((item) => item?.message)
          .filter((message) => typeof message === "string" && message.trim())
      : [];
    const message = billingErrors[0] ?? error?.message;
    return {
      error: typeof message === "string" && message.trim()
        ? message
        : "Unable to update the Shopify subscription.",
    };
  }
};

const plans = [
  {
    key: "sandbox",
    name: "Sandbox / Test",
    description: "Try the full app in test mode. No charges.",
    monthly: 0,
    yearly: 0,
    features: [
      [false, "Use Shipping Rates in Live Mode"],
      [false, "Use Shipping Customizations in Live Mode"],
      [false, "Custom Coded Shipping Rates"],
      [true, "Configure rules & preview behavior in test mode only"],
      [true, "Hero Support"],
    ],
  },
  {
    key: "starter",
    name: "Starter",
    description: "For Shipping Customizations only",
    monthly: 14,
    yearly: 140,
    features: [
      [false, "Use Shipping Rates in Live Mode"],
      [true, "Use Shipping Customizations in Live Mode"],
      [false, "Custom Coded Shipping Rates"],
      [true, "14-day free trial"],
      [true, "Hero support"],
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "For Shipping Rates and Shipping Customizations",
    monthly: 39,
    yearly: 390,
    features: [
      [true, "Use Shipping Rates in Live Mode"],
      [true, "Use Shipping Customizations in Live Mode"],
      [false, "Custom Coded Shipping Rates"],
      [true, "14-day free trial"],
      [true, "Hero support"],
    ],
  },
  {
    key: "proplus",
    name: "Pro+",
    description: "For Shipping Rates and Shipping Customizations",
    monthly: 59,
    yearly: 590,
    features: [
      [true, "Use Shipping Rates in Live Mode"],
      [true, "Use Shipping Customizations in Live Mode"],
      [true, "Custom Coded Shipping Rates"],
      [true, "14-day free trial"],
      [true, "Hero support"],
    ],
  },
];


export default function Billing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const { currentPlan } = useLoaderData();
  const paidPlan = currentPlan !== "sandbox";

  useEffect(() => {
    if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const submitBillingAction = (intent, values = {}) =>
    fetcher.submit({ intent, ...values }, { method: "post" });

  return (
    <Page
      title="Shipping Rates"
      backAction={{ content: "Back", onAction: () => navigate(-1) }}
      fullWidth
    >
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
                  currentPlan === plan.key
                    ? styles.currentPlanButton
                    : styles.buyButton
                }
                disabled={currentPlan === plan.key || plan.key === "sandbox"}
                onClick={() => submitBillingAction("purchase", {
                  plan: plan.key,
                  cycle: billingCycle,
                })}
              >
                {currentPlan === plan.key ? "Current Plan" : "Buy Now"}
              </button>
            </article>
          ))}
        </div>

        {paidPlan && (
          <button
            type="button"
            className={styles.planHelp}
            style={{ border: 0, background: "transparent", cursor: "pointer", font: "inherit", color: "#005bd3" }}
            onClick={() => submitBillingAction("cancel")}
          >
            Cancel plan / Downgrade to Sandbox
          </button>
        )}

        <p className={styles.planHelp}>
          Not sure which plan to choose? Click{" "}
          <a href="mailto:support@shipmagic.app">here</a>
        </p>
      </div>
    </Page>
  );
}
