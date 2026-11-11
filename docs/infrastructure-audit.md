# Shopify App Infrastructure Audit

## Executive assessment

The application has a sensible multi-package architecture and generally good tenant isolation. Shopify authentication is consistently applied to embedded admin routes, database relationships are scoped by `shopId`, and the carrier callback uses HMAC verification.

The main production-impacting issues are:

1. Scheduled rate/customization changes are not automatically processed.
2. Rate schedules are stored but ignored by the configuration builder.
3. Billing prices differ between the UI and Shopify billing configuration.
4. A configured `app_subscriptions/update` webhook has no corresponding route.
5. Shopify API versions are inconsistent across the app, server, and extension.
6. Clone-store zone mapping is collected by the UI but ignored by the backend.
7. Deployment does not automatically run database migrations.
8. Automated verification is incomplete because required local tooling is unavailable in the current environment.

## Project structure

The repository is an npm workspace monorepo:

```text
/
├── web/
│   ├── app/                 React Router application
│   ├── src/backend/         Shipping domain logic
│   ├── src/database/        Prisma schema, migrations, repositories
│   ├── src/shared/          Currently empty shared-package scaffold
│   ├── test/
│   └── public/
├── extensions/
│   └── delivery-customization/
│       ├── src/             Rust Shopify Function
│       ├── tests/
│       └── shopify.extension.toml
├── shopify.app.toml
├── shopify.app.shipping-mod.toml
├── shopify.web.toml
├── vercel.json
├── package.json
└── turbo.json
```

The principal packages are:

- `@calculator/shopify-app`
- `@calculator/backend`
- `@calculator/database`
- `@calculator/shared`

`@calculator/shared` currently exports only empty modules and is not meaningfully used.

## Frontend architecture

The frontend uses React 18, React Router 7, Vite, Shopify App Bridge, Shopify Polaris, Recharts, and CSS modules.

Routing is filesystem-based through `web/app/routes.js`.

Major route areas include:

- `/app` — authenticated application shell
- `/app/rates` — shipping-rate rules
- `/app/customizations` — delivery-option customizations
- `/app/zones` — shipping zone management
- `/app/settings` — configuration, synchronization, and transfer keys
- `/app/billing` — Shopify subscriptions
- `/app/clone-setup` — cross-store configuration cloning
- `/api/carrier-rates` — Shopify carrier callback
- `/webhooks/*` — Shopify webhook endpoints
- `/auth/*` — Shopify authentication

State management is primarily local React state plus React Router loaders, actions, and fetchers. There is no Redux, Zustand, or other global client-side store.

The application shell in `web/app/routes/app.jsx` authenticates every request, ensures a local shop record exists, and best-effort registers the carrier service.

## Backend architecture

The backend is organized into services, repositories, validators, rule matchers, shipping calculation, configuration serialization, Shopify adapters, and response formatters.

The main execution path is:

```text
Shopify carrier request
  → HMAC verification
  → Shopify unauthenticated Admin API
  → request mapping
  → Prisma shop/configuration lookup
  → zone matching
  → rule evaluation
  → rate generation/blending
  → customization application
  → Shopify carrier response
```

The main pipeline is exposed through `web/app/backend.server.js` and ultimately calls:

- `web/src/backend/src/services/ShippingService.js`
- `web/src/backend/src/rules/RuleEngine.js`
- `web/src/backend/src/shipping/ShippingCalculator.js`
- `web/src/backend/src/shipping/RateBlender.js`
- `web/src/backend/src/shipping/CustomizationApplier.js`

Validation is reasonably comprehensive for rates and customizations, including enum, length, position, schedule, and numeric checks.

## Database architecture

The database uses PostgreSQL and Prisma 6.

Core models:

- `Session`
- `Shop`
- `ShopConfiguration`
- `Zone`
- `RateRule`
- `RateCondition`
- `RateDefinition`
- `RateSchedule`
- `Customization`
- `CustomizationCondition`
- `CustomizationMethod`
- `CustomizationSchedule`

Positive findings:

- Application data is tenant-scoped through `shopId`.
- Child records use composite foreign keys containing both entity ID and shop ID.
- Cascading deletes are configured.
- Rate priorities are unique per shop.
- Transfer-key hashes are unique.
- Prisma transactions are used for multi-table writes.

The schema is defined in `web/src/database/prisma/schema.prisma`.

Shopify session access tokens are stored directly in the `Session` table. This is common for Shopify session storage, but the production database must be tightly protected.

## Shopify integration

The application implements:

