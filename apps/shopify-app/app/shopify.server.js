import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "@calculator/database";

export const BILLING_PLANS = {
  STARTER_MONTHLY: "Starter",
  STARTER_YEARLY: "Starter (Yearly)",
  PRO_MONTHLY: "Pro",
  PRO_YEARLY: "Pro (Yearly)",
  PROPLUS_MONTHLY: "Pro+",
  PROPLUS_YEARLY: "Pro+ (Yearly)",
};

const subscriptionPlan = (amount, interval) => ({
  trialDays: 14,
  lineItems: [{ amount, currencyCode: "USD", interval }],
});

const billing = {
  [BILLING_PLANS.STARTER_MONTHLY]: subscriptionPlan(14, BillingInterval.Every30Days),
  [BILLING_PLANS.STARTER_YEARLY]: subscriptionPlan(140, BillingInterval.Annual),
  [BILLING_PLANS.PRO_MONTHLY]: subscriptionPlan(39, BillingInterval.Every30Days),
  [BILLING_PLANS.PRO_YEARLY]: subscriptionPlan(390, BillingInterval.Annual),
  [BILLING_PLANS.PROPLUS_MONTHLY]: subscriptionPlan(59, BillingInterval.Every30Days),
  [BILLING_PLANS.PROPLUS_YEARLY]: subscriptionPlan(590, BillingInterval.Annual),
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  billing,
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
