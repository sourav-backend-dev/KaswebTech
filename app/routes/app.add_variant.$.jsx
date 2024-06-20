import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useSubmit,
} from "@remix-run/react";
import { Button, TextField, Form, Select, Checkbox, ColorPicker, Popover } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useNavigate } from "react-router-dom";
import { useParams } from "@remix-run/react";
import './Style/styles.css';
import { v4 as uuidv4 } from 'uuid';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const formData = await request.formData();
  const productId = parseInt(formData.get("product_id"));
  const title = formData.get("title");
  const selected = formData.get("selected");
  const values = formData.getAll("values[]");
  const prices = formData.getAll("prices[]");
  const colorNames = formData.getAll("colorNames[]");
  const havePrice = formData.get("havePrice") === "true";

  const valuePricePairs = {};
  const colorSwatchPairs = {};

  if (selected === "colorSwatches") {
    // Process color swatches
    values.forEach((value, index) => {
      const colorNameList = colorNames[index].split(',');
      const valueList = value.split(',');
      valueList.forEach((val, i) => {
        colorSwatchPairs[colorNameList[i]] = val;
      });
    });
  } else {
    // Process other types of values
    values.forEach((value, index) => {
      const valueList = value.split(',');
      const priceList = prices[index].split(',').map(parseFloat);
      valueList.forEach((val, i) => {
        valuePricePairs[val] = havePrice ? (priceList[i] || null) : null;
      });
    });
  }

  const newVariant = {
    id: uuidv4(),
    title,
    selected,
    havePrice,
    values: selected === "colorSwatches" ? colorSwatchPairs : valuePricePairs,
  };

  const existMetafield = await admin.rest.resources.Metafield.all({
    session: session,
    product_id: productId,
  });

  let existValue = { productId, variants: [] };
  let metafieldId = null;

  for (const item of existMetafield.data) {
    if (item.namespace === "Kaswebtech") {
      existValue = JSON.parse(item.value); // Parse existing JSON value
      metafieldId = item.id;
      console.log("Existing Value is : ", existValue);
      break;
    }
  }

  // Add the new variant to the existing variants
  const mergedValue = {
    productId: productId,
    variants: [...existValue.variants, newVariant]
  };

  // Update metafield value with merged value
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

export default function Add_variantPage() {
  const [title, setTitle] = useState("");
  const [checked, setChecked] = useState(false);
  const [fields, setFields] = useState([{ value: "", price: "", color: { hue: 120, brightness: 1, saturation: 1 }, showColorPicker: false , colorName: "" }]);
  const submit = useSubmit();
  const data = useActionData();
  const navigate = useNavigate();
  const params = useParams();
  const productId = params["*"];
  const [selected, setSelected] = useState("");
  const options = [
    { label: "Select an option", value: "" },
    { label: "Drop Down", value: "dropdown" },
    { label: "Buttons", value: "button" },
    { label: "TextField", value: "TextField" },
    { label: "Color Swatches", value: "colorSwatches" },
    { label: "Check Box", value: "CheckBox" },
  ];

  const handleAddField = () => {
    setFields([...fields, { value: "", price: "", color: { hue: 120, brightness: 1, saturation: 1 }, showColorPicker: false }]);
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const toggleColorPicker = (index) => {
    const newFields = [...fields];
    newFields[index].showColorPicker = !newFields[index].showColorPicker;
    setFields(newFields);
  };
  
  const handleColorChange = (index, color) => {
    const newFields = [...fields];
    newFields[index].color = color;
    newFields[index].value = hslToHex(color.hue, color.saturation*100, color.brightness*100);
    newFields[index].rgbColor = hslToHex(color.hue, color.saturation*100, color.brightness*100);
    setFields(newFields);
  };
  
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formattedFields = fields.reduce((acc, field) => {
        const values = field.value.split(',').map(value => value.trim());
        const prices = field.price.split(',').map(price => parseFloat(price.trim()));
        values.forEach((value, index) => {
          if (!acc[value]) {
            acc[value] = 0; 
          }
          // Add the price for the current value
          acc[value] += prices[index] || 0; 
        });
        return acc;
      }, {});

      await submit(
        {
            product_id: productId,
            title,
            selected,
            havePrice: checked.toString(),
            "values[]": fields.map(field => field.value),
            "prices[]": selected !== "colorSwatches" ? Object.values(formattedFields) : [],
            "colorNames[]": selected === "colorSwatches" ? fields.map(field => field.colorName) : []
        },
        { replace: true, method: "POST" },
    );
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  useEffect(() => {
    if (data) {
      navigate(`/app/product/${productId}`);
    }
  }, [data, navigate, productId]);

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

        {selected && selected !== "TextField" && selected !== "colorSwatches" && selected !== "CheckBox" && (
          <Checkbox
            label="Values Have Price ?"
            checked={checked}
            onChange={setChecked}
          />
        )}

        {selected && selected !== "TextField" && (
          <>
            {fields.map((field, index) => (
              <div key={index} className="field-container">
                {selected === "colorSwatches" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center" }}>
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
                      <Button onClick={() => toggleColorPicker(index)}>Pick Color</Button>
                    </div>
                    <Popover
                      active={field.showColorPicker}
                      activator={
                        <div style={{ display: "none" }}></div>
                      }
                      onClose={() => toggleColorPicker(index)}
                    >
                      <ColorPicker
                        onChange={(color) => handleColorChange(index, color)}
                        color={field.color}
                      />
                    </Popover>
                    <TextField
                      label="Color Name"
                      type="text"
                      placeholder="Enter Color Name"
                      onChange={(value) => handleFieldChange(index, "colorName", value)}
                      value={field.colorName}
                    />
                  </>
                ) : selected === "CheckBox" ? (
                  <>
                    <TextField
                      label="Value"
                      type="text"
                      placeholder="Enter Check-Box Value"
                      onChange={(value) => handleFieldChange(index, "value", value)}
                      value={field.value}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Value"
                      type="text"
                      placeholder="Value"
                      onChange={(value) => handleFieldChange(index, "value", value)}
                      value={field.value}
                    />
                    {checked && (
                      <TextField
                        label="Price"
                        type="number"
                        placeholder="Price"
                        onChange={(value) => handleFieldChange(index, "price", value)}
                        value={field.price}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            <Button onClick={handleAddField}>+</Button>
          </>
        )}
        <Button submit>Create Metafield</Button>
      </Form>
    </div>
  );
}
