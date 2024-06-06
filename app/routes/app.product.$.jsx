import {
  useActionData,
  useLoaderData,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { Button } from "@shopify/polaris";
import { loader as productLoader } from "./loaders/productByIdLoader";
export { productLoader as loader };
import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import "./Style/styles.css";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    const formData = await request.formData();
    const productId = parseInt(formData.get("product_id"));
    const variantId = formData.get("variant_id");
    const updatedJsonValue = deleteVariantFromMetafield(
      formData.get("json_value"),
      variantId,
    );

    const metafield = new admin.rest.resources.Metafield({ session: session });
    metafield.product_id = productId;
    metafield.id = formData.get("metafield_id");
    metafield.value = updatedJsonValue;
    await metafield.save({ update: true });

    return json({ success: true });
  } catch (error) {
    console.error("Error occurred:", error);
    return json({ success: false, message: "Failed to delete variant" });
  }
};

function deleteVariantFromMetafield(jsonValue, variantId) {
  const parsedValue = JSON.parse(jsonValue);
  const updatedVariants = parsedValue.variants.filter(
    (variant) => variant.id !== variantId,
  );
  parsedValue.variants = updatedVariants;
  return JSON.stringify(parsedValue);
}

export default function ProductPage() {
  const response = useLoaderData();
  const data = useActionData();
  const params = useParams();
  const productId = params["*"];
  const product = response.product;
  const metafields = response.metafield || [];
  console.log("metafield values are : ", metafields);
  const navigate = useNavigate();
  const submit = useSubmit();

  // Extracting virtual options from metafield
  const virtualOptions = metafields.value ? JSON.parse(metafields.value) : {};

  const handleDelete = async (variantId) => {
    try {
      await submit(
        {
          product_id: productId,
          variant_id: variantId,
          json_value: metafields.value,
          metafield_id: metafields.id,
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
    <div className="product-details-container">
      <div className="product-details-header">
        <h1 className="product-details-title">Product Details</h1>
      </div>
      <div className="product-info">
        <div className="product-info-item">
          <strong>Title:</strong> {product.title}
        </div>
        <div className="product-info-item">
          <strong>Description:</strong> {product.body_html}
        </div>
        <div className="product-info-item">
          <strong>Price:</strong>{" "}
          {product.variants && product.variants.length > 0
            ? product.variants[0].price
            : "N/A"}
        </div>
        <div className="product-info-item">
          <img
            className="product-image"
            src={product.image.src}
            alt={product.title}
          />
        </div>
      </div>

      <div className="options-section">
        {product.options && product.options.length > 0 ? (
          <>
          <h2 className="options-title">Options</h2>
          <ul className="options-list">
            {product.options.map((option) => (
              <li key={option.id} className="option-item">
                <div>
                  <strong>Option Name:</strong> {option.name}
                </div>
                <div>
                  <strong>Values:</strong> {option.values.join(", ")}
                </div>
              </li>
            ))}
          </ul>
          </>
        ) : ("")}
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Title</th>
              <th>Type</th>
              <th>Values</th>
              <th>Delete</th>
            </tr>
          </thead>
          {virtualOptions && virtualOptions.variants ? (
          <tbody>
          {virtualOptions.variants.map((variant, index) => (
            <tr key={variant.id}>
              <td>{index + 1}</td>
              <td>{variant.title}</td>
              <td>{variant.selected}</td>
              <td colSpan={variant.selected === "TextField" ? 2 : 1}>
                {variant.selected !== "TextField" && variant.values ? (
                  <ul>
                    {Object.entries(variant.values).map(([value, price]) => (
                      <li key={value}>
                        {value}: {price !== null ? `$${price.toFixed(2)}` : "N/A"}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </td>
              <td>
                <Button onClick={() => handleDelete(variant.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>        
        ) : (
          <tbody>
            <tr>
              <td colSpan="5">No virtual options available.</td>
            </tr>
          </tbody>
        )}
        </table>
      </div>

      {/* <div className="virtual-options-section">
        <h2 className="virtual-options-title">Virtual Options:</h2>
        {virtualOptions &&
        virtualOptions.variants &&
        virtualOptions.variants.length > 0 ? (
          <div className="virtual-options-container">
            {virtualOptions.variants.map((variant, index) => (
              <div key={variant.id} className="virtual-option-item">
                <div>
                  <strong>Title:</strong> {variant.title}
                </div>
                <div>
                  <strong>Type:</strong> {variant.selected}
                </div>
                {variant.selected !== "TextField" && (
                  <div>
                    <strong>Values:</strong> {variant.value}
                  </div>
                )}
                <Button onClick={() => handleDelete(variant.id)}>Delete</Button>
              </div>
            ))}
          </div>
        ) : (
          <p>No virtual options available from metafield.</p>
        )}
      </div> */}

      <Button
        primary
        className="add-variant-button"
        onClick={() => navigate(`/app/add_variant/${product.id}`)}
      >
        Add
      </Button>
    </div>
  );
}
