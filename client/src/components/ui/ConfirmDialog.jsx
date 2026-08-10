import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={isDestructive ? 'danger' : 'primary'}
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {isDestructive && (
          <div style={{ color: 'var(--color-danger-500)', marginTop: '0.25rem' }}>
            <AlertTriangle size={24} />
          </div>
        )}
        <p style={{ color: 'var(--color-gray-700)', margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
