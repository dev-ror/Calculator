import { Country, State } from "country-state-city";

const flag = (code) =>
  String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));

export const REGIONS = Country.getAllCountries()
  .map((c) => ({
    code: c.isoCode,
    name: c.name,
    flag: flag(c.isoCode),
    provinces: State.getStatesOfCountry(c.isoCode).map((s) => ({
      code: s.isoCode,
      name: s.name,
    })),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.code, r]));

// Label shown next to the provinces count: "provinces", "states", etc.
export const PROVINCE_LABEL = {
  US: "states", AU: "states and territories", BR: "states", MX: "states",
  IN: "states", NG: "states", CA: "provinces", CN: "provinces",
  IE: "counties", RO: "counties", JP: "prefectures", AE: "emirates",
};
export const provinceLabel = (code) => PROVINCE_LABEL[code] || "regions";