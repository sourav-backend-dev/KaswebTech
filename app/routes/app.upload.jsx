import {
    unstable_composeUploadHandlers,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData,
    unstable_createFileUploadHandler,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const standardFileUploadHandler = unstable_createFileUploadHandler({
    directory: "app/Img",
});
export const fileUploadHandler = (args) => {
    return standardFileUploadHandler(args);
};

export async function action({ request }) {
    const uploadHandler = unstable_composeUploadHandlers(
        async ({ name, contentType, data, filename }) => {
            const uploadedImage = await fileUploadHandler({
                name,
                data,
                filename,
                contentType,
            });
            return uploadedImage;
        },
        unstable_createMemoryUploadHandler()
    );
    const formData = await unstable_parseMultipartFormData(
        request,
        uploadHandler
    );

    const fields = {};
    for (const [name, value] of formData.entries()) {
        fields[name] = value;
    }

    const fileName = fields.file?.name;

    const { admin } = await authenticate.admin(request);
   
    const response = await admin.graphql(
    `#graphql
    mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
        files {
            id
        }
        }
    }`,
    {
        variables: {
        "files": {
            "alt": "fallback text for an image",
            "contentType": "IMAGE",
            "originalSource": `${process.env.SHOPIFY_APP_URL}/app/Img/${fileName}`
        }
        },
    },
    );
    const data = await response.json();
    return data.data.fileCreate.files[0].id;
}

export default function UploadPage() {
    const actionData = useActionData();
    console.log(actionData);
    return (
        <div>
            <h1>Upload a File</h1>
            <Form method="post" encType="multipart/form-data">
                <input type="file" name="file" />
                <button type="submit">Upload</button>
            </Form>

            {actionData?.fileName && (
                <p>Uploaded file: {actionData.fileName}</p>
            )}
        </div>
    );
}