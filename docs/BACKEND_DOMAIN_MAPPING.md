# Backend Domain Mapping

## Scope and current-state summary

This is a planning document only. It maps the current frontend controls to future backend and persistence boundaries; it does not prescribe a Prisma migration, Shopify integration, or calculation implementation.

Audited routes:

- `app.customizations._index.jsx`, `app.customizations.jsx`, `app.customizations.new.jsx`
- `app.rates._index.jsx`, `app.rates.jsx`, `app.rates.new.jsx`
- `app.products.jsx`
- `app.settings.jsx`
- Related constants in `shippingCustomizations.js` and `shippingRates.js`
- Related application authentication and database usage

Current implementation facts:

- The customization and rate index routes are empty states linking to their respective `new` routes. The parent routes only render an `Outlet`.
- None of the audited feature routes exports a React Router `loader` or `action`. The `/app` parent loader performs `authenticate.admin(request)`, so the screens inherit authentication but do not load or persist feature data.
- Save on the new-customization and new-rate screens only shows an App Bridge toast and navigates back to the index. Zone rates, product dimensions, settings, and blending rules live only in React state. Refreshing loses them.
- The products screen uses 26 hard-coded product rows. CSV generation is browser-only; upload currently logs selected files to the browser console.
- The settings sync buttons only update local timestamps after a timer. The settings Save and secret-regeneration controls have no persistence behavior.
- There are no Shopify Admin API calls in these feature routes. Existing Shopify use is the authenticated embedded shell, App Bridge toasts, and static Shopify-oriented field choices/help text.
- Prisma currently contains only the Shopify `Session` model. `@calculator/database` supplies the single Prisma client used by `PrismaSessionStorage` and webhook session cleanup. No audited feature route queries Prisma.

## 1. Customization Mapping

### Rule and action fields

| Frontend field | Current shape / validation | Future backend domain | Future database entity | Future Shopify resource |
| --- | --- | --- | --- | --- |
| Type | `hide`, `show`, `only_show`, `reorder`, `rename` options | `rules/` | `Customization.type` | Future delivery/shipping customization capability |
| Name | String; currently the only required rule-level field | `rules/`, `validators/` | `Customization.name` | App-owned configuration only |
| Status | `Active` or `Draft` | `rules/` | `Customization.status` | Future activation state for published customization configuration |
| Parameter set | `1`, `2`, or `3`; only one set is active | `rules/`, `validators/` | `Customization.parameterSet` | App-owned configuration only |
| Match | `all` or `any` | `rules/` | `Customization.conditionMatch` | Future customization input/configuration |
| Apply rule to | `all` shipments or `first` shipment | `shipping/`, `rules/` | `Customization.shipmentScope` | Future delivery/subscription context |
| Shipping methods | Ordered string array; at least one non-blank value is currently required | `shipping/`, `rules/`, `validators/` | `CustomizationMethod` | Future delivery-option handles/titles; current UI accepts partial names |

The frontend condition object is currently:

`{ field, operator, key, value, productMatch, matchValue }`

| Frontend condition family | Current fields | Future backend domain | Future database entity | Future Shopify resource/data |
| --- | --- | --- | --- | --- |
| Cart | Subtotal, quantity, weight, attribute | `rules/` | `CustomizationCondition` | Cart totals, lines, and attributes supplied by the future evaluation context |
| Product | Tag, title, type, weight, vendor, variant title, line-item property, price, collection, SKU, variant metafield, subscription flag | `rules/` with product data supplied by `services/` | `CustomizationCondition`; optional future synchronized product snapshot | Product, ProductVariant, Collection, SellingPlan/allocation, product or variant metafield |
| Customer | Tag, logged-in state, company, first name, customer/company/company-location metafield | `rules/` with customer context supplied by `services/` | `CustomizationCondition` | Customer, Company, CompanyLocation, and their metafields |
| Shipping | Postcode, province, country, address line, PO-box checks, shipping-method name, shipping rate | `shipping/`, `rules/` | `CustomizationCondition` | Delivery address and candidate delivery options |
| Other | Always, number of vendors | `rules/` | `CustomizationCondition` | None for `Always`; product/vendor cart context for vendor count |

Product-scoped customization conditions also store `productMatch` (`at-least-one`, `all-products`, exact/more/not-more quantity, more/not-more amount) and optional numeric `matchValue`. Keyed conditions store a `key` for cart attributes, line-item properties, named shipping rates, or metafields.

### Current validation and normalization gaps

