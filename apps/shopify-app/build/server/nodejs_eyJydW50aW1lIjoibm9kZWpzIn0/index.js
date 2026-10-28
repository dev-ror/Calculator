var _a;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, UNSAFE_withComponentProps, useNavigation, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, redirect, UNSAFE_withErrorBoundaryProps, useRouteError, useNavigate, useFetcher, useSubmit } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-react-router/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { Spinner, AppProvider as AppProvider$1, useIndexResourceState, Page, BlockStack, Banner, List, Text, Link, Card, IndexTable, InlineStack, Badge, Box, Icon, EmptyState, Modal, Layout, FormLayout, Select, TextField, Button, Tooltip, RadioButton, ProgressBar, DropZone, LegacyStack, Thumbnail, LegacyCard, Pagination, Divider, Grid, InlineGrid, Popover, ActionList, Checkbox, Collapsible } from "@shopify/polaris";
import { timingSafeEqual, createHmac } from "node:crypto";
import { Country, State } from "country-state-city";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ClockIcon, InfoIcon, DeleteIcon, PlusIcon, NoteIcon, HideIcon, ViewIcon, ClipboardIcon, MenuHorizontalIcon, ChevronUpIcon, ChevronDownIcon, SearchIcon } from "@shopify/polaris-icons";
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
function createShop$1(data) {
  return prisma.shop.create({ data });
}
function findShopById$1(id) {
  return prisma.shop.findUnique({
    where: { id },
    include: { configuration: true }
  });
}
function findShopByDomain$1(shopDomain) {
  return prisma.shop.findUnique({
    where: { shopDomain },
    include: { configuration: true }
  });
}
function createCustomization$2({ customization, conditions, methods, schedules }) {
  return prisma.$transaction(async (transaction) => {
    const createdCustomization = await transaction.customization.create({
      data: customization
    });
    if (conditions.length > 0) {
      await transaction.customizationCondition.createMany({
        data: conditions.map((condition) => ({
          ...condition,
          shopId: createdCustomization.shopId,
          customizationId: createdCustomization.id
        }))
      });
    }
    await transaction.customizationMethod.createMany({
      data: methods.map((method) => ({
        ...method,
        shopId: createdCustomization.shopId,
        customizationId: createdCustomization.id
      }))
    });
    if (schedules.length > 0) {
      await transaction.customizationSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          shopId: createdCustomization.shopId,
          customizationId: createdCustomization.id
        }))
      });
    }
    return transaction.customization.findUnique({
      where: {
        id_shopId: {
          id: createdCustomization.id,
          shopId: createdCustomization.shopId
        }
      },
      include: {
        conditions: true,
        methods: true,
        schedules: { orderBy: { position: "asc" } }
      }
    });
  });
}
function findCustomizationsByShop$1(shopId) {
  return prisma.customization.findMany({
    where: { shopId },
    include: {
      conditions: true,
      methods: true,
      schedules: { orderBy: { position: "asc" } }
    }
  });
}
function updateCustomization$2(id, shopId, { customization, conditions, methods, schedules }) {
  return prisma.$transaction(async (transaction) => {
    await transaction.customization.update({
      where: { id_shopId: { id, shopId } },
      data: customization
    });
    await transaction.customizationCondition.deleteMany({
      where: { customizationId: id, shopId }
    });
    await transaction.customizationMethod.deleteMany({
      where: { customizationId: id, shopId }
    });
    await transaction.customizationSchedule.deleteMany({
      where: { customizationId: id, shopId }
    });
    if (conditions.length > 0) {
      await transaction.customizationCondition.createMany({
        data: conditions.map((condition) => ({
          ...condition,
          shopId,
          customizationId: id
        }))
      });
    }
    await transaction.customizationMethod.createMany({
      data: methods.map((method) => ({
        ...method,
        shopId,
        customizationId: id
      }))
    });
    if (schedules.length > 0) {
      await transaction.customizationSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          shopId,
          customizationId: id
        }))
      });
    }
    return transaction.customization.findUnique({
      where: { id_shopId: { id, shopId } },
      include: {
        conditions: true,
        methods: true,
        schedules: { orderBy: { position: "asc" } }
      }
    });
  });
}
function deleteCustomization$2(id, shopId) {
  return prisma.customization.delete({ where: { id_shopId: { id, shopId } } });
}
const completeRate = {
  conditions: true,
  rates: true,
  schedules: { orderBy: { position: "asc" } }
};
function createRate$2({ rule, conditions, definitions, schedules }) {
  return prisma.$transaction(async (transaction) => {
    const createdRule = await transaction.rateRule.create({ data: rule });
    if (conditions.length > 0) {
      await transaction.rateCondition.createMany({
        data: conditions.map((condition) => ({
          ...condition,
          shopId: createdRule.shopId,
          rateRuleId: createdRule.id
        }))
      });
    }
    if (definitions.length > 0) {
      await transaction.rateDefinition.createMany({
        data: definitions.map((definition) => ({
          ...definition,
          shopId: createdRule.shopId,
          rateRuleId: createdRule.id
        }))
      });
    }
    if (schedules.length > 0) {
      await transaction.rateSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          shopId: createdRule.shopId,
          rateRuleId: createdRule.id
        }))
      });
    }
    return transaction.rateRule.findUnique({
      where: { id_shopId: { id: createdRule.id, shopId: createdRule.shopId } },
      include: completeRate
    });
  });
}
function findRatesByShop$1(shopId) {
  return prisma.rateRule.findMany({
    where: { shopId },
    include: completeRate
  });
}
function updateRate$2(id, shopId, { rule, conditions, definitions, schedules }) {
  return prisma.$transaction(async (transaction) => {
    await transaction.rateRule.update({
      where: { id_shopId: { id, shopId } },
      data: rule
    });
    await transaction.rateCondition.deleteMany({ where: { rateRuleId: id, shopId } });
    await transaction.rateDefinition.deleteMany({ where: { rateRuleId: id, shopId } });
    await transaction.rateSchedule.deleteMany({ where: { rateRuleId: id, shopId } });
    if (conditions.length > 0) {
      await transaction.rateCondition.createMany({
        data: conditions.map((condition) => ({ ...condition, shopId, rateRuleId: id }))
      });
    }
    if (definitions.length > 0) {
      await transaction.rateDefinition.createMany({
        data: definitions.map((definition) => ({ ...definition, shopId, rateRuleId: id }))
      });
    }
    if (schedules.length > 0) {
      await transaction.rateSchedule.createMany({
        data: schedules.map((schedule) => ({ ...schedule, shopId, rateRuleId: id }))
      });
    }
    return transaction.rateRule.findUnique({
      where: { id_shopId: { id, shopId } },
      include: completeRate
    });
  });
}
function deleteRate$2(id, shopId) {
  return prisma.rateRule.delete({ where: { id_shopId: { id, shopId } } });
}
function findRulesByShop$1(shopId) {
  return prisma.rateRule.findMany({ where: { shopId } });
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.October25;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
const unauthenticated = shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders2, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders2);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: reactRouterContext, url: request.url }),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders2.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders2,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const root = UNSAFE_withComponentProps(function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading" || navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width,initial-scale=1"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://cdn.shopify.com/"
      }), /* @__PURE__ */ jsx("link", {
        rel: "stylesheet",
        href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          minHeight: "100vh",
          position: "relative"
        },
        children: [/* @__PURE__ */ jsx(Outlet, {}), isNavigating && /* @__PURE__ */ jsx("div", {
          style: {
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          },
          "aria-busy": "true",
          children: /* @__PURE__ */ jsx(Spinner, {
            accessibilityLabel: "Loading page",
            size: "large"
          })
        })]
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const action$9 = async ({
  request
}) => {
  const {
    payload,
    session,
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9
}, Symbol.toStringTag, { value: "Module" }));
const action$8 = async ({
  request
}) => {
  const {
    shop,
    session,
    topic
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({
      where: {
        shop
      }
    });
  }
  return new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8
}, Symbol.toStringTag, { value: "Module" }));
function normalizedType(type) {
  return String(type ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function methodValues(customization) {
  return [...customization.methods ?? []].sort((left, right) => left.position - right.position).map((method) => String(method.value ?? "").trim().toLowerCase()).filter(Boolean);
}
function matchesMethod(rate, method) {
  return String(rate.name ?? "").toLowerCase().includes(method);
}
function matchesAnyMethod(rate, methods) {
  return methods.some((method) => matchesMethod(rate, method));
}
function uniqueRates(rates) {
  const seen = /* @__PURE__ */ new Set();
  return rates.filter((rate) => {
    const key = rate.id ?? `${rate.rateRuleId}:${rate.position}:${rate.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function reorder(rates, methods) {
  const ranked = [];
  const remaining = [...rates];
  for (const method of methods) {
    for (let index = 0; index < remaining.length; ) {
      if (matchesMethod(remaining[index], method)) {
        ranked.push(...remaining.splice(index, 1));
      } else {
        index += 1;
      }
    }
  }
  return [...ranked, ...remaining];
}
function apply(rates = [], matchedCustomizations = []) {
  if (!Array.isArray(rates) || !Array.isArray(matchedCustomizations)) {
    throw new TypeError("Rates and matched customizations must be arrays");
  }
  let visibleRates = [...rates];
  let hiddenRates = [];
  let reorderedRates = [];
  const renamedRates = [];
  for (const customization of matchedCustomizations) {
    const methods = methodValues(customization);
    if (methods.length === 0) continue;
    switch (normalizedType(customization.type)) {
      case "hide": {
        const hidden = visibleRates.filter((rate) => matchesAnyMethod(rate, methods));
        hiddenRates = uniqueRates([...hiddenRates, ...hidden]);
        visibleRates = visibleRates.filter((rate) => !matchesAnyMethod(rate, methods));
        break;
      }
      case "show": {
        const restored = hiddenRates.filter((rate) => matchesAnyMethod(rate, methods));
        visibleRates = uniqueRates([...visibleRates, ...restored]);
        hiddenRates = hiddenRates.filter((rate) => !matchesAnyMethod(rate, methods));
        break;
      }
      case "only_show":
      case "onlyshow": {
        const hidden = visibleRates.filter((rate) => !matchesAnyMethod(rate, methods));
        hiddenRates = uniqueRates([...hiddenRates, ...hidden]);
        visibleRates = visibleRates.filter((rate) => matchesAnyMethod(rate, methods));
        break;
      }
      case "rename":
        renamedRates.push(...visibleRates.filter((rate) => matchesAnyMethod(rate, methods)));
        break;
      case "reorder":
        visibleRates = reorder(visibleRates, methods);
        reorderedRates = [...visibleRates];
        break;
    }
  }
  return {
    visibleRates,
    hiddenRates,
    renamedRates: uniqueRates(renamedRates),
    reorderedRates
  };
}
function activeDefinitions(rateRule) {
  return (rateRule.rates ?? []).filter((definition) => String(definition.status).toUpperCase() === "ACTIVE").sort((left, right) => left.position - right.position);
}
function generate(matchedRateRules = []) {
  if (!Array.isArray(matchedRateRules)) {
    throw new TypeError("Matched rate rules must be an array");
  }
  return [...matchedRateRules].sort((left, right) => left.priority - right.priority).flatMap(
    (rateRule) => activeDefinitions(rateRule).map((definition) => ({
      ...definition,
      rule: {
        id: rateRule.id,
        name: rateRule.name,
        priority: rateRule.priority,
        exclusivity: rateRule.exclusivity
      }
    }))
  );
}
function calculate({ matchedCustomizations = [], matchedRateRules = [] } = {}) {
  const rates = generate(matchedRateRules);
  const customizationResult = apply(rates, matchedCustomizations);
  return { rates, ...customizationResult };
}
function evaluate$1({ matchedCustomizations = [], matchedRateRules = [] } = {}) {
  return {
    matchedCustomizations,
    matchedRateRules,
    ...calculate({ matchedCustomizations, matchedRateRules })
  };
}
const PRODUCT_FIELDS = /* @__PURE__ */ new Set([
  "producttitle",
  "varianttitle",
  "producttag",
  "producttype",
  "productweight",
  "productvendor",
  "productprice",
  "productcompareatprice",
  "productquantity",
  "productcollection",
  "productbarcode",
  "sku",
  "variantmetafield",
  "productmetafield",
  "lineitemproperty",
  "productlength",
  "productwidth",
  "productheight",
  "productvolume",
  "shopifyvariantid",
  "shopifyproductid",
  "issubscriptionproduct"
]);
function normalizedKey(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
function firstDefined(...values2) {
  return values2.find((value) => value !== void 0 && value !== null);
}
function lineItems(request) {
  var _a2, _b, _c;
  const items = firstDefined(
    request.lineItems,
    request.items,
    request.products,
    (_a2 = request.cart) == null ? void 0 : _a2.lineItems,
    (_b = request.cart) == null ? void 0 : _b.lines,
    (_c = request.cart) == null ? void 0 : _c.items
  );
  return Array.isArray(items) ? items : [];
}
function keyedValue(container, key) {
  if (!container || typeof container !== "object" || !key) return void 0;
  return container[key];
}
function productValue(item, field, key) {
  const product = item.product ?? item;
  const variant = item.variant ?? product.variant ?? {};
  switch (field) {
    case "producttitle":
      return firstDefined(product.title, item.productTitle, item.title);
    case "varianttitle":
      return firstDefined(variant.title, item.variantTitle);
    case "producttag":
      return firstDefined(product.tags, item.tags);
    case "producttype":
      return firstDefined(product.type, product.productType, item.productType);
    case "productweight":
      return firstDefined(item.weight, variant.weight, product.weight);
    case "productvendor":
      return firstDefined(product.vendor, item.vendor);
    case "productprice":
      return firstDefined(item.price, variant.price, product.price);
    case "productcompareatprice":
      return firstDefined(item.compareAtPrice, variant.compareAtPrice, product.compareAtPrice);
    case "productquantity":
      return firstDefined(item.quantity, 0);
    case "productcollection":
      return firstDefined(product.collections, product.collectionIds, item.collections);
    case "productbarcode":
      return firstDefined(variant.barcode, item.barcode);
    case "sku":
      return firstDefined(variant.sku, item.sku);
    case "variantmetafield":
      return keyedValue(variant.metafields ?? item.variantMetafields, key);
    case "productmetafield":
      return keyedValue(product.metafields ?? item.productMetafields, key);
    case "lineitemproperty":
      return keyedValue(item.properties, key);
    case "productlength":
      return firstDefined(item.length, variant.length, product.length);
    case "productwidth":
      return firstDefined(item.width, variant.width, product.width);
    case "productheight":
      return firstDefined(item.height, variant.height, product.height);
    case "productvolume":
      return firstDefined(item.volume, variant.volume, product.volume);
    case "shopifyvariantid":
      return firstDefined(variant.id, item.variantId);
    case "shopifyproductid":
      return firstDefined(product.id, item.productId);
    case "issubscriptionproduct":
      return firstDefined(item.isSubscription, item.subscription, item.sellingPlanId != null);
    default:
      return void 0;
  }
}
function scalarValue(request, field, key) {
  var _a2, _b, _c, _d, _e, _f, _g, _h;
  const cart = request.cart ?? request;
  const destination2 = request.destination ?? request.shippingAddress ?? request.address ?? {};
  const customer = request.customer ?? {};
  const items = lineItems(request);
  switch (field) {
    case "always":
      return true;
    case "cartsubtotal":
    case "cartsubtotaltotalbeforediscount":
      return firstDefined(cart.subtotal, cart.subtotalPrice, request.subtotal);
    case "carttotaltotalafterdiscount":
      return firstDefined(cart.total, cart.totalPrice, request.total);
    case "cartquantity":
      return firstDefined(cart.quantity, request.quantity, items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0));
    case "cartweight":
      return firstDefined(cart.weight, request.weight, items.reduce((sum, item) => sum + Number(item.weight ?? 0) * Number(item.quantity ?? 1), 0));
    case "cartvolume":
      return firstDefined(cart.volume, request.volume);
    case "cartlocale":
      return firstDefined(cart.locale, request.locale);
    case "cartattribute":
      return keyedValue(cart.attributes ?? request.attributes, key);
    case "zipcodepostcode":
      return firstDefined(destination2.zip, destination2.postcode, destination2.postalCode);
    case "provincestatecode":
      return firstDefined(destination2.provinceCode, destination2.province, destination2.stateCode);
    case "countrycode":
      return firstDefined(destination2.countryCode, destination2.country);
    case "addressline1":
      return firstDefined(destination2.address1, destination2.addressLine1);
    case "addressisapobox":
      return firstDefined(destination2.isPoBox, request.isPoBox);
    case "addressisnotapobox": {
      const isPoBox = firstDefined(destination2.isPoBox, request.isPoBox);
      return isPoBox === void 0 ? void 0 : !isPoBox;
    }
    case "timeofday":
    case "timeoftheday":
      return firstDefined(request.timeOfDay, request.time);
    case "dayoftheweek":
      return firstDefined(request.dayOfWeek, request.day);
    case "warehousezipcodepostcode":
      return firstDefined((_a2 = request.warehouse) == null ? void 0 : _a2.zip, (_b = request.warehouse) == null ? void 0 : _b.postcode, (_c = request.origin) == null ? void 0 : _c.postcode);
    case "customertag":
      return firstDefined(customer.tags, request.customerTags);
    case "customerfirstname":
      return firstDefined(customer.firstName, request.customerFirstName);
    case "customerlastname":
      return firstDefined(customer.lastName, request.customerLastName);
    case "customerloggedin":
      return firstDefined(customer.loggedIn, request.customerLoggedIn);
    case "customercompany":
      return firstDefined((_d = customer.company) == null ? void 0 : _d.name, customer.company, request.customerCompany);
    case "customermetafield":
      return keyedValue(customer.metafields, key);
    case "companymetafield":
      return keyedValue((_e = customer.company) == null ? void 0 : _e.metafields, key);
    case "companylocationmetafield":
      return keyedValue((_f = customer.companyLocation) == null ? void 0 : _f.metafields, key);
    case "shippingmethodname":
      return firstDefined((_g = request.shippingMethod) == null ? void 0 : _g.name, request.shippingMethodName);
    case "shippingrate":
      return firstDefined((_h = request.shippingMethod) == null ? void 0 : _h.price, request.shippingRate);
    case "numberofvendors": {
      const vendors = items.map((item) => productValue(item, "productvendor")).filter(Boolean);
      return new Set(vendors.map((vendor) => String(vendor).toLowerCase())).size;
    }
    default:
      return firstDefined(request[field], cart[field]);
  }
}
function values(value) {
  if (Array.isArray(value)) return value.flatMap(values);
  if (value && typeof value === "object") {
    return [firstDefined(value.value, value.id, value.handle, value.title, value.name)];
  }
  return [value];
}
function expectedValues(value) {
  if (Array.isArray(value)) return value.flatMap(expectedValues);
  if (typeof value !== "string") return [value];
  return value.split(/[;,]/).map((part) => part.trim()).filter(Boolean);
}
function equals(actual, expected) {
  if (typeof actual === "boolean") {
    const normalized = String(expected).trim().toLowerCase();
    return actual === ["true", "1", "yes"].includes(normalized);
  }
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  if (actual !== "" && expected !== "" && Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
    return actualNumber === expectedNumber;
  }
  return String(actual ?? "").trim().toLowerCase() === String(expected ?? "").trim().toLowerCase();
}
function compare(actualValue, operator, expectedValue) {
  const actual = values(actualValue);
  const expected = expectedValues(expectedValue);
  const normalizedOperator = normalizedKey(operator);
  const anyEqual = actual.some((left) => expected.some((right) => equals(left, right)));
  const anyContains = actual.some(
    (left) => expected.some((right) => String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase()))
  );
  switch (normalizedOperator) {
    case "equals":
      return anyEqual;
    case "notequals":
    case "doesnotequal":
      return !anyEqual;
    case "contains":
      return anyContains;
    case "doesnotcontain":
    case "doesnotcontains":
      return !anyContains;
    case "includesinlist":
      return anyEqual;
    case "notincludesinlist":
      return !anyEqual;
    case "isempty":
      return actual.every((value) => value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0);
    case "isnotempty":
      return actual.some((value) => value !== void 0 && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0));
    case "true":
      return actual.some((value) => equals(value, true));
    case "false":
      return actual.some((value) => equals(value, false));
    case "greaterthan":
      return actual.some((value) => Number(value) > Number(expectedValue));
    case "greaterthanorequal":
      return actual.some((value) => Number(value) >= Number(expectedValue));
    case "lessthan":
      return actual.some((value) => Number(value) < Number(expectedValue));
    case "lessthanorequal":
      return actual.some((value) => Number(value) <= Number(expectedValue));
    default:
      return false;
  }
}
function productMatch(condition, request, field) {
  const items = lineItems(request);
  const matches = items.filter((item) => compare(productValue(item, field, condition.key), condition.operator, condition.value));
  const quantity = matches.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0);
  const amount = matches.reduce((sum, item) => {
    var _a2;
    return sum + Number(item.price ?? ((_a2 = item.variant) == null ? void 0 : _a2.price) ?? 0) * Number(item.quantity ?? 1);
  }, 0);
  const threshold = Number(condition.matchValue ?? condition.quantityValue ?? 0);
  const mode = condition.productMatch ?? condition.quantityCheck ?? "atLeastOne";
  switch (normalizedKey(mode)) {
    case "allproducts":
      return items.length > 0 && matches.length === items.length;
    case "exactquantity":
      return quantity === threshold;
    case "morequantity":
    case "moreproducts":
      return quantity > threshold;
    case "notmorequantity":
      return quantity <= threshold;
    case "lessproducts":
      return quantity < threshold;
    case "moreamount":
      return amount > threshold;
    case "notmoreamount":
      return amount <= threshold;
    case "lessamount":
      return amount < threshold;
    default:
      return matches.length > 0;
  }
}
function matchesCondition(condition, request) {
  if (!condition || typeof condition !== "object" || !request || typeof request !== "object") {
    return false;
  }
  const field = normalizedKey(condition.subfield || condition.field);
  if (PRODUCT_FIELDS.has(field)) return productMatch(condition, request, field);
  if (["cartcontains", "cartdoesnotcontain"].includes(normalizedKey(condition.field))) {
    const matched = productMatch(condition, request, normalizedKey(condition.subfield));
    return normalizedKey(condition.field) === "cartdoesnotcontain" ? !matched : matched;
  }
  return compare(scalarValue(request, field, condition.key), condition.operator, condition.value);
}
function matchesAll$1(conditions, request, mode) {
  if (conditions.length === 0) return true;
  return String(mode).toUpperCase() === "ANY" ? conditions.some((condition) => matchesCondition(condition, request)) : conditions.every((condition) => matchesCondition(condition, request));
}
function matchCustomizations(customizations, request) {
  if (!Array.isArray(customizations)) return [];
  return customizations.filter(
    (customization) => String(customization.status).toUpperCase() === "ACTIVE" && matchesAll$1(customization.conditions ?? [], request, customization.conditionMatch)
  );
}
function matchesAll(conditions, request, mode) {
  if (conditions.length === 0) return true;
  return String(mode).toUpperCase() === "ANY" ? conditions.some((condition) => matchesCondition(condition, request)) : conditions.every((condition) => matchesCondition(condition, request));
}
function matchRateRules(rateRules, request) {
  if (!Array.isArray(rateRules)) return [];
  return rateRules.filter(
    (rateRule) => String(rateRule.status).toUpperCase() === "ACTIVE" && matchesAll(rateRule.conditions ?? [], request, rateRule.conditionMatch)
  );
}
function evaluate(input = {}, configuration) {
  const { customizations = [], rateRules = [], request } = input;
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("Shipping request must be an object");
  }
  return {
    matchedCustomizations: matchCustomizations(customizations, request),
    matchedRateRules: matchRateRules(rateRules, request)
  };
}
function requiredString$2(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}
function createShippingRequest({ shopId, currency = null, ...request }) {
  return {
    ...request,
    shopId: requiredString$2(shopId, "shopId"),
    currency
  };
}
function object(value, field) {
  if (value === void 0 || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}
function optionalNumber(value, field) {
  if (value === void 0 || value === null || value === "") return void 0;
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw new TypeError(`${field} must be a number`);
  }
  return normalized;
}
function optionalCurrency(value) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new TypeError("currency must be a three-letter code");
  }
  return value.trim().toUpperCase();
}
function compact(objectValue) {
  return Object.fromEntries(
    Object.entries(objectValue).filter(([, value]) => value !== void 0)
  );
}
function normalizeItem(item, index) {
  const normalized = object(item, `items[${index}]`);
  return compact({
    ...normalized,
    quantity: optionalNumber(normalized.quantity, `items[${index}].quantity`) ?? 1,
    price: optionalNumber(normalized.price, `items[${index}].price`),
    weight: optionalNumber(normalized.weight, `items[${index}].weight`),
    product: normalized.product ? { ...object(normalized.product, `items[${index}].product`) } : void 0,
    variant: normalized.variant ? { ...object(normalized.variant, `items[${index}].variant`) } : void 0
  });
}
function map(input, { shopId } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Shipping request must be an object");
  }
  const request = input;
  const rawCart = object(request.cart, "cart");
  const rawItems = request.items ?? request.lineItems ?? rawCart.items ?? rawCart.lines ?? [];
  if (!Array.isArray(rawItems)) {
    throw new TypeError("items must be an array");
  }
  const currency = optionalCurrency(
    request.currency ?? request.currencyCode ?? rawCart.currency ?? rawCart.currencyCode
  );
  const cart = compact({
    ...rawCart,
    subtotal: optionalNumber(
      rawCart.subtotal ?? rawCart.subtotalPrice ?? request.subtotal,
      "cart.subtotal"
    ),
    total: optionalNumber(rawCart.total ?? rawCart.totalPrice ?? request.total, "cart.total"),
    quantity: optionalNumber(rawCart.quantity ?? request.quantity, "cart.quantity"),
    weight: optionalNumber(rawCart.weight ?? request.weight, "cart.weight"),
    volume: optionalNumber(rawCart.volume ?? request.volume, "cart.volume")
  });
  return createShippingRequest({
    ...request,
    shopId: shopId ?? request.shopId,
    currency,
    cart,
    items: rawItems.map(normalizeItem),
    destination: { ...object(request.destination ?? request.shippingAddress ?? request.address, "destination") },
    customer: { ...object(request.customer, "customer") }
  });
}
function copy(value, seen = /* @__PURE__ */ new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (seen.has(value)) return seen.get(value);
  const cloned = Array.isArray(value) ? [] : {};
  seen.set(value, cloned);
  for (const [key, nestedValue] of Object.entries(value)) {
    cloned[key] = copy(nestedValue, seen);
  }
  return cloned;
}
function freeze(value, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const nestedValue of Object.values(value)) {
    freeze(nestedValue, seen);
  }
  return Object.freeze(value);
}
function number$1(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : Number.MAX_SAFE_INTEGER;
}
function compareRates(left, right) {
  var _a2, _b;
  return number$1((_a2 = left.rule) == null ? void 0 : _a2.priority) - number$1((_b = right.rule) == null ? void 0 : _b.priority) || number$1(left.position) - number$1(right.position) || String(left.name ?? "").localeCompare(String(right.name ?? "")) || String(left.id ?? "").localeCompare(String(right.id ?? ""));
}
function format(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new TypeError("Shipping Engine response must be an object");
  }
  const rates = response.visibleRates ?? response.rates ?? [];
  const matchedCustomizations = response.matchedCustomizations ?? [];
  const matchedRateRules = response.matchedRateRules ?? [];
  if (![rates, matchedCustomizations, matchedRateRules].every(Array.isArray)) {
    throw new TypeError("Shipping Engine response collections must be arrays");
  }
  return freeze({
    rates: copy(rates).sort(compareRates),
    matchedCustomizations: copy(matchedCustomizations),
    matchedRateRules: copy(matchedRateRules)
  });
}
async function evaluateShippingRules(shopId, request) {
  const [shop, customizations, rateRules] = await Promise.all([
    findShopById$1(shopId),
    findCustomizationsByShop$1(shopId),
    findRatesByShop$1(shopId)
  ]);
  if (!shop) {
    throw new TypeError("Shop was not found");
  }
  return evaluate({ customizations, rateRules, request });
}
async function calculateShipping(shopId, request) {
  const mappedRequest = map(request, { shopId });
  const ruleEvaluation = await evaluateShippingRules(shopId, mappedRequest);
  const engineResult = evaluate$1(ruleEvaluation);
  return format(engineResult);
}
const STATUSES$1 = /* @__PURE__ */ new Set(["DRAFT", "ACTIVE"]);
const CONDITION_MATCHES$1 = /* @__PURE__ */ new Set(["ALL", "ANY"]);
const EXCLUSIVITIES = /* @__PURE__ */ new Set(["INCLUSIVE", "EXCLUSIVE"]);
const SCHEDULE_ACTIONS$1 = /* @__PURE__ */ new Set(["ACTIVATE", "DEACTIVATE"]);
const QUANTITY_CHECKS = /* @__PURE__ */ new Set([
  "atLeastOne",
  "moreProducts",
  "lessProducts",
  "moreAmount",
  "lessAmount"
]);
const CURRENCY_CODES = /* @__PURE__ */ new Map([
  ["Default Store Currency", "USD"],
  ["United Arab Emirates Dirham", "AED"],
  ["Australian Dollars", "AUD"],
  ["Canadian Dollars", "CAD"],
  ["Euro", "EUR"],
  ["United Kingdom Pounds", "GBP"],
  ["Indian Rupees", "INR"],
  ["Japanese Yen", "JPY"],
  ["New Zealand Dollars", "NZD"],
  ["United States Dollars", "USD"],
  ["South African Rand", "ZAR"],
  ["Hong Kong Dollars", "HKD"],
  ["Swiss Francs", "CHF"],
  ["Polish Zlotych", "PLN"]
]);
const VALID_CURRENCY_CODES = new Set(CURRENCY_CODES.values());
const NON_NEGATIVE_RATE_FIELDS = [
  "price",
  "defaultRate",
  "rangeStart",
  "rangeEnd",
  "basePrice",
  "incrementalPrice",
  "perEach",
  "startFrom",
  "secondRangeStart",
  "secondRangeEnd",
  "discount",
  "handlingPercent",
  "handlingFixed"
];
const BOOLEAN_RATE_FIELDS = [
  "roundUp",
  "increasePerItem",
  "hideDeliveryDates",
  "fuelLevy"
];
function requireObject$3(value, field = "Rate data") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
}
function requireString$1(value, field, maximumLength = 255) {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${field} is required`);
  }
  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }
  return normalized;
}
function optionalString$1(value, field, maximumLength = 2e3) {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }
  return normalized || null;
}
function integer(value, field, minimum, required = true) {
  if (!required && (value === void 0 || value === null || value === "")) {
    return null;
  }
  const normalized = typeof value === "string" && value.trim() ? Number(value) : value;
  if (!Number.isInteger(normalized)) {
    throw new TypeError(`${field} must be an integer`);
  }
  if (normalized < minimum) {
    throw new RangeError(`${field} must be ${minimum} or greater`);
  }
  return normalized;
}
function enumValue(value, field, values2, fallback) {
  const normalized = requireString$1(value ?? fallback, field).toUpperCase();
  if (!values2.has(normalized)) {
    throw new TypeError(`${field} must be one of: ${[...values2].join(", ")}`);
  }
  return normalized;
}
function validatePositions(items, field) {
  const positions = /* @__PURE__ */ new Set();
  for (const item of items) {
    if (positions.has(item.position)) {
      throw new TypeError(`${field} contains duplicate position ${item.position}`);
    }
    positions.add(item.position);
  }
}
function validateConditions$1(conditions) {
  if (!Array.isArray(conditions)) {
    throw new TypeError("conditions must be an array");
  }
  if (conditions.length > 100) {
    throw new RangeError("conditions must contain 100 items or fewer");
  }
  const normalized = conditions.map((condition, index) => {
    requireObject$3(condition, `conditions[${index}]`);
    const quantityCheck = optionalString$1(
      condition.quantityCheck,
      `conditions[${index}].quantityCheck`,
      50
    );
    if (quantityCheck && !QUANTITY_CHECKS.has(quantityCheck)) {
      throw new TypeError(
        `conditions[${index}].quantityCheck must be one of: ${[...QUANTITY_CHECKS].join(", ")}`
      );
    }
    return {
      position: integer(condition.position ?? index, `conditions[${index}].position`, 0),
      field: requireString$1(condition.field, `conditions[${index}].field`),
      subfield: optionalString$1(condition.subfield, `conditions[${index}].subfield`, 255),
      key: optionalString$1(condition.key, `conditions[${index}].key`, 255),
      operator: requireString$1(condition.operator, `conditions[${index}].operator`, 100),
      value: optionalString$1(condition.value, `conditions[${index}].value`),
      quantityCheck,
      quantityValue: optionalString$1(
        condition.quantityValue,
        `conditions[${index}].quantityValue`
      )
    };
  });
  validatePositions(normalized, "conditions");
  return normalized;
}
function validateCurrency(rate, field) {
  const currencyCode = rate.currencyCode ? requireString$1(rate.currencyCode, `${field}.currencyCode`).toUpperCase() : CURRENCY_CODES.get(rate.currency);
  if (!currencyCode || !VALID_CURRENCY_CODES.has(currencyCode)) {
    throw new TypeError(`${field}.currency must be a supported currency`);
  }
  return currencyCode;
}
function validateRateSafetyFields(rate, field) {
  for (const key of NON_NEGATIVE_RATE_FIELDS) {
    if (rate[key] === void 0 || rate[key] === null || rate[key] === "") continue;
    const value = Number(rate[key]);
    if (!Number.isFinite(value)) {
      throw new TypeError(`${field}.${key} must be a number`);
    }
    if (value < 0) {
      throw new RangeError(`${field}.${key} must be zero or greater`);
    }
  }
  for (const key of BOOLEAN_RATE_FIELDS) {
    if (rate[key] !== void 0 && typeof rate[key] !== "boolean") {
      throw new TypeError(`${field}.${key} must be a boolean`);
    }
  }
}
function validateDefinitions(zoneRates, ruleStatus) {
  requireObject$3(zoneRates, "zoneRates");
  const entries = Object.entries(zoneRates).flatMap(
    ([zoneKey, rates]) => (Array.isArray(rates) ? rates : [rates]).map((rate) => [zoneKey, rate])
  );
  if (entries.length > 100) {
    throw new RangeError("zoneRates must contain 100 entries or fewer");
  }
  const definitions = entries.map(([zoneKey, rate], index) => {
    const field = `zoneRates.${zoneKey}`;
    requireObject$3(rate, field);
    validateRateSafetyFields(rate, field);
    const minimumDays = integer(rate.minimumDays, `${field}.minimumDays`, 0, false);
    const maximumDays = integer(rate.maximumDays, `${field}.maximumDays`, 0, false);
    if (minimumDays !== null && maximumDays !== null && maximumDays < minimumDays) {
      throw new RangeError(`${field}.maximumDays must be greater than or equal to minimumDays`);
    }
    return {
      position: integer(rate.position ?? index, `${field}.position`, 0),
      zoneKey: requireString$1(zoneKey, `${field}.zoneKey`),
      name: requireString$1(rate.name, `${field}.name`),
      calculation: requireString$1(
        rate.calculation ?? "Fixed rate",
        `${field}.calculation`
      ),
      price: rate.price === void 0 || rate.price === null || rate.price === "" ? null : Number(rate.price),
      description: optionalString$1(rate.description, `${field}.description`),
      minimumDays,
      maximumDays,
      tags: optionalString$1(rate.tags, `${field}.tags`),
      currencyCode: validateCurrency(rate, field),
      status: enumValue(rate.status ?? ruleStatus, `${field}.status`, STATUSES$1, "DRAFT")
    };
  });
  validatePositions(definitions, "rate definitions");
  return definitions;
}
function validateSchedules$1(schedules = []) {
  if (!Array.isArray(schedules)) {
    throw new TypeError("schedules must be an array");
  }
  if (schedules.length > 100) {
    throw new RangeError("schedules must contain 100 items or fewer");
  }
  return schedules.map((schedule, position) => {
    requireObject$3(schedule, `schedules[${position}]`);
    const scheduledAtValue = requireString$1(
      schedule.scheduledAt,
      `schedules[${position}].scheduledAt`
    );
    const scheduledAt = new Date(scheduledAtValue);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new TypeError(`schedules[${position}].scheduledAt must be a valid date and time`);
    }
    return {
      position,
      action: enumValue(
        schedule.action,
        `schedules[${position}].action`,
        SCHEDULE_ACTIONS$1,
        "ACTIVATE"
      ),
      scheduledAt,
      timezone: requireString$1(schedule.timezone, `schedules[${position}].timezone`, 100)
    };
  });
}
function validateRate(data) {
  requireObject$3(data);
  const status = enumValue(data.status, "status", STATUSES$1, "DRAFT");
  return {
    rule: {
      shopId: requireString$1(data.shopId, "shopId"),
      name: requireString$1(data.name, "name"),
      priority: integer(data.priority, "priority", 0),
      status,
      conditionMatch: enumValue(
        data.conditionMatch,
        "conditionMatch",
        CONDITION_MATCHES$1,
        "ALL"
      ),
      exclusivity: enumValue(
        data.exclusivity,
        "exclusivity",
        EXCLUSIVITIES,
        "INCLUSIVE"
      )
    },
    conditions: validateConditions$1(data.conditions),
    definitions: validateDefinitions(data.zoneRates, status),
    schedules: validateSchedules$1(data.schedules)
  };
}
function createRate$1(data) {
  return createRate$2(validateRate(data));
}
function findRatesByShop(shopId) {
  return findRatesByShop$1(shopId);
}
function updateRate$1(id, shopId, data) {
  return updateRate$2(id, shopId, validateRate({ ...data, shopId }));
}
function deleteRate$1(id, shopId) {
  return deleteRate$2(id, shopId);
}
function findRulesByShop(shopId) {
  return findRulesByShop$1(shopId);
}
const CUSTOMIZATION_TYPES = /* @__PURE__ */ new Set(["hide", "show", "only_show", "reorder", "rename"]);
const STATUSES = /* @__PURE__ */ new Set(["DRAFT", "ACTIVE"]);
const CONDITION_MATCHES = /* @__PURE__ */ new Set(["ALL", "ANY"]);
const SHIPMENT_SCOPES = /* @__PURE__ */ new Set(["ALL", "FIRST"]);
const SCHEDULE_ACTIONS = /* @__PURE__ */ new Set(["ACTIVATE", "DEACTIVATE"]);
const PRODUCT_MATCHES = /* @__PURE__ */ new Set([
  "at-least-one",
  "all-products",
  "exact-quantity",
  "more-quantity",
  "not-more-quantity",
  "more-amount",
  "not-more-amount"
]);
const CUSTOMIZATION_TYPE_ALIASES = /* @__PURE__ */ new Map([
  ["hide shipping rates", "hide"],
  ["show shipping rates", "show"],
  ["only show specified shipping rates and hide rest", "only_show"],
  ["reorder shipping rates", "reorder"],
  ["rename shipping rates", "rename"]
]);
const CONDITION_FIELDS = {
  1: /* @__PURE__ */ new Set([
    "Cart Subtotal",
    "Cart Quantity",
    "Cart Weight",
    "Product Tag",
    "Product Title",
    "Product Type",
    "Product Weight",
    "Product Vendor",
    "Variant Title",
    "Line Item Property",
    "Product Price",
    "Product Collection",
    "Customer Tag",
    "Customer Logged In",
    "Customer Company",
    "Customer First Name",
    "Zipcode / Postcode",
    "Country Code",
    "Address Line 1",
    "Address is a PO Box",
    "Address is not a PO Box",
    "Shipping Method Name",
    "Shipping Rate",
    "Always",
    "Number Of Vendors"
  ]),
  2: /* @__PURE__ */ new Set([
    "Cart Attribute",
    "SKU",
    "Product Tag",
    "Variant Metafield",
    "Is subscription product",
    "Province / State Code",
    "Country Code",
    "Address Line 1",
    "Address is a PO Box",
    "Address is not a PO Box",
    "Customer Tag",
    "Customer Metafield",
    "Company Metafield",
    "Customer First Name"
  ]),
  3: /* @__PURE__ */ new Set([
    "Cart Subtotal",
    "Cart Weight",
    "Company Location Metafield",
    "Customer First Name",
    "Zipcode / Postcode"
  ])
};
const OPERATORLESS_FIELDS = /* @__PURE__ */ new Set([
  "Address is a PO Box",
  "Address is not a PO Box",
  "Always"
]);
const VALUELESS_FIELDS = /* @__PURE__ */ new Set([
  ...OPERATORLESS_FIELDS,
  "Customer Logged In",
  "Is subscription product"
]);
const VALUELESS_OPERATORS = /* @__PURE__ */ new Set(["is empty", "is not empty", "true", "false"]);
function requireObject$2(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Customization data must be an object");
  }
}
function requireString(value, field, maximumLength = 255) {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${field} is required`);
  }
  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }
  return normalized;
}
function requireInteger(value, field, minimum, maximum) {
  const normalized = typeof value === "string" && value.trim() ? Number(value) : value;
  if (!Number.isInteger(normalized)) {
    throw new TypeError(`${field} must be an integer`);
  }
  if (normalized < minimum || normalized > maximum) {
    throw new RangeError(`${field} must be between ${minimum} and ${maximum}`);
  }
  return normalized;
}
function requireEnum(value, field, allowedValues, normalize) {
  const normalized = normalize(requireString(value, field));
  if (!allowedValues.has(normalized)) {
    throw new TypeError(`${field} must be one of: ${[...allowedValues].join(", ")}`);
  }
  return normalized;
}
function optionalString(value, field, maximumLength = 2e3) {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new RangeError(`${field} must be ${maximumLength} characters or fewer`);
  }
  return normalized || null;
}
function validateConditions(conditionsBySet, parameterSet) {
  requireObject$2(conditionsBySet);
  const conditions = conditionsBySet[String(parameterSet)];
  if (!Array.isArray(conditions)) {
    throw new TypeError(`conditionsBySet.${parameterSet} must be an array`);
  }
  if (conditions.length > 100) {
    throw new RangeError("conditions must contain 100 items or fewer");
  }
  return conditions.map((condition, position) => {
    requireObject$2(condition);
    const field = requireString(condition.field, `conditions[${position}].field`);
    if (!CONDITION_FIELDS[parameterSet].has(field)) {
      throw new TypeError(
        `conditions[${position}].field is not valid for parameter set ${parameterSet}`
      );
    }
    const productMatch2 = optionalString(
      condition.productMatch,
      `conditions[${position}].productMatch`,
      50
    );
    if (productMatch2 && !PRODUCT_MATCHES.has(productMatch2)) {
      throw new TypeError(
        `conditions[${position}].productMatch must be one of: ${[...PRODUCT_MATCHES].join(", ")}`
      );
    }
    const operator = optionalString(
      condition.operator,
      `conditions[${position}].operator`,
      100
    );
    const value = optionalString(condition.value, `conditions[${position}].value`);
    const matchValue = optionalString(
      condition.matchValue,
      `conditions[${position}].matchValue`
    );
    if (!OPERATORLESS_FIELDS.has(field) && !operator) {
      throw new TypeError(`conditions[${position}].operator is required`);
    }
    if (!VALUELESS_FIELDS.has(field) && !VALUELESS_OPERATORS.has(String(operator).toLowerCase()) && !value) {
      throw new TypeError(`conditions[${position}].value is required`);
    }
    if (productMatch2 && !["at-least-one", "all-products"].includes(productMatch2) && !matchValue) {
      throw new TypeError(`conditions[${position}].matchValue is required`);
    }
    return {
      position,
      field,
      operator,
      key: optionalString(condition.key, `conditions[${position}].key`),
      value,
      productMatch: productMatch2,
      matchValue
    };
  });
}
function validateMethods(methods, customizationType) {
  if (!Array.isArray(methods)) {
    throw new TypeError("methods must be an array");
  }
  if (methods.length > 100) {
    throw new RangeError("methods must contain 100 items or fewer");
  }
  const normalizedMethods = methods.map((method, index) => {
    if (typeof method === "string") {
      const value2 = optionalString(method, `methods[${index}]`, 255);
      if (!value2) return null;
      if (customizationType === "rename") {
        throw new TypeError(`methods[${index}].replacementValue is required`);
      }
      return { value: value2, replacementValue: null };
    }
    requireObject$2(method);
    const value = optionalString(method.value, `methods[${index}].value`, 255);
    if (!value) return null;
    const replacementValue = method.replacementValue === void 0 || method.replacementValue === null ? null : requireString(
      method.replacementValue,
      `methods[${index}].replacementValue`,
      255
    );
    if (customizationType === "rename" && !replacementValue) {
      throw new TypeError(`methods[${index}].replacementValue is required`);
    }
    return { value, replacementValue };
  }).filter(Boolean);
  if (normalizedMethods.length === 0) {
    throw new TypeError("methods must contain at least one shipping method");
  }
  return normalizedMethods.map((method, position) => ({ position, ...method }));
}
function validateSchedules(schedules = []) {
  if (!Array.isArray(schedules)) {
    throw new TypeError("schedules must be an array");
  }
  if (schedules.length > 100) {
    throw new RangeError("schedules must contain 100 items or fewer");
  }
  return schedules.map((schedule, position) => {
    requireObject$2(schedule);
    const scheduledAtValue = requireString(
      schedule.scheduledAt,
      `schedules[${position}].scheduledAt`
    );
    const scheduledAt = new Date(scheduledAtValue);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new TypeError(`schedules[${position}].scheduledAt must be a valid date and time`);
    }
    return {
      position,
      action: requireEnum(
        schedule.action,
        `schedules[${position}].action`,
        SCHEDULE_ACTIONS,
        (value) => value.toUpperCase()
      ),
      scheduledAt,
      timezone: requireString(schedule.timezone, `schedules[${position}].timezone`, 100)
    };
  });
}
function normalizeCustomizationType(value) {
  const normalized = value.toLowerCase();
  return CUSTOMIZATION_TYPE_ALIASES.get(normalized) ?? normalized;
}
function validateCustomization(data) {
  requireObject$2(data);
  const parameterSet = requireInteger(data.parameterSet, "parameterSet", 1, 3);
  const type = requireEnum(data.type, "type", CUSTOMIZATION_TYPES, normalizeCustomizationType);
  return {
    ...data,
    shopId: requireString(data.shopId, "shopId"),
    name: requireString(data.name, "name"),
    type,
    status: requireEnum(data.status ?? "DRAFT", "status", STATUSES, (value) => value.toUpperCase()),
    parameterSet,
    conditionMatch: requireEnum(
      data.conditionMatch ?? "ALL",
      "conditionMatch",
      CONDITION_MATCHES,
      (value) => value.toUpperCase()
    ),
    shipmentScope: requireEnum(
      data.shipmentScope ?? "ALL",
      "shipmentScope",
      SHIPMENT_SCOPES,
      (value) => value.toUpperCase()
    ),
    conditions: validateConditions(data.conditionsBySet, parameterSet),
    methods: validateMethods(data.methods, type),
    schedules: validateSchedules(data.schedules)
  };
}
function createCustomization$1(data) {
  const validated = validateCustomization(data);
  const {
    conditions,
    methods,
    schedules,
    conditionsBySet: _conditionsBySet,
    ...customization
  } = validated;
  return createCustomization$2({
    customization,
    conditions,
    methods,
    schedules
  });
}
function findCustomizationsByShop(shopId) {
  return findCustomizationsByShop$1(shopId);
}
function updateCustomization$1(id, shopId, data) {
  const validated = validateCustomization({ ...data, shopId });
  const {
    conditions,
    methods,
    schedules,
    conditionsBySet: _conditionsBySet,
    ...customization
  } = validated;
  return updateCustomization$2(id, shopId, {
    customization,
    conditions,
    methods,
    schedules
  });
}
function deleteCustomization$1(id, shopId) {
  return deleteCustomization$2(id, shopId);
}
function createShop(data) {
  return createShop$1(data);
}
function findShopById(id) {
  return findShopById$1(id);
}
function findShopByDomain(shopDomain) {
  return findShopByDomain$1(shopDomain);
}
function compareValues(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""));
}
function byPosition(left, right) {
  return (left.position ?? 0) - (right.position ?? 0) || compareValues(left.id, right.id);
}
function orderedChildren(items = []) {
  return [...items].sort(byPosition);
}
function scheduleInstant(schedule) {
  const instant = new Date(schedule == null ? void 0 : schedule.scheduledAt).getTime();
  return Number.isFinite(instant) ? instant : null;
}
function byScheduleTime(left, right) {
  return scheduleInstant(left) - scheduleInstant(right) || byPosition(left, right);
}
function resolveEffectiveStatus(customization, asOf) {
  const effectiveAt = new Date(asOf).getTime();
  if (!Number.isFinite(effectiveAt)) {
    throw new TypeError("Effective configuration time must be a valid date");
  }
  const lastDueSchedule = [...customization.schedules ?? []].filter((schedule) => {
    const instant = scheduleInstant(schedule);
    const action2 = String((schedule == null ? void 0 : schedule.action) ?? "").toUpperCase();
    return instant !== null && instant <= effectiveAt && (action2 === "ACTIVATE" || action2 === "DEACTIVATE");
  }).sort(byScheduleTime).at(-1);
  if (!lastDueSchedule) {
    return customization.status;
  }
  return String(lastDueSchedule.action).toUpperCase() === "ACTIVATE" ? "ACTIVE" : "INACTIVE";
}
function orderedCustomizations(customizations = [], asOf) {
  return [...customizations].sort((left, right) => compareValues(left.id, right.id)).map((customization) => ({
    ...customization,
    status: resolveEffectiveStatus(customization, asOf),
    conditions: orderedChildren(customization.conditions),
    methods: orderedChildren(customization.methods).map((method) => ({
      ...method,
      replacementValue: method.replacementValue ?? null
    })),
    schedules: orderedChildren(customization.schedules)
  }));
}
function orderedRateRules(rateRules = []) {
  return [...rateRules].sort(
    (left, right) => (left.priority ?? 0) - (right.priority ?? 0) || compareValues(left.id, right.id)
  ).map((rateRule) => ({
    ...rateRule,
    conditions: orderedChildren(rateRule.conditions),
    rates: orderedChildren(rateRule.rates),
    schedules: orderedChildren(rateRule.schedules)
  }));
}
function normalizedField(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function conditionTags(customizations = [], expectedField) {
  return [
    ...new Set(
      customizations.flatMap(
        (customization) => (customization.conditions ?? []).filter(({ field }) => normalizedField(field) === expectedField).flatMap(
          ({ value, matchValue }) => String(value ?? matchValue ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)
        )
      )
    )
  ].sort(compareValues);
}
function build({ shop, customizations, rateRules, asOf = /* @__PURE__ */ new Date() }) {
  var _a2;
  if (!shop) {
    throw new TypeError("Shop was not found");
  }
  return {
    shop: { ...shop },
    testMode: ((_a2 = shop.configuration) == null ? void 0 : _a2.customizationsEnabled) !== true,
    customerTags: conditionTags(customizations, "customer_tag"),
    productTags: conditionTags(customizations, "product_tag"),
    customizations: orderedCustomizations(customizations, asOf),
    rateRules: orderedRateRules(rateRules)
  };
}
function canonicalize(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
}
function serialize(configuration) {
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new TypeError("Configuration must be an object");
  }
  return JSON.stringify(canonicalize(configuration));
}
async function syncFunctionConfiguration$1(shopId, writeConfiguration, { asOf = /* @__PURE__ */ new Date() } = {}) {
  if (typeof writeConfiguration !== "function") {
    throw new TypeError("Function configuration writer is required");
  }
  const [shop, customizations, rateRules] = await Promise.all([
    findShopById(shopId),
    findCustomizationsByShop(shopId),
    findRatesByShop(shopId)
  ]);
  const configurationObject = build({
    shop,
    customizations,
    rateRules,
    asOf
  });
  const configuration = serialize(configurationObject);
  const { ownerId, metafield } = await writeConfiguration({
    shop,
    configuration
  });
  return {
    success: true,
    ownerId,
    metafieldId: metafield.id,
    updatedAt: metafield.updatedAt
  };
}
const OWNER_QUERY = `#graphql
  query DeliveryCustomizationOwners {
    deliveryCustomizations(first: 100) {
      nodes {
        id
        shopifyFunction {
          appKey
        }
      }
    }
  }
`;
const CREATE_OWNER_MUTATION = `#graphql
  mutation CreateDeliveryCustomizationOwner(
    $deliveryCustomization: DeliveryCustomizationInput!
  ) {
    deliveryCustomizationCreate(
      deliveryCustomization: $deliveryCustomization
    ) {
      deliveryCustomization {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
async function loadExistingOwner(admin, appKey) {
  var _a2, _b, _c, _d;
  const response = await admin.graphql(OWNER_QUERY);
  const payload = await response.json();
  if ((_a2 = payload.errors) == null ? void 0 : _a2.length) {
    throw new Error("Unable to load Shopify Delivery Customizations");
  }
  return (_d = (_c = (_b = payload.data) == null ? void 0 : _b.deliveryCustomizations) == null ? void 0 : _c.nodes) == null ? void 0 : _d.find(
    ({ shopifyFunction }) => (shopifyFunction == null ? void 0 : shopifyFunction.appKey) === appKey
  );
}
async function ensureDeliveryCustomizationOwner({
  admin,
  appKey,
  functionHandle,
  title
}) {
  var _a2, _b, _c, _d;
  const existingOwner = await loadExistingOwner(admin, appKey);
  if (existingOwner) {
    return {
      success: true,
      ownerId: existingOwner.id,
      created: false
    };
  }
  const response = await admin.graphql(CREATE_OWNER_MUTATION, {
    variables: {
      deliveryCustomization: {
        enabled: true,
        functionHandle,
        title
      }
    }
  });
  const payload = await response.json();
  if ((_a2 = payload.errors) == null ? void 0 : _a2.length) {
    throw new Error("Unable to create Shopify Delivery Customization");
  }
  const result = (_b = payload.data) == null ? void 0 : _b.deliveryCustomizationCreate;
  if ((_c = result == null ? void 0 : result.userErrors) == null ? void 0 : _c.length) {
    const messages = result.userErrors.map(({ message }) => message).join("; ");
    throw new Error(`Shopify rejected Delivery Customization: ${messages}`);
  }
  const ownerId = (_d = result == null ? void 0 : result.deliveryCustomization) == null ? void 0 : _d.id;
  if (!ownerId) {
    throw new Error("Shopify did not return the Delivery Customization owner");
  }
  return {
    success: true,
    ownerId,
    created: true
  };
}
function requireObject$1(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Shipping request must be an object");
  }
}
function validateShippingRequest(data) {
  requireObject$1(data);
  if (typeof data.shopId !== "string") {
    throw new TypeError("shopId must be a string");
  }
  const shopId = data.shopId.trim();
  if (!shopId) {
    throw new TypeError("shopId is required");
  }
  if (shopId.length > 255) {
    throw new RangeError("shopId must be 255 characters or fewer");
  }
  return { ...data, shopId };
}
const SHOP_DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Shop data must be an object");
  }
}
function validateShop(data) {
  requireObject(data);
  if (typeof data.shopDomain !== "string") {
    throw new TypeError("shopDomain must be a string");
  }
  const shopDomain = data.shopDomain.trim().toLowerCase();
  if (!shopDomain) {
    throw new TypeError("shopDomain is required");
  }
  if (shopDomain.length > 255) {
    throw new RangeError("shopDomain must be 255 characters or fewer");
  }
  if (!SHOP_DOMAIN_PATTERN.test(shopDomain)) {
    throw new TypeError("shopDomain must be a valid domain name");
  }
  return { ...data, shopDomain };
}
function execute(request) {
  return calculateShipping(request.shopId, request);
}
const CARRIER_SERVICE_NAME = "Calculator Shipping Rates";
const CARRIER_SERVICES_QUERY = `#graphql
  query CarrierServices {
    carrierServices(first: 50) {
      nodes {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
    }
  }
`;
const CREATE_CARRIER_SERVICE_MUTATION = `#graphql
  mutation CreateCarrierService($input: DeliveryCarrierServiceCreateInput!) {
    carrierServiceCreate(input: $input) {
      carrierService {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const UPDATE_CARRIER_SERVICE_MUTATION = `#graphql
  mutation UpdateCarrierService($input: DeliveryCarrierServiceUpdateInput!) {
    carrierServiceUpdate(input: $input) {
      carrierService {
        id
        name
        callbackUrl
        active
        supportsServiceDiscovery
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const PRODUCTS_QUERY = `#graphql
  query CarrierRateProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        tags
        productType
        vendor
      }
    }
  }
`;
function appSecret() {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error("Shopify app secret is unavailable");
  }
  return secret;
}
function signatureForShop(shopDomain) {
  return createHmac("sha256", appSecret()).update(`carrier-rates:${shopDomain}`).digest("hex");
}
function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
function callbackUrl(shopDomain) {
  const appUrl = process.env.SHOPIFY_APP_URL ?? process.env.HOST;
  if (!appUrl) {
    throw new Error("Shopify app URL is unavailable");
  }
  const url = new URL("/api/carrier-rates", appUrl);
  url.searchParams.set("shop", shopDomain);
  url.searchParams.set("signature", signatureForShop(shopDomain));
  return url.toString();
}
function graphQLError(payload, operation) {
  var _a2;
  if ((_a2 = payload.errors) == null ? void 0 : _a2.length) {
    throw new Error(`Shopify ${operation} failed`);
  }
}
function userError(result, operation) {
  var _a2;
  if ((_a2 = result == null ? void 0 : result.userErrors) == null ? void 0 : _a2.length) {
    const message = result.userErrors.map((error) => error.message).join("; ");
    throw new Error(`Shopify ${operation} was rejected: ${message}`);
  }
}
function verifyCarrierCallback(requestUrl) {
  var _a2;
  const url = new URL(requestUrl);
  const shopDomain = (_a2 = url.searchParams.get("shop")) == null ? void 0 : _a2.trim().toLowerCase();
  const signature = url.searchParams.get("signature");
  if (!shopDomain || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shopDomain) || !signature) {
    return null;
  }
  return safeEqual(signature, signatureForShop(shopDomain)) ? shopDomain : null;
}
async function ensureCarrierService$1(admin, shopDomain) {
  var _a2, _b, _c, _d, _e, _f, _g;
  const expectedCallbackUrl = callbackUrl(shopDomain);
  const queryResponse = await admin.graphql(CARRIER_SERVICES_QUERY);
  const queryPayload = await queryResponse.json();
  graphQLError(queryPayload, "carrier service lookup");
  const existing = (_c = (_b = (_a2 = queryPayload.data) == null ? void 0 : _a2.carrierServices) == null ? void 0 : _b.nodes) == null ? void 0 : _c.find(
    (service) => service.name === CARRIER_SERVICE_NAME
  );
  if (existing && existing.callbackUrl === expectedCallbackUrl && existing.active && existing.supportsServiceDiscovery === false) {
    return { ...existing, created: false };
  }
  if (existing) {
    const updateResponse = await admin.graphql(
      UPDATE_CARRIER_SERVICE_MUTATION,
      {
        variables: {
          input: {
            id: existing.id,
            name: CARRIER_SERVICE_NAME,
            callbackUrl: expectedCallbackUrl,
            active: true,
            supportsServiceDiscovery: false
          }
        }
      }
    );
    const updatePayload = await updateResponse.json();
    graphQLError(updatePayload, "carrier service update");
    userError((_d = updatePayload.data) == null ? void 0 : _d.carrierServiceUpdate, "carrier service update");
    return {
      ...updatePayload.data.carrierServiceUpdate.carrierService,
      created: false
    };
  }
  const createResponse = await admin.graphql(
    CREATE_CARRIER_SERVICE_MUTATION,
    {
      variables: {
        input: {
          name: CARRIER_SERVICE_NAME,
          callbackUrl: expectedCallbackUrl,
          active: true,
          supportsServiceDiscovery: false
        }
      }
    }
  );
  const createPayload = await createResponse.json();
  graphQLError(createPayload, "carrier service creation");
  userError((_e = createPayload.data) == null ? void 0 : _e.carrierServiceCreate, "carrier service creation");
  const carrierService = (_g = (_f = createPayload.data) == null ? void 0 : _f.carrierServiceCreate) == null ? void 0 : _g.carrierService;
  if (!carrierService) {
    throw new Error("Shopify did not return the carrier service");
  }
  return { ...carrierService, created: true };
}
function productGid(productId) {
  if (productId === void 0 || productId === null || productId === "") {
    return null;
  }
  const normalized = String(productId);
  return normalized.startsWith("gid://shopify/Product/") ? normalized : `gid://shopify/Product/${normalized}`;
}
async function loadProducts(admin, items) {
  var _a2;
  const ids = [
    ...new Set(items.map((item) => productGid(item.product_id)).filter(Boolean))
  ];
  if (!ids.length) return /* @__PURE__ */ new Map();
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { ids }
  });
  const payload = await response.json();
  graphQLError(payload, "product lookup");
  return new Map(
    (((_a2 = payload.data) == null ? void 0 : _a2.nodes) ?? []).filter(Boolean).map((product) => [product.id, product])
  );
}
function number(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}
function destination(rate) {
  const address = rate.destination ?? {};
  return {
    ...address,
    countryCode: address.country,
    provinceCode: address.province,
    zip: address.postal_code,
    address1: address.address1
  };
}
function origin(rate) {
  const address = rate.origin ?? {};
  return {
    ...address,
    countryCode: address.country,
    provinceCode: address.province,
    zip: address.postal_code,
    postcode: address.postal_code
  };
}
async function mapCarrierRequest(admin, payload, shopId) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Carrier request must be an object");
  }
  const rate = payload.rate;
  if (!rate || typeof rate !== "object" || Array.isArray(rate)) {
    throw new TypeError("Carrier request rate is required");
  }
  const rawItems = Array.isArray(rate.items) ? rate.items : [];
  const products = await loadProducts(admin, rawItems);
  const items = rawItems.map((item) => {
    const productId = productGid(item.product_id);
    const product = products.get(productId);
    const quantity = number(item.quantity, 1);
    return {
      ...item,
      quantity,
      price: number(item.price) / 100,
      weight: number(item.grams),
      productId,
      variantId: item.variant_id ? `gid://shopify/ProductVariant/${item.variant_id}` : null,
      product: product ? {
        id: product.id,
        title: product.title,
        tags: product.tags,
        productType: product.productType,
        vendor: product.vendor
      } : {
        id: productId,
        title: item.name,
        vendor: item.vendor
      },
      variant: {
        id: item.variant_id ? `gid://shopify/ProductVariant/${item.variant_id}` : null,
        sku: item.sku
      }
    };
  });
  return {
    shopId,
    currency: rate.currency,
    locale: rate.locale,
    origin: origin(rate),
    destination: destination(rate),
    cart: {
      subtotal: items.reduce(
        (total, item) => total + number(item.price) * number(item.quantity, 1),
        0
      ),
      quantity: items.reduce(
        (total, item) => total + number(item.quantity, 1),
        0
      ),
      weight: items.reduce(
        (total, item) => total + number(item.weight) * number(item.quantity, 1),
        0
      )
    },
    items
  };
}
function filterRatesForZone(result, zone) {
  if (!zone) return { ...result, rates: [] };
  return {
    ...result,
    rates: (Array.isArray(result == null ? void 0 : result.rates) ? result.rates : []).filter((rate) => {
      const zoneKey = String(rate.zoneKey ?? "");
      if (zoneKey === zone.id) return true;
      if (zoneKey.toLowerCase() === "domestic") {
        return zone.name === "Domestic" && !zone.isRestOfWorld;
      }
      if (zoneKey.toLowerCase() === "international") {
        return zone.isRestOfWorld;
      }
      return false;
    })
  };
}
function serviceCode(rate) {
  var _a2;
  const identity = String(rate.id ?? `${(_a2 = rate.rule) == null ? void 0 : _a2.id}-${rate.position}`);
  const normalized = identity.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return `calculator-${normalized}`.slice(0, 100);
}
function deliveryDateFields(rate, today) {
  const readDays = (value) => {
    if (value === null || value === void 0 || value === "") return null;
    const days = Number(value);
    return Number.isFinite(days) && days >= 0 ? days : null;
  };
  let minimumDays = readDays(rate.minimumDays);
  let maximumDays = readDays(rate.maximumDays);
  if (minimumDays === null && maximumDays === null) return {};
  if (minimumDays === null) minimumDays = maximumDays;
  if (maximumDays === null) maximumDays = minimumDays;
  if (minimumDays > maximumDays) {
    [minimumDays, maximumDays] = [maximumDays, minimumDays];
  }
  const formatDate = (days) => {
    const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1e3);
    return `${date.toISOString().slice(0, 10)} 00:00:00 +0000`;
  };
  return {
    min_delivery_date: formatDate(minimumDays),
    max_delivery_date: formatDate(maximumDays)
  };
}
function formatCarrierResponse(result, request) {
  const rates = Array.isArray(result == null ? void 0 : result.rates) ? result.rates : [];
  const today = /* @__PURE__ */ new Date();
  today.setUTCHours(0, 0, 0, 0);
  return {
    rates: rates.filter(
      (rate) => String(rate.status).toUpperCase() === "ACTIVE" && Number.isFinite(Number(rate.price)) && Number(rate.price) >= 0
    ).map((rate) => {
      var _a2;
      return {
        ...deliveryDateFields(rate, today),
        service_name: String(rate.name),
        service_code: serviceCode(rate),
        description: String(
          rate.description || ((_a2 = rate.rule) == null ? void 0 : _a2.name) || rate.name
        ),
        currency: String(
          rate.currencyCode || request.currency || "USD"
        ).toUpperCase(),
        total_price: String(Math.round(Number(rate.price) * 100))
      };
    })
  };
}
const SYNC_FUNCTION_CONFIGURATION_MUTATION = `#graphql
  mutation SyncFunctionConfiguration($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
function executeShippingPipeline(request) {
  return execute(request);
}
async function ensureCarrierService(shopDomain, authenticatedAdmin) {
  let admin = authenticatedAdmin;
  if (!admin) {
    try {
      ({ admin } = await unauthenticated.admin(shopDomain));
    } catch {
      throw new Error("Shopify authentication is unavailable");
    }
  }
  return ensureCarrierService$1(admin, shopDomain);
}
async function syncFunctionConfiguration(shopId, { asOf = /* @__PURE__ */ new Date() } = {}) {
  try {
    return await syncFunctionConfiguration$1(
      shopId,
      async ({ shop, configuration }) => {
        var _a2, _b, _c, _d;
        let admin;
        try {
          ({ admin } = await unauthenticated.admin(shop.shopDomain));
        } catch {
          throw new Error("Shopify authentication is unavailable");
        }
        const owner = await ensureDeliveryCustomizationOwner(
          {
            admin,
            appKey: process.env.SHOPIFY_API_KEY,
            functionHandle: "delivery-customization",
            title: "Calculator Delivery Customization"
          }
        );
        const metafieldResponse = await admin.graphql(
          SYNC_FUNCTION_CONFIGURATION_MUTATION,
          {
            variables: {
              metafields: [
                {
                  ownerId: owner.ownerId,
                  namespace: "$app:delivery-customization",
                  key: "function-configuration",
                  type: "json",
                  value: configuration
                }
              ]
            }
          }
        );
        const metafieldPayload = await metafieldResponse.json();
        if ((_a2 = metafieldPayload.errors) == null ? void 0 : _a2.length) {
          throw new Error("Unable to synchronize Shopify Function configuration");
        }
        const result = (_b = metafieldPayload.data) == null ? void 0 : _b.metafieldsSet;
        if ((_c = result == null ? void 0 : result.userErrors) == null ? void 0 : _c.length) {
          const messages = result.userErrors.map(({ message }) => message).join("; ");
          throw new Error(`Shopify rejected Function configuration: ${messages}`);
        }
        const metafield = (_d = result == null ? void 0 : result.metafields) == null ? void 0 : _d[0];
        if (!metafield) {
          throw new Error("Shopify did not return the synchronized metafield");
        }
        return {
          ownerId: owner.ownerId,
          metafield
        };
      },
      { asOf }
    );
  } catch (error) {
    const safeMessages = /* @__PURE__ */ new Set([
      "Shop was not found",
      "Shopify authentication is unavailable",
      "Unable to load Shopify Delivery Customizations",
      "Unable to create Shopify Delivery Customization",
      "Shopify did not return a Delivery Customization owner",
      "Unable to synchronize Shopify Function configuration",
      "Shopify did not return the synchronized metafield"
    ]);
    if (error instanceof Error && (safeMessages.has(error.message) || error.message.startsWith("Shopify rejected Delivery Customization:") || error.message.startsWith("Shopify rejected Function configuration:"))) {
      throw error;
    }
    throw new Error("Unable to synchronize Shopify Function configuration");
  }
}
async function ensureShop(shopDomain) {
  const shopData = validateShop({ shopDomain });
  const existingShop = await findShopByDomain(shopData.shopDomain);
  return existingShop ?? createShop(shopData);
}
async function loadCustomizations(shopDomain) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validateShippingRequest({
    shopId: shop.id
  });
  return findCustomizationsByShop(shopId);
}
async function loadRateData(shopDomain, admin) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validateShippingRequest({
    shopId: shop.id
  });
  const [rates, rules, carrierServiceResult] = await Promise.all([
    findRatesByShop(shopId),
    findRulesByShop(shopId),
    ensureCarrierService(shopDomain, admin).then((carrierService) => ({ available: true, carrierService })).catch((error) => ({
      available: false,
      error: error instanceof Error ? error.message : "Carrier-calculated shipping is unavailable"
    }))
  ]);
  return { rates, rules, carrierService: carrierServiceResult };
}
async function createRate(shopDomain, data, admin) {
  const shop = await ensureShop(shopDomain);
  validateRate({ ...data, shopId: shop.id });
  const rate = await createRate$1({ ...data, shopId: shop.id });
  await ensureCarrierService(shopDomain, admin).catch(() => null);
  return rate;
}
async function updateRate(shopDomain, id, data, admin) {
  const shop = await ensureShop(shopDomain);
  validateRate({ ...data, shopId: shop.id });
  const rate = await updateRate$1(id, shop.id, data);
  await ensureCarrierService(shopDomain, admin).catch(() => null);
  return rate;
}
async function validateCustomizationSubmission(shopDomain, data) {
  const shop = await ensureShop(shopDomain);
  return validateCustomization({
    ...data,
    shopId: shop.id
  });
}
async function createCustomization(shopDomain, data) {
  const validated = await validateCustomizationSubmission(shopDomain, data);
  const customization = await createCustomization$1({
    ...data,
    shopId: validated.shopId
  });
  await syncFunctionConfiguration(validated.shopId);
  return customization;
}
async function updateCustomization(shopDomain, id, data) {
  const shop = await ensureShop(shopDomain);
  validateCustomization({
    ...data,
    shopId: shop.id
  });
  const customization = await updateCustomization$1(
    id,
    shop.id,
    data
  );
  await syncFunctionConfiguration(shop.id);
  return customization;
}
async function deleteCustomization(shopDomain, id) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validateShippingRequest({
    shopId: shop.id
  });
  const customization = await deleteCustomization$1(id, shopId);
  await syncFunctionConfiguration(shopId);
  return customization;
}
async function deleteRate(shopDomain, id) {
  const shop = await ensureShop(shopDomain);
  const { shopId } = validateShippingRequest({
    shopId: shop.id
  });
  return deleteRate$1(id, shopId);
}
const flag = (code) => String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));
const REGIONS = Country.getAllCountries().map((c) => ({
  code: c.isoCode,
  name: c.name,
  flag: flag(c.isoCode),
  provinces: State.getStatesOfCountry(c.isoCode).map((s) => ({
    code: s.isoCode,
    name: s.name
  }))
})).sort((a, b) => a.name.localeCompare(b.name));
const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.code, r]));
const PROVINCE_LABEL = {
  US: "states",
  AU: "states and territories",
  BR: "states",
  MX: "states",
  IN: "states",
  NG: "states",
  CA: "provinces",
  CN: "provinces",
  IE: "counties",
  RO: "counties",
  JP: "prefectures",
  AE: "emirates"
};
const provinceLabel = (code) => PROVINCE_LABEL[code] || "regions";
async function getTaken(shopId, excludeId) {
  var _a2, _b;
  const zones = await prisma.zone.findMany({
    where: {
      shopId,
      isRestOfWorld: false,
      ...excludeId ? { id: { not: excludeId } } : {}
    }
  });
  const taken = {};
  for (const z of zones) {
    for (const [code, provs] of Object.entries(z.regions || {})) {
      const total = ((_a2 = REGION_MAP[code]) == null ? void 0 : _a2.provinces.length) || 0;
      const fullCountry = total === 0 || provs.length === total;
      if (fullCountry) {
        taken[code] = { zoneName: z.name, provinces: null };
      } else {
        const prev = ((_b = taken[code]) == null ? void 0 : _b.provinces) || [];
        taken[code] = { zoneName: z.name, provinces: [...prev, ...provs] };
      }
    }
  }
  return taken;
}
async function getRowHolder(shopId, excludeId) {
  const z = await prisma.zone.findFirst({
    where: {
      shopId,
      isRestOfWorld: true,
      ...excludeId ? { id: { not: excludeId } } : {}
    },
    select: { id: true, name: true }
  });
  return z || null;
}
async function validateZone({ shopId, excludeId, name, isRestOfWorld, regions }) {
  var _a2;
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
      return `${(_a2 = REGION_MAP[code]) == null ? void 0 : _a2.name} is already in "${t.zoneName}".`;
    }
  }
  return null;
}
function parseRegions(raw) {
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
async function ensureDefaultZones(shopId) {
  const count = await prisma.zone.count({ where: { shopId } });
  if (count > 0) return;
  const us = REGION_MAP.US;
  const usRegions = { US: us ? us.provinces.map((p) => p.code) : [] };
  try {
    await prisma.$transaction([
      prisma.zone.create({
        data: { shopId, name: "International", isRestOfWorld: true, regions: {}, countries: "Rest of world" }
      }),
      prisma.zone.create({
        data: { shopId, name: "Domestic", isRestOfWorld: false, regions: usRegions, countries: countriesLabel(usRegions) }
      })
    ]);
  } catch (e) {
    if ((e == null ? void 0 : e.code) !== "P2002") throw e;
  }
}
function countriesLabel(regions) {
  return Object.keys(regions || {}).map((c) => {
    var _a2;
    return (_a2 = REGION_MAP[c]) == null ? void 0 : _a2.name;
  }).filter(Boolean).join(", ");
}
function matchZone(zones, countryCode, provinceCode) {
  const specific = zones.find((z) => {
    var _a2;
    if (z.isRestOfWorld) return false;
    const provs = (z.regions || {})[countryCode];
    if (!provs) return false;
    const total = ((_a2 = REGION_MAP[countryCode]) == null ? void 0 : _a2.provinces.length) || 0;
    return total === 0 || provs.length === total || provs.includes(provinceCode);
  });
  return specific || zones.find((z) => z.isRestOfWorld) || null;
}
const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json"
};
function emptyRates() {
  return Response.json({
    rates: []
  }, {
    headers: responseHeaders
  });
}
const action$7 = async ({
  request
}) => {
  var _a2, _b;
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  try {
    const shopDomain = verifyCarrierCallback(request.url);
    if (!shopDomain) return emptyRates();
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 1e6) return emptyRates();
    const [payload, shop, unauthenticatedContext] = await Promise.all([request.json(), ensureShop(shopDomain), unauthenticated.admin(shopDomain)]);
    const mappedRequest = await mapCarrierRequest(unauthenticatedContext.admin, payload, shop.id);
    const zones = await prisma.zone.findMany({
      where: {
        shopId: shop.id
      },
      orderBy: {
        createdAt: "asc"
      }
    });
    const matchedZone = matchZone(zones, String(((_a2 = mappedRequest.destination) == null ? void 0 : _a2.countryCode) ?? "").toUpperCase(), String(((_b = mappedRequest.destination) == null ? void 0 : _b.provinceCode) ?? "").toUpperCase());
    if (!matchedZone) return emptyRates();
    const result = await executeShippingPipeline(mappedRequest);
    return Response.json(formatCarrierResponse(filterRatesForZone(result, matchedZone), mappedRequest), {
      headers: responseHeaders
    });
  } catch {
    return emptyRates();
  }
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const loader$b = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const action$6 = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const route$1 = UNSAFE_withComponentProps(function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const {
    errors
  } = actionData || loaderData;
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: false,
    children: /* @__PURE__ */ jsx("s-page", {
      children: /* @__PURE__ */ jsx(Form, {
        method: "post",
        children: /* @__PURE__ */ jsxs("s-section", {
          heading: "Log in",
          children: [/* @__PURE__ */ jsx("s-text-field", {
            name: "shop",
            label: "Shop domain",
            details: "example.myshopify.com",
            value: shop,
            onChange: (e) => setShop(e.currentTarget.value),
            autocomplete: "on",
            error: errors.shop
          }), /* @__PURE__ */ jsx("s-button", {
            type: "submit",
            children: "Log in"
          })]
        })
      })
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: route$1,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
const loader$a = async ({
  request
}) => {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  throw redirect(query ? `/app?${query}` : "/app");
};
const route = UNSAFE_withComponentProps(function IndexRedirect() {
  return null;
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: route,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const loader$9 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  headers: headers$1,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const Polaris = /* @__PURE__ */ JSON.parse('{"ActionMenu":{"Actions":{"moreActions":"More actions"},"RollupActions":{"rollupButton":"View actions"}},"ActionList":{"SearchField":{"clearButtonLabel":"Clear","search":"Search","placeholder":"Search actions"}},"Avatar":{"label":"Avatar","labelWithInitials":"Avatar with initials {initials}"},"Autocomplete":{"spinnerAccessibilityLabel":"Loading","ellipsis":"{content}…"},"Badge":{"PROGRESS_LABELS":{"incomplete":"Incomplete","partiallyComplete":"Partially complete","complete":"Complete"},"TONE_LABELS":{"info":"Info","success":"Success","warning":"Warning","critical":"Critical","attention":"Attention","new":"New","readOnly":"Read-only","enabled":"Enabled"},"progressAndTone":"{toneLabel} {progressLabel}"},"Banner":{"dismissButton":"Dismiss notification"},"Button":{"spinnerAccessibilityLabel":"Loading"},"Common":{"checkbox":"checkbox","undo":"Undo","cancel":"Cancel","clear":"Clear","close":"Close","submit":"Submit","more":"More"},"ContextualSaveBar":{"save":"Save","discard":"Discard"},"DataTable":{"sortAccessibilityLabel":"sort {direction} by","navAccessibilityLabel":"Scroll table {direction} one column","totalsRowHeading":"Totals","totalRowHeading":"Total"},"DatePicker":{"previousMonth":"Show previous month, {previousMonthName} {showPreviousYear}","nextMonth":"Show next month, {nextMonth} {nextYear}","today":"Today ","start":"Start of range","end":"End of range","months":{"january":"January","february":"February","march":"March","april":"April","may":"May","june":"June","july":"July","august":"August","september":"September","october":"October","november":"November","december":"December"},"days":{"monday":"Monday","tuesday":"Tuesday","wednesday":"Wednesday","thursday":"Thursday","friday":"Friday","saturday":"Saturday","sunday":"Sunday"},"daysAbbreviated":{"monday":"Mo","tuesday":"Tu","wednesday":"We","thursday":"Th","friday":"Fr","saturday":"Sa","sunday":"Su"}},"DiscardConfirmationModal":{"title":"Discard all unsaved changes","message":"If you discard changes, you’ll delete any edits you made since you last saved.","primaryAction":"Discard changes","secondaryAction":"Continue editing"},"DropZone":{"single":{"overlayTextFile":"Drop file to upload","overlayTextImage":"Drop image to upload","overlayTextVideo":"Drop video to upload","actionTitleFile":"Add file","actionTitleImage":"Add image","actionTitleVideo":"Add video","actionHintFile":"or drop file to upload","actionHintImage":"or drop image to upload","actionHintVideo":"or drop video to upload","labelFile":"Upload file","labelImage":"Upload image","labelVideo":"Upload video"},"allowMultiple":{"overlayTextFile":"Drop files to upload","overlayTextImage":"Drop images to upload","overlayTextVideo":"Drop videos to upload","actionTitleFile":"Add files","actionTitleImage":"Add images","actionTitleVideo":"Add videos","actionHintFile":"or drop files to upload","actionHintImage":"or drop images to upload","actionHintVideo":"or drop videos to upload","labelFile":"Upload files","labelImage":"Upload images","labelVideo":"Upload videos"},"errorOverlayTextFile":"File type is not valid","errorOverlayTextImage":"Image type is not valid","errorOverlayTextVideo":"Video type is not valid"},"EmptySearchResult":{"altText":"Empty search results"},"Frame":{"skipToContent":"Skip to content","navigationLabel":"Navigation","Navigation":{"closeMobileNavigationLabel":"Close navigation"}},"FullscreenBar":{"back":"Back","accessibilityLabel":"Exit fullscreen mode"},"Filters":{"moreFilters":"More filters","moreFiltersWithCount":"More filters ({count})","filter":"Filter {resourceName}","noFiltersApplied":"No filters applied","cancel":"Cancel","done":"Done","clearAllFilters":"Clear all filters","clear":"Clear","clearLabel":"Clear {filterName}","addFilter":"Add filter","clearFilters":"Clear all","searchInView":"in:{viewName}"},"FilterPill":{"clear":"Clear","unsavedChanges":"Unsaved changes - {label}"},"IndexFilters":{"searchFilterTooltip":"Search and filter","searchFilterTooltipWithShortcut":"Search and filter (F)","searchFilterAccessibilityLabel":"Search and filter results","sort":"Sort your results","addView":"Add a new view","newView":"Custom search","SortButton":{"ariaLabel":"Sort the results","tooltip":"Sort","title":"Sort by","sorting":{"asc":"Ascending","desc":"Descending","az":"A-Z","za":"Z-A"}},"EditColumnsButton":{"tooltip":"Edit columns","accessibilityLabel":"Customize table column order and visibility"},"UpdateButtons":{"cancel":"Cancel","update":"Update","save":"Save","saveAs":"Save as","modal":{"title":"Save view as","label":"Name","sameName":"A view with this name already exists. Please choose a different name.","save":"Save","cancel":"Cancel"}}},"IndexProvider":{"defaultItemSingular":"Item","defaultItemPlural":"Items","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} are selected","selected":"{selectedItemsCount} selected","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}"},"IndexTable":{"emptySearchTitle":"No {resourceNamePlural} found","emptySearchDescription":"Try changing the filters or search term","onboardingBadgeText":"New","resourceLoadingAccessibilityLabel":"Loading {resourceNamePlural}…","selectAllLabel":"Select all {resourceNamePlural}","selected":"{selectedItemsCount} selected","undo":"Undo","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural}","selectItem":"Select {resourceName}","selectButtonText":"Select","sortAccessibilityLabel":"sort {direction} by"},"Loading":{"label":"Page loading bar"},"Modal":{"iFrameTitle":"body markup","modalWarning":"These required properties are missing from Modal: {missingProps}"},"Page":{"Header":{"rollupActionsLabel":"View actions for {title}","pageReadyAccessibilityLabel":"{title}. This page is ready"}},"Pagination":{"previous":"Previous","next":"Next","pagination":"Pagination"},"ProgressBar":{"negativeWarningMessage":"Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.","exceedWarningMessage":"Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."},"ResourceList":{"sortingLabel":"Sort by","defaultItemSingular":"item","defaultItemPlural":"items","showing":"Showing {itemsCount} {resource}","showingTotalCount":"Showing {itemsCount} of {totalItemsCount} {resource}","loading":"Loading {resource}","selected":"{selectedItemsCount} selected","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} in your store are selected","allFilteredItemsSelected":"All {itemsLength}+ {resourceNamePlural} in this filter are selected","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural} in your store","selectAllFilteredItems":"Select all {itemsLength}+ {resourceNamePlural} in this filter","emptySearchResultTitle":"No {resourceNamePlural} found","emptySearchResultDescription":"Try changing the filters or search term","selectButtonText":"Select","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}","Item":{"actionsDropdownLabel":"Actions for {accessibilityLabel}","actionsDropdown":"Actions dropdown","viewItem":"View details for {itemName}"},"BulkActions":{"actionsActivatorLabel":"Actions","moreActionsActivatorLabel":"More actions"}},"SkeletonPage":{"loadingLabel":"Page loading"},"Tabs":{"newViewAccessibilityLabel":"Create new view","newViewTooltip":"Create view","toggleTabsLabel":"More views","Tab":{"rename":"Rename view","duplicate":"Duplicate view","edit":"Edit view","editColumns":"Edit columns","delete":"Delete view","copy":"Copy of {name}","deleteModal":{"title":"Delete view?","description":"This can’t be undone. {viewName} view will no longer be available in your admin.","cancel":"Cancel","delete":"Delete view"}},"RenameModal":{"title":"Rename view","label":"Name","cancel":"Cancel","create":"Save","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"DuplicateModal":{"title":"Duplicate view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"CreateViewModal":{"title":"Create new view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}}},"Tag":{"ariaLabel":"Remove {children}"},"TextField":{"characterCount":"{count} characters","characterCountWithMaxLength":"{count} of {limit} characters used"},"TooltipOverlay":{"accessibilityLabel":"Tooltip: {label}"},"TopBar":{"toggleMenuLabel":"Toggle menu","SearchField":{"clearButtonLabel":"Clear","search":"Search"}},"MediaCard":{"dismissButton":"Dismiss","popoverButton":"Actions"},"VideoThumbnail":{"playButtonA11yLabel":{"default":"Play video","defaultWithDuration":"Play video of length {duration}","duration":{"hours":{"other":{"only":"{hourCount} hours","andMinutes":"{hourCount} hours and {minuteCount} minutes","andMinute":"{hourCount} hours and {minuteCount} minute","minutesAndSeconds":"{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hours, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hours, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hours, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hours and {secondCount} seconds","andSecond":"{hourCount} hours and {secondCount} second"},"one":{"only":"{hourCount} hour","andMinutes":"{hourCount} hour and {minuteCount} minutes","andMinute":"{hourCount} hour and {minuteCount} minute","minutesAndSeconds":"{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hour, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hour, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hour, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hour and {secondCount} seconds","andSecond":"{hourCount} hour and {secondCount} second"}},"minutes":{"other":{"only":"{minuteCount} minutes","andSeconds":"{minuteCount} minutes and {secondCount} seconds","andSecond":"{minuteCount} minutes and {secondCount} second"},"one":{"only":"{minuteCount} minute","andSeconds":"{minuteCount} minute and {secondCount} seconds","andSecond":"{minuteCount} minute and {secondCount} second"}},"seconds":{"other":"{secondCount} seconds","one":"{secondCount} second"}}}}}');
const enTranslations = {
  Polaris
};
const loader$8 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  try {
    await ensureShop(session.shop);
  } catch {
    throw new Response("Unable to initialize shop data", {
      status: 500
    });
  }
  return {
    apiKey: process.env.SHOPIFY_API_KEY || ""
  };
};
const app = UNSAFE_withComponentProps(function App2() {
  const {
    apiKey
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: true,
    apiKey,
    children: /* @__PURE__ */ jsxs(AppProvider$1, {
      i18n: enTranslations,
      children: [/* @__PURE__ */ jsxs("s-app-nav", {
        children: [/* @__PURE__ */ jsx("s-link", {
          href: "/app/rates",
          children: "Shipping Rates"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/zones",
          children: "Shipping Zones"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/customizations",
          children: "Shipping Customizations"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/settings",
          children: "Settings"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/videos",
          children: "Example Setup Videos"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/billing",
          children: "Billing"
        })]
      }), /* @__PURE__ */ jsx(Outlet, {})]
    })
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return boundary.error(useRouteError());
});
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: app,
  headers,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const app_customizations = UNSAFE_withComponentProps(function CustomizationsLayout() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_customizations
}, Symbol.toStringTag, { value: "Module" }));
const emptyCustomizationCondition = () => ({
  field: "Cart Subtotal",
  operator: "Equals",
  key: "",
  value: "",
  productMatch: "at-least-one",
  matchValue: ""
});
const emptyParameter2Condition = () => ({
  ...emptyCustomizationCondition(),
  field: "SKU"
});
const productMatchOptions = [
  ["at-least-one", "At least one product meets the condition."],
  ["all-products", "All products meet the condition."],
  ["exact-quantity", "Cart has exactly specified quantity."],
  ["more-quantity", "Cart has more than specified quantity."],
  ["not-more-quantity", "Cart has not more than specified quantity."],
  ["more-amount", "Cart has more than specified total price."],
  ["not-more-amount", "Cart has not more than total price."]
];
const quantityMatches = /* @__PURE__ */ new Set([
  "exact-quantity",
  "more-quantity",
  "not-more-quantity"
]);
const amountMatches = /* @__PURE__ */ new Set(["more-amount", "not-more-amount"]);
const productFields = /* @__PURE__ */ new Set([
  "Product Tag",
  "Product Title",
  "Product Type",
  "Product Weight",
  "Product Vendor",
  "Variant Title",
  "Line Item Property",
  "Product Price",
  "Product Collection",
  "SKU",
  "Variant Metafield",
  "Is subscription product"
]);
const textProductFields = /* @__PURE__ */ new Set([
  "Product Title",
  "Product Type",
  "Product Vendor",
  "Variant Title"
]);
const numericProductFields = /* @__PURE__ */ new Set(["Product Weight", "Product Price"]);
const unsupportedCheckoutConditionFields = /* @__PURE__ */ new Set([
  "Cart Attribute",
  "Line Item Property",
  "Product Collection",
  "Variant Metafield",
  "Customer Metafield",
  "Company Metafield",
  "Company Location Metafield"
]);
const textOperators = [
  "Equals",
  "Not equals",
  "Contains",
  "Does not contains",
  "Starts with",
  "Ends with"
];
const textAndListOperators = [
  ...textOperators,
  "Includes in list",
  "Not includes in list"
];
const hasProductMatchOptions = (field) => productFields.has(field);
const getConditionOperators = (field, parameterSet) => {
  if (field === "Is subscription product") return ["True", "False"];
  if (field === "Cart Attribute") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty"
    ];
  }
  if (field === "SKU" || field === "Province / State Code") {
    return textAndListOperators;
  }
  if (field === "Variant Metafield") {
    return ["Equals", "Not equals", "Contains", "Does not contains"];
  }
  if (field === "Company Metafield") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
      "Includes in list",
      "Not includes in list"
    ];
  }
  if (field === "Company Location Metafield" && parameterSet === 3) {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty",
      "Includes in list",
      "Not includes in list"
    ];
  }
  if (field === "Customer Metafield" || field === "Company Location Metafield") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty"
    ];
  }
  if (field === "Zipcode / Postcode") return ["Equals", "Not equals"];
  if (field === "Country Code") {
    return textAndListOperators;
  }
  if (field === "Address Line 1" || field === "Shipping Method Name") {
    return textOperators;
  }
  if (field === "Shipping Rate" || field === "Number Of Vendors") {
    return numericOperators;
  }
  if (field === "Customer Logged In") return ["True", "False"];
  if (field === "Customer Company") {
    return [...textOperators, "Is empty", "Is not empty"];
  }
  if (field === "Customer First Name") {
    return textAndListOperators;
  }
  if (field === "Customer Tag") return ["Equals", "Not equals"];
  if (textProductFields.has(field)) {
    return textAndListOperators;
  }
  if (field === "Line Item Property") {
    return [
      "Equals",
      "Not equals",
      "Contains",
      "Does not contains",
      "Is empty",
      "Is not empty"
    ];
  }
  if (numericProductFields.has(field)) {
    return [...numericOperators, "Is empty", "Is not empty"];
  }
  if (field === "Product Tag" || field === "Product Collection") {
    return ["Equals", "Not equals"];
  }
  return numericOperators;
};
const numericOperators = [
  "Equals",
  "Not equals",
  "Greater than",
  "Less than",
  "Greater than or equal",
  "Less than or equal"
];
const getDefaultConditionOperator = (field) => {
  if (field === "Customer Logged In" || field === "Is subscription product") {
    return "True";
  }
  if (field === "Customer Company" || field === "Address Line 1" || field === "Shipping Method Name") {
    return "Contains";
  }
  return "Equals";
};
const getCustomizationActionLabel = (type) => {
  const normalizedType2 = String(type || "").trim().toLowerCase();
  if (normalizedType2 === "hide" || normalizedType2 === "hide shipping rates") {
    return "Hide the following shipping methods";
  }
  if (normalizedType2 === "show" || normalizedType2 === "show shipping rates") {
    return "Show the following shipping methods";
  }
  if (normalizedType2 === "only_show" || normalizedType2 === "only show specified shipping rates and hide rest") {
    return "Only show the following shipping methods and hide the rest";
  }
  if (normalizedType2 === "rename" || normalizedType2 === "rename shipping rates") {
    return "Rename the following shipping methods";
  }
  return "Reorder the following shipping methods";
};
const getCustomizationTypeLabel = (type) => {
  const normalizedType2 = String(type || "").trim().toLowerCase();
  const typeLabels = {
    hide: "Hide shipping rates",
    show: "Show shipping rates",
    only_show: "Only show specified shipping rates and hide rest",
    reorder: "Reorder shipping rates",
    rename: "Rename shipping rates"
  };
  return typeLabels[normalizedType2] || type || "Unknown customization type";
};
async function actionPayload$1(request) {
  var _a2;
  if ((_a2 = request.headers.get("content-type")) == null ? void 0 : _a2.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  const data = formData.get("data");
  return {
    intent: formData.get("intent"),
    id: formData.get("id"),
    ids: formData.getAll("ids"),
    data: typeof data === "string" && data ? JSON.parse(data) : void 0
  };
}
function requiredString$1(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}
const action$5 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  try {
    const payload = await actionPayload$1(request);
    const intent = requiredString$1(payload.intent, "intent");
    if (intent === "update") {
      const id = requiredString$1(payload.id, "id");
      const customization = await updateCustomization(session.shop, id, payload.data);
      return Response.json({
        ok: true,
        customization
      });
    }
    if (intent === "delete") {
      const ids = Array.isArray(payload.ids) && payload.ids.length ? payload.ids.map((id) => requiredString$1(id, "id")) : [requiredString$1(payload.id, "id")];
      await Promise.all(ids.map((id) => deleteCustomization(session.shop, id)));
      return Response.json({
        ok: true,
        ids
      });
    }
    return Response.json({
      ok: false,
      error: "Unsupported action"
    }, {
      status: 400
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError || error instanceof SyntaxError) {
      return Response.json({
        ok: false,
        error: error.message
      }, {
        status: 400
      });
    }
    return Response.json({
      ok: false,
      error: "Unable to update customization"
    }, {
      status: 500
    });
  }
};
function titleCase$1(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—";
}
function conditionSummary$1(condition) {
  return [condition.field, condition.operator, condition.value].filter((value) => value !== void 0 && value !== null && String(value).trim()).join(" ");
}
const loader$7 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  try {
    return {
      customizations: await loadCustomizations(session.shop)
    };
  } catch {
    throw new Response("Unable to load customizations", {
      status: 500
    });
  }
};
const app_customizations__index = UNSAFE_withComponentProps(function CustomizationsIndex() {
  var _a2;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify2 = useAppBridge();
  const {
    customizations
  } = useLoaderData();
  const [pendingDelete, setPendingDelete] = useState([]);
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection
  } = useIndexResourceState(customizations);
  const createCustomization2 = () => navigate("/app/customizations/new");
  useEffect(() => {
    var _a3;
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify2.toast.show(((_a3 = fetcher.data.ids) == null ? void 0 : _a3.length) > 1 ? "Shipping customizations deleted" : "Shipping customization deleted");
      setPendingDelete([]);
      clearSelection();
      return;
    }
    shopify2.toast.show(fetcher.data.error || "Unable to delete customization", {
      isError: true
    });
  }, [clearSelection, fetcher.data, shopify2]);
  const confirmDelete = () => {
    if (!pendingDelete.length) return;
    fetcher.submit({
      intent: "delete",
      ids: pendingDelete.map((customization) => customization.id)
    }, {
      method: "post",
      encType: "application/json"
    });
  };
  const deleteSelectedCustomizations = () => {
    const selectedCustomizations = allResourcesSelected ? customizations : customizations.filter((customization) => selectedResources.includes(customization.id));
    setPendingDelete(selectedCustomizations);
  };
  return /* @__PURE__ */ jsxs(Page, {
    title: "Shipping Customizations",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    primaryAction: {
      content: "Create Customization",
      onAction: createCustomization2
    },
    children: [/* @__PURE__ */ jsxs(BlockStack, {
      gap: "400",
      children: [customizations.length > 0 && /* @__PURE__ */ jsx(Banner, {
        tone: "warning",
        title: "App is running in test mode",
        children: /* @__PURE__ */ jsxs(List, {
          children: [/* @__PURE__ */ jsxs(List.Item, {
            children: ["Enter the first name as ", /* @__PURE__ */ jsx(Text, {
              as: "span",
              fontWeight: "semibold",
              children: "shipflux"
            }), " ", "on the checkout page to see the customizations in action."]
          }), /* @__PURE__ */ jsxs(List.Item, {
            children: ["To go in live mode, enable the", " ", /* @__PURE__ */ jsx(Link, {
              url: "/app/settings",
              children: "Shipping Customizations"
            }), " toggle on the settings page."]
          })]
        })
      }), /* @__PURE__ */ jsx(Card, {
        padding: "0",
        children: customizations.length > 0 ? /* @__PURE__ */ jsx(IndexTable, {
          resourceName: {
            singular: "customization",
            plural: "customizations"
          },
          itemCount: customizations.length,
          selectedItemsCount: allResourcesSelected ? "All" : selectedResources.length,
          onSelectionChange: handleSelectionChange,
          promotedBulkActions: [{
            content: "Delete",
            destructive: true,
            onAction: deleteSelectedCustomizations
          }],
          headings: [{
            title: "Name"
          }, {
            title: "Status"
          }, {
            title: "Condition"
          }, {
            title: "Action"
          }],
          children: customizations.map((customization, index) => {
            var _a3, _b;
            return /* @__PURE__ */ jsxs(IndexTable.Row, {
              id: customization.id,
              position: index,
              selected: selectedResources.includes(customization.id),
              accessibilityLabel: `Edit ${customization.name}`,
              onClick: () => navigate(`/app/customizations/new?id=${customization.id}`),
              children: [/* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsx(Text, {
                  as: "span",
                  fontWeight: "semibold",
                  children: customization.name
                })
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsxs(InlineStack, {
                  gap: "100",
                  blockAlign: "center",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Badge, {
                    tone: customization.status === "ACTIVE" ? "success" : void 0,
                    children: titleCase$1(customization.status)
                  }), ((_a3 = customization.schedules) == null ? void 0 : _a3.length) > 0 && /* @__PURE__ */ jsx(Box, {
                    background: "bg-fill-caution-secondary",
                    borderRadius: "full",
                    minWidth: "32px",
                    paddingBlock: "050",
                    paddingInline: "50",
                    children: /* @__PURE__ */ jsx(Icon, {
                      source: ClockIcon,
                      tone: "caution",
                      accessibilityLabel: "Scheduled"
                    })
                  })]
                })
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsxs(Text, {
                    as: "span",
                    children: ["Match", " ", /* @__PURE__ */ jsx(Text, {
                      as: "span",
                      fontWeight: "semibold",
                      children: customization.conditionMatch === "ALL" ? "All" : "Any"
                    }), " ", "conditions below:"]
                  }), ((_b = customization.conditions) == null ? void 0 : _b.length) ? customization.conditions.map((condition, conditionIndex) => /* @__PURE__ */ jsxs(Text, {
                    as: "span",
                    children: [conditionIndex + 1, ". ", conditionSummary$1(condition)]
                  }, condition.id)) : /* @__PURE__ */ jsx(Text, {
                    as: "span",
                    tone: "subdued",
                    children: "No conditions"
                  })]
                })
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "span",
                    children: getCustomizationTypeLabel(customization.type)
                  }), customization.methods.map((method, methodIndex) => /* @__PURE__ */ jsxs(Text, {
                    as: "span",
                    children: [methodIndex + 1, ". ", method.value]
                  }, method.id))]
                })
              })]
            }, customization.id);
          })
        }) : /* @__PURE__ */ jsx(EmptyState, {
          heading: "You haven't created any customizations yet.",
          action: {
            content: "Create Customization",
            onAction: createCustomization2
          },
          image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        })
      }), /* @__PURE__ */ jsx(Box, {
        paddingBlock: "400",
        children: /* @__PURE__ */ jsx(InlineStack, {
          align: "center",
          gap: "100",
          children: /* @__PURE__ */ jsxs(Text, {
            as: "span",
            variant: "bodyMd",
            tone: "subdued",
            children: [/* @__PURE__ */ jsx(Link, {
              url: "#learn",
              removeUnderline: true,
              children: "Learn more"
            }), " ", "about Shipping Customizations |", " ", /* @__PURE__ */ jsx(Link, {
              url: "#troubleshoot",
              removeUnderline: true,
              children: "Troubleshoot"
            }), " ", "Shipping Customizations"]
          })
        })
      })]
    }), /* @__PURE__ */ jsx(Modal, {
      open: pendingDelete.length > 0,
      onClose: () => setPendingDelete([]),
      title: pendingDelete.length > 1 ? "Delete customizations?" : "Delete customization?",
      primaryAction: {
        content: "Delete",
        destructive: true,
        loading: fetcher.state !== "idle",
        onAction: confirmDelete
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setPendingDelete([])
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsx(Text, {
          as: "p",
          children: pendingDelete.length > 1 ? `This will permanently delete ${pendingDelete.length} customizations.` : `This will permanently delete ${((_a2 = pendingDelete[0]) == null ? void 0 : _a2.name) || "this customization"}.`
        })
      })
    })]
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: app_customizations__index,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const loader$6 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return {
    customization: null
  };
  try {
    const customizations = await loadCustomizations(session.shop);
    const customization = customizations.find((item) => item.id === id);
    if (!customization) {
      throw new Response("Customization not found", {
        status: 404
      });
    }
    return {
      customization
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response("Unable to load customization", {
      status: 500
    });
  }
};
const action$4 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  try {
    const submission = await request.json();
    const customization = await createCustomization(session.shop, submission);
    return Response.json({
      ok: true,
      customization
    }, {
      status: 201
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return Response.json({
        ok: false,
        error: error.message
      }, {
        status: 400
      });
    }
    return Response.json({
      ok: false,
      error: "Unable to submit customization."
    }, {
      status: 500
    });
  }
};
const typeOptions = [{
  label: "Hide shipping rates",
  value: "hide"
}, {
  label: "Show shipping rates",
  value: "show"
}, {
  label: "Only show specified shipping rates and hide rest",
  value: "only_show"
}, {
  label: "Reorder shipping rates",
  value: "reorder"
}, {
  label: "Rename shipping rates",
  value: "rename"
}];
const fieldGroupsByParameterSet = {
  1: [{
    title: "Cart",
    options: ["Cart Subtotal", "Cart Quantity", "Cart Weight"]
  }, {
    title: "Product",
    options: ["Product Tag", "Product Title", "Product Type", "Product Weight", "Product Vendor", "Variant Title", "Line Item Property", "Product Price", "Product Collection"]
  }, {
    title: "Customer",
    options: ["Customer Tag", "Customer Logged In", "Customer Company", "Customer First Name"]
  }, {
    title: "Shipping",
    options: ["Zipcode / Postcode", "Country Code", "Address Line 1", "Address is a PO Box", "Address is not a PO Box", "Shipping Method Name", "Shipping Rate"]
  }, {
    title: "Other",
    options: ["Always", "Number Of Vendors"]
  }],
  2: [{
    title: "Cart",
    options: ["Cart Attribute"]
  }, {
    title: "Product",
    options: ["SKU", "Product Tag", "Variant Metafield", "Is subscription product"]
  }, {
    title: "Shipping",
    options: ["Province / State Code", "Country Code", "Address Line 1", "Address is a PO Box", "Address is not a PO Box"]
  }, {
    title: "Customer",
    options: ["Customer Tag", "Customer Metafield", "Company Metafield", "Customer First Name"]
  }],
  3: [{
    title: "Cart",
    options: ["Cart Subtotal", "Cart Weight"]
  }, {
    title: "Customer",
    options: ["Company Location Metafield", "Customer First Name"]
  }, {
    title: "Shipping",
    options: ["Zipcode / Postcode"]
  }]
};
const conditionFieldOptionsFor = (parameterSet) => fieldGroupsByParameterSet[parameterSet].map((group) => ({
  title: group.title,
  options: group.options.map((value) => {
    const unsupported = unsupportedCheckoutConditionFields.has(value);
    return {
      label: unsupported ? `${value} (not supported at Shopify checkout)` : value,
      value,
      disabled: unsupported
    };
  })
}));
const keyedConditionFields = /* @__PURE__ */ new Set(["Line Item Property", "Shipping Rate", "Cart Attribute", "Variant Metafield", "Customer Metafield", "Company Metafield", "Company Location Metafield"]);
const operatorlessConditionFields = /* @__PURE__ */ new Set(["Address is a PO Box", "Address is not a PO Box", "Always"]);
const valuelessConditionFields = /* @__PURE__ */ new Set(["Customer Logged In", "Is subscription product", "Address is a PO Box", "Address is not a PO Box", "Always"]);
function editableCondition(condition, parameterSet) {
  const fallback = parameterSet === 2 ? emptyParameter2Condition() : emptyCustomizationCondition();
  return {
    ...fallback,
    field: condition.field,
    operator: condition.operator ?? fallback.operator,
    key: condition.key ?? "",
    value: condition.value ?? "",
    productMatch: condition.productMatch ?? fallback.productMatch,
    matchValue: condition.matchValue ?? ""
  };
}
function browserTimezone$1() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function localDateValue$1(date = /* @__PURE__ */ new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 6e4);
  return offsetDate.toISOString().slice(0, 10);
}
function formatSchedule$1(schedule) {
  const scheduledAt = new Date(schedule.scheduledAt);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: schedule.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(scheduledAt);
    const value = (type) => {
      var _a2;
      return (_a2 = parts.find((part) => part.type === type)) == null ? void 0 : _a2.value;
    };
    return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
  } catch {
    return scheduledAt.toISOString().slice(0, 16).replace("T", " ");
  }
}
const app_customizations_new = UNSAFE_withComponentProps(function NewCustomization() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify2 = useAppBridge();
  const {
    customization
  } = useLoaderData();
  const [type, setType] = useState((customization == null ? void 0 : customization.type) ?? "hide");
  const [name, setName] = useState((customization == null ? void 0 : customization.name) ?? "");
  const [status, setStatus] = useState(customization ? `${customization.status.charAt(0)}${customization.status.slice(1).toLowerCase()}` : "Active");
  const [match, setMatch] = useState((customization == null ? void 0 : customization.conditionMatch.toLowerCase()) ?? "all");
  const [parameterSet, setParameterSet] = useState((customization == null ? void 0 : customization.parameterSet) ?? 1);
  const [shipmentScope, setShipmentScope] = useState((customization == null ? void 0 : customization.shipmentScope.toLowerCase()) ?? "all");
  const [conditionsBySet, setConditionsBySet] = useState(() => ({
    1: (customization == null ? void 0 : customization.parameterSet) === 1 ? customization.conditions.map((condition) => editableCondition(condition, 1)) : [emptyCustomizationCondition()],
    2: (customization == null ? void 0 : customization.parameterSet) === 2 ? customization.conditions.map((condition) => editableCondition(condition, 2)) : [emptyParameter2Condition()],
    3: (customization == null ? void 0 : customization.parameterSet) === 3 ? customization.conditions.map((condition) => editableCondition(condition, 3)) : [emptyCustomizationCondition()]
  }));
  const [methods, setMethods] = useState(customization ? customization.methods.map((method) => ({
    value: method.value,
    replacementValue: method.replacementValue ?? ""
  })) : [{
    value: "",
    replacementValue: ""
  }]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedules, setSchedules] = useState((customization == null ? void 0 : customization.schedules) ?? []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleAction, setScheduleAction] = useState("ACTIVATE");
  const [scheduleDate, setScheduleDate] = useState(localDateValue$1);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");
  const conditions = conditionsBySet[parameterSet];
  const setConditions = (nextConditions) => setConditionsBySet((current) => ({
    ...current,
    [parameterSet]: typeof nextConditions === "function" ? nextConditions(current[parameterSet]) : nextConditions
  }));
  const nextParameterSet = parameterSet === 3 ? 1 : parameterSet + 1;
  const updateCondition = (index, key, value) => setConditions(conditions.map((condition, itemIndex) => itemIndex === index ? {
    ...condition,
    [key]: value
  } : condition));
  const canSave = name.trim() && methods.some((method) => method.value.trim()) && (type !== "rename" || methods.every((method) => !method.value.trim() || method.replacementValue.trim()));
  const save = () => {
    if (!canSave) return;
    const submission = {
      type,
      name,
      status,
      conditionMatch: match,
      parameterSet,
      shipmentScope,
      conditionsBySet,
      methods: methods.map((method) => ({
        value: method.value,
        replacementValue: type === "rename" ? method.replacementValue : null
      })),
      schedules
    };
    fetcher.submit(customization ? {
      intent: "update",
      id: customization.id,
      data: submission
    } : submission, {
      method: "post",
      encType: "application/json",
      ...customization ? {
        action: "/app/customizations?index"
      } : {}
    });
  };
  const deleteCustomizationRule = () => {
    if (!customization) return;
    setDeleting(true);
    fetcher.submit({
      intent: "delete",
      id: customization.id
    }, {
      method: "post",
      encType: "application/json",
      action: "/app/customizations?index"
    });
  };
  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify2.toast.show(deleting ? "Shipping customization deleted" : "Shipping customization saved");
      navigate("/app/customizations");
      return;
    }
    shopify2.toast.show(fetcher.data.error || (deleting ? "Unable to delete customization" : "Unable to submit customization"), {
      isError: true
    });
    setDeleting(false);
  }, [deleting, fetcher.data, navigate, shopify2]);
  const updateMethod = (index, field, value) => setMethods(methods.map((method, itemIndex) => itemIndex === index ? {
    ...method,
    [field]: value
  } : method));
  const removeMethod = (index) => setMethods(methods.filter((_, itemIndex) => itemIndex !== index));
  const addMethod = () => setMethods([...methods, {
    value: "",
    replacementValue: ""
  }]);
  const openScheduleModal = () => {
    setScheduleAction("ACTIVATE");
    setScheduleDate(localDateValue$1());
    setScheduleTime("09:00");
    setScheduleTimezone(browserTimezone$1());
    setScheduleModalOpen(true);
  };
  const addSchedule = () => {
    const scheduledAt = /* @__PURE__ */ new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (!scheduleDate || !scheduleTime || Number.isNaN(scheduledAt.getTime())) {
      shopify2.toast.show("Select a valid schedule date and time", {
        isError: true
      });
      return;
    }
    setSchedules([...schedules, {
      action: scheduleAction,
      scheduledAt: scheduledAt.toISOString(),
      timezone: scheduleTimezone
    }]);
    setScheduleModalOpen(false);
  };
  const actionLabel = getCustomizationActionLabel(type);
  return /* @__PURE__ */ jsxs(Page, {
    title: customization ? "Edit customization rule" : "Create customization rule",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    secondaryActions: customization ? [{
      content: "Delete",
      destructive: true,
      onAction: () => setDeleteConfirmationOpen(true)
    }] : [],
    primaryAction: {
      content: "Save",
      onAction: save,
      disabled: !canSave
    },
    children: [/* @__PURE__ */ jsxs(Layout, {
      children: [/* @__PURE__ */ jsx(Layout.Section, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(FormLayout, {
              children: [/* @__PURE__ */ jsx(Select, {
                label: "Type",
                options: typeOptions,
                value: type,
                onChange: setType
              }), /* @__PURE__ */ jsx(TextField, {
                label: "Name",
                value: name,
                onChange: setName,
                placeholder: "e.g. Hide free shipping for heavy items",
                autoComplete: "off"
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsxs(InlineStack, {
                align: "space-between",
                blockAlign: "center",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "h2",
                  variant: "headingMd",
                  children: "Conditions"
                }), /* @__PURE__ */ jsxs(InlineStack, {
                  gap: "100",
                  blockAlign: "center",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Button, {
                    variant: "plain",
                    onClick: () => setParameterSet(nextParameterSet),
                    children: /* @__PURE__ */ jsxs(Text, {
                      as: "span",
                      children: ["Switch to parameter set ", nextParameterSet]
                    })
                  }), /* @__PURE__ */ jsx(Tooltip, {
                    dismissOnMouseOut: true,
                    content: "Three parameter sets are available for creating conditions. A rule may use parameters from only one set.",
                    children: /* @__PURE__ */ jsx(Icon, {
                      source: InfoIcon
                    })
                  })]
                })]
              }), /* @__PURE__ */ jsxs(BlockStack, {
                gap: "200",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Rule must match:"
                }), /* @__PURE__ */ jsx(RadioButton, {
                  label: "All conditions",
                  name: "customization-match",
                  checked: match === "all",
                  onChange: () => setMatch("all")
                }), /* @__PURE__ */ jsx(RadioButton, {
                  label: "Any condition",
                  name: "customization-match",
                  checked: match === "any",
                  onChange: () => setMatch("any")
                })]
              }), conditions.map((condition, index) => {
                const isKeyed = keyedConditionFields.has(condition.field);
                const hasOperator = !operatorlessConditionFields.has(condition.field);
                const hasValue = !valuelessConditionFields.has(condition.field);
                const hasMatchOptions = hasProductMatchOptions(condition.field);
                return /* @__PURE__ */ jsx(Card, {
                  background: "bg-surface-secondary",
                  children: /* @__PURE__ */ jsxs(BlockStack, {
                    gap: "300",
                    children: [/* @__PURE__ */ jsxs(InlineStack, {
                      align: "space-between",
                      blockAlign: "center",
                      children: [/* @__PURE__ */ jsxs(Text, {
                        as: "h3",
                        variant: "headingSm",
                        children: ["Condition ", index + 1]
                      }), /* @__PURE__ */ jsx(Button, {
                        icon: DeleteIcon,
                        tone: "critical",
                        variant: "plain",
                        accessibilityLabel: `Delete condition ${index + 1}`,
                        onClick: () => setConditions(conditions.filter((_, itemIndex) => itemIndex !== index))
                      })]
                    }), /* @__PURE__ */ jsxs(InlineStack, {
                      gap: "300",
                      wrap: true,
                      blockAlign: "start",
                      children: [/* @__PURE__ */ jsx(Box, {
                        minWidth: "220px",
                        children: /* @__PURE__ */ jsx(Select, {
                          label: "Field",
                          labelHidden: true,
                          options: conditionFieldOptionsFor(parameterSet),
                          value: condition.field,
                          onChange: (field) => setConditions(conditions.map((item, itemIndex) => itemIndex === index ? {
                            ...item,
                            field,
                            operator: getDefaultConditionOperator(field),
                            key: "",
                            productMatch: "at-least-one",
                            matchValue: ""
                          } : item))
                        })
                      }), isKeyed && /* @__PURE__ */ jsx(Box, {
                        minWidth: "200px",
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: condition.field === "Shipping Rate" ? "Shipping rate name" : `${condition.field} key`,
                          labelHidden: true,
                          placeholder: condition.field === "Shipping Rate" ? "Shipping Rate Name" : condition.field === "Variant Metafield" || condition.field === "Company Location Metafield" ? "namespace.key" : "Key",
                          value: condition.key,
                          onChange: (value) => updateCondition(index, "key", value),
                          autoComplete: "off"
                        })
                      }), hasOperator && /* @__PURE__ */ jsx(Box, {
                        minWidth: "200px",
                        children: /* @__PURE__ */ jsx(Select, {
                          label: "Operator",
                          labelHidden: true,
                          options: getConditionOperators(condition.field, parameterSet),
                          value: condition.operator,
                          onChange: (value) => updateCondition(index, "operator", value)
                        })
                      })]
                    }), hasValue && /* @__PURE__ */ jsx(TextField, {
                      label: "Value",
                      labelHidden: true,
                      value: condition.value,
                      onChange: (value) => updateCondition(index, "value", value),
                      autoComplete: "off"
                    }), condition.field === "Customer Tag" && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "You can enter multiple values separated by comma (,)."
                    }), condition.field === "Zipcode / Postcode" && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "Enter postcodes separated by commas. You can use asterisk (*) for wildcard. You can also use enter hyphen separated values for range. For e.g. AB14*, 444001-444099"
                    }), condition.field === "Province / State Code" && /* @__PURE__ */ jsxs(Text, {
                      as: "p",
                      tone: "subdued",
                      children: ["Enter two-letter province codes used by Shopify. You can find them", " ", /* @__PURE__ */ jsx("a", {
                        href: "https://help.shopify.com/en/manual/international/managing",
                        target: "_blank",
                        rel: "noreferrer",
                        children: "here"
                      }), "."]
                    }), condition.field === "Country Code" && /* @__PURE__ */ jsxs(Text, {
                      as: "p",
                      tone: "subdued",
                      children: ["Enter two-letter country codes used by Shopify. You can find them", " ", /* @__PURE__ */ jsx("a", {
                        href: "https://www.iban.com/country-codes",
                        target: "_blank",
                        rel: "noreferrer",
                        children: "here"
                      }), "."]
                    }), condition.field === "Address is a PO Box" && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "This condition will try to find any mention of PO Box in the address entered by customer."
                    }), condition.field === "Address is not a PO Box" && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "This condition will check that the address does NOT contain any mention of PO Box."
                    }), (condition.field === "Shipping Method Name" || condition.field === "Shipping Rate") && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "Enter part of the full shipping method name."
                    }), condition.field === "Always" && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: "This rule will be always true"
                    }), hasMatchOptions && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "300",
                      children: [condition.field === "Product Tag" && /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can enter multiple values separated by comma (,)."
                      }), condition.field === "Product Collection" && /* @__PURE__ */ jsxs(Text, {
                        as: "p",
                        tone: "subdued",
                        children: ["Enter IDs of collections. Click", " ", /* @__PURE__ */ jsx("a", {
                          href: "https://help.shopify.com/en/manual/products/collections",
                          target: "_blank",
                          rel: "noreferrer",
                          children: "here"
                        }), " ", "to find IDs. Comma separated multiple values are allowed."]
                      }), /* @__PURE__ */ jsxs(BlockStack, {
                        gap: "150",
                        children: [/* @__PURE__ */ jsx(Text, {
                          as: "p",
                          children: "Condition must match:"
                        }), productMatchOptions.map(([value, label]) => /* @__PURE__ */ jsx(RadioButton, {
                          label,
                          name: `product-tag-match-${index}`,
                          checked: condition.productMatch === value,
                          onChange: () => setConditions(conditions.map((item, itemIndex) => itemIndex === index ? {
                            ...item,
                            productMatch: value,
                            matchValue: ""
                          } : item))
                        }, value))]
                      }), (quantityMatches.has(condition.productMatch) || amountMatches.has(condition.productMatch)) && /* @__PURE__ */ jsx(Box, {
                        maxWidth: "220px",
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: quantityMatches.has(condition.productMatch) ? "Quantity" : "Amount",
                          type: "number",
                          min: 0,
                          step: 1,
                          value: condition.matchValue,
                          onChange: (value) => updateCondition(index, "matchValue", value),
                          autoComplete: "off"
                        })
                      })]
                    })]
                  })
                }, index);
              }), /* @__PURE__ */ jsx(Box, {
                children: /* @__PURE__ */ jsx(Button, {
                  icon: PlusIcon,
                  onClick: () => setConditions([...conditions, emptyCustomizationCondition()]),
                  children: "Add another condition"
                })
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Action"
              }), /* @__PURE__ */ jsxs(InlineStack, {
                gap: "100",
                blockAlign: "center",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: actionLabel
                }), /* @__PURE__ */ jsx(Tooltip, {
                  dismissOnMouseOut: true,
                  content: "You can enter part of the shipping method name to match multiple options. For example, to match 'Express Shipping' and 'Express Delivery' both, enter 'Express'.",
                  children: /* @__PURE__ */ jsx(Icon, {
                    source: InfoIcon
                  })
                })]
              }), methods.map((method, index) => /* @__PURE__ */ jsxs(InlineStack, {
                gap: "200",
                wrap: false,
                blockAlign: "center",
                children: [type === "rename" ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Original Method",
                      placeholder: "e.g. Express Shipping",
                      value: method.value,
                      onChange: (value) => updateMethod(index, "value", value),
                      autoComplete: "off"
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Replacement Method",
                      placeholder: "e.g. Priority Delivery",
                      value: method.replacementValue,
                      onChange: (value) => updateMethod(index, "replacementValue", value),
                      autoComplete: "off"
                    })
                  })]
                }) : /* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: `Method ${index + 1}`,
                    labelHidden: true,
                    placeholder: "e.g. Express Shipping",
                    value: method.value,
                    onChange: (value) => updateMethod(index, "value", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Button, {
                  icon: DeleteIcon,
                  accessibilityLabel: `Delete method ${index + 1}`,
                  onClick: () => removeMethod(index)
                })]
              }, index)), /* @__PURE__ */ jsx(Box, {
                children: /* @__PURE__ */ jsx(Button, {
                  icon: PlusIcon,
                  onClick: addMethod,
                  children: "Add another method"
                })
              })]
            })
          })]
        })
      }), /* @__PURE__ */ jsx(Layout.Section, {
        variant: "oneThird",
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "200",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Status"
              }), /* @__PURE__ */ jsx(Select, {
                label: "Status",
                labelHidden: true,
                options: ["Active", "Draft"],
                value: status,
                onChange: setStatus
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "200",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Advanced"
              }), /* @__PURE__ */ jsx(Text, {
                as: "p",
                children: "Apply rule to:"
              }), /* @__PURE__ */ jsx(RadioButton, {
                label: "All shipments",
                name: "shipment-scope",
                checked: shipmentScope === "all",
                onChange: () => setShipmentScope("all")
              }), /* @__PURE__ */ jsx(RadioButton, {
                label: "Only the first shipment",
                name: "shipment-scope",
                checked: shipmentScope === "first",
                onChange: () => setShipmentScope("first"),
                helpText: "Select this if you sell subscriptions and want the rule to apply only to the first shipment's shipping method."
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsxs(InlineStack, {
                align: "space-between",
                blockAlign: "center",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "100",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Schedule"
                  }), /* @__PURE__ */ jsx(Tooltip, {
                    content: "Activate or deactivate this customization automatically at a scheduled time.",
                    children: /* @__PURE__ */ jsx(Icon, {
                      source: InfoIcon
                    })
                  })]
                }), /* @__PURE__ */ jsx(Button, {
                  icon: PlusIcon,
                  onClick: openScheduleModal,
                  children: "Add schedule"
                })]
              }), schedules.length > 0 ? schedules.map((schedule, index) => /* @__PURE__ */ jsxs(InlineStack, {
                align: "space-between",
                blockAlign: "center",
                wrap: false,
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Badge, {
                    tone: "info",
                    children: schedule.action === "ACTIVATE" ? "Activate" : "Deactivate"
                  }), /* @__PURE__ */ jsx(Text, {
                    as: "span",
                    children: formatSchedule$1(schedule)
                  })]
                }), /* @__PURE__ */ jsx(Button, {
                  icon: DeleteIcon,
                  tone: "critical",
                  variant: "plain",
                  accessibilityLabel: `Delete schedule ${index + 1}`,
                  onClick: () => setSchedules(schedules.filter((_, scheduleIndex) => scheduleIndex !== index))
                })]
              }, `${schedule.scheduledAt}-${index}`)) : /* @__PURE__ */ jsx(Text, {
                as: "p",
                tone: "subdued",
                children: "No schedules added."
              })]
            })
          })]
        })
      })]
    }), /* @__PURE__ */ jsx(Box, {
      paddingBlockStart: "500",
      paddingBlockEnd: "500",
      children: /* @__PURE__ */ jsx(Text, {
        as: "p",
        alignment: "center",
        tone: "subdued",
        children: "Reach out to live chat support for set up assistance or feature requests."
      })
    }), /* @__PURE__ */ jsx(Modal, {
      open: scheduleModalOpen,
      onClose: () => setScheduleModalOpen(false),
      title: "Add schedule",
      primaryAction: {
        content: "Save",
        onAction: addSchedule
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setScheduleModalOpen(false)
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsxs(BlockStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Text, {
              as: "p",
              children: "Action"
            }), /* @__PURE__ */ jsx(RadioButton, {
              label: "Activate",
              name: "schedule-action",
              checked: scheduleAction === "ACTIVATE",
              onChange: () => setScheduleAction("ACTIVATE")
            }), /* @__PURE__ */ jsx(RadioButton, {
              label: "Deactivate",
              name: "schedule-action",
              checked: scheduleAction === "DEACTIVATE",
              onChange: () => setScheduleAction("DEACTIVATE")
            })]
          }), /* @__PURE__ */ jsx(TextField, {
            label: "Date",
            type: "date",
            value: scheduleDate,
            onChange: setScheduleDate,
            autoComplete: "off"
          }), /* @__PURE__ */ jsx(TextField, {
            label: "Time",
            type: "time",
            value: scheduleTime,
            onChange: setScheduleTime,
            autoComplete: "off",
            helpText: `Timezone: ${scheduleTimezone}`
          })]
        })
      })
    }), /* @__PURE__ */ jsx(Modal, {
      open: deleteConfirmationOpen,
      onClose: () => setDeleteConfirmationOpen(false),
      title: "Delete customization rule?",
      primaryAction: {
        content: "Delete",
        destructive: true,
        loading: deleting && fetcher.state !== "idle",
        onAction: deleteCustomizationRule
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setDeleteConfirmationOpen(false)
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(Text, {
          as: "p",
          children: ["This will permanently delete ", (customization == null ? void 0 : customization.name) || "this customization rule", "."]
        })
      })
    })]
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: app_customizations_new,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
function EnterSecretStep({
  sourceSecret,
  setSourceSecret
}) {
  return /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Enter Source Store Secret" }),
      /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "Enter the API secret from the source store. You can find it in Settings → Clone Setup." })
    ] }),
    /* @__PURE__ */ jsx(
      TextField,
      {
        label: "Source Store Secret",
        value: sourceSecret,
        onChange: setSourceSecret,
        placeholder: "Paste the secret here",
        autoComplete: "off"
      }
    )
  ] });
}
function SelectConfigurationStep() {
  return /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Select Configuration" }),
    /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "Choose which settings should be copied." })
  ] });
}
function MapZonesStep() {
  return /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Map Shipping Zones" }),
    /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "Match destination zones with source zones." })
  ] });
}
function ConfirmStep() {
  return /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Confirm" }),
    /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "Review all selected options before cloning." })
  ] });
}
function CompleteStep() {
  return /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Complete" }),
    /* @__PURE__ */ jsx(Text, { tone: "success", children: "Clone completed successfully." })
  ] });
}
const app_cloneSetup = UNSAFE_withComponentProps(function CloneStoreSetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [sourceSecret, setSourceSecret] = useState("");
  const [selectedConfigurations, setSelectedConfigurations] = useState([]);
  const [mappedZones, setMappedZones] = useState({});
  const steps = ["Enter Secret", "Select Configuration", "Map Zones", "Confirm", "Complete"];
  const progress = (currentStep + 1) / steps.length * 100;
  const handleContinue = () => {
    setError("");
    switch (currentStep) {
      case 0:
        if (!sourceSecret.trim()) {
          setError("Please enter a source store secret.");
          return;
        }
        break;
      case 1:
        if (selectedConfigurations.length === 0) {
          setError("Please select at least one configuration.");
          return;
        }
        break;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log("Clone completed");
    }
  };
  const handleBack = () => {
    setError("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  const wizardSteps = [/* @__PURE__ */ jsx(EnterSecretStep, {
    sourceSecret,
    setSourceSecret
  }, "step1"), /* @__PURE__ */ jsx(SelectConfigurationStep, {
    selectedConfigurations,
    setSelectedConfigurations
  }, "step2"), /* @__PURE__ */ jsx(MapZonesStep, {
    mappedZones,
    setMappedZones
  }, "step3"), /* @__PURE__ */ jsx(ConfirmStep, {
    sourceSecret,
    selectedConfigurations,
    mappedZones
  }, "step4"), /* @__PURE__ */ jsx(CompleteStep, {}, "step5")];
  return /* @__PURE__ */ jsx(Page, {
    title: "Clone Store Setup",
    backAction: {
      content: "Settings",
      onAction: () => navigate(-1)
    },
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "600",
      children: [/* @__PURE__ */ jsxs(BlockStack, {
        gap: "200",
        children: [/* @__PURE__ */ jsx(InlineStack, {
          align: "space-between",
          children: steps.map((step, index) => /* @__PURE__ */ jsx(Text, {
            as: "span",
            variant: "bodySm",
            tone: index === currentStep ? "base" : "subdued",
            fontWeight: index === currentStep ? "bold" : "regular",
            children: step
          }, step))
        }), /* @__PURE__ */ jsx(ProgressBar, {
          progress,
          tone: "primary",
          size: "small"
        })]
      }), error && /* @__PURE__ */ jsx(Banner, {
        tone: "critical",
        title: error,
        onDismiss: () => setError("")
      }), /* @__PURE__ */ jsx(Card, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "500",
          children: [wizardSteps[currentStep], /* @__PURE__ */ jsx(Box, {
            paddingBlockStart: "500",
            children: /* @__PURE__ */ jsxs(InlineStack, {
              align: "space-between",
              children: [/* @__PURE__ */ jsx(Box, {
                children: currentStep > 0 && /* @__PURE__ */ jsx(Button, {
                  onClick: handleBack,
                  children: "Back"
                })
              }), /* @__PURE__ */ jsx(Button, {
                variant: "primary",
                onClick: handleContinue,
                children: currentStep === steps.length - 1 ? "Finish" : "Validate & Continue"
              })]
            })
          })]
        })
      })]
    })
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_cloneSetup
}, Symbol.toStringTag, { value: "Module" }));
const allProducts = [{
  id: "1",
  name: "The Compare at Price Snowboard"
}, {
  id: "2",
  name: "The Collection Snowboard: Hydrogen"
}, {
  id: "3",
  name: "The Out of Stock Snowboard"
}, {
  id: "4",
  name: "The Complete Snowboard - Ice"
}, {
  id: "5",
  name: "The Complete Snowboard - Dawn"
}, {
  id: "6",
  name: "The Complete Snowboard - Powder"
}, {
  id: "7",
  name: "The Complete Snowboard - Electric"
}, {
  id: "8",
  name: "The Complete Snowboard - Sunset"
}, {
  id: "9",
  name: "The Archived Snowboard"
}, {
  id: "10",
  name: "Gift Card - $10"
}, {
  id: "11",
  name: "Gift Card - $25"
}, {
  id: "12",
  name: "Gift Card - $50"
}, {
  id: "13",
  name: "Gift Card - $100"
}, {
  id: "14",
  name: "Selling Plans Ski Wax - Selling Plans Ski Wax"
}, {
  id: "15",
  name: "Selling Plans Ski Wax - Special Selling Plans Ski Wax"
}, {
  id: "16",
  name: "Selling Plans Ski Wax - Sample Selling Plans Ski Wax"
}, {
  id: "17",
  name: "The Draft Snowboard"
}, {
  id: "18",
  name: "The Videographer Snowboard"
}, {
  id: "19",
  name: "The Hidden Snowboard"
}, {
  id: "20",
  name: "The Minimal Snowboard"
}, {
  id: "21",
  name: "The Inventory Not Tracked Snowboard"
}, {
  id: "22",
  name: "The Multi-location Snowboard"
}, {
  id: "23",
  name: "The 3p Fulfilled Snowboard"
}, {
  id: "24",
  name: "The Multi-managed Snowboard"
}, {
  id: "25",
  name: "The Collection Snowboard: Oxygen"
}, {
  id: "26",
  name: "The Collection Snowboard: Liquid"
}];
const csvEscape = (value) => {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};
const buildDimensionsCsv = (products) => {
  const header = ["Shopify Variant ID", "Variant Title", "Length", "Width", "Height"];
  const rows = products.map((product) => [product.id, product.name, "", "", ""]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
};
const app_products = UNSAFE_withComponentProps(function ProductsPage() {
  const [dimensions, setDimensions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const toggleModal = useCallback(() => {
    setIsModalOpen((active) => !active);
    setFiles([]);
  }, []);
  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => setFiles((files2) => [...files2, ...acceptedFiles]), []);
  const handleDownloadCsvFormat = useCallback(() => {
    const csvContent = buildDimensionsCsv(allProducts);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "product-dimensions-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);
  const fileUpload = !files.length && /* @__PURE__ */ jsx(DropZone.FileUpload, {
    actionTitle: "+ Add file",
    actionHint: "Accepts .csv"
  });
  const uploadedFiles = files.length > 0 && /* @__PURE__ */ jsx("div", {
    style: {
      padding: "10px"
    },
    children: /* @__PURE__ */ jsx(LegacyStack, {
      vertical: true,
      children: files.map((file, index) => /* @__PURE__ */ jsxs(LegacyStack, {
        alignment: "center",
        children: [/* @__PURE__ */ jsx(Thumbnail, {
          size: "small",
          alt: file.name,
          source: NoteIcon
        }), /* @__PURE__ */ jsxs("div", {
          children: [file.name, " ", /* @__PURE__ */ jsxs(Text, {
            variant: "bodySm",
            as: "p",
            children: [file.size, " bytes"]
          })]
        })]
      }, index))
    })
  });
  const handleDimensionChange = (id, field, value) => {
    setDimensions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id] || {},
        [field]: value
      }
    }));
  };
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const totalItems = allProducts.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = allProducts.slice(startIndex, startIndex + rowsPerPage);
  const rowMarkup = currentRows.map(({
    id,
    name
  }, index) => {
    var _a2, _b, _c;
    return /* @__PURE__ */ jsxs(IndexTable.Row, {
      id,
      position: index,
      children: [/* @__PURE__ */ jsx(IndexTable.Cell, {
        children: /* @__PURE__ */ jsx("div", {
          style: {
            padding: "12px 0"
          },
          children: /* @__PURE__ */ jsx(Text, {
            variant: "bodyMd",
            fontWeight: "bold",
            as: "span",
            children: name
          })
        })
      }), /* @__PURE__ */ jsx(IndexTable.Cell, {
        children: /* @__PURE__ */ jsx(TextField, {
          label: "Length",
          labelHidden: true,
          type: "number",
          suffix: "mm",
          autoComplete: "off",
          value: ((_a2 = dimensions[id]) == null ? void 0 : _a2.length) || "",
          onChange: (val) => handleDimensionChange(id, "length", val)
        })
      }), /* @__PURE__ */ jsx(IndexTable.Cell, {
        children: /* @__PURE__ */ jsx(TextField, {
          label: "Width",
          labelHidden: true,
          type: "number",
          suffix: "mm",
          autoComplete: "off",
          value: ((_b = dimensions[id]) == null ? void 0 : _b.width) || "",
          onChange: (val) => handleDimensionChange(id, "width", val)
        })
      }), /* @__PURE__ */ jsx(IndexTable.Cell, {
        children: /* @__PURE__ */ jsx(TextField, {
          label: "Height",
          labelHidden: true,
          type: "number",
          suffix: "mm",
          autoComplete: "off",
          value: ((_c = dimensions[id]) == null ? void 0 : _c.height) || "",
          onChange: (val) => handleDimensionChange(id, "height", val)
        })
      })]
    }, id);
  });
  return /* @__PURE__ */ jsxs(Page, {
    backAction: {
      content: "Products",
      url: "#"
    },
    title: "Products",
    primaryAction: {
      content: "Bulk upload dimensions",
      onAction: toggleModal
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        marginBottom: "40px"
      },
      children: /* @__PURE__ */ jsxs(LegacyCard, {
        children: [/* @__PURE__ */ jsx(IndexTable, {
          resourceName: {
            singular: "product",
            plural: "products"
          },
          itemCount: totalItems,
          selectable: false,
          headings: [{
            title: "Name"
          }, {
            title: "Length"
          }, {
            title: "Width"
          }, {
            title: "Height"
          }],
          children: rowMarkup
        }), totalItems > 0 && /* @__PURE__ */ jsx(Box, {
          padding: "300",
          background: "bg-surface-secondary",
          borderBlockStartWidth: "025",
          borderColor: "border",
          children: /* @__PURE__ */ jsx(InlineStack, {
            align: "center",
            blockAlign: "center",
            children: /* @__PURE__ */ jsx(Pagination, {
              hasPrevious: currentPage > 1,
              onPrevious: () => setCurrentPage((prev) => prev - 1),
              hasNext: startIndex + rowsPerPage < totalItems,
              onNext: () => setCurrentPage((prev) => prev + 1)
            })
          })
        })]
      })
    }), /* @__PURE__ */ jsxs(Modal, {
      open: isModalOpen,
      onClose: toggleModal,
      title: "Upload products dimensions by CSV",
      children: [/* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsx("div", {
          style: {
            marginBottom: "20px"
          },
          children: /* @__PURE__ */ jsxs(DropZone, {
            onDrop: handleDropZoneDrop,
            accept: ".csv",
            type: "file",
            children: [uploadedFiles, fileUpload]
          })
        })
      }), /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(InlineStack, {
          align: "space-between",
          blockAlign: "center",
          children: [/* @__PURE__ */ jsx(Button, {
            variant: "plain",
            onClick: handleDownloadCsvFormat,
            children: "Download CSV format"
          }), /* @__PURE__ */ jsxs(InlineStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Button, {
              onClick: toggleModal,
              children: "Cancel"
            }), /* @__PURE__ */ jsx(Button, {
              variant: "primary",
              disabled: files.length === 0,
              onClick: () => console.log("Uploading...", files),
              children: "Upload"
            })]
          })]
        })
      })]
    })]
  });
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_products
}, Symbol.toStringTag, { value: "Module" }));
const home = "_home_1bdju_2";
const card = "_card_1bdju_13";
const review = "_review_1bdju_32";
const faqCard = "_faqCard_1bdju_37";
const faq = "_faq_1bdju_37";
const billingPage = "_billingPage_1bdju_77";
const billingToggle = "_billingToggle_1bdju_87";
const activeBillingTab = "_activeBillingTab_1bdju_106";
const yearlyOffer = "_yearlyOffer_1bdju_110";
const pricingGrid = "_pricingGrid_1bdju_115";
const pricingCard = "_pricingCard_1bdju_120";
const planDescription = "_planDescription_1bdju_134";
const planPrice = "_planPrice_1bdju_139";
const featureList = "_featureList_1bdju_154";
const included = "_included_1bdju_168";
const excluded = "_excluded_1bdju_172";
const buyButton = "_buyButton_1bdju_177";
const currentPlanButton = "_currentPlanButton_1bdju_178";
const planHelp = "_planHelp_1bdju_197";
const videoCardCell = "_videoCardCell_1bdju_240";
const settingsToggle = "_settingsToggle_1bdju_247";
const secretRow = "_secretRow_1bdju_286";
const styles = {
  home,
  card,
  review,
  faqCard,
  faq,
  billingPage,
  billingToggle,
  activeBillingTab,
  yearlyOffer,
  pricingGrid,
  pricingCard,
  planDescription,
  planPrice,
  featureList,
  included,
  excluded,
  buyButton,
  currentPlanButton,
  planHelp,
  videoCardCell,
  settingsToggle,
  secretRow
};
const API_SECRET = "shipmagic_store_secret_7f3c91a2";
const formatNow = () => {
  const date = /* @__PURE__ */ new Date();
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/,/g, "");
};
const blendTypeLabels = {
  add: "Add",
  lowest: "Lowest",
  highest: "Highest"
};
function Toggle({
  checked,
  onChange,
  label
}) {
  return /* @__PURE__ */ jsxs("label", {
    className: styles.settingsToggle,
    children: [/* @__PURE__ */ jsx("input", {
      type: "checkbox",
      checked,
      onChange: (event) => onChange(event.target.checked),
      "aria-label": label
    }), /* @__PURE__ */ jsx("span", {
      "aria-hidden": "true"
    })]
  });
}
function SettingsRow({
  children,
  control
}) {
  return /* @__PURE__ */ jsx(Box, {
    padding: "400",
    children: /* @__PURE__ */ jsxs(InlineStack, {
      align: "space-between",
      blockAlign: "center",
      gap: "400",
      wrap: false,
      children: [/* @__PURE__ */ jsx(Box, {
        children
      }), control]
    })
  });
}
const app_settings = UNSAFE_withComponentProps(function SettingsPage() {
  const navigate = useNavigate();
  const [shippingRates, setShippingRates] = useState(false);
  const [shippingCustomizations, setShippingCustomizations] = useState(false);
  const [autoProductSync, setAutoProductSync] = useState(false);
  const [blendMode, setBlendMode] = useState("add");
  const [secretVisible, setSecretVisible] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSyncingZones, setIsSyncingZones] = useState(false);
  const [zonesDate, setZonesDate] = useState("13 Jul 2026, 12:09");
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [productsDate, setProductsDate] = useState("Not synced yet");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBlendType, setModalBlendType] = useState("add");
  const [blendTags, setBlendTags] = useState("");
  const [blendMax, setBlendMax] = useState("");
  const [blendMin, setBlendMin] = useState("");
  const [rateName, setRateName] = useState("");
  const [rateDescription, setRateDescription] = useState("");
  const [deliveryMin, setDeliveryMin] = useState("");
  const [deliveryMax, setDeliveryMax] = useState("");
  const [advancedRules, setAdvancedRules] = useState([]);
  const [limitRatesToggle, setLimitRatesToggle] = useState(false);
  const [rateRows, setRateRows] = useState([{
    name: "",
    max: "",
    min: ""
  }]);
  const handleSyncZones = () => {
    setIsSyncingZones(true);
    setTimeout(() => {
      setIsSyncingZones(false);
      setZonesDate(formatNow());
    }, 1e4);
  };
  const handleSyncProducts = () => {
    setIsSyncingProducts(true);
    setTimeout(() => {
      setIsSyncingProducts(false);
      setProductsDate(formatNow());
    }, 1e4);
  };
  const resetBlendForm = () => {
    setModalBlendType("add");
    setBlendTags("");
    setBlendMax("");
    setBlendMin("");
    setRateName("");
    setRateDescription("");
    setDeliveryMin("");
    setDeliveryMax("");
  };
  const openBlendModal = useCallback(() => {
    resetBlendForm();
    setIsModalOpen(true);
  }, []);
  const closeBlendModal = useCallback(() => setIsModalOpen(false), []);
  const canSaveBlendingRule = Boolean(blendTags.trim() && (modalBlendType !== "add" || rateName.trim()));
  const saveBlendingRule = () => {
    if (!canSaveBlendingRule) return;
    setAdvancedRules((rules) => [...rules, {
      id: Date.now(),
      blendType: modalBlendType,
      tags: blendTags,
      max: blendMax,
      min: blendMin,
      rateName,
      description: rateDescription,
      deliveryMin,
      deliveryMax
    }]);
    closeBlendModal();
  };
  const removeAdvancedRule = (id) => setAdvancedRules((rules) => rules.filter((rule) => rule.id !== id));
  const copySecret = async () => {
    var _a2;
    await ((_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(API_SECRET));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const addRow = () => setRateRows([...rateRows, {
    name: "",
    max: "",
    min: ""
  }]);
  const removeRow = (index) => setRateRows(rateRows.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => {
    const updated = [...rateRows];
    updated[index][field] = value;
    setRateRows(updated);
  };
  return /* @__PURE__ */ jsx(Fragment, {
    children: /* @__PURE__ */ jsx(Page, {
      title: "Settings",
      backAction: {
        content: "Back",
        onAction: () => navigate(-1)
      },
      primaryAction: {
        content: "Save",
        onAction: () => {
        }
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => navigate(-1)
      }],
      children: /* @__PURE__ */ jsxs(BlockStack, {
        gap: "500",
        children: [/* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "App Modes"
          }), /* @__PURE__ */ jsxs(Card, {
            padding: "0",
            children: [/* @__PURE__ */ jsx(SettingsRow, {
              control: /* @__PURE__ */ jsx(Toggle, {
                checked: shippingRates,
                onChange: setShippingRates,
                label: "Enable Shipping Rates"
              }),
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "050",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "headingSm",
                  children: "Shipping Rates"
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  tone: "subdued",
                  children: 'To test, use "shipflux" as first name at checkout.'
                }), /* @__PURE__ */ jsxs(Text, {
                  as: "p",
                  tone: "subdued",
                  children: ["To go live, ", /* @__PURE__ */ jsx("a", {
                    href: "/app/billing",
                    children: "upgrade"
                  }), ' to "Pro" plan.']
                })]
              })
            }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(SettingsRow, {
              control: /* @__PURE__ */ jsx(Toggle, {
                checked: shippingCustomizations,
                onChange: setShippingCustomizations,
                label: "Enable Shipping Customizations"
              }),
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "050",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "headingSm",
                  children: "Shipping Customizations"
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  tone: "subdued",
                  children: 'To test, use "shipflux" as first name at checkout.'
                }), /* @__PURE__ */ jsxs(Text, {
                  as: "p",
                  tone: "subdued",
                  children: ["To go live, ", /* @__PURE__ */ jsx("a", {
                    href: "/app/billing",
                    children: "upgrade"
                  }), ' to "Starter" plan.']
                })]
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "Syncing"
          }), /* @__PURE__ */ jsxs(Card, {
            padding: "0",
            children: [/* @__PURE__ */ jsx(SettingsRow, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "200",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "headingSm",
                  children: "Shipping Zones"
                }), /* @__PURE__ */ jsx(Box, {
                  children: /* @__PURE__ */ jsx(Button, {
                    onClick: handleSyncZones,
                    disabled: isSyncingZones,
                    children: isSyncingZones ? /* @__PURE__ */ jsx(Spinner, {
                      size: "small"
                    }) : "Sync now"
                  })
                }), /* @__PURE__ */ jsxs(Text, {
                  as: "p",
                  tone: "subdued",
                  children: ["Last synced: ", zonesDate]
                })]
              })
            }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(SettingsRow, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "200",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "headingSm",
                  children: "Products"
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  tone: "subdued",
                  children: "[Optional] You need to sync products only if you want to create shipping rate rules based on tags, title, type or barcode."
                }), /* @__PURE__ */ jsx(Box, {
                  children: /* @__PURE__ */ jsx(Button, {
                    onClick: handleSyncProducts,
                    disabled: isSyncingProducts,
                    children: isSyncingProducts ? /* @__PURE__ */ jsx(Spinner, {
                      size: "small"
                    }) : "Sync now"
                  })
                }), /* @__PURE__ */ jsxs(Text, {
                  as: "p",
                  tone: "subdued",
                  children: ["Last synced: ", productsDate]
                })]
              })
            }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(SettingsRow, {
              control: /* @__PURE__ */ jsx(Toggle, {
                checked: autoProductSync,
                onChange: setAutoProductSync,
                label: "Enable Auto Product Sync"
              }),
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "050",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "headingSm",
                  children: "Auto Product Sync"
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Enable this to auto sync new products with the app."
                })]
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "Blending"
          }), /* @__PURE__ */ jsxs(Card, {
            padding: "0",
            children: [/* @__PURE__ */ jsx(Box, {
              padding: "400",
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "300",
                children: [/* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "p",
                    variant: "headingSm",
                    children: "Basic"
                  }), /* @__PURE__ */ jsx(Text, {
                    as: "p",
                    tone: "subdued",
                    children: "Choose how you want to blend rates with same name."
                  })]
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Blend rates",
                  labelHidden: true,
                  options: [{
                    label: "Add rates",
                    value: "add"
                  }, {
                    label: "Show the lowest rate only",
                    value: "lowest"
                  }, {
                    label: "Show the highest rate only",
                    value: "highest"
                  }],
                  value: blendMode,
                  onChange: setBlendMode
                }), /* @__PURE__ */ jsxs(InlineStack, {
                  align: "space-between",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "p",
                    children: "Set limits while adding rates"
                  }), /* @__PURE__ */ jsx(Toggle, {
                    checked: limitRatesToggle,
                    onChange: setLimitRatesToggle,
                    label: "Set limits while adding rates"
                  })]
                }), limitRatesToggle && /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "200",
                  children: [rateRows.map((row, index) => /* @__PURE__ */ jsxs(InlineStack, {
                    gap: "200",
                    blockAlign: "end",
                    wrap: false,
                    children: [/* @__PURE__ */ jsx("div", {
                      style: {
                        flex: 1
                      },
                      children: /* @__PURE__ */ jsx(TextField, {
                        label: "Rate name",
                        labelHidden: true,
                        placeholder: "Rate name",
                        value: row.name,
                        onChange: (v) => updateRow(index, "name", v),
                        autoComplete: "off"
                      })
                    }), /* @__PURE__ */ jsx("div", {
                      style: {
                        flex: 1
                      },
                      children: /* @__PURE__ */ jsx(TextField, {
                        label: "Max limit",
                        labelHidden: true,
                        placeholder: "Max limit",
                        value: row.max,
                        onChange: (v) => updateRow(index, "max", v),
                        autoComplete: "off"
                      })
                    }), /* @__PURE__ */ jsx("div", {
                      style: {
                        flex: 1
                      },
                      children: /* @__PURE__ */ jsx(TextField, {
                        label: "Min limit",
                        labelHidden: true,
                        placeholder: "Min limit",
                        value: row.min,
                        onChange: (v) => updateRow(index, "min", v),
                        autoComplete: "off"
                      })
                    }), /* @__PURE__ */ jsx(Button, {
                      icon: DeleteIcon,
                      tone: "critical",
                      onClick: () => removeRow(index)
                    })]
                  }, index)), /* @__PURE__ */ jsx(Box, {
                    children: /* @__PURE__ */ jsx(Button, {
                      icon: PlusIcon,
                      onClick: addRow,
                      children: "Add"
                    })
                  })]
                })]
              })
            }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(Box, {
              padding: "400",
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "300",
                children: [/* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "p",
                    variant: "headingSm",
                    children: "Advanced"
                  }), /* @__PURE__ */ jsx(Text, {
                    as: "p",
                    tone: "subdued",
                    children: "Choose how you want to blend rates with different names (based on tags)."
                  })]
                }), advancedRules.length === 0 ? /* @__PURE__ */ jsx(Banner, {
                  tone: "info",
                  children: "No advanced blending rules created yet."
                }) : /* @__PURE__ */ jsx(BlockStack, {
                  gap: "200",
                  children: advancedRules.map((rule) => /* @__PURE__ */ jsx(Card, {
                    background: "bg-surface-secondary",
                    children: /* @__PURE__ */ jsxs(InlineStack, {
                      align: "space-between",
                      blockAlign: "center",
                      children: [/* @__PURE__ */ jsxs(BlockStack, {
                        gap: "050",
                        children: [/* @__PURE__ */ jsx(Text, {
                          as: "p",
                          variant: "headingSm",
                          children: rule.rateName || rule.tags
                        }), /* @__PURE__ */ jsxs(Text, {
                          as: "p",
                          tone: "subdued",
                          children: [blendTypeLabels[rule.blendType], " · Tags: ", rule.tags, rule.max ? ` · Max: ${rule.max}` : "", rule.min ? ` · Min: ${rule.min}` : ""]
                        })]
                      }), /* @__PURE__ */ jsx(Button, {
                        icon: DeleteIcon,
                        tone: "critical",
                        accessibilityLabel: `Delete blending rule ${rule.rateName || rule.tags}`,
                        onClick: () => removeAdvancedRule(rule.id)
                      })]
                    })
                  }, rule.id))
                }), /* @__PURE__ */ jsx(Box, {
                  children: /* @__PURE__ */ jsx(Button, {
                    icon: PlusIcon,
                    onClick: openBlendModal,
                    children: "Add"
                  })
                })]
              })
            })]
          })]
        }), /* @__PURE__ */ jsx(Modal, {
          open: isModalOpen,
          onClose: closeBlendModal,
          title: "Add blending rule",
          primaryAction: {
            content: "Done",
            onAction: saveBlendingRule,
            disabled: !canSaveBlendingRule
          },
          secondaryActions: [{
            content: "Cancel",
            onAction: closeBlendModal
          }],
          children: /* @__PURE__ */ jsx(Modal.Section, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsxs(BlockStack, {
                gap: "200",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "h3",
                  variant: "headingMd",
                  children: "Blending"
                }), /* @__PURE__ */ jsxs(FormLayout, {
                  children: [/* @__PURE__ */ jsx(Select, {
                    label: "Blend type",
                    requiredIndicator: true,
                    options: [{
                      label: "Add",
                      value: "add"
                    }, {
                      label: "Lowest",
                      value: "lowest"
                    }, {
                      label: "Highest",
                      value: "highest"
                    }],
                    value: modalBlendType,
                    onChange: setModalBlendType
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Tags",
                    requiredIndicator: true,
                    helpText: "Comma separated values are allowed.",
                    value: blendTags,
                    onChange: setBlendTags,
                    autoComplete: "off"
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Maximum",
                    value: blendMax,
                    onChange: setBlendMax,
                    autoComplete: "off"
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Minimum",
                    value: blendMin,
                    onChange: setBlendMin,
                    autoComplete: "off"
                  })]
                })]
              }), modalBlendType === "add" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "200",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h3",
                    variant: "headingMd",
                    children: "Details"
                  }), /* @__PURE__ */ jsx(Text, {
                    tone: "subdued",
                    children: "Enter details which customers should see when rates with different names are added."
                  }), /* @__PURE__ */ jsxs(FormLayout, {
                    children: [/* @__PURE__ */ jsx(TextField, {
                      label: "Rate name",
                      requiredIndicator: true,
                      value: rateName,
                      onChange: setRateName,
                      autoComplete: "off"
                    }), /* @__PURE__ */ jsx(TextField, {
                      label: "Description",
                      value: rateDescription,
                      onChange: setRateDescription,
                      autoComplete: "off"
                    }), /* @__PURE__ */ jsxs(InlineStack, {
                      gap: "400",
                      wrap: false,
                      children: [/* @__PURE__ */ jsx("div", {
                        style: {
                          flex: 1
                        },
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: "Delivery time",
                          suffix: "days",
                          value: deliveryMin,
                          onChange: setDeliveryMin,
                          autoComplete: "off"
                        })
                      }), /* @__PURE__ */ jsx("div", {
                        style: {
                          flex: 1,
                          paddingTop: "28px"
                        },
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: "Delivery time max",
                          labelHidden: true,
                          suffix: "days",
                          value: deliveryMax,
                          onChange: setDeliveryMax,
                          autoComplete: "off"
                        })
                      })]
                    })]
                  })]
                })]
              })]
            })
          })
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "API Secret"
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "p",
                variant: "headingSm",
                children: "Your Store API Secret"
              }), /* @__PURE__ */ jsxs("div", {
                className: styles.secretRow,
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: "Store API secret",
                  labelHidden: true,
                  value: secretVisible ? API_SECRET : "••••••••••••••••••••••••",
                  readOnly: true,
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(Button, {
                  icon: secretVisible ? HideIcon : ViewIcon,
                  onClick: () => setSecretVisible((visible) => !visible)
                }), /* @__PURE__ */ jsx(Button, {
                  icon: ClipboardIcon,
                  onClick: copySecret
                })]
              }), /* @__PURE__ */ jsx(Text, {
                as: "p",
                tone: "subdued",
                children: copied ? "Secret copied." : "Share this secret with other stores to allow them to clone your configuration."
              }), /* @__PURE__ */ jsx(Box, {
                children: /* @__PURE__ */ jsx(Button, {
                  variant: "primary",
                  tone: "critical",
                  children: "Regenerate Secret"
                })
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "Clone Setup"
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "p",
                variant: "headingSm",
                children: "Clone Configuration"
              }), /* @__PURE__ */ jsx(Text, {
                as: "p",
                tone: "subdued",
                children: "Copy shipping rates, customizations, and settings from another store using its API Secret."
              }), /* @__PURE__ */ jsx(Box, {
                children: /* @__PURE__ */ jsx(Button, {
                  variant: "primary",
                  onClick: () => navigate("/app/clone-setup"),
                  children: "Clone from another store"
                })
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "200",
          children: [/* @__PURE__ */ jsx(Text, {
            as: "h2",
            variant: "headingSm",
            children: "Other"
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsx(TextField, {
              label: "Contact Email",
              type: "email",
              value: contactEmail,
              onChange: setContactEmail,
              autoComplete: "email",
              helpText: "This will be used only for important communication. No Spam we promise!"
            })
          })]
        }), /* @__PURE__ */ jsx(Box, {
          paddingBlockEnd: "800"
        })]
      })
    })
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_settings
}, Symbol.toStringTag, { value: "Module" }));
const plans = [{
  name: "Sandbox / Test",
  description: "Try the full app in test mode. No charges.",
  monthly: 0,
  yearly: 0,
  current: true,
  features: [[false, "Use Shipping Rates in Live Mode"], [false, "Use Shipping Customizations in Live Mode"], [false, "Custom Coded Shipping Rates"], [true, "Configure rules & preview behavior in test mode only"], [true, "Hero Support"]]
}, {
  name: "Starter",
  description: "For Shipping Customizations only",
  monthly: 14,
  yearly: 140,
  features: [[false, "Use Shipping Rates in Live Mode"], [true, "Use Shipping Customizations in Live Mode"], [false, "Custom Coded Shipping Rates"], [true, "14-day free trial"], [true, "Hero support"]]
}, {
  name: "Pro",
  description: "For Shipping Rates and Shipping Customizations",
  monthly: 39,
  yearly: 390,
  features: [[true, "Use Shipping Rates in Live Mode"], [true, "Use Shipping Customizations in Live Mode"], [false, "Custom Coded Shipping Rates"], [true, "14-day free trial"], [true, "Hero support"]]
}, {
  name: "Pro+",
  description: "For Shipping Rates and Shipping Customizations",
  monthly: 59,
  yearly: 590,
  features: [[true, "Use Shipping Rates in Live Mode"], [true, "Use Shipping Customizations in Live Mode"], [true, "Custom Coded Shipping Rates"], [true, "14-day free trial"], [true, "Hero support"]]
}];
const app_billing = UNSAFE_withComponentProps(function Billing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const shopify2 = useAppBridge();
  return /* @__PURE__ */ jsx(Page, {
    title: "Shipping Rates",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    fullWidth: true,
    children: /* @__PURE__ */ jsxs("div", {
      className: styles.billingPage,
      children: [/* @__PURE__ */ jsxs("div", {
        className: styles.billingToggle,
        role: "tablist",
        "aria-label": "Billing cycle",
        children: [/* @__PURE__ */ jsx("button", {
          type: "button",
          role: "tab",
          "aria-selected": billingCycle === "monthly",
          className: billingCycle === "monthly" ? styles.activeBillingTab : "",
          onClick: () => setBillingCycle("monthly"),
          children: "Monthly"
        }), /* @__PURE__ */ jsx("button", {
          type: "button",
          role: "tab",
          "aria-selected": billingCycle === "yearly",
          className: billingCycle === "yearly" ? styles.activeBillingTab : "",
          onClick: () => setBillingCycle("yearly"),
          children: "Yearly"
        })]
      }), /* @__PURE__ */ jsx("p", {
        className: styles.yearlyOffer,
        children: "Get 2 months FREE when you pay yearly!"
      }), /* @__PURE__ */ jsx("div", {
        className: styles.pricingGrid,
        children: plans.map((plan) => /* @__PURE__ */ jsxs("article", {
          className: styles.pricingCard,
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              children: plan.name
            }), /* @__PURE__ */ jsx("p", {
              className: styles.planDescription,
              children: plan.description
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: styles.planPrice,
            children: [/* @__PURE__ */ jsxs("span", {
              children: ["$", plan[billingCycle]]
            }), /* @__PURE__ */ jsxs("small", {
              children: ["/ per ", billingCycle === "monthly" ? "month" : "year"]
            })]
          }), /* @__PURE__ */ jsx("ul", {
            className: styles.featureList,
            children: plan.features.map(([included2, feature]) => /* @__PURE__ */ jsxs("li", {
              children: [/* @__PURE__ */ jsx("span", {
                className: included2 ? styles.included : styles.excluded,
                "aria-hidden": "true",
                children: included2 ? "✓" : "×"
              }), /* @__PURE__ */ jsx("span", {
                children: feature
              })]
            }, feature))
          }), /* @__PURE__ */ jsx("button", {
            type: "button",
            className: plan.current ? styles.currentPlanButton : styles.buyButton,
            disabled: plan.current,
            onClick: () => shopify2.toast.show(`${plan.name} ${billingCycle} plan selected`),
            children: plan.current ? "Current Plan" : "Buy Now"
          })]
        }, plan.name))
      }), /* @__PURE__ */ jsxs("p", {
        className: styles.planHelp,
        children: ["Not sure which plan to choose? Click", " ", /* @__PURE__ */ jsx("a", {
          href: "mailto:support@offsidetech.app",
          children: "here"
        })]
      })]
    })
  });
});
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_billing
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const faqs = [["What is the difference between Shipping Rates and Shipping Customizations?", "Shipping Rates calculate a price at checkout. Shipping Customizations rename, reorder, or hide the delivery options your customers see."], ["I need help in setting up the app.", "Choose Talk to agent now for live help, or schedule a convenient onboarding session with our setup team."], ["My requirements don't meet.", "Contact support with your exact shipping workflow. We can help design a rule set or suggest a practical alternative."], ["Do I need CCS in order for this app to work?", "Carrier-calculated shipping is required for live calculated rates. Customizations can still work independently on eligible plans."], ["I want to avoid doubling of shipping charges which occurs because of multiple origins.", "Create a combined-rate rule and choose how rates from multiple fulfillment locations should be merged."]];
const app__index = UNSAFE_withComponentProps(function Index() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const notify = (message) => {
    var _a2, _b;
    return (_b = (_a2 = window.shopify) == null ? void 0 : _a2.toast) == null ? void 0 : _b.show(message);
  };
  return /* @__PURE__ */ jsx("s-page", {
    heading: "ShipFlux: Shipping Calculator",
    inlineSize: "large",
    children: /* @__PURE__ */ jsxs("div", {
      className: styles.home,
      children: [/* @__PURE__ */ jsx(Text, {
        variant: "headingMd",
        as: "h6",
        children: "Get started"
      }), /* @__PURE__ */ jsxs("section", {
        className: styles.card,
        children: [/* @__PURE__ */ jsx(Text, {
          variant: "headingMd",
          as: "h6",
          children: "Get a free onboarding session"
        }), /* @__PURE__ */ jsx("p", {
          children: "Reach out to our live chat and get a free onboarding session where we will help you set up the app quickly."
        }), /* @__PURE__ */ jsxs("div", {
          className: styles.review,
          children: [/* @__PURE__ */ jsx("div", {
            children: "⭐⭐⭐⭐⭐"
          }), /* @__PURE__ */ jsxs("em", {
            children: ["“The support is amazing, fast, responsive and accurate. They take time to understand your exact need and are pro-active at helping.”", /* @__PURE__ */ jsx("br", {}), "~ Jacob Miller (Durant Cricket)"]
          })]
        }), /* @__PURE__ */ jsxs(InlineStack, {
          gap: "300",
          children: [/* @__PURE__ */ jsx(Button, {
            variant: "primary",
            onClick: () => notify("An agent will be with you shortly."),
            children: "Talk to Agent"
          }), /* @__PURE__ */ jsx(Button, {
            onClick: () => notify("Onboarding scheduled."),
            children: "Schedule for Later"
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: styles.card,
        children: [/* @__PURE__ */ jsx(Text, {
          variant: "headingMd",
          as: "h6",
          children: "Learn how to setup the app yourself"
        }), /* @__PURE__ */ jsx("p", {
          children: "Explore the instructional videos to learn how to set up the app yourself."
        }), /* @__PURE__ */ jsx(Button, {
          onClick: () => navigate("/app/videos"),
          variant: "primary",
          children: "Watch Videos"
        })]
      }), /* @__PURE__ */ jsx(Text, {
        variant: "headingMd",
        as: "h6",
        children: "FAQs"
      }), /* @__PURE__ */ jsx("section", {
        className: `${styles.card} ${styles.faqCard}`,
        children: faqs.map(([question, answer], index) => /* @__PURE__ */ jsxs("div", {
          className: styles.faq,
          children: [/* @__PURE__ */ jsxs("button", {
            onClick: () => setOpenFaq(openFaq === index ? null : index),
            "aria-expanded": openFaq === index,
            children: [/* @__PURE__ */ jsxs("span", {
              children: [index + 1, ". ", question]
            }), /* @__PURE__ */ jsx("span", {
              children: openFaq === index ? "⌃" : "⌄"
            })]
          }), openFaq === index && /* @__PURE__ */ jsx("p", {
            children: answer
          })]
        }, question))
      }), /* @__PURE__ */ jsxs("footer", {
        children: ["Reach out to ", /* @__PURE__ */ jsx("a", {
          href: "mailto:support@offsidetech.app",
          children: "support"
        }), " | Offside Tech Apps"]
      })]
    })
  });
});
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app__index,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const videos = [{
  title: "Per item / Incremental shipping rates",
  description: "Learn how to set up shipping rates that increase by amount X for every Y additional items in cart.",
  thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
  youtube: "https://youtu.be/rUXvpyftrIg",
  category: "rates",
  tags: ["Per item rates", "Incremental rates"]
}, {
  title: "Percentage based shipping rates",
  description: "Create shipping rates based on percentage of cart subtotal.",
  thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
  youtube: "https://youtu.be/rUXvpyftrIg",
  category: "rates",
  tags: ["Percentage rates"]
}, {
  title: "Zipcode / Postcode shipping rates",
  description: "Create different shipping rates for groups of zipcodes/postcodes.",
  thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
  youtube: "https://youtu.be/rUXvpyftrIg",
  category: "customizations",
  tags: ["Postcode", "Zipcode"]
}];
const app_videos = UNSAFE_withComponentProps(function Videos() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("all");
  const list = useMemo(() => {
    if (selected === "all") return videos;
    if (selected === "rates") return videos.filter((v) => v.category === "rates");
    return videos.filter((v) => v.category === "customizations");
  }, [selected]);
  return /* @__PURE__ */ jsx(Page, {
    title: "Example Setup Videos",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "500",
      children: [/* @__PURE__ */ jsx(Text, {
        as: "p",
        variant: "bodyMd",
        children: "Learn how to setup the app for some of the most-common shipping rate requirements."
      }), /* @__PURE__ */ jsx(Banner, {
        tone: "info",
        title: "Please Note",
        children: /* @__PURE__ */ jsxs("p", {
          children: ["This page features videos on common shipping rate scenarios. For other app capabilities, ", /* @__PURE__ */ jsx(Link, {
            url: "mailto:support@example.com",
            children: "contact"
          }), " customer support or check back for updates as we add new videos regularly."]
        })
      }), /* @__PURE__ */ jsxs(InlineStack, {
        gap: "400",
        blockAlign: "center",
        children: [/* @__PURE__ */ jsx(RadioButton, {
          label: "All Videos",
          checked: selected === "all",
          id: "all",
          name: "videoFilter",
          onChange: () => setSelected("all")
        }), /* @__PURE__ */ jsx(RadioButton, {
          label: "Shipping Rates Videos",
          checked: selected === "rates",
          id: "rates",
          name: "videoFilter",
          onChange: () => setSelected("rates")
        }), /* @__PURE__ */ jsx(RadioButton, {
          label: "Shipping Customizations Videos",
          checked: selected === "customizations",
          id: "customizations",
          name: "videoFilter",
          onChange: () => setSelected("customizations")
        })]
      }), /* @__PURE__ */ jsx(Grid, {
        children: list.map((video) => /* @__PURE__ */ jsx(Grid.Cell, {
          columnSpan: {
            xs: 6,
            sm: 3,
            md: 2,
            lg: 4,
            xl: 4
          },
          children: /* @__PURE__ */ jsx("div", {
            className: styles.videoCardCell,
            children: /* @__PURE__ */ jsx(Card, {
              padding: "0",
              children: /* @__PURE__ */ jsxs("a", {
                href: video.youtube,
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  textDecoration: "none",
                  color: "inherit"
                },
                children: [/* @__PURE__ */ jsxs(Box, {
                  position: "relative",
                  children: [/* @__PURE__ */ jsx("img", {
                    src: video.thumbnail,
                    alt: video.title,
                    style: {
                      width: "100%",
                      display: "block",
                      aspectRatio: "16/9",
                      objectFit: "cover"
                    }
                  }), /* @__PURE__ */ jsx("img", {
                    src: "https://shipmagic.fly.dev/assets/play-button-M-9Od2Qw.png",
                    alt: "",
                    style: {
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 80
                    }
                  })]
                }), /* @__PURE__ */ jsx(Box, {
                  padding: "400",
                  width: "100%",
                  children: /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      height: "100%"
                    },
                    children: [/* @__PURE__ */ jsxs(BlockStack, {
                      gap: "300",
                      children: [/* @__PURE__ */ jsx(Text, {
                        as: "h3",
                        variant: "headingMd",
                        children: video.title
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: video.description
                      })]
                    }), /* @__PURE__ */ jsx("div", {
                      style: {
                        marginTop: "auto",
                        paddingTop: "12px"
                      },
                      children: /* @__PURE__ */ jsx(InlineStack, {
                        gap: "200",
                        children: video.tags.map((t) => /* @__PURE__ */ jsx(Badge, {
                          tone: "info",
                          children: t
                        }, t))
                      })
                    })]
                  })
                })]
              })
            })
          })
        }, video.title))
      })]
    })
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_videos
}, Symbol.toStringTag, { value: "Module" }));
const app_rates = UNSAFE_withComponentProps(function RatesLayout() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_rates
}, Symbol.toStringTag, { value: "Module" }));
async function actionPayload(request) {
  var _a2;
  if ((_a2 = request.headers.get("content-type")) == null ? void 0 : _a2.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  const data = formData.get("data");
  return {
    intent: formData.get("intent"),
    id: formData.get("id"),
    ids: formData.getAll("ids"),
    data: typeof data === "string" && data ? JSON.parse(data) : void 0
  };
}
function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}
const action$3 = async ({
  request
}) => {
  const {
    admin,
    session
  } = await authenticate.admin(request);
  try {
    const payload = await actionPayload(request);
    const intent = requiredString(payload.intent, "intent");
    if (intent === "update") {
      const id = requiredString(payload.id, "id");
      const rate = await updateRate(session.shop, id, payload.data, admin);
      return Response.json({
        ok: true,
        rate
      });
    }
    if (intent === "delete") {
      const ids = Array.isArray(payload.ids) && payload.ids.length ? payload.ids.map((id) => requiredString(id, "id")) : [requiredString(payload.id, "id")];
      await Promise.all(ids.map((id) => deleteRate(session.shop, id)));
      return Response.json({
        ok: true,
        ids
      });
    }
    return Response.json({
      ok: false,
      error: "Unsupported action"
    }, {
      status: 400
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError || error instanceof SyntaxError) {
      return Response.json({
        ok: false,
        error: error.message
      }, {
        status: 400
      });
    }
    return Response.json({
      ok: false,
      error: "Unable to update rate"
    }, {
      status: 500
    });
  }
};
const loader$4 = async ({
  request
}) => {
  const {
    admin,
    session
  } = await authenticate.admin(request);
  try {
    return await loadRateData(session.shop, admin);
  } catch {
    throw new Response("Unable to load rate data", {
      status: 500
    });
  }
};
function titleCase(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—";
}
function conditionField(condition) {
  if (["Cart Contains", "Cart Does Not Contain"].includes(condition.field)) {
    return condition.subfield || condition.field;
  }
  return condition.field;
}
function conditionSummary(condition) {
  return [conditionField(condition), condition.operator, condition.value].filter((value) => value !== void 0 && value !== null && String(value).trim()).join(" ");
}
const app_rates__index = UNSAFE_withComponentProps(function RatesIndex() {
  var _a2;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify2 = useAppBridge();
  const {
    rates,
    carrierService
  } = useLoaderData();
  const [pendingDelete, setPendingDelete] = useState([]);
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection
  } = useIndexResourceState(rates);
  const addRule = () => navigate("/app/rates/new");
  useEffect(() => {
    var _a3;
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify2.toast.show(((_a3 = fetcher.data.ids) == null ? void 0 : _a3.length) > 1 ? "Shipping rate rules deleted" : "Shipping rate rule deleted");
      setPendingDelete([]);
      clearSelection();
      return;
    }
    shopify2.toast.show(fetcher.data.error || "Unable to delete rate rule", {
      isError: true
    });
  }, [clearSelection, fetcher.data, shopify2]);
  const confirmDelete = () => {
    if (!pendingDelete.length) return;
    fetcher.submit({
      intent: "delete",
      ids: pendingDelete.map((rate) => rate.id)
    }, {
      method: "post",
      encType: "application/json"
    });
  };
  const deleteSelectedRates = () => {
    const selectedRates = allResourcesSelected ? rates : rates.filter((rate) => selectedResources.includes(rate.id));
    setPendingDelete(selectedRates);
  };
  return /* @__PURE__ */ jsxs(Page, {
    title: "Shipping Rates",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    primaryAction: {
      content: "Add Rule",
      onAction: addRule
    },
    children: [/* @__PURE__ */ jsxs(BlockStack, {
      gap: "400",
      children: [!(carrierService == null ? void 0 : carrierService.available) && /* @__PURE__ */ jsx(Banner, {
        title: "CCS is not enabled for your store.",
        tone: "critical",
        children: /* @__PURE__ */ jsxs(List, {
          children: [/* @__PURE__ */ jsx(List.Item, {
            children: "CCS is required to show shipping rates from all shipping rate apps in Shopify."
          }), /* @__PURE__ */ jsxs(List.Item, {
            children: ["Click", " ", /* @__PURE__ */ jsx(Link, {
              url: "https://help.shopify.com/en/manual/shipping/setting-up-and-managing-your-shipping/enabling-shipping-carriers",
              external: true,
              children: "here"
            }), " ", "to know more about CCS and how to enable it."]
          })]
        })
      }), /* @__PURE__ */ jsx(Card, {
        padding: "0",
        children: rates.length > 0 ? /* @__PURE__ */ jsx(IndexTable, {
          resourceName: {
            singular: "rate rule",
            plural: "rate rules"
          },
          itemCount: rates.length,
          selectedItemsCount: allResourcesSelected ? "All" : selectedResources.length,
          onSelectionChange: handleSelectionChange,
          promotedBulkActions: [{
            content: "Delete",
            destructive: true,
            onAction: deleteSelectedRates
          }],
          headings: [{
            title: "Name"
          }, {
            title: "Status"
          }, {
            title: "Priority"
          }, {
            title: "Condition"
          }],
          children: rates.map((rate, index) => {
            var _a3, _b;
            return /* @__PURE__ */ jsxs(IndexTable.Row, {
              id: rate.id,
              position: index,
              selected: selectedResources.includes(rate.id),
              accessibilityLabel: `Edit ${rate.name}`,
              onClick: () => navigate(`/app/rates/new?id=${rate.id}`),
              children: [/* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsx(Text, {
                  as: "span",
                  fontWeight: "semibold",
                  children: rate.name
                })
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsxs(InlineStack, {
                  gap: "100",
                  blockAlign: "center",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Badge, {
                    tone: rate.status === "ACTIVE" ? "success" : void 0,
                    children: titleCase(rate.status)
                  }), ((_a3 = rate.schedules) == null ? void 0 : _a3.length) > 0 && /* @__PURE__ */ jsx(Box, {
                    background: "bg-fill-caution-secondary",
                    borderRadius: "full",
                    minWidth: "32px",
                    paddingBlock: "050",
                    paddingInline: "100",
                    children: /* @__PURE__ */ jsx(InlineStack, {
                      align: "center",
                      blockAlign: "center",
                      children: /* @__PURE__ */ jsx(Icon, {
                        source: ClockIcon,
                        tone: "caution",
                        accessibilityLabel: "Scheduled"
                      })
                    })
                  })]
                })
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: rate.priority
              }), /* @__PURE__ */ jsx(IndexTable.Cell, {
                children: /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsxs(Text, {
                    as: "span",
                    children: ["Match", " ", /* @__PURE__ */ jsx(Text, {
                      as: "span",
                      fontWeight: "semibold",
                      children: String(rate.matchMode || "ALL").toUpperCase() === "ALL" ? "All" : "Any"
                    }), " ", "conditions"]
                  }), ((_b = rate.conditions) == null ? void 0 : _b.length) ? rate.conditions.map((condition) => /* @__PURE__ */ jsx(Text, {
                    as: "span",
                    children: conditionSummary(condition)
                  }, condition.id)) : /* @__PURE__ */ jsx(Text, {
                    as: "span",
                    tone: "subdued",
                    children: "No conditions"
                  })]
                })
              })]
            }, rate.id);
          })
        }) : /* @__PURE__ */ jsx(EmptyState, {
          heading: "You haven't created any rules yet.",
          action: {
            content: "Add Rule",
            onAction: addRule
          },
          image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        })
      }), /* @__PURE__ */ jsx(Box, {
        paddingBlockEnd: "400",
        children: /* @__PURE__ */ jsx(InlineStack, {
          align: "center",
          gap: "100",
          children: /* @__PURE__ */ jsxs(Text, {
            as: "span",
            variant: "bodyMd",
            children: [/* @__PURE__ */ jsx(Link, {
              url: "#learn",
              children: "Learn"
            }), " more about Shipping Rates |", " ", /* @__PURE__ */ jsx(Link, {
              url: "#troubleshoot",
              children: "Troubleshoot"
            }), " Shipping Rates"]
          })
        })
      })]
    }), /* @__PURE__ */ jsx(Modal, {
      open: pendingDelete.length > 0,
      onClose: () => setPendingDelete([]),
      title: pendingDelete.length > 1 ? "Delete rate rules?" : "Delete rate rule?",
      primaryAction: {
        content: "Delete",
        destructive: true,
        loading: fetcher.state !== "idle",
        onAction: confirmDelete
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setPendingDelete([])
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsx(Text, {
          as: "p",
          children: pendingDelete.length > 1 ? `This will permanently delete ${pendingDelete.length} rate rules.` : `This will permanently delete ${((_a2 = pendingDelete[0]) == null ? void 0 : _a2.name) || "this rate rule"}.`
        })
      })
    })]
  });
});
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: app_rates__index,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const blankCondition = () => ({
  field: "Product Tag",
  subfield: "Product Tag",
  key: "",
  operator: "Equals",
  value: "",
  quantityCheck: "atLeastOne",
  quantityValue: ""
});
const cartProductFields = [
  "Product Title",
  "Variant Title",
  "Product Tag",
  "SKU",
  "Product Barcode",
  "Product Vendor",
  "Product Price",
  "Product Compare-at Price",
  "Product Quantity",
  "Product Type",
  "Product Weight",
  "Line item property",
  "Product Metafield",
  "Variant Metafield",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product Volume"
];
const isCartProductCondition = (field) => ["Cart Contains", "Cart Does Not Contain"].includes(field);
const effectiveConditionField = (condition) => isCartProductCondition(condition.field) ? condition.subfield : condition.field;
const isKeyedCondition = (condition) => effectiveConditionField(condition).includes("Metafield") || effectiveConditionField(condition) === "Line item property";
const blankRate = () => ({
  name: "",
  description: "",
  minimumDays: "",
  maximumDays: "",
  currency: "Default Store Currency",
  calculation: "Fixed rate",
  price: "",
  roundUp: false,
  metafieldKey: "",
  increasePerItem: false,
  defaultRate: "",
  rateType: "Range",
  rangeStart: "",
  rangeEnd: "",
  basePrice: "",
  incrementalPrice: "",
  perEach: "",
  startFrom: "",
  priceCalculation: "Number of items",
  secondRangeStart: "",
  secondRangeEnd: "",
  googleMapsApiKey: "",
  originLocation: "Default Shopify Location",
  originCountry: "US",
  originPostcode: "",
  distanceMethod: "Driving",
  carrierApiKey: "",
  carrierSecret: "",
  carrierAccount: "",
  carrierEmail: "",
  carrierPassword: "",
  carrierSchedule: "Retail",
  ratesToShow: "All rates",
  hideDeliveryDates: false,
  packagingDistribution: "By items count",
  packages: [{ limit: "", length: "", width: "", height: "", weight: "" }],
  discount: "",
  handlingPercent: "",
  handlingFixed: "",
  carrierRateType: "Item",
  fuelLevy: false,
  packageType: "Parcel",
  signatureRequired: "No",
  insured: "No",
  selectedServices: [],
  tags: ""
});
const currencyCodes = {
  "Default Store Currency": "USD",
  "United Arab Emirates Dirham": "AED",
  "Australian Dollars": "AUD",
  "Canadian Dollars": "CAD",
  Euro: "EUR",
  "United Kingdom Pounds": "GBP",
  "Indian Rupees": "INR",
  "Japanese Yen": "JPY",
  "New Zealand Dollars": "NZD",
  "United States Dollars": "USD",
  "South African Rand": "ZAR",
  "Hong Kong Dollars": "HKD",
  "Swiss Francs": "CHF",
  "Polish Zlotych": "PLN"
};
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryOptions = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(" ").map((code) => ({ code, name: regionNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
const carrierNames = [
  "Australia Post",
  "USPS",
  "Fedex",
  "Shiprocket",
  "Direct Freight Express",
  "Stallion Express",
  "ShipStation"
];
const uspsDomesticServices = [
  "Priority Mail",
  "Priority Mail Flat Rate Envelope",
  "Priority Mail Small Flat Rate Box",
  "Priority Mail Medium Flat Rate Box",
  "Priority Mail Large Flat Rate Box",
  "Priority Mail Padded Flat Rate Envelope",
  "Priority Mail Legal Flat Rate Envelope",
  "Priority Mail Window Flat Rate Envelope",
  "Priority Mail Express",
  "Priority Mail Express Flat Rate Envelope",
  "Priority Mail Express Padded Flat Rate Envelope",
  "First-Class Mail",
  "Ground Advantage",
  "Media Mail Parcel",
  "Library Mail Parcel"
];
const uspsInternationalServices = [
  "Priority Mail International",
  "Priority Mail International Flat Rate Envelope",
  "Priority Mail International Small Flat Rate Box",
  "Priority Mail International Medium Flat Rate Box",
  "Priority Mail International Large Flat Rate Box",
  "Priority Mail Express International",
  "First-Class Package International",
  "Global Express Guaranteed",
  "Global Express Guaranteed - Envelopes"
];
const textFields = /* @__PURE__ */ new Set([
  "Product Title",
  "Variant Title",
  "SKU",
  "Product Barcode",
  "Product Vendor",
  "Product Type",
  "Line item property",
  "Address Line 1",
  "Customer First Name",
  "Customer Last Name"
]);
const numericFields = /* @__PURE__ */ new Set([
  "Product Price",
  "Product Compare-at Price",
  "Product Quantity",
  "Product Weight",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product Volume",
  "Cart Quantity",
  "Cart Subtotal (total before discount)",
  "Cart Total (total after discount)",
  "Cart Weight",
  "Cart Volume"
]);
const idFields = /* @__PURE__ */ new Set(["Shopify Variant ID", "Shopify Product ID"]);
const conditionBehavior = (field) => {
  if (field === "Product Tag" || field === "Customer Tag")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "You can enter multiple values separated by comma (,).",
      type: "text"
    };
  if (field === "Address Line 1")
    return {
      operators: ["Contains", "Does Not Contain"],
      help: "You can enter multiple values separated by semi-colon (;).",
      type: "text"
    };
  if (textFields.has(field))
    return {
      operators: ["Equals", "Does Not Equal", "Contains", "Does Not Contain"],
      help: ["Customer First Name", "Customer Last Name"].includes(field) ? "" : "You can enter multiple values separated by semi-colon (;).",
      type: "text"
    };
  if ([
    "Product Price",
    "Product Compare-at Price",
    "Cart Subtotal (total before discount)",
    "Cart Total (total after discount)"
  ].includes(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal"
      ],
      help: "",
      type: "number",
      currency: true
    };
  if (["Product Weight", "Cart Weight"].includes(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal"
      ],
      help: "",
      type: "number",
      unit: "lb"
    };
  if ([
    "Product Length",
    "Product Width",
    "Product Height",
    "Product Volume",
    "Cart Volume"
  ].includes(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal"
      ],
      help: "",
      type: "number",
      unit: ["Product Volume", "Cart Volume"].includes(field) ? "mm³" : "mm"
    };
  if (numericFields.has(field))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than",
        "Less Than or Equal"
      ],
      help: "Enter a numeric value for this condition.",
      type: "number"
    };
  if (idFields.has(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "You can also enter multiple values separated by semi-colon (;).",
      type: "text"
    };
  if (field.includes("Metafield"))
    return {
      operators: [
        "Equals",
        "Does Not Equal",
        "Contains",
        "Greater Than",
        "Less Than",
        "Greater Than or Equal",
        "Less Than or Equal",
        "Is True",
        "Is False",
        ...field === "Variant Metafield" ? ["Is Empty", "Is Not Empty"] : []
      ],
      help: "You can enter multiple values separated by semi-colon (;).",
      type: "text"
    };
  if (["Zipcode / Postcode", "Warehouse Zipcode / Postcode"].includes(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text"
    };
  if (["Province / State Code", "Country Code"].includes(field))
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text"
    };
  if (field === "Day of the Week")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text"
    };
  if (field === "Cart Locale")
    return {
      operators: ["Equals", "Does Not Equal"],
      help: "",
      type: "text"
    };
  if (["Cart Contains", "Cart Does Not Contain"].includes(field))
    return {
      operators: [
        "Product",
        "Variant",
        "Collection",
        "Product Type",
        "Vendor",
        "Tag"
      ],
      help: "Enter the item value that should be checked in the cart.",
      type: "text"
    };
  if (field === "Time of the Day")
    return {
      operators: [
        "Less Than",
        "Greater Than",
        "Greater Than or Equal",
        "Less Than or Equal"
      ],
      help: "",
      type: "time"
    };
  return {
    operators: ["Equals", "Does Not Equal", "Contains", "Does Not Contain"],
    help: "You can enter multiple values separated by comma (,).",
    type: "text"
  };
};
function zoneIdForStoredKey(zoneKey, zones) {
  var _a2, _b, _c;
  const normalizedKey2 = String(zoneKey).toLowerCase();
  if (normalizedKey2 === "domestic") {
    return ((_a2 = zones.find((zone) => zone.name === "Domestic" && !zone.isRestOfWorld)) == null ? void 0 : _a2.id) ?? null;
  }
  if (normalizedKey2 === "international") {
    return ((_b = zones.find((zone) => zone.isRestOfWorld)) == null ? void 0 : _b.id) ?? null;
  }
  return ((_c = zones.find((zone) => zone.id === zoneKey)) == null ? void 0 : _c.id) ?? null;
}
function groupStoredRates(definitions, zones) {
  return definitions.reduce((grouped, definition) => {
    const zoneId = zoneIdForStoredKey(definition.zoneKey, zones);
    const groupKey = zoneId ?? definition.zoneKey;
    const zoneRates = grouped[groupKey] ?? [];
    zoneRates.push({
      ...blankRate(),
      name: definition.name,
      calculation: definition.calculation,
      price: definition.price === null ? "" : String(definition.price),
      description: definition.description ?? "",
      minimumDays: definition.minimumDays === null ? "" : String(definition.minimumDays),
      maximumDays: definition.maximumDays === null ? "" : String(definition.maximumDays),
      tags: definition.tags ?? "",
      currency: Object.keys(currencyCodes).find((label) => currencyCodes[label] === definition.currencyCode) ?? "Default Store Currency",
      status: definition.status,
      persistedZoneKey: definition.zoneKey
    });
    grouped[groupKey] = zoneRates;
    return grouped;
  }, {});
}
function storedZoneRates(zoneRates) {
  return Object.entries(zoneRates).reduce((stored, [zoneKey, rates]) => {
    for (const rate of rates) {
      const storedKey = rate.persistedZoneKey ?? zoneKey;
      const definition = {
        ...rate
      };
      delete definition.persistedZoneKey;
      (stored[storedKey] ?? (stored[storedKey] = [])).push(definition);
    }
    return stored;
  }, {});
}
const loader$3 = async ({
  request
}) => {
  const {
    admin,
    session
  } = await authenticate.admin(request);
  const id = new URL(request.url).searchParams.get("id");
  await ensureDefaultZones(session.shop);
  const storedZones = await prisma.zone.findMany({
    where: {
      shopId: session.shop
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  storedZones.sort((left, right) => Number(left.isRestOfWorld) - Number(right.isRestOfWorld));
  const zones = storedZones.map(({
    id: zoneId,
    name,
    isRestOfWorld
  }) => ({
    id: zoneId,
    name,
    isRestOfWorld
  }));
  if (!id) return {
    rate: null,
    zones
  };
  try {
    const {
      rates
    } = await loadRateData(session.shop, admin);
    const rate = rates.find((item) => item.id === id);
    if (!rate) {
      throw new Response("Rate rule not found", {
        status: 404
      });
    }
    return {
      rate,
      zones
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response("Unable to load rate rule", {
      status: 500
    });
  }
};
const action$2 = async ({
  request
}) => {
  const {
    admin,
    session
  } = await authenticate.admin(request);
  try {
    const submission = await request.json();
    const rate = await createRate(session.shop, submission, admin);
    return Response.json({
      ok: true,
      rate
    }, {
      status: 201
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return Response.json({
        ok: false,
        error: error.message
      }, {
        status: 400
      });
    }
    return Response.json({
      ok: false,
      error: "Unable to submit rate rule."
    }, {
      status: 500
    });
  }
};
const conditionFieldOptions = [{
  title: "Product",
  options: ["Product Title", "Variant Title", "Product Tag", "SKU", "Product Barcode", "Product Vendor", "Product Price", "Product Compare-at Price", "Product Quantity", "Product Type", "Product Weight", "Product Metafield", "Variant Metafield", "Line item property", "Product Length", "Product Width", "Product Height", "Product Volume", "Shopify Variant ID", "Shopify Product ID"].map((label) => ({
    label,
    value: label
  }))
}, {
  title: "Cart",
  options: ["Cart Quantity", "Cart Subtotal (total before discount)", "Cart Total (total after discount)", "Cart Weight", "Cart Volume", "Cart Contains", "Cart Does Not Contain", "Cart Locale"].map((label) => ({
    label,
    value: label
  }))
}, {
  title: "Shipping",
  options: ["Zipcode / Postcode", "Province / State Code", "Address Line 1", "Country Code", "Time of the Day", "Day of the Week", "Warehouse Zipcode / Postcode"].map((label) => ({
    label,
    value: label
  }))
}, {
  title: "Customer",
  options: ["Customer Tag", "Customer First Name", "Customer Last Name"].map((label) => ({
    label,
    value: label
  }))
}];
const cartProductFieldOptions = cartProductFields.map((label) => ({
  label,
  value: label
}));
const currencyOptions = ["Default Store Currency", "United Arab Emirates Dirham", "Australian Dollars", "Canadian Dollars", "Euro", "United Kingdom Pounds", "Indian Rupees", "Japanese Yen", "New Zealand Dollars", "United States Dollars", "South African Rand", "Hong Kong Dollars", "Swiss Francs", "Polish Zlotych"].map((label) => ({
  label,
  value: label
}));
const calculationOptionGroups = [{
  title: "Fixed Rates",
  options: ["Fixed rate", "Percentage of total price", "Product Metafield", "Variant Metafield"].map((label) => ({
    label,
    value: label
  }))
}, {
  title: "Dynamic Rates",
  options: ["Total weight of items", "Total price of items", "Number of items", "Sum Of Product Metafield", "Sum Of Variant Metafield", "Distance"].map((label) => ({
    label,
    value: label
  }))
}, {
  title: "Carrier Rates",
  options: carrierNames.map((label) => ({
    label,
    value: label
  }))
}];
const stallionPackageTypeOptions = ["Parcel", "Legal Flat Rate Envelope", "Flat Rate Padded Envelope", "Small Flat Rate Box", "Medium Flat Rate Box 1", "Medium Flat Rate Box 2", "Large Flat Rate Box", "Regional Rate Box A1", "Regional Rate Box A2", "Regional Rate Box B1", "Regional Rate Box B2", "Letter", "Large Envelope Or Flat", "Thick Envelope"].map((label) => ({
  label,
  value: label
}));
const cartContainsQuantityChecks = [["atLeastOne", "Cart contains at least one product"], ["moreProducts", "Cart contains more than X products"], ["lessProducts", "Cart contains less than X products"], ["moreAmount", "Cart contains more than X amount"], ["lessAmount", "Cart contains less than X amount"]];
const rateTypeOptions = ["Range", "Incremental", "Range + Incremental", "Range + Range"];
function editableRateCondition(condition) {
  return {
    ...blankCondition(),
    field: condition.field,
    subfield: condition.subfield ?? "Product Tag",
    key: condition.key ?? "",
    operator: condition.operator,
    value: condition.value ?? "",
    quantityCheck: condition.quantityCheck ?? "atLeastOne",
    quantityValue: condition.quantityValue ?? ""
  };
}
function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function localDateValue(date = /* @__PURE__ */ new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 6e4);
  return offsetDate.toISOString().slice(0, 10);
}
function formatSchedule(schedule) {
  const scheduledAt = new Date(schedule.scheduledAt);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: schedule.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(scheduledAt);
    const value = (type) => {
      var _a2;
      return (_a2 = parts.find((part) => part.type === type)) == null ? void 0 : _a2.value;
    };
    return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
  } catch {
    return scheduledAt.toISOString().slice(0, 16).replace("T", " ");
  }
}
const app_rates_new = UNSAFE_withComponentProps(function NewShippingRateRule() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify2 = useAppBridge();
  const {
    rate,
    zones
  } = useLoaderData();
  const [name, setName] = useState((rate == null ? void 0 : rate.name) ?? "");
  const [priority, setPriority] = useState(rate ? String(rate.priority) : "");
  const [status, setStatus] = useState(rate ? `${rate.status.charAt(0)}${rate.status.slice(1).toLowerCase()}` : "Active");
  const [match, setMatch] = useState((rate == null ? void 0 : rate.conditionMatch.toLowerCase()) ?? "all");
  const [exclusivity, setExclusivity] = useState((rate == null ? void 0 : rate.exclusivity.toLowerCase()) ?? "inclusive");
  const [conditions, setConditions] = useState((rate == null ? void 0 : rate.conditions.length) ? rate.conditions.map(editableRateCondition) : [blankCondition()]);
  const [zoneRates, setZoneRates] = useState(() => groupStoredRates((rate == null ? void 0 : rate.rates) ?? [], zones));
  const [activeZone, setActiveZone] = useState(null);
  const [activeRateIndex, setActiveRateIndex] = useState(null);
  const [activeRateMenu, setActiveRateMenu] = useState(null);
  const [rateDraft, setRateDraft] = useState(blankRate());
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedules, setSchedules] = useState((rate == null ? void 0 : rate.schedules) ?? []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleAction, setScheduleAction] = useState("ACTIVATE");
  const [scheduleDate, setScheduleDate] = useState(localDateValue);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");
  const openRateModal = (zone, rateIndex = null) => {
    setActiveZone(zone);
    setActiveRateIndex(rateIndex);
    setRateDraft(rateIndex === null ? blankRate() : zoneRates[zone][rateIndex]);
    setActiveRateMenu(null);
  };
  const closeRateModal = () => {
    setActiveZone(null);
    setActiveRateIndex(null);
  };
  const updateRate2 = (key, value) => setRateDraft({
    ...rateDraft,
    [key]: value
  });
  const updatePackage = (index, key, value) => updateRate2("packages", rateDraft.packages.map((item, itemIndex) => itemIndex === index ? {
    ...item,
    [key]: value
  } : item));
  const addPackage = () => updateRate2("packages", [...rateDraft.packages, {
    limit: "",
    length: "",
    width: "",
    height: "",
    weight: ""
  }]);
  const removePackage = (index) => updateRate2("packages", rateDraft.packages.filter((_, itemIndex) => itemIndex !== index));
  const toggleCarrierService = (service) => updateRate2("selectedServices", rateDraft.selectedServices.includes(service) ? rateDraft.selectedServices.filter((item) => item !== service) : [...rateDraft.selectedServices, service]);
  const isMetafieldRate = ["Product Metafield", "Variant Metafield"].includes(rateDraft.calculation);
  const isDynamicRate = ["Total weight of items", "Total price of items", "Number of items", "Sum Of Product Metafield", "Sum Of Variant Metafield", "Distance"].includes(rateDraft.calculation);
  const isSumMetafieldRate = ["Sum Of Product Metafield", "Sum Of Variant Metafield"].includes(rateDraft.calculation);
  const isCarrierRate = carrierNames.includes(rateDraft.calculation);
  const currencyCode = currencyCodes[rateDraft.currency] || "USD";
  const parameterSuffix = rateDraft.calculation === "Distance" ? "kms" : rateDraft.calculation === "Total weight of items" ? "lb" : rateDraft.calculation === "Total price of items" ? currencyCode : "";
  const priceCalculationSuffix = rateDraft.priceCalculation === "Total weight of items" ? "lb" : rateDraft.priceCalculation === "Total price of items" ? currencyCode : "";
  const incrementalParameterSuffix = rateDraft.rateType.includes("+") ? priceCalculationSuffix : parameterSuffix;
  const canSaveRate = Boolean(rateDraft.name.trim() && (isCarrierRate ? true : isDynamicRate ? rateDraft.calculation === "Distance" ? rateDraft.googleMapsApiKey.trim() && (rateDraft.originLocation !== "Custom Location" || rateDraft.originPostcode.trim()) : !isSumMetafieldRate || rateDraft.metafieldKey.trim() : isMetafieldRate ? rateDraft.metafieldKey.trim() : rateDraft.price.trim()));
  const saveRate = () => {
    if (!canSaveRate) return;
    const rates = [...zoneRates[activeZone] ?? []];
    if (activeRateIndex === null) {
      rates.push(rateDraft);
    } else {
      rates[activeRateIndex] = rateDraft;
    }
    setZoneRates({
      ...zoneRates,
      [activeZone]: rates
    });
    closeRateModal();
  };
  const removeZoneRate = (zone, rateIndex) => {
    setZoneRates({
      ...zoneRates,
      [zone]: zoneRates[zone].filter((_, index) => index !== rateIndex)
    });
    setActiveRateMenu(null);
  };
  const renderPackagingFields = (parcel = false) => /* @__PURE__ */ jsxs(BlockStack, {
    gap: "300",
    children: [/* @__PURE__ */ jsx(Select, {
      label: parcel ? "Parcel distribution" : "Packaging box distribution",
      options: ["By items count", "By items volume"],
      value: rateDraft.packagingDistribution,
      onChange: (value) => updateRate2("packagingDistribution", value)
    }), rateDraft.packages.map((item, index) => /* @__PURE__ */ jsx(Card, {
      background: "bg-surface-secondary",
      children: /* @__PURE__ */ jsx(BlockStack, {
        gap: "300",
        children: /* @__PURE__ */ jsxs(InlineStack, {
          gap: "300",
          wrap: true,
          children: [rateDraft.packagingDistribution === "By items count" && /* @__PURE__ */ jsx(Box, {
            minWidth: "140px",
            children: /* @__PURE__ */ jsx(TextField, {
              label: `${parcel ? "Parcel" : "Box"} Max Limit`,
              type: "number",
              suffix: "items",
              value: item.limit,
              onChange: (value) => updatePackage(index, "limit", value),
              autoComplete: "off"
            })
          }), [["length", "Length", "mm"], ["width", "Width", "mm"], ["height", "Height", "mm"], ["weight", "Weight (Optional)", "g"]].map(([key, label, suffix]) => /* @__PURE__ */ jsx(Box, {
            minWidth: "140px",
            children: /* @__PURE__ */ jsx(TextField, {
              label: `${parcel ? "Parcel" : "Box"} ${label}`,
              type: "number",
              suffix,
              value: item[key],
              onChange: (value) => updatePackage(index, key, value),
              autoComplete: "off"
            })
          }, key)), /* @__PURE__ */ jsx(Box, {
            paddingBlockStart: "600",
            children: /* @__PURE__ */ jsx(Button, {
              icon: DeleteIcon,
              tone: "critical",
              accessibilityLabel: `Delete package ${index + 1}`,
              onClick: () => removePackage(index)
            })
          })]
        })
      })
    }, index)), /* @__PURE__ */ jsx(Box, {
      children: /* @__PURE__ */ jsx(Button, {
        icon: PlusIcon,
        onClick: addPackage,
        children: "Add"
      })
    }), /* @__PURE__ */ jsx(Text, {
      as: "p",
      tone: "subdued",
      children: "Add packages from smallest to largest max limit value."
    })]
  });
  const updateCondition = (index, key, value) => setConditions(conditions.map((condition, conditionIndex) => conditionIndex === index ? {
    ...condition,
    [key]: value
  } : condition));
  const changeConditionField = (index, field) => {
    const behaviorField = isCartProductCondition(field) ? "Product Tag" : field;
    const {
      operators
    } = conditionBehavior(behaviorField);
    setConditions(conditions.map((condition, conditionIndex) => conditionIndex === index ? {
      ...condition,
      field,
      subfield: "Product Tag",
      key: "",
      operator: operators[0],
      value: "",
      quantityCheck: "atLeastOne",
      quantityValue: ""
    } : condition));
  };
  const changeCartProductField = (index, subfield) => {
    const {
      operators
    } = conditionBehavior(subfield);
    setConditions(conditions.map((condition, conditionIndex) => conditionIndex === index ? {
      ...condition,
      subfield,
      key: "",
      operator: operators[0],
      value: ""
    } : condition));
  };
  const canSave = name.trim() && priority.trim();
  const save = () => {
    if (!canSave) return;
    const submission = {
      name,
      priority,
      status,
      conditionMatch: match,
      exclusivity,
      conditions,
      zoneRates: storedZoneRates(zoneRates),
      schedules
    };
    fetcher.submit(rate ? {
      intent: "update",
      id: rate.id,
      data: submission
    } : submission, {
      method: "post",
      encType: "application/json",
      ...rate ? {
        action: "/app/rates?index"
      } : {}
    });
  };
  const openScheduleModal = () => {
    setScheduleAction("ACTIVATE");
    setScheduleDate(localDateValue());
    setScheduleTime("09:00");
    setScheduleTimezone(browserTimezone());
    setScheduleModalOpen(true);
  };
  const addSchedule = () => {
    const scheduledAt = /* @__PURE__ */ new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (!scheduleDate || !scheduleTime || Number.isNaN(scheduledAt.getTime())) {
      shopify2.toast.show("Select a valid schedule date and time", {
        isError: true
      });
      return;
    }
    setSchedules([...schedules, {
      action: scheduleAction,
      scheduledAt: scheduledAt.toISOString(),
      timezone: scheduleTimezone
    }]);
    setScheduleModalOpen(false);
  };
  const deleteRule = () => {
    if (!rate) return;
    setDeleting(true);
    fetcher.submit({
      intent: "delete",
      id: rate.id
    }, {
      method: "post",
      encType: "application/json",
      action: "/app/rates?index"
    });
  };
  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify2.toast.show(deleting ? "Shipping rate rule deleted" : "Shipping rate rule saved");
      navigate("/app/rates");
      return;
    }
    shopify2.toast.show(fetcher.data.error || (deleting ? "Unable to delete rate rule" : "Unable to submit rate rule"), {
      isError: true
    });
    setDeleting(false);
  }, [deleting, fetcher.data, navigate, shopify2]);
  return /* @__PURE__ */ jsxs(Page, {
    title: rate ? "Edit shipping rate rule" : "Add shipping rate rule",
    backAction: {
      content: "Back",
      onAction: () => navigate(-1)
    },
    secondaryActions: rate ? [{
      content: "Delete",
      destructive: true,
      onAction: () => setDeleteConfirmationOpen(true)
    }] : [],
    primaryAction: {
      content: "Save",
      onAction: save,
      disabled: !canSave
    },
    children: [/* @__PURE__ */ jsxs(Layout, {
      children: [/* @__PURE__ */ jsx(Layout.Section, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(FormLayout, {
              children: [/* @__PURE__ */ jsx(TextField, {
                label: "Name",
                value: name,
                onChange: setName,
                placeholder: "e.g. Heavy products rule",
                autoComplete: "off"
              }), /* @__PURE__ */ jsx(TextField, {
                label: "Priority",
                type: "number",
                min: 1,
                value: priority,
                onChange: setPriority,
                placeholder: "e.g. 1",
                autoComplete: "off",
                helpText: "Rules are evaluated in ascending order of priority. No two rules can share the same priority."
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Conditions"
              }), /* @__PURE__ */ jsxs(BlockStack, {
                gap: "200",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Rule must match:"
                }), /* @__PURE__ */ jsx(RadioButton, {
                  label: "All conditions",
                  name: "match",
                  checked: match === "all",
                  onChange: () => setMatch("all")
                }), /* @__PURE__ */ jsx(RadioButton, {
                  label: "Any condition",
                  name: "match",
                  checked: match === "any",
                  onChange: () => setMatch("any")
                })]
              }), conditions.map((condition, index) => {
                const behavior = conditionBehavior(effectiveConditionField(condition));
                return /* @__PURE__ */ jsx(Card, {
                  background: "bg-surface-secondary",
                  children: /* @__PURE__ */ jsxs(BlockStack, {
                    gap: "300",
                    children: [/* @__PURE__ */ jsxs(InlineStack, {
                      align: "space-between",
                      blockAlign: "center",
                      children: [/* @__PURE__ */ jsxs(Text, {
                        as: "h3",
                        variant: "headingSm",
                        children: ["Condition ", index + 1]
                      }), /* @__PURE__ */ jsx(Button, {
                        icon: DeleteIcon,
                        tone: "critical",
                        variant: "plain",
                        accessibilityLabel: `Delete condition ${index + 1}`,
                        onClick: () => setConditions(conditions.filter((_, itemIndex) => itemIndex !== index))
                      })]
                    }), /* @__PURE__ */ jsxs(InlineStack, {
                      gap: "300",
                      wrap: true,
                      blockAlign: "start",
                      children: [/* @__PURE__ */ jsx(Box, {
                        minWidth: "220px",
                        children: /* @__PURE__ */ jsx(Select, {
                          label: "Field",
                          labelHidden: true,
                          options: conditionFieldOptions,
                          value: condition.field,
                          onChange: (value) => changeConditionField(index, value)
                        })
                      }), isCartProductCondition(condition.field) && /* @__PURE__ */ jsx(Box, {
                        minWidth: "200px",
                        children: /* @__PURE__ */ jsx(Select, {
                          label: "Product field",
                          labelHidden: true,
                          options: cartProductFieldOptions,
                          value: condition.subfield,
                          onChange: (value) => changeCartProductField(index, value)
                        })
                      }), isKeyedCondition(condition) && /* @__PURE__ */ jsx(Box, {
                        minWidth: "180px",
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: `${effectiveConditionField(condition)} key`,
                          labelHidden: true,
                          value: condition.key,
                          placeholder: effectiveConditionField(condition) === "Variant Metafield" ? "Namespace.Key" : "Key",
                          onChange: (value) => updateCondition(index, "key", value),
                          autoComplete: "off"
                        })
                      }), /* @__PURE__ */ jsx(Box, {
                        minWidth: "200px",
                        children: /* @__PURE__ */ jsx(Select, {
                          label: "Operator",
                          labelHidden: true,
                          options: behavior.operators,
                          value: condition.operator,
                          onChange: (value) => updateCondition(index, "operator", value)
                        })
                      })]
                    }), /* @__PURE__ */ jsx(InlineStack, {
                      gap: "200",
                      blockAlign: "end",
                      wrap: false,
                      children: /* @__PURE__ */ jsx(Box, {
                        width: "100%",
                        children: /* @__PURE__ */ jsx(TextField, {
                          label: "Value",
                          labelHidden: true,
                          type: behavior.type === "time" ? "time" : behavior.type === "number" ? "number" : "text",
                          min: behavior.currency ? 0 : void 0,
                          step: behavior.currency ? 1 : void 0,
                          value: condition.value,
                          onChange: (value) => updateCondition(index, "value", value),
                          suffix: behavior.currency || behavior.unit ? behavior.unit || "USD" : ["Time of the Day", "Day of the Week"].includes(effectiveConditionField(condition)) ? "America/New_York" : void 0,
                          autoComplete: "off"
                        })
                      })
                    }), behavior.help && /* @__PURE__ */ jsx(Text, {
                      as: "p",
                      tone: "subdued",
                      children: behavior.help
                    }), condition.field === "Cart Locale" && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "100",
                      children: [/* @__PURE__ */ jsxs(Text, {
                        as: "p",
                        tone: "subdued",
                        children: ["Enter the locale code used by Shopify. You can find them", " ", /* @__PURE__ */ jsx("a", {
                          href: "https://shopify.dev/docs/api/liquid/objects/localization",
                          target: "_blank",
                          rel: "noreferrer",
                          children: "here"
                        }), "."]
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also enter multiple values separated by semi-colon (;)."
                      })]
                    }), ["Zipcode / Postcode", "Warehouse Zipcode / Postcode"].includes(condition.field) && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "100",
                      children: [/* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can use asterisk (*) for wildcard (For e.g. AB14*)."
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also use hyphen to enter range of postcodes (For e.g. 90209-90231)."
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also enter multiple values separated by comma (,)."
                      })]
                    }), condition.field === "Province / State Code" && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "100",
                      children: [/* @__PURE__ */ jsxs(Text, {
                        as: "p",
                        tone: "subdued",
                        children: ["Enter two-letter province codes used by Shopify. You can find them", " ", /* @__PURE__ */ jsx("a", {
                          href: "https://en.wikipedia.org/wiki/ISO_3166-2",
                          target: "_blank",
                          rel: "noreferrer",
                          children: "here"
                        }), "."]
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also enter multiple values separated by comma (,)."
                      })]
                    }), condition.field === "Country Code" && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "100",
                      children: [/* @__PURE__ */ jsxs(Text, {
                        as: "p",
                        tone: "subdued",
                        children: ["Enter two-letter country codes used by Shopify. You can find them", " ", /* @__PURE__ */ jsx("a", {
                          href: "https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2",
                          target: "_blank",
                          rel: "noreferrer",
                          children: "here"
                        }), "."]
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also enter multiple values separated by semi-colon (;)."
                      })]
                    }), condition.field === "Day of the Week" && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "100",
                      children: [/* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "Enter full names of the day like Monday, Tuesday, etc."
                      }), /* @__PURE__ */ jsx(Text, {
                        as: "p",
                        tone: "subdued",
                        children: "You can also enter multiple values separated by comma (,)."
                      })]
                    }), condition.field === "Cart Contains" && /* @__PURE__ */ jsxs(BlockStack, {
                      gap: "200",
                      children: [/* @__PURE__ */ jsx(Text, {
                        as: "p",
                        children: "Quantity / amount check:"
                      }), cartContainsQuantityChecks.map(([value, label]) => /* @__PURE__ */ jsx(RadioButton, {
                        label,
                        name: `quantity-check-${index}`,
                        checked: condition.quantityCheck === value,
                        onChange: () => setConditions(conditions.map((item, itemIndex) => itemIndex === index ? {
                          ...item,
                          quantityCheck: value,
                          quantityValue: ""
                        } : item))
                      }, value)), condition.quantityCheck !== "atLeastOne" && /* @__PURE__ */ jsx(TextField, {
                        label: condition.quantityCheck.includes("Amount") ? "Amount" : "Quantity",
                        type: "number",
                        min: 0,
                        step: 1,
                        placeholder: condition.quantityCheck.includes("Amount") ? "Enter amount" : "Enter quantity",
                        suffix: condition.quantityCheck.includes("Amount") ? "USD" : void 0,
                        value: condition.quantityValue,
                        onChange: (value) => updateCondition(index, "quantityValue", value),
                        autoComplete: "off"
                      })]
                    })]
                  })
                }, index);
              }), /* @__PURE__ */ jsx(Box, {
                children: /* @__PURE__ */ jsx(Button, {
                  icon: PlusIcon,
                  onClick: () => setConditions([...conditions, blankCondition()]),
                  children: "Add another condition"
                })
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Shipping zones"
              }), zones.map((zone) => /* @__PURE__ */ jsx(Card, {
                background: "bg-surface-secondary",
                children: /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsxs(InlineStack, {
                    align: "space-between",
                    blockAlign: "center",
                    children: [/* @__PURE__ */ jsx(Text, {
                      as: "h3",
                      variant: "headingSm",
                      children: zone.name
                    }), /* @__PURE__ */ jsx(Button, {
                      variant: "plain",
                      onClick: () => openRateModal(zone.id),
                      children: "Add rate"
                    })]
                  }), (zoneRates[zone.id] ?? []).length === 0 ? /* @__PURE__ */ jsx(Banner, {
                    tone: "warning",
                    children: "No rates. Customers in this zone won't see shipping rates from ShipMagic app."
                  }) : /* @__PURE__ */ jsxs(BlockStack, {
                    gap: "0",
                    children: [/* @__PURE__ */ jsx(Box, {
                      paddingBlock: "200",
                      children: /* @__PURE__ */ jsxs(InlineGrid, {
                        columns: "2fr 2fr 1fr auto",
                        gap: "300",
                        alignItems: "center",
                        children: [/* @__PURE__ */ jsx(Text, {
                          as: "span",
                          fontWeight: "semibold",
                          children: "Rate name"
                        }), /* @__PURE__ */ jsx(Text, {
                          as: "span",
                          fontWeight: "semibold",
                          children: "Condition"
                        }), /* @__PURE__ */ jsx(Text, {
                          as: "span",
                          fontWeight: "semibold",
                          children: "Price"
                        }), /* @__PURE__ */ jsx(Box, {
                          minWidth: "32px"
                        })]
                      })
                    }), (zoneRates[zone.id] ?? []).map((shippingRate, rateIndex) => {
                      const menuKey = `${zone.id}-${rateIndex}`;
                      return /* @__PURE__ */ jsx(Box, {
                        paddingBlock: "300",
                        children: /* @__PURE__ */ jsxs(InlineGrid, {
                          columns: "2fr 2fr 1fr auto",
                          gap: "300",
                          alignItems: "center",
                          children: [/* @__PURE__ */ jsx(Text, {
                            as: "span",
                            children: shippingRate.name
                          }), /* @__PURE__ */ jsx(Text, {
                            as: "span",
                            children: shippingRate.calculation || "-"
                          }), /* @__PURE__ */ jsx(Text, {
                            as: "span",
                            children: shippingRate.price === "" ? "-" : `$${shippingRate.price}`
                          }), /* @__PURE__ */ jsx(Popover, {
                            active: activeRateMenu === menuKey,
                            activator: /* @__PURE__ */ jsx(Button, {
                              icon: MenuHorizontalIcon,
                              variant: "plain",
                              accessibilityLabel: `Actions for ${shippingRate.name}`,
                              onClick: () => setActiveRateMenu(activeRateMenu === menuKey ? null : menuKey)
                            }),
                            onClose: () => setActiveRateMenu(null),
                            children: /* @__PURE__ */ jsx(ActionList, {
                              items: [{
                                content: "Edit",
                                onAction: () => openRateModal(zone.id, rateIndex)
                              }, {
                                content: "Delete",
                                destructive: true,
                                onAction: () => removeZoneRate(zone.id, rateIndex)
                              }]
                            })
                          })]
                        })
                      }, menuKey);
                    })]
                  })]
                })
              }, zone.id))]
            })
          })]
        })
      }), /* @__PURE__ */ jsx(Layout.Section, {
        variant: "oneThird",
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "200",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Status"
              }), /* @__PURE__ */ jsx(Select, {
                label: "Status",
                labelHidden: true,
                options: ["Active", "Draft"],
                value: status,
                onChange: setStatus
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "200",
              children: [/* @__PURE__ */ jsx(Text, {
                as: "h2",
                variant: "headingMd",
                children: "Exclusivity"
              }), /* @__PURE__ */ jsx(RadioButton, {
                label: "Inclusive",
                name: "exclusivity",
                checked: exclusivity === "inclusive",
                onChange: () => setExclusivity("inclusive")
              }), /* @__PURE__ */ jsx(RadioButton, {
                label: "Exclusive",
                name: "exclusivity",
                checked: exclusivity === "exclusive",
                onChange: () => setExclusivity("exclusive")
              }), /* @__PURE__ */ jsx(Text, {
                as: "p",
                tone: "subdued",
                children: "If an 'Exclusive' rule is satisfied, all lower-priority rules are skipped from evaluation."
              })]
            })
          }), /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsxs(InlineStack, {
                align: "space-between",
                blockAlign: "center",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "100",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Schedule"
                  }), /* @__PURE__ */ jsx(Tooltip, {
                    content: "Activate or deactivate this shipping rate rule automatically at a scheduled time.",
                    children: /* @__PURE__ */ jsx(Icon, {
                      source: InfoIcon
                    })
                  })]
                }), /* @__PURE__ */ jsx(Button, {
                  icon: PlusIcon,
                  onClick: openScheduleModal,
                  children: "Add schedule"
                })]
              }), schedules.length > 0 ? schedules.map((schedule, index) => /* @__PURE__ */ jsxs(InlineStack, {
                align: "space-between",
                blockAlign: "center",
                wrap: false,
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Badge, {
                    tone: "info",
                    children: schedule.action === "ACTIVATE" ? "Activate" : "Deactivate"
                  }), /* @__PURE__ */ jsx(Text, {
                    as: "span",
                    children: formatSchedule(schedule)
                  })]
                }), /* @__PURE__ */ jsx(Button, {
                  icon: DeleteIcon,
                  tone: "critical",
                  variant: "plain",
                  accessibilityLabel: `Delete schedule ${index + 1}`,
                  onClick: () => setSchedules(schedules.filter((_, scheduleIndex) => scheduleIndex !== index))
                })]
              }, `${schedule.scheduledAt}-${index}`)) : /* @__PURE__ */ jsx(Text, {
                as: "p",
                tone: "subdued",
                children: "No schedules added."
              })]
            })
          })]
        })
      })]
    }), /* @__PURE__ */ jsx(Box, {
      paddingBlockStart: "500",
      paddingBlockEnd: "500",
      children: /* @__PURE__ */ jsx(Text, {
        as: "p",
        alignment: "center",
        tone: "subdued",
        children: "Reach out to live chat support for set up assistance or feature requests."
      })
    }), /* @__PURE__ */ jsx(Modal, {
      open: scheduleModalOpen,
      onClose: () => setScheduleModalOpen(false),
      title: "Add schedule",
      primaryAction: {
        content: "Save",
        onAction: addSchedule
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setScheduleModalOpen(false)
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsxs(BlockStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Text, {
              as: "p",
              children: "Action"
            }), /* @__PURE__ */ jsx(RadioButton, {
              label: "Activate",
              name: "schedule-action",
              checked: scheduleAction === "ACTIVATE",
              onChange: () => setScheduleAction("ACTIVATE")
            }), /* @__PURE__ */ jsx(RadioButton, {
              label: "Deactivate",
              name: "schedule-action",
              checked: scheduleAction === "DEACTIVATE",
              onChange: () => setScheduleAction("DEACTIVATE")
            })]
          }), /* @__PURE__ */ jsx(TextField, {
            label: "Date",
            type: "date",
            value: scheduleDate,
            onChange: setScheduleDate,
            autoComplete: "off"
          }), /* @__PURE__ */ jsx(TextField, {
            label: "Time",
            type: "time",
            value: scheduleTime,
            onChange: setScheduleTime,
            autoComplete: "off",
            helpText: `Timezone: ${scheduleTimezone}`
          })]
        })
      })
    }), /* @__PURE__ */ jsx(Modal, {
      open: deleteConfirmationOpen,
      onClose: () => setDeleteConfirmationOpen(false),
      title: "Delete shipping rate rule?",
      primaryAction: {
        content: "Delete",
        destructive: true,
        loading: deleting && fetcher.state !== "idle",
        onAction: deleteRule
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: () => setDeleteConfirmationOpen(false)
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(Text, {
          as: "p",
          children: ["This will permanently delete ", (rate == null ? void 0 : rate.name) || "this shipping rate rule", "."]
        })
      })
    }), /* @__PURE__ */ jsx(Modal, {
      open: Boolean(activeZone),
      onClose: closeRateModal,
      title: activeRateIndex === null ? "Add rate" : "Edit rate",
      primaryAction: {
        content: "Done",
        onAction: saveRate,
        disabled: !canSaveRate
      },
      secondaryActions: [{
        content: "Cancel",
        onAction: closeRateModal
      }],
      children: /* @__PURE__ */ jsx(Modal.Section, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsxs(BlockStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Text, {
              as: "h3",
              variant: "headingMd",
              children: "Details"
            }), /* @__PURE__ */ jsxs(FormLayout, {
              children: [/* @__PURE__ */ jsx(TextField, {
                label: "Rate name",
                requiredIndicator: true,
                value: rateDraft.name,
                onChange: (value) => updateRate2("name", value),
                helpText: "This is the shipping rate name customer will see at checkout.",
                autoComplete: "off"
              }), /* @__PURE__ */ jsx(TextField, {
                label: "Description",
                value: rateDraft.description,
                onChange: (value) => updateRate2("description", value),
                helpText: `Tip: Use {{today}} to display today's date and {{today+3}} to add 3 days dynamically.`,
                autoComplete: "off"
              }), /* @__PURE__ */ jsxs(InlineStack, {
                gap: "400",
                wrap: false,
                align: "start",
                children: [/* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Delivery time",
                    type: "number",
                    min: 0,
                    suffix: "days",
                    value: rateDraft.minimumDays,
                    onChange: (value) => updateRate2("minimumDays", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  paddingBlockStart: "600",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Delivery time max",
                    labelHidden: true,
                    type: "number",
                    min: 0,
                    suffix: "days",
                    value: rateDraft.maximumDays,
                    onChange: (value) => updateRate2("maximumDays", value),
                    autoComplete: "off"
                  })
                })]
              }), /* @__PURE__ */ jsx(Select, {
                label: "Currency",
                options: currencyOptions,
                value: rateDraft.currency,
                onChange: (value) => updateRate2("currency", value)
              })]
            })]
          }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Text, {
              as: "h3",
              variant: "headingMd",
              children: "Rate"
            }), /* @__PURE__ */ jsx(Select, {
              label: "Calculation parameter",
              requiredIndicator: true,
              options: calculationOptionGroups,
              value: rateDraft.calculation,
              onChange: (value) => updateRate2("calculation", value)
            }), isCarrierRate ? /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [rateDraft.calculation === "Australia Post" && /* @__PURE__ */ jsx(TextField, {
                label: "API Key",
                requiredIndicator: true,
                value: rateDraft.carrierApiKey,
                onChange: (value) => updateRate2("carrierApiKey", value),
                autoComplete: "off"
              }), rateDraft.calculation === "USPS" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "300",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Client ID",
                      value: rateDraft.carrierApiKey,
                      onChange: (value) => updateRate2("carrierApiKey", value),
                      autoComplete: "off"
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Client Secret",
                      type: "password",
                      value: rateDraft.carrierSecret,
                      onChange: (value) => updateRate2("carrierSecret", value),
                      autoComplete: "off"
                    })
                  })]
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Rate schedule",
                  options: ["Retail", "Commercial"],
                  value: rateDraft.carrierSchedule,
                  onChange: (value) => updateRate2("carrierSchedule", value)
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Select which rates to show",
                  options: ["All rates", "lowest rate only", "Highest rate only"],
                  value: rateDraft.ratesToShow,
                  onChange: (value) => updateRate2("ratesToShow", value)
                }), /* @__PURE__ */ jsx(BlockStack, {
                  gap: "300",
                  children: [["Domestic Services", uspsDomesticServices], ["International Services", uspsInternationalServices]].map(([heading, services]) => /* @__PURE__ */ jsxs(BlockStack, {
                    gap: "150",
                    children: [/* @__PURE__ */ jsx(Text, {
                      as: "p",
                      fontWeight: "semibold",
                      children: heading
                    }), services.map((service) => /* @__PURE__ */ jsx(Checkbox, {
                      label: service,
                      checked: rateDraft.selectedServices.includes(service),
                      onChange: () => toggleCarrierService(service)
                    }, service))]
                  }, heading))
                })]
              }), rateDraft.calculation === "Fedex" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "300",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "API Key",
                      value: rateDraft.carrierApiKey,
                      onChange: (value) => updateRate2("carrierApiKey", value),
                      autoComplete: "off"
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Secret Key",
                      type: "password",
                      value: rateDraft.carrierSecret,
                      onChange: (value) => updateRate2("carrierSecret", value),
                      autoComplete: "off"
                    })
                  })]
                }), /* @__PURE__ */ jsx(TextField, {
                  label: "Account Number",
                  value: rateDraft.carrierAccount,
                  onChange: (value) => updateRate2("carrierAccount", value),
                  autoComplete: "off"
                })]
              }), rateDraft.calculation === "Shiprocket" && /* @__PURE__ */ jsxs(InlineStack, {
                gap: "300",
                wrap: false,
                children: [/* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Email ID",
                    type: "email",
                    value: rateDraft.carrierEmail,
                    onChange: (value) => updateRate2("carrierEmail", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Password",
                    type: "password",
                    value: rateDraft.carrierPassword,
                    onChange: (value) => updateRate2("carrierPassword", value),
                    autoComplete: "off"
                  })
                })]
              }), rateDraft.calculation === "Direct Freight Express" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "300",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "API Key",
                      value: rateDraft.carrierApiKey,
                      onChange: (value) => updateRate2("carrierApiKey", value),
                      autoComplete: "off"
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Account Number",
                      value: rateDraft.carrierAccount,
                      onChange: (value) => updateRate2("carrierAccount", value),
                      autoComplete: "off"
                    })
                  })]
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Rate Type",
                  options: ["Item", "Pallet", "Skid", "Carton"],
                  value: rateDraft.carrierRateType,
                  onChange: (value) => updateRate2("carrierRateType", value)
                }), /* @__PURE__ */ jsx(Checkbox, {
                  label: "Fuel Levy Charges",
                  helpText: "Add fuel levy charges to the final delivery cost",
                  checked: rateDraft.fuelLevy,
                  onChange: (value) => updateRate2("fuelLevy", value)
                })]
              }), rateDraft.calculation === "Stallion Express" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: "API Key",
                  value: rateDraft.carrierApiKey,
                  onChange: (value) => updateRate2("carrierApiKey", value),
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Package type",
                  options: stallionPackageTypeOptions,
                  value: rateDraft.packageType,
                  onChange: (value) => updateRate2("packageType", value)
                })]
              }), rateDraft.calculation === "ShipStation" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: "API Key",
                  value: rateDraft.carrierApiKey,
                  onChange: (value) => updateRate2("carrierApiKey", value),
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(TextField, {
                  label: "API Secret",
                  type: "password",
                  value: rateDraft.carrierSecret,
                  onChange: (value) => updateRate2("carrierSecret", value),
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(Box, {
                  children: /* @__PURE__ */ jsx(Button, {
                    children: "Fetch Carriers"
                  })
                }), /* @__PURE__ */ jsx(Text, {
                  as: "h4",
                  variant: "headingSm",
                  children: "Box Configuration"
                })]
              }), ["Fedex", "Shiprocket"].includes(rateDraft.calculation) && /* @__PURE__ */ jsx(Checkbox, {
                label: "Hide estimated delivery dates",
                helpText: `Estimated delivery dates are calculated by ${rateDraft.calculation}`,
                checked: rateDraft.hideDeliveryDates,
                onChange: (value) => updateRate2("hideDeliveryDates", value)
              }), rateDraft.calculation === "Shiprocket" && /* @__PURE__ */ jsx(Select, {
                label: "Select which rates to show",
                options: ["All rates", "Lowest rate only", "Highest rate only"],
                value: rateDraft.ratesToShow,
                onChange: (value) => updateRate2("ratesToShow", value)
              }), renderPackagingFields(rateDraft.calculation === "Stallion Express"), rateDraft.calculation === "Stallion Express" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Select, {
                  label: "Signature required",
                  options: ["No", "Yes"],
                  value: rateDraft.signatureRequired,
                  onChange: (value) => updateRate2("signatureRequired", value)
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Insured",
                  options: ["No", "Yes"],
                  value: rateDraft.insured,
                  onChange: (value) => updateRate2("insured", value)
                })]
              }), ["USPS", "Fedex", "Stallion Express"].includes(rateDraft.calculation) && /* @__PURE__ */ jsx(TextField, {
                label: "Discount (Optional)",
                type: "number",
                min: 0,
                step: 1,
                value: rateDraft.discount,
                onChange: (value) => updateRate2("discount", value),
                helpText: "Discount all rates by a specific percentage",
                autoComplete: "off"
              }), rateDraft.calculation === "Fedex" && /* @__PURE__ */ jsxs(InlineStack, {
                gap: "300",
                wrap: false,
                children: [/* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Handling Fees",
                    type: "number",
                    suffix: "%",
                    value: rateDraft.handlingPercent,
                    onChange: (value) => updateRate2("handlingPercent", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Handling Fees",
                    type: "number",
                    suffix: currencyCode,
                    value: rateDraft.handlingFixed,
                    onChange: (value) => updateRate2("handlingFixed", value),
                    autoComplete: "off"
                  })
                })]
              }), rateDraft.calculation !== "ShipStation" && /* @__PURE__ */ jsx(TextField, {
                label: `Default rate${["Fedex", "Stallion Express"].includes(rateDraft.calculation) ? " (Optional)" : ""}`,
                type: "number",
                min: 0,
                step: 1,
                value: rateDraft.defaultRate,
                onChange: (value) => updateRate2("defaultRate", value),
                helpText: "This rate will be applied if there is no response / rate from the carrier during rate query.",
                autoComplete: "off"
              })]
            }) : isDynamicRate ? /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [rateDraft.calculation === "Distance" && /* @__PURE__ */ jsxs(BlockStack, {
                gap: "300",
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: "Google maps API key",
                  requiredIndicator: true,
                  value: rateDraft.googleMapsApiKey,
                  onChange: (value) => updateRate2("googleMapsApiKey", value),
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(Select, {
                  label: "Origin Location",
                  requiredIndicator: true,
                  options: ["Default Shopify Location", "Custom Location"],
                  value: rateDraft.originLocation,
                  onChange: (value) => updateRate2("originLocation", value)
                }), rateDraft.originLocation === "Custom Location" && /* @__PURE__ */ jsxs(InlineStack, {
                  gap: "300",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(Select, {
                      label: "Country",
                      requiredIndicator: true,
                      options: countryOptions.map((country) => ({
                        label: country.name,
                        value: country.code
                      })),
                      value: rateDraft.originCountry,
                      onChange: (value) => updateRate2("originCountry", value)
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Postcode",
                      requiredIndicator: true,
                      value: rateDraft.originPostcode,
                      onChange: (value) => updateRate2("originPostcode", value),
                      autoComplete: "off"
                    })
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(Select, {
                  label: "Distance calculation method (in kilometers)",
                  requiredIndicator: true,
                  options: ["Driving", "Straight Line"],
                  value: rateDraft.distanceMethod,
                  onChange: (value) => updateRate2("distanceMethod", value)
                }), /* @__PURE__ */ jsx(Divider, {})]
              }), isSumMetafieldRate && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: rateDraft.calculation === "Sum Of Variant Metafield" ? "Namespace and key" : "Key",
                  requiredIndicator: true,
                  placeholder: rateDraft.calculation === "Sum Of Variant Metafield" ? "Namespace.Key" : "Key",
                  value: rateDraft.metafieldKey,
                  onChange: (value) => updateRate2("metafieldKey", value),
                  autoComplete: "off"
                }), /* @__PURE__ */ jsx(Divider, {})]
              }), /* @__PURE__ */ jsxs(BlockStack, {
                gap: "150",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Rate Type"
                }), rateTypeOptions.map((type) => /* @__PURE__ */ jsx(RadioButton, {
                  label: type,
                  name: "rate-type",
                  checked: rateDraft.rateType === type,
                  onChange: () => updateRate2("rateType", type)
                }, type))]
              }), rateDraft.rateType !== "Incremental" && /* @__PURE__ */ jsxs(InlineStack, {
                gap: "300",
                wrap: false,
                children: [/* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Range Start",
                    requiredIndicator: true,
                    type: "number",
                    suffix: parameterSuffix,
                    value: rateDraft.rangeStart,
                    onChange: (value) => updateRate2("rangeStart", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  width: "100%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Range End",
                    type: "number",
                    suffix: parameterSuffix,
                    helpText: "Leave empty for unlimited",
                    value: rateDraft.rangeEnd,
                    onChange: (value) => updateRate2("rangeEnd", value),
                    autoComplete: "off"
                  })
                })]
              }), ["Range + Incremental", "Range + Range"].includes(rateDraft.rateType) && /* @__PURE__ */ jsx(Select, {
                label: "Price calculation parameter",
                options: ["Number of items", "Total weight of items", "Total price of items"],
                value: rateDraft.priceCalculation,
                onChange: (value) => updateRate2("priceCalculation", value)
              }), ["Incremental", "Range + Incremental"].includes(rateDraft.rateType) && /* @__PURE__ */ jsxs(InlineStack, {
                gap: "300",
                wrap: true,
                children: [/* @__PURE__ */ jsx(Box, {
                  minWidth: "45%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Base Price",
                    requiredIndicator: true,
                    type: "number",
                    suffix: currencyCode,
                    value: rateDraft.basePrice,
                    onChange: (value) => updateRate2("basePrice", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  minWidth: "45%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Incremental price",
                    requiredIndicator: true,
                    type: "number",
                    suffix: currencyCode,
                    value: rateDraft.incrementalPrice,
                    onChange: (value) => updateRate2("incrementalPrice", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  minWidth: "45%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Per each",
                    requiredIndicator: true,
                    type: "number",
                    suffix: incrementalParameterSuffix,
                    value: rateDraft.perEach,
                    onChange: (value) => updateRate2("perEach", value),
                    autoComplete: "off"
                  })
                }), /* @__PURE__ */ jsx(Box, {
                  minWidth: "45%",
                  children: /* @__PURE__ */ jsx(TextField, {
                    label: "Start From",
                    type: "number",
                    suffix: incrementalParameterSuffix,
                    helpText: "Leave empty for default value",
                    value: rateDraft.startFrom,
                    onChange: (value) => updateRate2("startFrom", value),
                    autoComplete: "off"
                  })
                })]
              }), rateDraft.rateType === "Range" && /* @__PURE__ */ jsx(TextField, {
                label: "Price",
                requiredIndicator: true,
                type: "number",
                suffix: currencyCode,
                value: rateDraft.price,
                onChange: (value) => updateRate2("price", value),
                autoComplete: "off"
              }), rateDraft.rateType === "Range + Range" && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "300",
                  wrap: false,
                  children: [/* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Range Start",
                      requiredIndicator: true,
                      type: "number",
                      suffix: priceCalculationSuffix,
                      value: rateDraft.secondRangeStart,
                      onChange: (value) => updateRate2("secondRangeStart", value),
                      autoComplete: "off"
                    })
                  }), /* @__PURE__ */ jsx(Box, {
                    width: "100%",
                    children: /* @__PURE__ */ jsx(TextField, {
                      label: "Range End",
                      type: "number",
                      suffix: priceCalculationSuffix,
                      value: rateDraft.secondRangeEnd,
                      onChange: (value) => updateRate2("secondRangeEnd", value),
                      autoComplete: "off"
                    })
                  })]
                }), /* @__PURE__ */ jsx(TextField, {
                  label: "Price",
                  requiredIndicator: true,
                  type: "number",
                  suffix: currencyCode,
                  value: rateDraft.price,
                  onChange: (value) => updateRate2("price", value),
                  autoComplete: "off"
                })]
              })]
            }) : isMetafieldRate ? /* @__PURE__ */ jsxs(BlockStack, {
              gap: "300",
              children: [/* @__PURE__ */ jsx(TextField, {
                label: rateDraft.calculation === "Variant Metafield" ? "Namespace and key" : "Key",
                requiredIndicator: true,
                placeholder: rateDraft.calculation === "Variant Metafield" ? "Namespace.Key" : "Key",
                value: rateDraft.metafieldKey,
                onChange: (value) => updateRate2("metafieldKey", value),
                autoComplete: "off"
              }), /* @__PURE__ */ jsx(Checkbox, {
                label: "Increase rate per item",
                checked: rateDraft.increasePerItem,
                onChange: (value) => updateRate2("increasePerItem", value)
              }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(TextField, {
                label: "Default rate",
                type: "number",
                min: 0,
                step: 1,
                value: rateDraft.defaultRate,
                onChange: (value) => updateRate2("defaultRate", value),
                autoComplete: "off"
              }), /* @__PURE__ */ jsxs(Text, {
                as: "p",
                tone: "subdued",
                children: ["This rate will be applied if there is no value present in metafield for a", rateDraft.calculation === "Variant Metafield" ? "n SKU" : " product", "."]
              })]
            }) : /* @__PURE__ */ jsx(TextField, {
              label: rateDraft.calculation === "Percentage of total price" ? "Percentage" : "Price",
              requiredIndicator: true,
              type: "number",
              min: 0,
              step: 1,
              suffix: rateDraft.calculation === "Percentage of total price" ? `%${currencyCodes[rateDraft.currency] || "USD"}` : currencyCodes[rateDraft.currency] || "USD",
              value: rateDraft.price,
              onChange: (value) => updateRate2("price", value),
              autoComplete: "off"
            }), !isMetafieldRate && rateDraft.calculation === "Percentage of total price" && /* @__PURE__ */ jsx(Checkbox, {
              label: "Round up to nearest integer",
              helpText: "For e.g. $2.67 will rounded up to $3",
              checked: rateDraft.roundUp,
              onChange: (value) => updateRate2("roundUp", value)
            })]
          }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
            gap: "200",
            children: [/* @__PURE__ */ jsx(Text, {
              as: "h3",
              variant: "headingMd",
              children: "Advanced"
            }), /* @__PURE__ */ jsx(TextField, {
              label: "Tags",
              value: rateDraft.tags,
              onChange: (value) => updateRate2("tags", value),
              helpText: "Comma separated values are allowed.",
              autoComplete: "off"
            })]
          })]
        })
      })
    })]
  });
});
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: app_rates_new,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const app_zones = UNSAFE_withComponentProps(function ZonesLayout() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_zones
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  await ensureDefaultZones(shop.id);
  const zones = await prisma.zone.findMany({
    where: {
      shopId: shop.id
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  zones.sort((a, b) => Number(a.isRestOfWorld) - Number(b.isRestOfWorld));
  return {
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      summary: z.isRestOfWorld ? "Rest of world" : summarize(z.regions)
    }))
  };
};
function summarize(regions) {
  const names = Object.keys(regions || {}).map((c) => {
    var _a2;
    return (_a2 = REGION_MAP[c]) == null ? void 0 : _a2.name;
  }).filter(Boolean);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}
