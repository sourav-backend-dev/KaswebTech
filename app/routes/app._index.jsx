import {
  Text,
} from "@shopify/polaris";
import React from 'react';
// import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";
// ==========================example of action and loader function======================
// export const loader = async ({ request }) => {
  
// };

// export const action = async ({ request }) => {
//   const { admin, redirect } = await authenticate.admin(request);
//   redirect('some/where');
// };

export default function Index() {
  const data = useLoaderData();
  console.log(data);
  // const { shopOrigin, host } = this.props;
  // const config = { apiKey: API_KEY, shopOrigin, host, forceRedirect: true };
  
  // const app = createApp(config);
  // const redirect = Redirect.create(app);
  //   const handleButtonClick = () => {
  //     redirect.dispatch(Redirect.Action.REMOTE, 'http://google.com');
  //   };
  return (
      <Text variant="headingMd" as="h1" alignment="center">🚧 Main Page is Under Construction 🚧</Text>
  );
}
