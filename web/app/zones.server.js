import prisma from "./db.server";
import { REGION_MAP } from "./constants/regions";

const SHOP_ZONE_DEFAULTS_QUERY = `#graphql
  query ShopZoneDefaults {
    shop {
      currencyCode
    }
    backupRegion {
      ... on MarketRegionCountry {
        code
      }
    }
    shopLocales {
      locale
      primary
    }
  }
`;

export async function getShopZoneDefaults(admin) {
  const response = await admin.graphql(SHOP_ZONE_DEFAULTS_QUERY);
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error("Unable to read Shopify market, currency, and locale settings");
  }

  const shopDefaults = {
    countryCode: String(payload.data?.backupRegion?.code || "").toUpperCase(),
    currencyCode: String(payload.data?.shop?.currencyCode || "").toUpperCase(),
    locale: String(
      payload.data?.shopLocales?.find((locale) => locale.primary)?.locale || "",
    ),
  };

  if (
    !REGION_MAP[shopDefaults.countryCode] ||
    !shopDefaults.currencyCode ||
    !shopDefaults.locale
  ) {
    throw new Error("Shopify returned incomplete market, currency, or locale settings");
  }

  return shopDefaults;
}

function fullCountryRegions(countryCode) {
  const country = REGION_MAP[countryCode];
  return {
    [countryCode]: country?.provinces.map((province) => province.code) || [],
  };
}

function isFullSingleCountry(regions) {
  const entries = Object.entries(regions || {});
  if (entries.length !== 1) return false;

  const [countryCode, provinces] = entries[0];
  const country = REGION_MAP[countryCode];
  if (!country || !Array.isArray(provinces)) return false;

  return (
    country.provinces.length === 0 ||
    provinces.length === country.provinces.length
  );
}

// Zones jinke countries dusre zones mein pehle se hain
export async function getTaken(shopId, excludeId) {
  const zones = await prisma.zone.findMany({
    where: {
      shopId,
      isRestOfWorld: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  const taken = {};
  for (const z of zones) {
    for (const [code, provs] of Object.entries(z.regions || {})) {
      const total = REGION_MAP[code]?.provinces.length || 0;
      const fullCountry = total === 0 || provs.length === total;
      if (fullCountry) {
        taken[code] = { zoneName: z.name, provinces: null };
      } else {
        const prev = taken[code]?.provinces || [];
        taken[code] = { zoneName: z.name, provinces: [...prev, ...provs] };
      }
    }
  }
  return taken;
}

// Kaunsa (dusra) zone Rest of world le chuka hai
export async function getRowHolder(shopId, excludeId) {
  const z = await prisma.zone.findFirst({
    where: {
      shopId,
      isRestOfWorld: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });
  return z || null;
}

// Returns error string or null
export async function validateZone({ shopId, excludeId, name, isRestOfWorld, regions }) {
  if (!name) return "Zone name is required.";

  if (isRestOfWorld) {
    const holder = await getRowHolder(shopId, excludeId);
    if (holder) return `"${holder.name}" is already your Rest of world zone.`;
    return null;
  }

  if (Object.keys(regions).length === 0) return "Select at least one region.";

  const taken = await getTaken(shopId, excludeId);
  for (const [code, provs] of Object.entries(regions)) {
    const t = taken[code];
    if (!t) continue;
    if (t.provinces === null || provs.some((p) => t.provinces.includes(p))) {
      return `${REGION_MAP[code]?.name} is already in "${t.zoneName}".`;
    }
  }
  return null;
}

// Returns cleaned regions object, or null if payload is invalid
export function parseRegions(raw) {
  let data;
  try {
    data = JSON.parse(String(raw || "{}"));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const clean = {};
  for (const [code, provs] of Object.entries(data)) {
    const country = REGION_MAP[code];
    if (!country || !Array.isArray(provs)) return null;
    const valid = new Set(country.provinces.map((p) => p.code));
    if (!provs.every((p) => typeof p === "string" && valid.has(p))) return null;
    clean[code] = [...new Set(provs)];
  }
  return clean;
}

// Keep the generated Domestic zone aligned with the Shopify store country.
export async function ensureDefaultZones(shopId, shopDefaults = {}) {
  const domesticCountryCode = String(shopDefaults.countryCode || "").toUpperCase();
  if (!REGION_MAP[domesticCountryCode]) {
    throw new Error("Shopify did not return a supported backup region");
  }
  const domesticRegions = fullCountryRegions(domesticCountryCode);
  const zones = await prisma.zone.findMany({ where: { shopId } });

  if (zones.length > 0) {
    const domestic = zones.find(
      (zone) => zone.name === "Domestic" && !zone.isRestOfWorld,
    );

    // Reconcile only an auto-generated full-country Domestic zone. A merchant's
    // custom partial or multi-country zone must never be overwritten.
    if (domestic && isFullSingleCountry(domestic.regions)) {
      const currentCountryCode = Object.keys(domestic.regions || {})[0];
      if (currentCountryCode !== domesticCountryCode) {
        await prisma.zone.update({
          where: { id: domestic.id },
          data: {
            regions: domesticRegions,
            countries: countriesLabel(domesticRegions),
          },
        });
      }
    }
    return;
  }

  try {
    // ek transaction: ROW pehle, taake concurrent request par unique index fail kar de
    await prisma.$transaction([
      prisma.zone.create({
        data: {
          shopId,
          name: "International",
          isRestOfWorld: true,
          regions: {},
          countries: "Rest of world",
        },
      }),
      prisma.zone.create({
        data: {
          shopId,
          name: "Domestic",
          isRestOfWorld: false,
          regions: domesticRegions,
          countries: countriesLabel(domesticRegions),
        },
      }),
    ]);
  } catch (e) {
    // P2002: dusri request pehle bana chuki hai, theek hai
    if (e?.code !== "P2002") throw e;
  }
}

export function countriesLabel(regions) {
  return Object.keys(regions || {})
    .map((c) => REGION_MAP[c]?.name)
    .filter(Boolean)
    .join(", ");
}

// Country + province ke liye zone dhundo (carrier service mein bhi yahi use karein)
export function matchZone(zones, countryCode, provinceCode) {
  const specific = zones.find((z) => {
    if (z.isRestOfWorld) return false;
    const provs = (z.regions || {})[countryCode];
    if (!provs) return false;
    const total = REGION_MAP[countryCode]?.provinces.length || 0;
    return total === 0 || provs.length === total || provs.includes(provinceCode);
  });
  return specific || zones.find((z) => z.isRestOfWorld) || null;
}
