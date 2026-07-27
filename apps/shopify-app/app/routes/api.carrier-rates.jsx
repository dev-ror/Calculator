import {
  ensureShop,
  executeShippingPipeline,
} from "../backend.server";
import {
  formatCarrierResponse,
  mapCarrierRequest,
  verifyCarrierCallback,
} from "../carrier-service.server";
import { unauthenticated } from "../shopify.server";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function emptyRates() {
  return Response.json({ rates: [] }, { headers: responseHeaders });
}

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const shopDomain = verifyCarrierCallback(request.url);

    if (!shopDomain) return emptyRates();

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 1_000_000) return emptyRates();

    const [payload, shop, unauthenticatedContext] = await Promise.all([
      request.json(),
      ensureShop(shopDomain),
      unauthenticated.admin(shopDomain),
    ]);
    const mappedRequest = await mapCarrierRequest(
      unauthenticatedContext.admin,
      payload,
      shop.id,
    );
    const result = await executeShippingPipeline(mappedRequest);

    return Response.json(formatCarrierResponse(result, mappedRequest), {
      headers: responseHeaders,
    });
  } catch {
    return emptyRates();
  }
};