- Current save eligibility validates only a non-blank name and one non-blank method. Conditions, status, parameter-set compatibility, numeric values, metafield keys, and method uniqueness are not validated.
- Comma-, semicolon-, wildcard-, and postcode-range syntax is described in help text but is not parsed or validated.
- Country/province codes, collection IDs, numeric units, and `namespace.key` metafield identifiers are not normalized.
- The initial `type` state is the label `Hide shipping rates`, while the select options use values such as `hide`; the action-label helper also compares labels. A future contract must choose stable enum values and explicitly migrate/translate UI labels.
- Empty conditions and methods can be added or all removed. Future validation must define minimum cardinality.

## 2. Rates Mapping

### Rate-rule envelope

| Frontend field | Current shape / validation | Future owner | Future entity |
| --- | --- | --- | --- |
| Name | String; required | `rates/`, `validators/` | `RateRule.name` |
| Priority | Numeric input stored as string; non-blank is required; uniqueness is help text only | `rates/`, `validators/` | `RateRule.priority` |
| Status | `Active` or `Draft` | `rates/` | `RateRule.status` |
| Match | `all` or `any` | `rules/` | `RateRule.conditionMatch` |
| Exclusivity | `inclusive` or `exclusive`; exclusive is intended to skip lower-priority rules | `rates/`, `rules/` | `RateRule.exclusivity` |
| Conditions | Array of condition objects | `rules/`, `validators/` | `RateCondition` |
| Zone rates | Object keyed by hard-coded `Domestic` and `International` | `shipping/`, `rates/` | `ShippingZone`, `RateDefinition`, and rule-to-zone association |

The frontend rate-condition object is:

`{ field, subfield, key, operator, value, quantityCheck, quantityValue }`

Condition inputs cover:

- Product: title, variant title, tag, SKU, barcode, vendor, price, compare-at price, quantity, type, weight, product/variant metafield, line-item property, length, width, height, volume, Shopify product ID, and Shopify variant ID.
- Cart: quantity, subtotal before discount, total after discount, weight, volume, contains/does-not-contain with a product subfield, and locale.
- Shipping: destination postcode, province, address line, country, time/day, and warehouse postcode.
- Customer: tag, first name, and last name.

`Cart Contains` additionally has quantity/amount modes (`atLeastOne`, more/less products, more/less amount). Metafield and line-item-property conditions have a separate `key`. Operators vary by field and include equality, text containment, numeric comparisons, boolean checks, and empty checks.

### Rate definition and pricing inputs

| Field group | Existing frontend fields | Future backend ownership | Future persistence |
| --- | --- | --- | --- |
| Checkout display | Rate name, description, minimum/maximum delivery days, tags | `rates/` | `RateDefinition` |
| Currency | Store currency or one of 13 named currencies | `rates/`, `validators/` | `RateDefinition.currencyCode` |
| Fixed pricing | Fixed price, percentage, round-up | `rates/` | `RatePricing` |
| Metafield pricing | Product/variant metafield key, increase per item, default rate | `rates/`, `services/`, `validators/` | `RatePricing`; Shopify definition remains external |
| Dynamic pricing | Weight, cart price, item count, summed product/variant metafield, or distance | `rates/` | `RatePricing` |
| Range pricing | Rate type (`Range`, `Incremental`, combinations), range start/end, second range, base price, incremental price, per-each, start-from, price-calculation parameter | `rates/`, `validators/` | `RatePricingTier` |
| Distance | Google Maps key, default/custom origin, country, postcode, driving/straight-line method | `services/` boundary plus `rates/`; no provider implementation in this phase | `DistanceRateConfiguration`; encrypted credential storage later |
| Packaging | Distribution by item count/volume; package limit, length, width, height, optional weight | `shipping/` | `PackageProfile` |
| Carrier-shaped configuration | Provider, API credentials/account, schedule, services, rates-to-show, delivery-date visibility, discount, handling fees, default rate, package type, signature, insurance, fuel levy, carrier rate type | Future integration adapter behind `services/`; rate policy in `rates/` | `CarrierConfiguration`, `CarrierServiceSelection`, `RateAdjustment`; secrets encrypted and separated |

The carrier choices visible today are Australia Post, USPS, FedEx, Shiprocket, Direct Freight Express, Stallion Express, and ShipStation. They are form branches only; there are no integrations or network calls.

### Zones and future ownership

- `Domestic` and `International` are currently labels, not Shopify zone identifiers, countries, or persisted records.
- Future `services/` synchronization should translate Shopify delivery profiles/zones into stable external IDs and normalized membership. `shipping/` should expose that context; `rates/` should associate definitions with it.
- The current UI stores at most one draft rate per zone key. The future cardinality (one or many rates per rule/zone) must be decided before schema work.
- A future Shopify publishing boundary may expose calculated rates through the appropriate Shopify delivery/rate capability. No such resource, endpoint, Function, or API call exists today.

### Current rate validation gaps

