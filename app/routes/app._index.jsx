import {
  Text,
} from "@shopify/polaris";

// ==========================example of action and loader function======================
// export const loader = async ({ request }) => {
//   await authenticate.admin(request);

//   return null;
// };

// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   const color = ["Red", "Orange", "Yellow", "Green"][
//     Math.floor(Math.random() * 4)
//   ];
//   const response = await admin.graphql(
//     `#graphql
//       mutation populateProduct($input: ProductInput!) {
//         productCreate(input: $input) {
//           product {
//             id
//             title
//             handle
//             status
//             variants(first: 10) {
//               edges {
//                 node {
//                   id
//                   price
//                   barcode
//                   createdAt
//                 }
//               }
//             }
//           }
//         }
//       }`,
//     {
//       variables: {
//         input: {
//           title: `${color} Snowboard`,
//         },
//       },
//     },
//   );
//   const responseJson = await response.json();
//   const variantId =
//     responseJson.data.productCreate.product.variants.edges[0].node.id;
//   const variantResponse = await admin.graphql(
//     `#graphql
//       mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
//         productVariantUpdate(input: $input) {
//           productVariant {
//             id
//             price
//             barcode
//             createdAt
//           }
//         }
//       }`,
//     {
//       variables: {
//         input: {
//           id: variantId,
//           price: Math.random() * 100,
//         },
//       },
//     },
//   );
//   const variantResponseJson = await variantResponse.json();

//   return json({
//     product: responseJson.data.productCreate.product,
//     variant: variantResponseJson.data.productVariantUpdate.productVariant,
//   });
// };

export default function Index() {
  return (
    <Text variant="headingMd" as="h1" alignment="center">🚧 Main Page is Under Construction 🚧</Text>
  );
}
