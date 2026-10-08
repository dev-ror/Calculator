import { useLoaderData, useActionData, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import ZoneForm from "../components/ZoneForm";
import { getTaken, getRowHolder, validateZone, countriesLabel, parseRegions } from "../zones.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return {
    taken: await getTaken(session.shop),
    rowHolder: await getRowHolder(session.shop),
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const name = String(form.get("name") || "").trim();
  const isRestOfWorld = form.get("isRestOfWorld") === "true";
 const regions = isRestOfWorld ? {} : parseRegions(form.get("regions"));
if (regions === null) return { error: "Invalid regions." };

  const error = await validateZone({
    shopId: session.shop, name, isRestOfWorld, regions,
  });
  if (error) return { error };


    await prisma.zone.create({
    data: {
      shopId: session.shop,
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