- Rule save checks only name and non-blank priority. It does not require conditions or zone rates and does not enforce integer, positive, or unique priority.
- Modal validation requires rate name plus only a subset of calculation-specific inputs. Carrier branches currently pass without credential validation.
- Range ordering, delivery-day ordering, non-negative prices, currency precision, package dimensions, unit conversion, percentages, duplicate services, and mutually compatible options are not checked.
- Carrier secrets and the Google Maps key currently live in browser state. Future implementations must never persist or log plaintext credentials through ordinary rule payloads.

## 3. Product / Tag / Metafield Mapping

### Existing product configuration

| Existing field/use | Current source | Required future Shopify resource | Future approach |
| --- | --- | --- | --- |
| Product/variant identity and title | Hard-coded rows (`id`, `name`) | Product and ProductVariant stable GraphQL IDs | Paginated authenticated synchronization; never treat current numeric demo IDs as Shopify IDs |
| Length, width, height | Per-row React state, millimetres | ProductVariant plus app-owned dimension data | Validate non-negative decimals and units, then write or synchronize app-owned variant data |
| Bulk dimensions CSV | Columns: Shopify Variant ID, Variant Title, Length, Width, Height | ProductVariant | Parse server-side later, report row errors, resolve stable IDs, and upsert atomically/idempotently |
| Product tags | Rule/customization input and blending input | Product tags | Read from synchronized product context or request-time Shopify context; normalize matching semantics |
| Product title/type/vendor/barcode/SKU/prices/weight | Condition choices | Product and ProductVariant | Select the minimum fields required for evaluation and refresh on webhooks/manual sync |
| Collection membership | Customization condition | Collection/product membership | Synchronize stable collection IDs or obtain them in the evaluation context |
| Product/variant metafield | Condition and pricing fields | Product or ProductVariant metafield | Define ownership/type first; read typed values, not untyped display strings |
| Customer/company metafields | Customization conditions | Customer, Company, CompanyLocation metafields | Fetch only when the future evaluation surface and permissions support them |

The settings page indicates product sync is needed for tag, title, type, or barcode rules, exposes manual product/zone sync timestamps, and has an auto-product-sync toggle. All three are local simulations today.

### Future metafield discipline

- Decide each metafield's owner, namespace/key, Shopify type, access, and source of truth before schema or API work.
- For app-owned definitions, define them declaratively in Shopify TOML first and use the `$app` namespace in future Admin API operations. The existing TOML contains only template/demo custom-data definitions; none corresponds to shipping dimensions or rules.
- Future writes should use the Admin GraphQL API with typed values; future reads should request the owner resource's metafields and consume typed/JSON values. This document does not add definitions or operations.
- Product dimensions need a deliberate choice between Shopify-owned app metafields and local synchronized storage. Avoid maintaining both as writable sources without conflict/version rules.

### Future synchronization approach

1. Authenticate the shop and enqueue/manual-trigger a sync through `services/`.
2. Fetch only required Product/ProductVariant/Collection fields using stable GraphQL IDs and pagination.
3. Normalize tags, identifiers, units, currency values, and typed metafields.
4. Upsert shop-scoped snapshots through a repository boundary supplied by `@calculator/database` only when persistence is implemented.
5. Record cursor/status/error/last-success metadata separately from UI timestamps.
6. Refresh incrementally from relevant webhooks, with a full resync recovery path.

This is a future plan; the current scopes and webhook subscriptions have not been assessed as sufficient for those operations and must be reviewed before implementation.

## 4. Backend Ownership Plan

| Backend module | Future responsibility | Must not own |
| --- | --- | --- |
| `shipping/` | Framework-independent shipping context and orchestration contracts: shipment, destination, packages, zones, and candidate methods | React/Polaris types, Shopify authentication, direct persistence setup |
| `rates/` | Rate-rule and rate-definition contracts, priority/exclusivity semantics, pricing policy boundaries, currency/unit-safe outputs | Route loaders/actions, carrier SDK details, UI state |
| `rules/` | Shared condition AST/contracts, field/operator compatibility, all/any evaluation boundary, customization action contracts | Shopify API clients, component labels as persisted enums |
| `services/` | Application use-case boundaries for CRUD, publishing, product/zone sync, and ports for future Shopify/provider adapters | Provider implementations in the domain core, embedded-app concerns |
| `validators/` | Input schemas/contracts for rule payloads, discriminated calculation modes, keys/codes/units, cross-field constraints, and safe error shapes | Business execution, data fetching, React-specific validation state |

Cross-cutting ownership rules:

- The Shopify app will translate route form payloads into backend contracts and translate validation failures back to fields.
- Backend contracts will use stable machine enums; UI labels remain presentation concerns.
- Persistence will be accessed through explicit ports/repositories when needed. `@calculator/backend` must not depend on the Shopify app.
- Shopify and carrier clients will remain adapters outside the pure domain contracts. Credentials must be shop-scoped, encrypted, redacted, and never returned to the browser after creation.

