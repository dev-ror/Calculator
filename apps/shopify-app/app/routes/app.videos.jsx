import { useMemo, useState } from "react";
import {
  Page,
  Banner,
  Card,
  BlockStack,
  InlineStack,
  Text,
  RadioButton,
  Grid,
  Badge,
  Box,
  Link,
} from "@shopify/polaris";
import { useNavigate } from "react-router";
import styles from "../app.module.css";

const videos = [
  {
    title: "Per item / Incremental shipping rates",
    description:
      "Learn how to set up shipping rates that increase by amount X for every Y additional items in cart.",
    thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
    youtube: "https://youtu.be/rUXvpyftrIg",
    category: "rates",
    tags: ["Per item rates", "Incremental rates"],
  },
  {
    title: "Percentage based shipping rates",
    description: "Create shipping rates based on percentage of cart subtotal.",
    thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
    youtube: "https://youtu.be/rUXvpyftrIg",
    category: "rates",
    tags: ["Percentage rates"],
  },
  {
    title: "Zipcode / Postcode shipping rates",
    description: "Create different shipping rates for groups of zipcodes/postcodes.",
    thumbnail: "https://img.youtube.com/vi/rUXvpyftrIg/maxresdefault.jpg",
    youtube: "https://youtu.be/rUXvpyftrIg",
    category: "customizations",
    tags: ["Postcode", "Zipcode"],
  },
];

export default function Videos() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("all");

  const list = useMemo(() => {
    if (selected === "all") return videos;
    if (selected === "rates") return videos.filter((v) => v.category === "rates");
    return videos.filter((v) => v.category === "customizations");
  }, [selected]);

  return (
    <Page title="Example Setup Videos" backAction={{ content: "Back", onAction: () => navigate(-1) }}>
      <BlockStack gap="500">
        <Text as="p" variant="bodyMd">
          Learn how to setup the app for some of the most-common shipping rate requirements.
        </Text>
        <Banner tone="info" title="Please Note">
          <p>
            This page features videos on common shipping rate scenarios. For other app
            capabilities, <Link url="mailto:support@example.com">contact</Link> customer support
            or check back for updates as we add new videos regularly.
          </p>
        </Banner>
        <InlineStack gap="400" blockAlign="center">
          <RadioButton
            label="All Videos"
            checked={selected === "all"}
            id="all"
            name="videoFilter"
            onChange={() => setSelected("all")}
          />
          <RadioButton
            label="Shipping Rates Videos"
            checked={selected === "rates"}
            id="rates"
            name="videoFilter"
            onChange={() => setSelected("rates")}
          />
          <RadioButton
            label="Shipping Customizations Videos"
            checked={selected === "customizations"}
            id="customizations"
            name="videoFilter"
            onChange={() => setSelected("customizations")}
          />
        </InlineStack>
        <Grid>
          {list.map((video) => (
            <Grid.Cell key={video.title} columnSpan={{ xs: 6, sm: 3, md: 2, lg: 4, xl: 4 }}>
              <div className={styles.videoCardCell} >
                <Card padding="0">
                  <a
                    href={video.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Box position="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
                      />
                      <img
                        src="https://shipmagic.fly.dev/assets/play-button-M-9Od2Qw.png"
                        alt=""
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%,-50%)",
                          width: 80,
                        }}
                      />
                    </Box>
                    <Box padding="400" width="100%">
                      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            {video.title}
                          </Text>
                          <Text as="p" tone="subdued">
                            {video.description}
                          </Text>
                        </BlockStack>
                        <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                          <InlineStack gap="200">
                            {video.tags.map((t) => (
                              <Badge key={t} tone="info">{t}</Badge>
                            ))}
                          </InlineStack>
                        </div>
                      </div>
                    </Box>
                  </a>
                </Card>
              </div>
            </Grid.Cell>
          ))}
        </Grid>
      </BlockStack>
    </Page>
    
  );
}
