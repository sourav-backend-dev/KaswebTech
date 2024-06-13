import { useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/react";

export const action = async ({ request }) => {
    console.log("------------hit app proxy-------------");
    const { admin, session } = await authenticate.public.appProxy(request);
    const cartData = await request.json();
    console.log("Received cart data:", cartData);

    const draft_order = new admin.rest.resources.DraftOrder({ session });
    const lineItems = [];

    for (const item of cartData.items) {
        const lineItem = {
            variant_id: item.variant_id,
            quantity: item.quantity
        };

        lineItems.push(lineItem);

        if (Object.keys(item.properties).length > 0) {
            const addOnProduct = {
                title: item.title + " Add-On",
                price: item.properties.price,
                quantity: 1,
                properties: []
            };

            for (const property in item.properties) {
                if (property !== "price") {
                    addOnProduct.properties.push({
                        name: property,
                        value: item.properties[property]
                    });
                }
            }

            lineItems.push(addOnProduct);
        }
    }

    draft_order.line_items = lineItems;
    await draft_order.save({ update: true });
    
    const invoiceUrl = draft_order.invoice_url;
    console.log("Invoice URL:", invoiceUrl);
    
    return new Response(JSON.stringify({ invoiceUrl }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
