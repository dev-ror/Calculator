import {
  ensureShop,
  executeShippingPipeline,
} from "../backend.server";
import {
  formatCarrierResponse,
  filterRatesForZone,
  mapCarrierRequest,
  verifyCarrierCallback,
} from "../carrier-service.server";
import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { matchZone } from "../zones.server";

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
    const zones = await prisma.zone.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "asc" },
    });
    const matchedZone = matchZone(
      zones,
      String(mappedRequest.destination?.countryCode ?? "").toUpperCase(),
      String(mappedRequest.destination?.provinceCode ?? "").toUpperCase(),
    );
    if (!matchedZone) return emptyRates();

    const result = await executeShippingPipeline(mappedRequest);

    return Response.json(
      formatCarrierResponse(filterRatesForZone(result, matchedZone), mappedRequest),
      { headers: responseHeaders },
    );
  } catch {
    return emptyRates();
  }
};
