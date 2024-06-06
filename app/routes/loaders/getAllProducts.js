// productsLoader.js

import { json } from "@remix-run/node";
import shopify from "../../shopify.server";

export async function loader({ request }) {
  const { admin, session } = await shopify.authenticate.admin(request);
  const data = await admin.rest.resources.Product.all({ session, limit: 200 });

  return json(data);
}
