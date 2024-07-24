import React, { useState, useEffect,useCallback } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Button,
  TextField,
  Form,
  Select,
  Checkbox,
  ColorPicker,
  Popover,
  DropZone,
  Icon,
  Thumbnail,
  BlockStack,
  Modal,
  Text
} from "@shopify/polaris";
import { NoteIcon, EyeDropperIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { useNavigate } from "react-router-dom";
import { useParams } from "@remix-run/react";
import "./Style/styles.css";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";

// Function to ensure admin authentication
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// Main action function to handle form submission and variant creation
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Extract form data from request
  const formData = await request.formData();
  const productId = parseInt(formData.get("product_id"));
  const title = formData.get("title");
  const selected = formData.get("selected");
  const values = formData.getAll("values[]");
  const prices = formData.getAll("prices[]");
  const colorNames = formData.getAll("colorNames[]");
  const havePrice = formData.get("havePrice") === "true";

  // Prepare data structures based on selected variant type
  const valuePricePairs = {};
  const colorSwatchPairs = {};

  // Process form data based on selected variant type
  if (selected === "colorSwatches") {
    values.forEach((value, index) => {
      const colorNameList = colorNames[index].split(",");
      const valueList = value.split(",");
      valueList.forEach((val, i) => {
        colorSwatchPairs[colorNameList[i]] = val;
      });
    });
  } else {
    values.forEach((value, index) => {
      const valueList = value.split(",");
      const priceList = prices[index].split(",").map(parseFloat);
      valueList.forEach((val, i) => {
        valuePricePairs[val] = havePrice ? priceList[i] || null : null;
      });
    });
  }

  // Construct new variant object
  const newVariant = {
    id: uuidv4(),
    title,
    selected,
    havePrice,
    values: selected === "colorSwatches" ? colorSwatchPairs : valuePricePairs,
  };

  // Fetch existing metafield data for the product
  const existMetafield = await admin.rest.resources.Metafield.all({
    session: session,
    product_id: productId,
  });

  let existValue = { productId, variants: [] };
  let metafieldId = null;

  // Find existing metafield with namespace "Kaswebtech"
  for (const item of existMetafield.data) {
    if (item.namespace === "Kaswebtech") {
      existValue = JSON.parse(item.value); // Parse existing JSON value
      metafieldId = item.id;
      break;
    }
  }

  // Merge new variant into existing variants
  const mergedValue = {
    productId: productId,
    variants: [...existValue.variants, newVariant],
  };

  // Create or update metafield with merged value
  const metafield = new admin.rest.resources.Metafield({ session });
  metafield.product_id = productId;
  metafield.namespace = "Kaswebtech";
  metafield.key = "Variant";
  metafield.type = "json";
  metafield.value = JSON.stringify(mergedValue);
  if (metafieldId) {
    metafield.id = metafieldId;
  }

  await metafield.save({ update: Boolean(metafieldId) });

  return json({ success: true });
};

