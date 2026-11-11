import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { BillingReplacementBehavior } from "@shopify/shopify-app-react-router/server";
import styles from "../app.module.css";
import { Page } from "@shopify/polaris";
import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
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
    description: "Try and configure ShipFlux with no cost.",
    monthly: 0,
    yearly: 0,
    features: [
      [true, "Live shipping rates (test mode)"],
      [true, "Basic checkout customizations"],
      [true, "Up to 5 shipping rules"],
      [true, "Standard support"],
    ],
  },
  {
    name: "Starter",
    code: "STARTER",
    description: "Everything you need to go live with real shipping rates.",
    monthly: 9,
    yearly: 90,
    features: [
      [true, "Live shipping rates (real-time)"],
      [true, "Checkout customizations"],
      [true, "Unlimited shipping rules"],
      [true, "7-day free trial"],
      [true, "Email support"],
    ],
  },
  {
    name: "Pro",
    code: "PRO",
    description: "Advanced control and flexibility for growing stores.",
    monthly: 29,
    yearly: 290,
    features: [
      [true, "Live shipping rates (real-time)"],
      [true, "Advanced checkout customizations"],
      [true, "Unlimited shipping rules"],
      [true, "Advanced coded rates (e.g., carrier, product, address, tags)"],
      [true, "7-day free trial"],
      [true, "Priority support"],
    ],
  },
  {
    name: "Pro+",
    code: "PRO_PLUS",
    description: "Maximum flexibility and support for complex shipping needs.",
    monthly: 59,
    yearly: 590,
    features: [
      [true, "All Pro features"],
      [true, "Custom rate logic (advanced)"],
      [true, "Multi-origin & zone strategies"],
      [true, "Partner / dedicated support"],
      [true, "Priority feature requests"],
    ],
  },
];

export default function Billing() {
  const { currentPlan, currentCycle } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const shopify = useAppBridge();

  useEffect(() => {
    if (actionData?.error) shopify.toast.show(actionData.error, { isError: true });
  }, [actionData, shopify]);

  return (
    <Page fullWidth>
      <div className={styles.billingPage}>
        <header className={styles.billingHeader}>
          <div>
            <h1>Billing</h1>
            <p>Choose the plan that fits your shipping setup.</p>
          </div>
          <div className={styles.billingControls}>
            <div className={styles.billingToggle} role="tablist" aria-label="Billing cycle">
              <button type="button" role="tab" aria-selected={billingCycle === "monthly"} className={billingCycle === "monthly" ? styles.activeBillingTab : ""} onClick={() => setBillingCycle("monthly")}>
                <span aria-hidden="true">▣</span> Monthly
              </button>
              <button type="button" role="tab" aria-selected={billingCycle === "yearly"} className={billingCycle === "yearly" ? styles.activeBillingTab : ""} onClick={() => setBillingCycle("yearly")}>
                <span aria-hidden="true">▣</span> Yearly
              </button>
            </div>
            <div className={styles.yearlyOffer}>
              <svg className={styles.offerIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="m13.5 3 7.5 7.5-9.8 9.8a2.4 2.4 0 0 1-3.4 0l-3.1-3.1a2.4 2.4 0 0 1 0-3.4L14.5 4a2.4 2.4 0 0 1 1.7-.7H20v3.8" />
                <circle cx="16.8" cy="7.2" r="1.2" />
              </svg>
              Save 2 months with yearly billing
            </div>
          </div>
        </header>

        <div className={styles.pricingGrid}>
          {plans.map((plan) => (
            (() => {
              const isCurrent = plan.code === currentPlan &&
                (plan.code === "SANDBOX" || billingCycle === currentCycle);
              const annualSaving = plan.monthly * 12 - plan.yearly;
              return (
            <article className={`${styles.pricingCard} ${plan.code === "PRO" ? styles.recommendedCard : ""}`} key={plan.name}>
              <div className={styles.planIntro}>
                <h2>
                  {plan.code === "PRO" && <span className={styles.recommendedBadge}>✦ Recommended</span>}
                  {plan.name}
                </h2>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.planPrice}>
                <strong>${billingCycle === "monthly" ? plan.monthly : plan.yearly}</strong>
                <span>{plan.monthly === 0 ? "Forever" : billingCycle === "monthly" ? "/ month" : "/ year"}</span>
              </div>
              {plan.monthly > 0 && <div className={styles.yearlyPrice}>${plan.yearly} / year {billingCycle === "yearly" && <b>Save ${annualSaving}</b>}</div>}

              <ul className={styles.featureList}>
                {plan.features.map(([included, feature]) => (
                  <li key={feature}>
                    <span className={included ? styles.included : styles.excluded} aria-hidden="true">{included ? "✓" : "×"}</span>
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
                {isCurrent ? "✓  Current plan" : plan.code === "SANDBOX" ? "Downgrade" : "Start 7-day free trial"}
              </button>
              </Form>
            </article>
              );
            })()
          ))}
        </div>

        <div className={styles.planHelp}>
          <div className={styles.helpIntro}><span className={styles.helpIcon}>▢</span><div><strong>Need help choosing?</strong><span>Compare all plan features or get personalized advice from our team.</span></div></div>
          <a href="mailto:support@offsidetech.app">⚖&nbsp;&nbsp; View full comparison&nbsp;&nbsp; ›</a>
          <a href="mailto:support@offsidetech.app">♧&nbsp;&nbsp; Contact support&nbsp;&nbsp; ›</a>
        </div>
      </div>
    </Page>
  );
}
