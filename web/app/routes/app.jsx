import '@shopify/polaris/build/esm/styles.css';
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { ensureCarrierService, ensureShop } from "../backend.server";
import enTranslations from '@shopify/polaris/locales/en.json';
import { AppProvider as PolarisProvider } from '@shopify/polaris';

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    await ensureShop(session.shop);
    // Keep the registered carrier callback aligned with the active app URL
    // (especially after a development tunnel changes). This is best-effort so
    // a temporary Shopify API failure does not prevent the embedded app from
    // loading.
    await ensureCarrierService(session.shop, admin).catch(() => null);
  } catch {
    throw new Response("Unable to initialize shop data", { status: 500 });
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={enTranslations}>
        <s-app-nav>
          <s-link href="/app/rates">Shipping Rates</s-link>
          <s-link href="/app/zones">Shipping Zones</s-link>
          <s-link href="/app/customizations">Shipping Customizations</s-link>
          <s-link href="/app/settings">Settings</s-link>
          <s-link href="/app/videos">Example Setup Videos</s-link>
          {/* <s-link href="/app/products">Products</s-link> */}
          <s-link href="/app/billing">Billing</s-link>
          <s-link href="/app/analytics">Analytics</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
