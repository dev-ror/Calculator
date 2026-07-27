import React, { useState, useCallback } from "react";
import {
  Page,
  LegacyCard,
  LegacyStack,
  IndexTable,
  TextField,
  Text,
  Box,
  Modal,
  DropZone,
  Thumbnail,
  Button,
  Pagination,
  InlineStack,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";

const allProducts = [
  { id: "1", name: "The Compare at Price Snowboard" },
  { id: "2", name: "The Collection Snowboard: Hydrogen" },
  { id: "3", name: "The Out of Stock Snowboard" },
  { id: "4", name: "The Complete Snowboard - Ice" },
  { id: "5", name: "The Complete Snowboard - Dawn" },
  { id: "6", name: "The Complete Snowboard - Powder" },
  { id: "7", name: "The Complete Snowboard - Electric" },
  { id: "8", name: "The Complete Snowboard - Sunset" },
  { id: "9", name: "The Archived Snowboard" },
  { id: "10", name: "Gift Card - $10" },
  { id: "11", name: "Gift Card - $25" },
  { id: "12", name: "Gift Card - $50" },
  { id: "13", name: "Gift Card - $100" },
  { id: "14", name: "Selling Plans Ski Wax - Selling Plans Ski Wax" },
  { id: "15", name: "Selling Plans Ski Wax - Special Selling Plans Ski Wax" },
  { id: "16", name: "Selling Plans Ski Wax - Sample Selling Plans Ski Wax" },
  { id: "17", name: "The Draft Snowboard" },
  { id: "18", name: "The Videographer Snowboard" },
  { id: "19", name: "The Hidden Snowboard" },
  { id: "20", name: "The Minimal Snowboard" },
  { id: "21", name: "The Inventory Not Tracked Snowboard" },
  { id: "22", name: "The Multi-location Snowboard" },
  { id: "23", name: "The 3p Fulfilled Snowboard" },
  { id: "24", name: "The Multi-managed Snowboard" },
  { id: "25", name: "The Collection Snowboard: Oxygen" },
  { id: "26", name: "The Collection Snowboard: Liquid" },
];

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

export default function ProductsPage() {
  const [dimensions, setDimensions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState([]);

  // --- Modal & Dropzone Logic ---
  const toggleModal = useCallback(() => {
    setIsModalOpen((active) => !active);
    setFiles([]); // Reset files when closing/opening
  }, []);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) =>
      setFiles((files) => [...files, ...acceptedFiles]),
    [],
  );

  // Generates the sample CSV in-browser and downloads it, matching
  // product-dimensions-template.csv from the reference screenshot.
  const handleDownloadCsvFormat = useCallback(() => {
    const csvContent = buildDimensionsCsv(allProducts);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "product-dimensions-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const fileUpload = !files.length && (
    <DropZone.FileUpload actionTitle="+ Add file" actionHint="Accepts .csv" />
  );

  const uploadedFiles = files.length > 0 && (
    <div style={{ padding: "10px" }}>
      <LegacyStack vertical>
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={index}>
            <Thumbnail size="small" alt={file.name} source={NoteIcon} />
            <div>
              {file.name}{" "}
              <Text variant="bodySm" as="p">
                {file.size} bytes
              </Text>
            </div>
          </LegacyStack>
        ))}
      </LegacyStack>
    </div>
  );

  const handleDimensionChange = (id, field, value) => {
    setDimensions((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const totalItems = allProducts.length;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = allProducts.slice(startIndex, startIndex + rowsPerPage);

  const rowMarkup = currentRows.map(({ id, name }, index) => (
    <IndexTable.Row id={id} key={id} position={index}>
      <IndexTable.Cell>
        <div style={{ padding: "12px 0" }}>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </div>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <TextField
          label="Length"
          labelHidden
          type="number"
          suffix="mm"
          autoComplete="off"
          value={dimensions[id]?.length || ""}
          onChange={(val) => handleDimensionChange(id, "length", val)}
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <TextField
          label="Width"
          labelHidden
          type="number"
          suffix="mm"
          autoComplete="off"
          value={dimensions[id]?.width || ""}
          onChange={(val) => handleDimensionChange(id, "width", val)}
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <TextField
          label="Height"
          labelHidden
          type="number"
          suffix="mm"
          autoComplete="off"
          value={dimensions[id]?.height || ""}
          onChange={(val) => handleDimensionChange(id, "height", val)}
        />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      backAction={{ content: "Products", url: "#" }}
      title="Products"
      primaryAction={{
        content: "Bulk upload dimensions",
        onAction: toggleModal,
      }}
    >
      <div style={{ marginBottom: "40px" }}>
        <LegacyCard>
          <IndexTable
            resourceName={{ singular: "product", plural: "products" }}
            itemCount={totalItems}
            selectable={false}
            headings={[
              { title: "Name" },
              { title: "Length" },
              { title: "Width" },
              { title: "Height" },
            ]}
          >
            {rowMarkup}
          </IndexTable>

          {/* Conditional Pagination logic */}
          {totalItems > 0 && (
            <Box
              padding="300"
              background="bg-surface-secondary"
              borderBlockStartWidth="025"
              borderColor="border"
            >
              <InlineStack align="center" blockAlign="center">
                <Pagination
                  hasPrevious={currentPage > 1}
                  onPrevious={() => setCurrentPage((prev) => prev - 1)}
                  hasNext={startIndex + rowsPerPage < totalItems}
                  onNext={() => setCurrentPage((prev) => prev + 1)}
                />
              </InlineStack>
            </Box>
          )}
        </LegacyCard>
      </div>

      <Modal open={isModalOpen} onClose={toggleModal} title="Upload products dimensions by CSV">
        <Modal.Section>
          <div style={{ marginBottom: "20px" }}>
            <DropZone onDrop={handleDropZoneDrop} accept=".csv" type="file">
              {uploadedFiles}
              {fileUpload}
            </DropZone>
          </div>
        </Modal.Section>

        {/* Custom footer: "Download CSV format" link on the left, Cancel/Upload
            on the right — matches the reference screenshot's single footer row. */}
        <Modal.Section>
          <InlineStack align="space-between" blockAlign="center">
            <Button variant="plain" onClick={handleDownloadCsvFormat}>
              Download CSV format
            </Button>
            <InlineStack gap="200">
              <Button onClick={toggleModal}>Cancel</Button>
              <Button
                variant="primary"
                disabled={files.length === 0}
                onClick={() => console.log("Uploading...", files)}
              >
                Upload
              </Button>
            </InlineStack>
          </InlineStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
