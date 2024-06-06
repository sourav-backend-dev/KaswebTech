import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import shopify from "../../shopify.server";

export async function loader({ params, request }) {
  const { admin, session } = await shopify.authenticate.admin(request);
  const productId = params["*"];
  console.log(productId.id);

  const product = await admin.rest.resources.Product.find({
    session,
    id: productId,
  });


  const existMetafield = await admin.rest.resources.Metafield.all({
    session: session,
    product_id: productId,
  });
  const dataArray = existMetafield.data;

  for (const metafield of dataArray) {
    if (metafield.namespace === "Kaswebtech") {
      const response = {
        product,
        metafield,
      };
      return json(response);
    }
  }
  const response = {
    product,
  };
  return json(response);
}