const app_zones__index = UNSAFE_withComponentProps(function ZonesIndex() {
  const {
    zones
  } = useLoaderData();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs(Page, {
    title: "Shipping Zones",
    backAction: {
      content: "Back",
      onAction: () => navigate("/app")
    },
    primaryAction: {
      content: "Add zone",
      onAction: () => navigate("/app/zones/add")
    },
    children: [/* @__PURE__ */ jsx(Card, {
      padding: "0",
      children: /* @__PURE__ */ jsx(IndexTable, {
        resourceName: {
          singular: "zone",
          plural: "zones"
        },
        itemCount: zones.length,
        selectable: false,
        headings: [{
          title: "Name"
        }, {
          title: "Regions"
        }],
        children: zones.map((z, i) => /* @__PURE__ */ jsxs(IndexTable.Row, {
          id: z.id,
          position: i,
          onClick: () => navigate(`/app/zones/${z.id}`),
          children: [/* @__PURE__ */ jsx(IndexTable.Cell, {
            children: /* @__PURE__ */ jsx(Text, {
              as: "span",
              fontWeight: "semibold",
              children: z.name
            })
          }), /* @__PURE__ */ jsx(IndexTable.Cell, {
            children: z.summary
          })]
        }, z.id))
      })
    }), /* @__PURE__ */ jsx("div", {
      style: {
        textAlign: "center",
        marginTop: 24
      },
      children: /* @__PURE__ */ jsxs(Text, {
        as: "p",
        children: [/* @__PURE__ */ jsx("a", {
          href: "https://help.shopify.com/en/manual/shipping",
          target: "_blank",
          rel: "noreferrer",
          children: "Learn more"
        }), " ", "about managing zones"]
      })
    })]
  });
});
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_zones__index,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const SearchIconWrapper = () => /* @__PURE__ */ jsx(Icon, { source: SearchIcon });
function RegionPicker({ value, onChange, taken = {} }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({});
  const [initialSelected] = useState(() => new Set(Object.keys(value)));
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? REGIONS.filter((r) => r.name.toLowerCase().includes(q)) : REGIONS;
    return [...filtered].sort((a, b) => {
      const aSel = initialSelected.has(a.code) ? 0 : 1;
      const bSel = initialSelected.has(b.code) ? 0 : 1;
      return aSel - bSel;
    });
  }, [query, initialSelected]);
  const takenProvinces = (code) => {
    var _a2;
    return ((_a2 = taken[code]) == null ? void 0 : _a2.provinces) || [];
  };
  const isCountryTaken = (code) => taken[code] && taken[code].provinces === null;
  const selectableProvinces = (r) => r.provinces.map((p) => p.code).filter((c) => !takenProvinces(r.code).includes(c));
  const toggleCountry = (r) => {
    const next = { ...value };
    if (next[r.code]) {
      delete next[r.code];
    } else {
      const provs = selectableProvinces(r);
      if (r.provinces.length > 0 && provs.length === 0) return;
      next[r.code] = provs;
    }
    onChange(next);
  };
  const toggleProvince = (r, pCode) => {
    const next = { ...value };
    const cur = new Set(next[r.code] || []);
    cur.has(pCode) ? cur.delete(pCode) : cur.add(pCode);
    if (cur.size === 0) delete next[r.code];
    else next[r.code] = [...cur];
    onChange(next);
  };
  const countryState = (r) => {
    const sel = value[r.code];
    if (!sel) return false;
    if (r.provinces.length === 0) return true;
    const total = selectableProvinces(r).length;
    if (total === 0) return false;
    return sel.length === total ? true : "indeterminate";
  };
  return /* @__PURE__ */ jsxs("div", { style: { border: "1px solid var(--p-color-border)", borderRadius: "var(--p-border-radius-200)", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx(Box, { padding: "300", borderBlockEndWidth: "025", borderColor: "border", children: /* @__PURE__ */ jsx(
      TextField,
      {
        label: "Search countries and regions",
        labelHidden: true,
        placeholder: "Search countries and regions",
        prefix: /* @__PURE__ */ jsx("span", { style: { display: "flex" }, children: /* @__PURE__ */ jsx(SearchIconWrapper, {}) }),
        value: query,
        onChange: setQuery,
        autoComplete: "off",
        clearButton: true,
        onClearButtonClick: () => setQuery("")
      }
    ) }),
    /* @__PURE__ */ jsx("div", { style: { maxHeight: 440, overflowY: "auto" }, children: list.map((r) => {
      var _a2;
      const disabled = isCountryTaken(r.code);
      const hasProvinces = r.provinces.length > 0;
      const selectedCount = ((_a2 = value[r.code]) == null ? void 0 : _a2.length) || 0;
      const isOpen = !!open[r.code];
      return /* @__PURE__ */ jsxs("div", { style: { borderBottom: "1px solid var(--p-color-border-secondary)", background: disabled ? "var(--p-color-bg-surface-secondary)" : void 0 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }, children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              label: r.name,
              labelHidden: true,
              checked: countryState(r),
              disabled,
              onChange: () => toggleCountry(r)
            }
          ),
          /* @__PURE__ */ jsxs(
            "label",
            {
              style: { display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: disabled ? "default" : "pointer" },
              onClick: () => !disabled && toggleCountry(r),
              children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": true, style: { fontSize: 20, width: 24 }, children: r.flag }),
                /* @__PURE__ */ jsx(Text, { as: "p", tone: disabled ? "subdued" : void 0, children: r.name })
              ]
            }
          ),
          disabled && /* @__PURE__ */ jsxs(Text, { as: "p", tone: "subdued", children: [
            'In "',
            taken[r.code].zoneName,
            '"'
          ] }),
          !disabled && hasProvinces && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(Text, { as: "p", tone: "subdued", children: [
              selectedCount,
              " of ",
              r.provinces.length,
              " ",
              provinceLabel(r.code)
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "tertiary",
                icon: isOpen ? ChevronUpIcon : ChevronDownIcon,
                accessibilityLabel: `Show ${provinceLabel(r.code)} in ${r.name}`,
                onClick: () => setOpen((o) => ({ ...o, [r.code]: !o[r.code] }))
              }
            )
          ] })
        ] }),
        hasProvinces && !disabled && /* @__PURE__ */ jsx(Collapsible, { open: isOpen, id: `prov-${r.code}`, children: /* @__PURE__ */ jsx(Box, { paddingInlineStart: "1000", paddingBlockEnd: "200", children: /* @__PURE__ */ jsx(BlockStack, { gap: "100", children: r.provinces.map((p) => {
          var _a3;
          const pTaken = takenProvinces(r.code).includes(p.code);
          return /* @__PURE__ */ jsxs(InlineStack, { gap: "200", blockAlign: "center", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                label: p.name,
                checked: !!((_a3 = value[r.code]) == null ? void 0 : _a3.includes(p.code)),
                disabled: pTaken,
                onChange: () => toggleProvince(r, p.code)
              }
            ),
            pTaken && /* @__PURE__ */ jsxs(Text, { as: "span", tone: "subdued", children: [
              'In "',
              taken[r.code].zoneName,
              '"'
            ] })
          ] }, p.code);
        }) }) }) })
      ] }, r.code);
    }) })
  ] });
}
function ZoneForm({ zone, taken, rowHolder, error, isNew }) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [name, setName] = useState(zone.name);
  const [isRow, setIsRow] = useState(zone.isRestOfWorld);
  const [regions, setRegions] = useState(zone.regions || {});
  const rowLocked = !!rowHolder;
  const saving = navigation.state === "submitting";
  const save = () => submit(
    {
      intent: "save",
      name,
      isRestOfWorld: String(isRow),
      regions: JSON.stringify(isRow ? {} : regions)
    },
    { method: "post" }
  );
  const remove = () => {
    if (confirm(`Delete zone "${zone.name}"?`)) {
      submit({ intent: "delete" }, { method: "post" });
    }
  };
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: isNew ? "Add zone" : zone.name,
      backAction: { content: "Zones", onAction: () => navigate("/app/zones") },
      primaryAction: { content: "Save", onAction: save, loading: saving },
      secondaryActions: isNew ? [] : [{ content: "Delete zone", destructive: true, onAction: remove }],
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        error && /* @__PURE__ */ jsx(Banner, { tone: "critical", children: error }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
          TextField,
          {
            label: "Zone name",
            value: name,
            onChange: setName,
            autoComplete: "off",
            helpText: "Shown on your shipping rate rules. Customers don't see zone names."
          }
        ) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingSm", children: "Regions" }),
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              label: "Rest of world",
              checked: isRow,
              disabled: rowLocked,
              onChange: setIsRow,
              helpText: rowLocked ? `"${rowHolder.name}" is already your Rest of world zone.` : "Covers every country and province that isn't in another zone."
            }
          ),
          !isRow && /* @__PURE__ */ jsx(RegionPicker, { value: regions, onChange: setRegions, taken })
        ] }) })
      ] })
    }
  );
}
async function findZone(shopId, id) {
  const zone = await prisma.zone.findFirst({
    where: {
      id,
      shopId
    }
  });
  if (!zone) throw new Response("Zone not found", {
    status: 404
  });
  return zone;
}
const loader$1 = async ({
  request,
  params
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const zone = await findZone(shop.id, params.id);
  return {
    zone: {
      id: zone.id,
      name: zone.name,
      isRestOfWorld: zone.isRestOfWorld,
      regions: zone.regions || {}
    },
    taken: await getTaken(shop.id, zone.id),
    rowHolder: await getRowHolder(shop.id, zone.id)
  };
};
const action$1 = async ({
  request,
  params
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const zone = await findZone(shop.id, params.id);
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    await prisma.zone.delete({
      where: {
        id: zone.id
      }
    });
    return redirect("/app/zones");
  }
  const name = String(form.get("name") || "").trim();
  const isRestOfWorld = form.get("isRestOfWorld") === "true";
  const regions = isRestOfWorld ? {} : parseRegions(form.get("regions"));
  if (regions === null) return {
    error: "Invalid regions."
  };
  const error = await validateZone({
    shopId: shop.id,
    excludeId: zone.id,
    name,
    isRestOfWorld,
    regions
  });
  if (error) return {
    error
  };
  await prisma.zone.update({
    where: {
      id: zone.id
    },
    data: {
      name,
      isRestOfWorld,
      regions,
      countries: isRestOfWorld ? "Rest of world" : countriesLabel(regions)
    }
  });
  return redirect("/app/zones");
};
const app_zones_$id = UNSAFE_withComponentProps(function EditZone() {
  const {
    zone,
    taken,
    rowHolder
  } = useLoaderData();
  const actionData = useActionData();
  return /* @__PURE__ */ jsx(ZoneForm, {
    zone,
    taken,
    rowHolder,
    error: actionData == null ? void 0 : actionData.error
  }, zone.id);
});
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: app_zones_$id,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  return {
    taken: await getTaken(shop.id),
    rowHolder: await getRowHolder(shop.id)
  };
};
const action = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const isRestOfWorld = form.get("isRestOfWorld") === "true";
  const regions = isRestOfWorld ? {} : parseRegions(form.get("regions"));
  if (regions === null) return {
    error: "Invalid regions."
  };
  const error = await validateZone({
    shopId: shop.id,
    name,
    isRestOfWorld,
    regions
  });
  if (error) return {
    error
  };
  await prisma.zone.create({
    data: {
      shopId: shop.id,
      name,
      isRestOfWorld,
      regions,
      countries: isRestOfWorld ? "Rest of world" : countriesLabel(regions)
    }
  });
  return redirect("/app/zones");
};
const app_zones_add = UNSAFE_withComponentProps(function AddZone() {
  const {
    taken,
    rowHolder
  } = useLoaderData();
  const actionData = useActionData();
  return /* @__PURE__ */ jsx(ZoneForm, {
    isNew: true,
    zone: {
      name: "",
      isRestOfWorld: false,
      regions: {}
    },
    taken,
    rowHolder,
    error: actionData == null ? void 0 : actionData.error
  });
});
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: app_zones_add,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-xcvWJ1ZB.js", "imports": ["/assets/jsx-runtime-C6e02r0u.js", "/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/index-D7nzmdhB.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-BE2oQLR0.js", "imports": ["/assets/jsx-runtime-C6e02r0u.js", "/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/index-D7nzmdhB.js", "/assets/Spinner-CP1GQruM.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.carrier-rates": { "id": "routes/api.carrier-rates", "parentId": "root", "path": "api/carrier-rates", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.carrier-rates-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-BOla1NLS.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/AppProxyLink-tj_e8j7-.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-D-O4VzC3.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/app-Bmpgrb0w.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/AppProxyLink-tj_e8j7-.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/context-Dh4NEsqn.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js"], "css": ["/assets/app-x1cbIzLV.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.customizations": { "id": "routes/app.customizations", "parentId": "routes/app", "path": "customizations", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.customizations-Czh1Fe3o.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.customizations._index": { "id": "routes/app.customizations._index", "parentId": "routes/app.customizations", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.customizations._index-DH_0EfGp.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/shippingCustomizations-osU7QKcW.js", "/assets/useAppBridge-Bj34gXAL.js", "/assets/List-D4cdOnqZ.js", "/assets/Page-DNSI32A3.js", "/assets/Banner-B_KTgK2b.js", "/assets/Spinner-CP1GQruM.js", "/assets/Link-lj8o7TR5.js", "/assets/Card-CrrBs3V9.js", "/assets/IndexTable-BVxw_skM.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/Modal-B21QHyl1.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.customizations.new": { "id": "routes/app.customizations.new", "parentId": "routes/app.customizations", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.customizations.new-lrPfpu2x.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/shippingCustomizations-osU7QKcW.js", "/assets/useAppBridge-Bj34gXAL.js", "/assets/Page-DNSI32A3.js", "/assets/Layout-BYSd_nGw.js", "/assets/Card-CrrBs3V9.js", "/assets/Select-B_vmL1Sv.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/Spinner-CP1GQruM.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/RadioButton-CYjyJM2w.js", "/assets/Modal-B21QHyl1.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/Choice-ByFqPKsD.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js", "/assets/XIcon.svg-3Jn-vbSH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.clone-setup": { "id": "routes/app.clone-setup", "parentId": "routes/app", "path": "clone-setup", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.clone-setup-CKVC37yo.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/context-BmZLOxf0.js", "/assets/CSSTransition-DGepzxn5.js", "/assets/Banner-B_KTgK2b.js", "/assets/Card-CrrBs3V9.js", "/assets/context-CVC4aaB5.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.products": { "id": "routes/app.products", "parentId": "routes/app", "path": "products", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.products-BrGoqf_H.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/context-BmZLOxf0.js", "/assets/Spinner-CP1GQruM.js", "/assets/context-CVC4aaB5.js", "/assets/Page-DNSI32A3.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/IndexTable-BVxw_skM.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/Modal-B21QHyl1.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js", "/assets/XIcon.svg-3Jn-vbSH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.settings-CvlpdOj_.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/app.module-BhDAjhCl.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/Card-CrrBs3V9.js", "/assets/Divider-BcwjOU1Y.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/Select-B_vmL1Sv.js", "/assets/Banner-B_KTgK2b.js", "/assets/Modal-B21QHyl1.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js"], "css": ["/assets/app-Dx2V_t7r.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.billing": { "id": "routes/app.billing", "parentId": "routes/app", "path": "billing", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.billing-oCWQIzdi.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/app.module-BhDAjhCl.js", "/assets/useAppBridge-Bj34gXAL.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/index-D7nzmdhB.js"], "css": ["/assets/app-Dx2V_t7r.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app._index-BW6Ohpf1.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/app.module-BhDAjhCl.js", "/assets/Spinner-CP1GQruM.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/context-CVC4aaB5.js"], "css": ["/assets/app-Dx2V_t7r.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.videos": { "id": "routes/app.videos", "parentId": "routes/app", "path": "videos", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.videos-B4MVVVSz.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/app.module-BhDAjhCl.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/Banner-B_KTgK2b.js", "/assets/Link-lj8o7TR5.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/RadioButton-CYjyJM2w.js", "/assets/Card-CrrBs3V9.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/Choice-ByFqPKsD.js"], "css": ["/assets/app-Dx2V_t7r.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.rates": { "id": "routes/app.rates", "parentId": "routes/app", "path": "rates", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.rates-CcYVxKJz.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.rates._index": { "id": "routes/app.rates._index", "parentId": "routes/app.rates", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.rates._index-CSV3yoT1.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/useAppBridge-Bj34gXAL.js", "/assets/List-D4cdOnqZ.js", "/assets/Page-DNSI32A3.js", "/assets/Banner-B_KTgK2b.js", "/assets/Link-lj8o7TR5.js", "/assets/Card-CrrBs3V9.js", "/assets/IndexTable-BVxw_skM.js", "/assets/Spinner-CP1GQruM.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/Modal-B21QHyl1.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.rates.new": { "id": "routes/app.rates.new", "parentId": "routes/app.rates", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.rates.new-BIXPAtoC.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/useAppBridge-Bj34gXAL.js", "/assets/Page-DNSI32A3.js", "/assets/Layout-BYSd_nGw.js", "/assets/Card-CrrBs3V9.js", "/assets/Select-B_vmL1Sv.js", "/assets/Spinner-CP1GQruM.js", "/assets/RadioButton-CYjyJM2w.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/Banner-B_KTgK2b.js", "/assets/Modal-B21QHyl1.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/Divider-BcwjOU1Y.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/Choice-ByFqPKsD.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/context-Dh4NEsqn.js", "/assets/CSSTransition-DGepzxn5.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.zones": { "id": "routes/app.zones", "parentId": "routes/app", "path": "zones", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.zones-B-L46CF0.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.zones._index": { "id": "routes/app.zones._index", "parentId": "routes/app.zones", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.zones._index-Cbmb0nlz.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/Page-DNSI32A3.js", "/assets/Card-CrrBs3V9.js", "/assets/IndexTable-BVxw_skM.js", "/assets/Spinner-CP1GQruM.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/index-D7nzmdhB.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.zones.$id": { "id": "routes/app.zones.$id", "parentId": "routes/app.zones", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.zones._id-BHYdXD5q.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/ZoneForm-D1CGfdqo.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/index-D7nzmdhB.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js", "/assets/Banner-B_KTgK2b.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/Card-CrrBs3V9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.zones.add": { "id": "routes/app.zones.add", "parentId": "routes/app.zones", "path": "add", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.zones.add-ByOBb86k.js", "imports": ["/assets/chunk-KS7C4IRE-CBptP6rc.js", "/assets/jsx-runtime-C6e02r0u.js", "/assets/ZoneForm-D1CGfdqo.js", "/assets/Page-DNSI32A3.js", "/assets/Spinner-CP1GQruM.js", "/assets/use-is-after-initial-mount-DuwtYf2i.js", "/assets/InlineStack-dTP0cs3k.js", "/assets/context-CVC4aaB5.js", "/assets/context-BmZLOxf0.js", "/assets/index-D7nzmdhB.js", "/assets/Checkbox-BHRSuLVO.js", "/assets/Choice-ByFqPKsD.js", "/assets/Banner-B_KTgK2b.js", "/assets/within-content-context-BS4ce0FV.js", "/assets/InfoIcon.svg-CRMUWCM8.js", "/assets/XIcon.svg-3Jn-vbSH.js", "/assets/Card-CrrBs3V9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-108863f0.js", "version": "108863f0", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "v8_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.carrier-rates": {
    id: "routes/api.carrier-rates",
    parentId: "root",
    path: "api/carrier-rates",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route5
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/app.customizations": {
    id: "routes/app.customizations",
    parentId: "routes/app",
    path: "customizations",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/app.customizations._index": {
    id: "routes/app.customizations._index",
    parentId: "routes/app.customizations",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  },
  "routes/app.customizations.new": {
    id: "routes/app.customizations.new",
    parentId: "routes/app.customizations",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/app.clone-setup": {
    id: "routes/app.clone-setup",
    parentId: "routes/app",
    path: "clone-setup",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/app.products": {
    id: "routes/app.products",
    parentId: "routes/app",
    path: "products",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/app.billing": {
    id: "routes/app.billing",
    parentId: "routes/app",
    path: "billing",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app.videos": {
    id: "routes/app.videos",
    parentId: "routes/app",
    path: "videos",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/app.rates": {
    id: "routes/app.rates",
    parentId: "routes/app",
    path: "rates",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/app.rates._index": {
    id: "routes/app.rates._index",
    parentId: "routes/app.rates",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route18
  },
  "routes/app.rates.new": {
    id: "routes/app.rates.new",
    parentId: "routes/app.rates",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/app.zones": {
    id: "routes/app.zones",
    parentId: "routes/app",
    path: "zones",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/app.zones._index": {
    id: "routes/app.zones._index",
    parentId: "routes/app.zones",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route21
  },
  "routes/app.zones.$id": {
    id: "routes/app.zones.$id",
    parentId: "routes/app.zones",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/app.zones.add": {
    id: "routes/app.zones.add",
    parentId: "routes/app.zones",
    path: "add",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
