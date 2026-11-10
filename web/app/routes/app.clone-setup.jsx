import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  Banner,
  Box,
  Text,
  Button,
  ProgressBar,
  InlineStack,
} from "@shopify/polaris";

import EnterSecretStep from "../components/clone-store/EnterSecretStep";
import SelectConfigurationStep from "../components/clone-store/SelectConfigurationStep";
import MapZonesStep from "../components/clone-store/MapZonesStep";
import ConfirmStep from "../components/clone-store/ConfirmStep";
import CompleteStep from "../components/clone-store/CompleteStep";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { ensureShop, syncFunctionConfiguration } from "../backend.server";
import { decryptApiSecret, hashApiSecret } from "../settings-secret.server";
import { entitlementsFor } from "../plans.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  return null;
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const destinationShop = await ensureShop(session.shop);
  const data = await request.formData();
  const secret = String(data.get("secret") ?? "").trim();
  let sourceConfiguration = await prisma.shopConfiguration.findUnique({
    where: { apiSecretHash: hashApiSecret(secret) },
    include: { shop: true },
  });
  // Recover secrets created before the hash column was populated, and tolerate
  // copy/paste whitespace without exposing the plaintext secret to the client.
  if (!sourceConfiguration && secret) {
    const candidates = await prisma.shopConfiguration.findMany({
      where: { apiSecretEncrypted: { not: null } },
      include: { shop: true },
    });
    sourceConfiguration = candidates.find((candidate) => {
      try {
        return decryptApiSecret(candidate.apiSecretEncrypted) === secret;
      } catch {
        return false;
      }
    });
    if (sourceConfiguration && sourceConfiguration.apiSecretHash !== hashApiSecret(secret)) {
      await prisma.shopConfiguration.update({
        where: { shopId: sourceConfiguration.shopId },
        data: { apiSecretHash: hashApiSecret(secret) },
      });
    }
  }
  if (!sourceConfiguration) {
    return { ok: false, error: "Source store secret is invalid. Copy the complete secret from another store's Settings page." };
  }
  if (sourceConfiguration.shopId === destinationShop.id) {
    return { ok: false, error: "You cannot clone a store into itself. Use a secret from another store." };
  }
  if (data.get("intent") === "validate") return { ok: true, intent: "validate" };

  let selected;
  try {
    selected = JSON.parse(String(data.get("selected") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid clone configuration selection." };
  }
  if (!Array.isArray(selected) || !selected.length) return { ok: false, error: "Select at least one configuration." };
  const source = await prisma.shop.findUnique({
    where: { id: sourceConfiguration.shopId },
    include: {
      customizations: { include: { conditions: true, methods: true, schedules: true } },
      rateRules: { include: { conditions: true, rates: true, schedules: true } },
    },
  });
  const destinationConfiguration = await prisma.shopConfiguration.findUnique({ where: { shopId: destinationShop.id } });
  if (!source) return { ok: false, error: "Source store is unavailable." };
  const permissions = entitlementsFor(destinationConfiguration?.plan);

  await prisma.$transaction(async (tx) => {
    if (selected.includes("customizations")) {
      await tx.customization.deleteMany({ where: { shopId: destinationShop.id } });
      for (const item of source.customizations) {
        await tx.customization.create({ data: {
          shopId: destinationShop.id, name: item.name, type: item.type, status: item.status,
          parameterSet: item.parameterSet, conditionMatch: item.conditionMatch, shipmentScope: item.shipmentScope,
          conditions: { create: item.conditions.map(({ position, field, operator, key, value, productMatch, matchValue }) => ({ shopId: destinationShop.id, position, field, operator, key, value, productMatch, matchValue })) },
          methods: { create: item.methods.map(({ position, value, replacementValue }) => ({ shopId: destinationShop.id, position, value, replacementValue })) },
          schedules: { create: item.schedules.map(({ position, action, scheduledAt, timezone }) => ({ shopId: destinationShop.id, position, action, scheduledAt, timezone })) },
        } });
      }
    }
    if (selected.includes("rates")) {
      await tx.rateRule.deleteMany({ where: { shopId: destinationShop.id } });
      for (const item of source.rateRules) {
        await tx.rateRule.create({ data: {
          shopId: destinationShop.id, name: item.name, priority: item.priority, status: item.status,
          conditionMatch: item.conditionMatch, exclusivity: item.exclusivity,
          conditions: { create: item.conditions.map(({ position, field, subfield, key, operator, value, quantityCheck, quantityValue }) => ({ shopId: destinationShop.id, position, field, subfield, key, operator, value, quantityCheck, quantityValue })) },
          rates: { create: item.rates.map(({ position, zoneKey, name, calculation, price, description, minimumDays, maximumDays, tags, currencyCode, status }) => ({ shopId: destinationShop.id, position, zoneKey, name, calculation, price, description, minimumDays, maximumDays, tags, currencyCode, status })) },
          schedules: { create: item.schedules.map(({ position, action, scheduledAt, timezone }) => ({ shopId: destinationShop.id, position, action, scheduledAt, timezone })) },
        } });
      }
    }
    if (selected.includes("settings")) {
      await tx.shopConfiguration.update({ where: { shopId: destinationShop.id }, data: {
        shippingRatesEnabled: permissions.shippingRatesLive && sourceConfiguration.shippingRatesEnabled,
        customizationsEnabled: permissions.customizationsLive && sourceConfiguration.customizationsEnabled,
        autoProductSyncEnabled: sourceConfiguration.autoProductSyncEnabled,
        blendMode: sourceConfiguration.blendMode,
        contactEmail: sourceConfiguration.contactEmail,
        basicBlendLimits: sourceConfiguration.basicBlendLimits,
        advancedBlendRules: sourceConfiguration.advancedBlendRules,
      } });
    }
  });
  if (selected.includes("customizations") || selected.includes("settings")) await syncFunctionConfiguration(destinationShop.id);
  return { ok: true, intent: "clone" };
}

export default function CloneStoreSetupPage() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");

  // Step 1 Data
  const [sourceSecret, setSourceSecret] = useState("");

  // Step 2 Data
  const [selectedConfigurations, setSelectedConfigurations] = useState([]);

  // Step 3 Data
  const [mappedZones, setMappedZones] = useState({});

  const steps = [
    "Enter Secret",
    "Select Configuration",
    "Map Zones",
    "Confirm",
    "Complete",
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleContinue = () => {
    setError("");

    switch (currentStep) {
      case 0:
        if (!sourceSecret.trim()) {
          setError("Please enter a source store secret.");
          return;
        }
        fetcher.submit({ intent: "validate", secret: sourceSecret }, { method: "post" });
        return;

      case 1:
        if (selectedConfigurations.length === 0) {
          setError("Please select at least one configuration.");
          return;
        }
        break;

      case 2:
        // Validate mapped zones here if required
        break;

      case 3:
        fetcher.submit({ intent: "clone", secret: sourceSecret, selected: JSON.stringify(selectedConfigurations) }, { method: "post" });
        return;

      default:
        break;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigate("/app/settings");
    }
  };

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (!fetcher.data.ok) { setError(fetcher.data.error); return; }
    if (fetcher.data.intent === "validate") setCurrentStep(1);
    if (fetcher.data.intent === "clone") setCurrentStep(4);
  }, [fetcher.data, fetcher.state]);

  const handleBack = () => {
    setError("");

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const wizardSteps = [
    <EnterSecretStep
      key="step1"
      sourceSecret={sourceSecret}
      setSourceSecret={setSourceSecret}
    />,

    <SelectConfigurationStep
      key="step2"
      selectedConfigurations={selectedConfigurations}
      setSelectedConfigurations={setSelectedConfigurations}
    />,

    <MapZonesStep
      key="step3"
      mappedZones={mappedZones}
      setMappedZones={setMappedZones}
    />,

    <ConfirmStep
      key="step4"
      sourceSecret={sourceSecret}
      selectedConfigurations={selectedConfigurations}
      mappedZones={mappedZones}
    />,

    <CompleteStep
      key="step5"
    />,
  ];

  return (
    <Page
      title="Clone Store Setup"
      backAction={{
        content: "Settings",
        onAction: () => navigate(-1),
      }}
    >
      <BlockStack gap="600">

        {/* Progress */}
        <BlockStack gap="200">
          <InlineStack align="space-between">
            {steps.map((step, index) => (
              <Text
                key={step}
                as="span"
                variant="bodySm"
                tone={index === currentStep ? "base" : "subdued"}
                fontWeight={index === currentStep ? "bold" : "regular"}
              >
                {step}
              </Text>
            ))}
          </InlineStack>

          <ProgressBar
            progress={progress}
            tone="primary"
            size="small"
          />
        </BlockStack>

        {/* Error */}
        {error && (
          <Banner
            tone="critical"
            title={error}
            onDismiss={() => setError("")}
          />
        )}

        {/* Current Step */}
        <Card>
          <BlockStack gap="500">

            {wizardSteps[currentStep]}

            <Box paddingBlockStart="500">
              <InlineStack align="space-between">

                <Box>
                  {currentStep > 0 && (
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                  )}
                </Box>

                <Button
                  variant="primary"
                  onClick={handleContinue}
                  loading={fetcher.state !== "idle"}
                >
                  {currentStep === steps.length - 1
                    ? "Finish"
                    : "Validate & Continue"}
                </Button>

              </InlineStack>
            </Box>

          </BlockStack>
        </Card>

      </BlockStack>
    </Page>
  );
}
