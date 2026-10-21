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
  const response = await admin.graphql(OWNER_QUERY);
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error("Unable to load Shopify Delivery Customizations");
  }

  return payload.data?.deliveryCustomizations?.nodes?.find(
    ({ shopifyFunction }) => shopifyFunction?.appKey === appKey,
  );
}

export async function ensureDeliveryCustomizationOwner({
  admin,
  appKey,
  functionHandle,
  title,
}) {
  const existingOwner = await loadExistingOwner(admin, appKey);

  if (existingOwner) {
    return {
      success: true,
      ownerId: existingOwner.id,
      created: false,
    };
  }

  const response = await admin.graphql(CREATE_OWNER_MUTATION, {
    variables: {
      deliveryCustomization: {
        enabled: true,
        functionHandle,
        title,
      },
    },
  });
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error("Unable to create Shopify Delivery Customization");
  }

  const result = payload.data?.deliveryCustomizationCreate;

  if (result?.userErrors?.length) {
    const messages = result.userErrors
      .map(({ message }) => message)
      .join("; ");
    throw new Error(`Shopify rejected Delivery Customization: ${messages}`);
  }

  const ownerId = result?.deliveryCustomization?.id;

  if (!ownerId) {
    throw new Error("Shopify did not return the Delivery Customization owner");
  }

  return {
    success: true,
    ownerId,
    created: true,
  };
}
