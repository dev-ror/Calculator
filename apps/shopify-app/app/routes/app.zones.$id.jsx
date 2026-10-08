import { useLoaderData, useActionData, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import ZoneForm from "../components/ZoneForm";
import { getTaken, getRowHolder, validateZone, countriesLabel, parseRegions } from "../zones.server";
import { ensureShop } from "../backend.server";

async function findZone(shopId, id) {
  const zone = await prisma.zone.findFirst({ where: { id, shopId } });
  if (!zone) throw new Response("Zone not found", { status: 404 });
  return zone;
}

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const zone = await findZone(shop.id, params.id);

  return {
    zone: {
      id: zone.id,
      name: zone.name,
      isRestOfWorld: zone.isRestOfWorld,
      regions: zone.regions || {},
    },
    taken: await getTaken(shop.id, zone.id),
    rowHolder: await getRowHolder(shop.id, zone.id),
  };
};

export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const zone = await findZone(shop.id, params.id);
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    await prisma.zone.delete({ where: { id: zone.id } });
    return redirect("/app/zones");
  }

  const name = String(form.get("name") || "").trim();
  const isRestOfWorld = form.get("isRestOfWorld") === "true";
const regions = isRestOfWorld ? {} : parseRegions(form.get("regions"));
if (regions === null) return { error: "Invalid regions." };

  const error = await validateZone({
    shopId: shop.id, excludeId: zone.id, name, isRestOfWorld, regions,
  });
  if (error) return { error };

  await prisma.zone.update({
    where: { id: zone.id },
    data: {
      name,
      isRestOfWorld,
      regions,
      countries: isRestOfWorld ? "Rest of world" : countriesLabel(regions),
    },
  });
  return redirect("/app/zones");
};

export default function EditZone() {
  const { zone, taken, rowHolder } = useLoaderData();
  const actionData = useActionData();

  return (
    <ZoneForm
      key={zone.id}
      zone={zone}
      taken={taken}
      rowHolder={rowHolder}
      error={actionData?.error}
    />
  );
}
