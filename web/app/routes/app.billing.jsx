import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { BillingReplacementBehavior } from "@shopify/shopify-app-react-router/server";
import styles from "../app.module.css";
import { Page } from "@shopify/polaris";
import { Form, redirect, useActionData, useLoaderData, useNavigate, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureShop, syncFunctionConfiguration } from "../backend.server";
import {
  billingIsTest,
  billingPlanName,
  persistBillingState,
  PLAN_CODES,
  resolveBillingPlan,
} from "../plans.server";

export async function loader({ request }) {
  const { billing, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const previous = await prisma.shopConfiguration.findUnique({ where: { shopId: shop.id } });
  const state = await resolveBillingPlan(billing);
  await persistBillingState(shop.id, state);
  if (previous?.plan !== state.plan) await syncFunctionConfiguration(shop.id).catch(() => null);
  return { currentPlan: state.plan, currentCycle: state.cycle };
}

export async function action({ request }) {
  const { billing, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const formData = await request.formData();
  const plan = String(formData.get("plan") ?? "");
  const cycle = String(formData.get("cycle") ?? "");

  if (plan === PLAN_CODES.SANDBOX) {
    const state = await resolveBillingPlan(billing);
    if (state.subscriptionId) {
      await billing.cancel({
        subscriptionId: state.subscriptionId,
        prorate: true,
        isTest: billingIsTest(),
      });
    }
    await persistBillingState(shop.id, {
      plan: PLAN_CODES.SANDBOX,
      cycle: null,
      subscriptionId: null,
      status: "INACTIVE",
    });
    await syncFunctionConfiguration(shop.id).catch(() => null);
    return redirect("/app/billing");
  }

  const billingPlan = billingPlanName(plan, cycle);
  if (!billingPlan) return { error: "Invalid subscription plan." };

  return billing.request({
    plan: billingPlan,
    isTest: billingIsTest(),
    replacementBehavior: BillingReplacementBehavior.Standard,
    returnUrl: new URL("/app/billing", request.url).toString(),
  });
}

const plans = [
  {
    name: "Sandbox / Test",
    code: "SANDBOX",
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
    name: "Starter",
    code: "STARTER",
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
    name: "Pro",
    code: "PRO",
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
    name: "Pro+",
    code: "PRO_PLUS",
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
  const { currentPlan, currentCycle } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const shopify = useAppBridge();

  useEffect(() => {
    if (actionData?.error) shopify.toast.show(actionData.error, { isError: true });
  }, [actionData, shopify]);

  return (
    <Page
      title="Billing"
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
            (() => {
              const isCurrent = plan.code === currentPlan &&
                (plan.code === "SANDBOX" || billingCycle === currentCycle);
              return (
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

              <Form method="post">
                <input type="hidden" name="plan" value={plan.code} />
                <input type="hidden" name="cycle" value={billingCycle} />
              <button
                type="button"
                className={
                  isCurrent ? styles.currentPlanButton : styles.buyButton
                }
                disabled={isCurrent || navigation.state !== "idle"}
                onClick={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {isCurrent ? "Current Plan" : plan.code === "SANDBOX" ? "Downgrade" : "Buy Now"}
              </button>
              </Form>
            </article>
              );
            })()
          ))}
        </div>

        <p className={styles.planHelp}>
          Not sure which plan to choose? Click{" "}
          <a href="mailto:support@offsidetech.app">here</a>
        </p>
      </div>
    </Page>
  );
}
