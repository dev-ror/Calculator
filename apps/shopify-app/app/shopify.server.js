import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "@calculator/database";
import { ensureCarrierService } from "./carrier-service.server";

function isCarrierServiceUnavailable(message) {
  return /carrier calculated shipping must be enabled|carrier calculated shipping.*(?:unavailable|not enabled|not eligible)|ccs.*(?:unavailable|not enabled|not eligible)/i.test(
    message,
  );
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  hooks: {
    afterAuth: async ({ admin, session }) => {
      try {
        await ensureCarrierService(admin, session.shop);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown Shopify API error";

        if (isCarrierServiceUnavailable(message)) {
          console.warn(
            "Carrier Service registration skipped: carrier-calculated shipping is not enabled for this store",
          );
        } else {
          console.error(`Carrier Service registration failed: ${message}`);
        }
      }
    },
  },
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