## 5. Database Planning Only

No schema change is part of this phase. Candidate future entities are:

| Candidate entity | Purpose / likely relationships |
| --- | --- |
| `ShopConfiguration` | Shop-scoped mode flags, contact email, blend mode, auto-sync setting, and configuration version |
| `Customization` | Named, statused customization rule with type, match mode, parameter set, and shipment scope |
| `CustomizationCondition` | Ordered typed conditions belonging to a customization |
| `CustomizationMethod` | Ordered target shipping-method matcher/action data |
| `RateRule` | Named, prioritized, statused, inclusive/exclusive rule |
| `RateCondition` | Ordered typed conditions belonging to a rate rule |
| `ShippingZone` | Shop-scoped synchronized external zone identity and metadata |
| `RateDefinition` | Checkout-facing rate data associated with a rule and zone |
| `RatePricing` / `RatePricingTier` | Discriminated pricing configuration and ordered ranges/increments |
| `PackageProfile` | Ordered package constraints/dimensions used by a rate definition |
| `CarrierConfiguration` | Shop/provider configuration with encrypted secret references |
| `CarrierServiceSelection` | Selected external services and provider-specific options |
| `RateAdjustment` | Discount, handling, default/fallback, and display-selection policy |
| `BlendRule` | Basic or tag-based blending behavior and optional display/delivery overrides |
| `ProductSnapshot` / `VariantSnapshot` | Optional shop-scoped synchronized product evaluation fields |
| `ProductDimension` | Variant dimensions with explicit units and synchronization provenance |
| `SyncRun` | Product/zone sync status, cursors, timestamps, counts, and errors |

Planning constraints:

- Every business record must be shop-scoped and must not use the Shopify `Session` row as its business-data parent.
- Conditions and pricing should use discriminated shapes so irrelevant fields cannot be stored together accidentally. Decide between normalized subtype tables and validated JSON only after query/evolution needs are known.
- Stable Shopify GraphQL IDs should be preserved as strings. Add uniqueness and cascade behavior deliberately.
- Monetary values should use decimal/minor-unit semantics with explicit currency; weights and dimensions need explicit canonical units.
- Priorities, ordering, active-version publication, idempotency, and optimistic concurrency need database constraints, not only UI checks.
- Secrets should be encrypted or stored through a secret manager and referenced from business records.

## Data-flow target (future)

`Authenticated React Router action` → `validators/` → `services/` use case → `rules/` / `rates/` / `shipping/` contracts → repository or Shopify/provider port → persisted result → loader response

Current data flow stops inside the browser: controls update React state, and save either navigates/toasts or does nothing. Introducing server actions is therefore a behavioral migration and should be staged behind explicit contracts and tests rather than inferred from the current component state.

## Migration risks and decisions required before implementation

- **Prototype-to-contract drift:** UI strings, casing, and labels currently function as data. Freeze canonical enums and write explicit translation maps first.
- **Incomplete validation:** Current eligibility checks are much weaker than the visible field complexity. Persisting existing shapes directly would admit invalid and ambiguous records.
- **No existing business records:** There is nothing persisted to migrate yet, but browser-only configurations cannot be recovered after refresh or deployment.
- **Shop isolation:** Every query and uniqueness rule must include shop identity to prevent cross-store access.
- **Shopify capability and scope fit:** Required evaluation inputs, publishing mechanism, API version, access scopes, protected customer data, and plan eligibility must be validated before selecting an integration design.
- **Metafield ownership/type:** Arbitrary `key` strings are accepted today. Definitions, types, permissions, missing-value behavior, and namespace conventions must be decided first.
- **Zone identity:** Domestic/International labels cannot safely key synchronized Shopify zones. Use stable external IDs and handle zone/profile changes.
- **Units, money, locale, and time:** The UI mixes millimetres, grams, pounds, kilometres, USD suffixes, store currency, locale codes, and a fixed `America/New_York` display suffix. Canonicalization and shop timezone/currency rules are required.
- **Credentials:** Provider and maps credentials cannot remain ordinary client state or be exposed through loaders. Secret lifecycle and redaction are prerequisites.
- **Cardinality/versioning:** Decide whether zones can have multiple rates, whether rules are mutable or versioned, and how publish/rollback works.
- **Sync consistency:** Define webhook coverage, retries, idempotency, deletion handling, rate limits, and stale-data behavior before product/zone synchronization.
- **Current type mismatch:** The customization Type default/option/helper mismatch can produce ambiguous action behavior. Preserve the UI now, but resolve it in the future adapter contract before persistence.

