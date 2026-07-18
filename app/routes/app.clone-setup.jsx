import { useState } from "react";
import { useNavigate } from "react-router";
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

export default function CloneStoreSetupPage() {
  const navigate = useNavigate();

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
        break;

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
        // Confirmation step
        break;

      default:
        break;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log("Clone completed");

      // TODO:
      // Submit API request
      // navigate("/app/settings");
    }
  };

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