// Component for adding variants
export default function AddVariantPage() {
  const [title, setTitle] = useState("");
  const [checked, setChecked] = useState(false);
  const [fields, setFields] = useState([
    {
      value: "",
      price: "",
      color: { hue: 120, brightness: 1, saturation: 1 },
      showColorPicker: false,
      colorName: "",
      files: [],
    },
  ]);
  const submit = useSubmit();
  const data = useActionData();
  const navigate = useNavigate();
  const params = useParams();
  const productId = params["*"];
  const [selected, setSelected] = useState("");
  const [files, setFiles] = useState([]);

  const [active, setActive] = useState(false);
  const handleChange = useCallback(() => {
    setActive(!active);
    if (!active) {
      setFiles([]);
    }
  }, [active]);


  // Valid image types for DropZone
  const validImageTypes = ["image/jpeg", "image/png", "image/gif"];

  // Options for variant selection
  const options = [
    { label: "Select an option", value: "" },
    { label: "Drop Down", value: "dropdown" },
    { label: "Buttons", value: "button" },
    { label: "TextField", value: "TextField" },
    { label: "Color Swatches", value: "colorSwatches" },
    { label: "Check Boxes", value: "CheckBox" },
    { label: "Image Swatches", value: "ImgSwatches" },
  ];

  // Function to add a new field
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        value: "",
        price: "",
        color: { hue: 120, brightness: 1, saturation: 1 },
        showColorPicker: false,
        colorName: "",
        files: [],
      },
    ]);
  };

  // Function to handle changes in fields
  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  // Function to toggle color picker visibility
  const toggleColorPicker = (index) => {
    const newFields = [...fields];
    newFields[index].showColorPicker = !newFields[index].showColorPicker;
    setFields(newFields);
  };

  // Function to handle color change in ColorPicker
  const handleColorChange = (index, color) => {
    const newFields = [...fields];
    newFields[index].color = color;
    newFields[index].value = hslToHex(
      color.hue,
      color.saturation * 100,
      color.brightness * 100
    );
    newFields[index].rgbColor = hslToHex(
      color.hue,
      color.saturation * 100,
      color.brightness * 100
    );
    setFields(newFields);
  };

  // Function to convert HSL color to HEX
  function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Format fields data based on selected variant type
      const formattedFields = fields.reduce((acc, field) => {
        const values = field.value.split(",").map((value) => value.trim());
        const prices = field.price
          .split(",")
          .map((price) => parseFloat(price.trim()));
        values.forEach((value, index) => {
          if (!acc[value]) {
            acc[value] = 0;
          }
          acc[value] += prices[index] || 0; // Accumulate prices for each value
        });
        return acc;
      }, {});

      // Submit form data
      await submit(
        {
          product_id: productId,
          title,
          selected,
          havePrice: checked.toString(),
          "values[]": fields.map((field) => field.value),
          "prices[]":
            selected !== "colorSwatches" ? Object.values(formattedFields) : [],
          "colorNames[]":
            selected === "colorSwatches"
              ? fields.map((field) => field.colorName)
              : [],
        },
        { replace: true, method: "POST" }
      );
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  // Effect to navigate after successful form submission
  useEffect(() => {
    if (data) {
      navigate(`/app/product/${productId}`);
    }
  }, [data, navigate, productId]);

  const fileInputRef = useRef(null);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => {
      setFiles((files) => [...files, ...acceptedFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input if using
      }
    },
    []
  );

  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
    <div style={{ padding: '0' }}>
        <BlockStack vertical>
            {files.map((file, index) => (
                <BlockStack alignment="center" key={index}>
                    <Thumbnail
                        size="small"
                        alt={file.name}
                        source={
                            validImageTypes.includes(file.type)
                                ? window.URL.createObjectURL(file)
                                : UploadIcon
                        }
                    />
                    <div>
                        {file.name}{' '}
                        <Text variant="bodySm" as="p">
                            {file.size} bytes
                        </Text>
                    </div>
                </BlockStack>
            ))}
        </BlockStack>
    </div>
);

  const handleImageUpload = (event) => {
    event.preventDefault();
    const formData = new FormData();
    files.forEach((file, index) => {
        formData.append('file', file, file.name);
    });

    fetch('/app/uploadAction', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Upload successful:', data);
    })
    .catch(error => {
        console.error('Upload error:', error);
    });
};


  // JSX structure for the component
  return (
    <div className="create-metafield-container">
      <Form noValidate onSubmit={handleSubmit}>
      <TextField
            label="Title"
            type="text"
            onChange={setTitle}
            value={title}
          />
          <Select
            label="Select an option"
            options={options}
            onChange={setSelected}
            value={selected}
          />

          {/* Conditional rendering based on selected variant type */}
          {selected &&
            selected !== "TextField" &&
            selected !== "colorSwatches" &&
            selected !== "CheckBox" &&
            selected !== "ImgSwatches" && (
              <Checkbox
                label="Values Have Price ?"
                checked={checked}
                onChange={setChecked}
              />
            )}

          {selected && selected !== "TextField" && (
            <>
              {/* Render fields based on selected variant type */}
              {fields.map((field, index) => (
                <div key={index} className="field-container">
                  {selected === "colorSwatches" ? (
                    // Color swatch variant type
                    <>
                      <div style={{ display: "flex", justifyContent: "space-around" }}>
                        {/* Color preview */}
                        <div
                          style={{
                            backgroundColor: field.rgbColor,
                            width: "36px",
                            height: "36px",
                            border: "1px solid #222",
                            borderRadius: "50%",
                            marginRight: "10px",
                          }}
                        ></div>
                        {/* Color picker */}
                        <Button onClick={() => toggleColorPicker(index)}>
                          <Icon source={EyeDropperIcon} />
                        </Button>
                        {/* Color name input */}
                        <TextField
                          type="text"
                          placeholder="Enter Color Name"
                          onChange={(value) =>
                            handleFieldChange(index, "colorName", value)
                          }
                          value={field.colorName}
                        />
                      </div>
                      {/* Color picker popover */}
                      <Popover
                        active={field.showColorPicker}
                        activator={<div style={{ display: "none" }}></div>}
                        onClose={() => toggleColorPicker(index)}
                      >
                        <ColorPicker
                          onChange={(color) => handleColorChange(index, color)}
                          color={field.color}
                        />
                      </Popover>
                    </>
                  ) : selected === "ImgSwatches" ? (
                    // Image swatch variant type
                    <>
                      <div style={{ display: "flex", justifyContent: "space-around" }}>
                      <Button onClick={handleChange} style={{ width: 40, height: 40 }}>Click</Button>
                    <Modal
                      open={active}
                      onClose={handleChange}
                      title="Modal title"
                      primaryAction={{
                        content: 'Upload',
                        onAction: handleImageUpload,
                      }}
                    >
                    <Modal.Section>
                      {/* DropZone for image upload */}
                      <div style={{ width: 40, height: 40 }}>
                      <DropZone onDrop={handleDropZoneDrop}>
                          {uploadedFiles}
                          {fileUpload}
                      </DropZone>
                      </div>
                    </Modal.Section>
                  </Modal>
                        {/* Image name input */}
                        <TextField
                          type="text"
                          placeholder="Enter Image Name"
                          onChange={(value) =>
                            handleFieldChange(index, "imageName", value)
                          }
                          value={field.imageName}
                        />
                      </div>
                    </>
                  ) : (
                    // Default variant type (Dropdown, Buttons, etc.)
                    <>
                      <TextField
                        label="Value"
                        type="text"
                        placeholder="Value"
                        onChange={(value) =>
                          handleFieldChange(index, "value", value)
                        }
                        value={field.value}
                      />
                      {/* Optional price field if 'Values Have Price' is checked */}
                      {checked && (
                        <TextField
                          label="Price"
                          type="number"
                          placeholder="Price"
                          onChange={(value) =>
                            handleFieldChange(index, "price", value)
                          }
                          value={field.price}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              {/* Button to add another field */}
              <Button onClick={handleAddField}>+</Button>
            </>
          )}
          {/* Button to submit the form */}
          <Button submit>Create Variant</Button>
        </Form>
      </div>
    );
}
