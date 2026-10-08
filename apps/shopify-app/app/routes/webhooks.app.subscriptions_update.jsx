import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidatePlanCache } from "../billing.server";
import { syncFunctionConfiguration } from "../backend.server";

export const action = async ({ request }) => {
  const { shop } = await authenticate.webhook(request);
  invalidatePlanCache(shop);

  const record = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    select: { id: true },
  });
  if (record) await syncFunctionConfiguration(record.id);

  return new Response();
};
