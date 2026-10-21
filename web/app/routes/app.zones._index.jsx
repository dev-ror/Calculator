import { Page, Card, IndexTable, Text } from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureDefaultZones, getShopZoneDefaults } from "../zones.server";
import { ensureShop } from "../backend.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const shopDefaults = await getShopZoneDefaults(admin);
  await ensureDefaultZones(shop.id, shopDefaults);

  const zones = await prisma.zone.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "asc" },
  });

  // Rest of world wala zone sabse neeche
  zones.sort((a, b) => Number(a.isRestOfWorld) - Number(b.isRestOfWorld));

  return {
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      summary: z.isRestOfWorld
        ? "Rest of world"
        : summarize(z.regions, shopDefaults.locale),
    })),
  };
};

function summarize(regions, locale) {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });

  const names = Object.keys(regions || {})
    .map((code) => displayNames.of(code))
    .filter(Boolean);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

export default function ZonesIndex() {
  const { zones } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page
      title="Shipping Zones"
      backAction={{ content: "Back", onAction: () => navigate("/app") }}
      primaryAction={{ content: "Add zone", onAction: () => navigate("/app/zones/add") }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{ singular: "zone", plural: "zones" }}
          itemCount={zones.length}
          selectable={false}
          headings={[{ title: "Name" }, { title: "Regions" }]}
        >
          {zones.map((z, i) => (
            <IndexTable.Row
              id={z.id}
              key={z.id}
              position={i}
              onClick={() => navigate(`/app/zones/${z.id}`)}
            >
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">{z.name}</Text>
              </IndexTable.Cell>
              <IndexTable.Cell>{z.summary}</IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Text as="p">
          <a href="https://help.shopify.com/en/manual/shipping" target="_blank" rel="noreferrer">Learn more</a>{" "}
          about managing zones
        </Text>
      </div>
    </Page>
  );
}
