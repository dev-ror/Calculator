import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { matchZone } from "../zones.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const country = (url.searchParams.get("country") || "").toUpperCase();
  const province = (url.searchParams.get("province") || "").toUpperCase();

  const zones = await prisma.zone.findMany({ where: { shopId: session.shop } });
  const hit = matchZone(zones, country, province);

  return {
    country, province,
    result: hit ? hit.name : "NO ZONE",
    isRestOfWorld: hit?.isRestOfWorld ?? false,
  };
};

export default function ZoneTest() {
  const data = useLoaderData();
  return <pre style={{ padding: 20 }}>{JSON.stringify(data, null, 2)}</pre>;
}