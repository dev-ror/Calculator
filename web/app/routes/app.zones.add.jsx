import { useLoaderData, useActionData, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import ZoneForm from "../components/ZoneForm";
import { getTaken, getRowHolder, validateZone, countriesLabel, parseRegions } from "../zones.server";
import { ensureShop } from "../backend.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  return {
    taken: await getTaken(shop.id),
    rowHolder: await getRowHolder(shop.id),
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();

  const name = String(form.get("name") || "").trim();
  const isRestOfWorld = form.get("isRestOfWorld") === "true";
 const regions = isRestOfWorld ? {} : parseRegions(form.get("regions"));
if (regions === null) return { error: "Invalid regions." };

  const error = await validateZone({
    shopId: shop.id, name, isRestOfWorld, regions,
  });
  if (error) return { error };


    await prisma.zone.create({
    data: {
      shopId: shop.id,
      name,
      isRestOfWorld,
      regions,
      countries: isRestOfWorld ? "Rest of world" : countriesLabel(regions),
    },
  });
  return redirect("/app/zones");
};

export default function AddZone() {
  const { taken, rowHolder } = useLoaderData();
  const actionData = useActionData();

  return (
    <ZoneForm
      isNew
      zone={{ name: "", isRestOfWorld: false, regions: {} }}
      taken={taken}
      rowHolder={rowHolder}
      error={actionData?.error}
    />
  );
}
