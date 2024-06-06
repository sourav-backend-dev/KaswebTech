import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { Button, TextField, Form, Select,Checkbox, Icon } from "@shopify/polaris";
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
  const havePrice = formData.get("havePrice") === "true";
  const valuePricePairs = {};
  values.forEach((value, index) => {
    const valueList = value.split(',');
    const priceList = prices[index].split(',').map(parseFloat); 
    valueList.forEach((val, i) => {
      valuePricePairs[val] = havePrice ? (priceList[i] || null) : null;
    });
  });
  const newVariant = {
    id: uuidv4(),
    title,
    selected,
    havePrice,
    values: valuePricePairs,
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
  const [fields, setFields] = useState([{ value: "", price: "" }]);
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
  ];

  const handleAddField = () => {
    setFields([...fields, { value: "", price: "" }]);
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = fields.slice();
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formattedFields = fields.reduce((acc, field) => {
        const values = field.value.split(',').map(value => value.trim());
        const prices = field.price.split(',').map(price => parseFloat(price.trim()));
        values.forEach((value, index) => {
          if (!acc[value]) {
            acc[value] = 0; // initialize with 0
          }
          // Add the price for the current value
          acc[value] += prices[index] || 0; // Add 0 if price is undefined
        });
        return acc;
      }, {});
  
      await submit(
        {
          product_id: productId,
          title,
          selected,
          havePrice: checked.toString(),
          "values[]": Object.keys(formattedFields),
          // Convert the formattedFields object into an array of prices
          "prices[]": Object.values(formattedFields),
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
        {selected && selected !== "TextField" && (
          <>
            <Checkbox
              label="Values Have Price ?"
              checked={checked}
              onChange={setChecked}
            />
            {fields.map((field, index) => (
              <div key={index} className="field-container">
                <TextField
                  label="Value"
                  type="text"
                  placeholder="Value"
                  onChange={(value) => handleFieldChange(index, "value", value)}
                  value={field.value}
                />
                {checked && selected !== "TextField" && (
                  <TextField
                    label="Price"
                    type="number"
                    placeholder="Price"
                    onChange={(value) => handleFieldChange(index, "price", value)}
                    value={field.price}
                  />
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
