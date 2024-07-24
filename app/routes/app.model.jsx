import { useState, useCallback } from 'react';
import { AppProvider, Button, Modal, Card } from '@shopify/polaris';
import UploadPage from './app.upload';

export default function ModelPage() {
  const [active, setActive] = useState(false);

  const handleChange = useCallback(() => setActive(!active), [active]);

  return (
    <AppProvider>
      <Button onClick={handleChange}>Click</Button>
      <UploadPage/>
      <Modal
        open={active}
        onClose={handleChange}
        title="Modal title"
        primaryAction={{
          content: 'Primary action',
          onAction: handleChange,
        }}
        secondaryActions={[
          {
            content: 'Secondary action',
            onAction: handleChange,
          },
        ]}
      >
        <Modal.Section>
          <Card>
            <p>
              <UploadPage/>
            </p>
          </Card>
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}
