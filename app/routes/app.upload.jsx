import { Form, useActionData } from "@remix-run/react";
import { DropZone, BlockStack, Thumbnail, Text } from '@shopify/polaris';
import { UploadIcon } from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';

export default function UploadPage() {
    const actionData = useActionData();
    const [files, setFiles] = useState([]);

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) =>
            setFiles((files) => [...files, ...acceptedFiles]),
        []
    );

    const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
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

    const handleSubmit = (event) => {
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

    return (
        <div>
            <div style={{width: 40, height: 40}}>
                <DropZone onDrop={handleDropZoneDrop}>
                    {uploadedFiles}
                    {fileUpload}
                </DropZone>
            </div>
            <h1>Upload a File</h1>
            <Form onSubmit={handleSubmit}>
                <button type="submit">Upload</button>
            </Form>

            {actionData?.fileName && (
                <p>Uploaded file: {actionData.fileName}</p>
            )}
        </div>
    );
}
