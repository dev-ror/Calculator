import { Spinner } from "@shopify/polaris";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigation } from "react-router";

export default function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading" || navigation.state === "submitting";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ minHeight: "100vh", position: "relative" }}>
          <Outlet />
          {isNavigating && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              aria-busy="true"
            >
              <Spinner accessibilityLabel="Loading page" size="large" />
            </div>
          )}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