- Embedded Shopify admin app
- OAuth through `shopify-app-react-router`
- Prisma-backed Shopify sessions
- Offline Admin API access
- Carrier-calculated shipping service
- Delivery Customization Function
- App uninstall webhook
- Scope-update webhook
- Shopify billing subscriptions
- Function configuration through an app-owned metafield

The carrier callback validates the shop domain, checks an HMAC signature with `timingSafeEqual`, limits request size, and only then uses unauthenticated Shopify Admin API access.

The Rust extension uses the target `cart.delivery-options.transform.run` and supports hide, show, only-show, rename, and reorder operations.

Configuration is synchronized through the app-owned metafield:

```text
$app:delivery-customization.function-configuration
```

## Configuration and deployment

Build configuration uses Vite, React Router SSR, the Vercel preset, Turbo, npm workspaces, and Prisma migrations.

Referenced environment variables include:

- `DATABASE_URL`
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL`
- `SCOPES`
- `SHOPIFY_BILLING_TEST`
- `SHOP_CUSTOM_DOMAIN`

Deployment is configured for Vercel in `vercel.json`, but the production build only generates Prisma Client. It does not run `prisma migrate deploy`; production migration execution must be handled separately.

## Findings

### High priority

#### Scheduled functionality is incomplete

`processCustomizationSchedules` is exported but never invoked by a route, cron handler, worker, or deployment schedule.

Additionally:

- Due schedules are queried only from `CustomizationSchedule`.
- `RateSchedule` is not included in schedule processing.
- The configuration builder resolves ordering for rate rules but does not calculate effective scheduled status.
- Tests cover customization schedules but not rate-rule schedule execution.

Scheduled activation/deactivation will therefore not reliably happen at the intended time.

#### Billing prices are inconsistent

Shopify billing configuration uses:

- Starter: `$14/$140`
- Pro: `$39/$390`
- Pro+: `$59/$590`

The billing UI displays:

- Starter: `$9/$90`
- Pro: `$29/$290`
- Pro+: `$59/$590`

These values should be centralized and validated against one another.

#### Missing subscription webhook route

`shopify.app.toml` configures `/webhooks/app/subscriptions_update`, but no matching route exists under `web/app/routes/`. This may cause webhook delivery failures or stale local billing state.

### Medium priority

#### Shopify API version drift

Versions are inconsistent:

- App TOML: `2026-10`
- Server SDK: `ApiVersion.October25`
- Function extension: `2026-04`
- Alternate app configuration: `2027-01`

These should be intentionally aligned and documented.

#### Clone-store zone mapping is ignored

The clone wizard collects `mappedZones`, but the backend does not use it when copying rates or customizations. The UI suggests zone remapping is supported, while original `zoneKey` values are copied unchanged.

#### Transfer-key lookup can become expensive

When a hash lookup fails, the clone action loads every encrypted transfer key and attempts decryption sequentially. This becomes an O(number-of-stores) operation and has no visible rate limiting.

#### Settings return plaintext transfer keys

The settings loader decrypts and returns the store transfer key to the browser on every load. Prefer returning a masked key and revealing it only through an explicit action.

#### Shopify app-secret rotation breaks transfer keys

Transfer secrets are encrypted using a key derived from `SHOPIFY_API_SECRET`. Rotating the Shopify app secret would make existing encrypted transfer keys undecryptable unless a migration strategy exists.

### Low priority

- The README still describes the project as a mostly unmodified Shopify template.
- There is no CI workflow, Docker configuration, or automated migration/deployment workflow.
- Several backend adapter exports appear unused.
- Shared package modules are empty scaffolding.
- Tests do not cover route authorization, Prisma integration, Shopify GraphQL failures, billing transitions, webhooks, carrier callbacks, or Function synchronization.

## Verification results

Passed:

- Shopify app tests: 2 passing.
- Transfer-key encryption/hash tests.
- Plan-entitlement tests.

Could not run:

- Backend tests — `prisma` executable unavailable.
- Typecheck — `react-router` executable unavailable.
- Lint — `eslint` executable unavailable.
- Rust tests — `cargo` unavailable.

These failures appear environment/tooling-related rather than source-test failures. Dependencies are not currently installed in the workspace.

## Recommended remediation order

1. Implement scheduled processing for both customization and rate schedules, and connect it to a reliable cron or worker.
2. Fix rate-rule effective-status handling.
3. Correct billing prices and add the missing subscription webhook route.
4. Standardize Shopify API versions.
5. Implement actual zone remapping in clone operations.
6. Add CI with dependency installation, Prisma generation, migrations, lint, typecheck, JavaScript tests, and Rust tests.
7. Add integration tests for carrier callbacks, billing, webhooks, tenant isolation, and Shopify Function synchronization.