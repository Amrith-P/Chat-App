import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'warning',
    onConfirm: null
  });

  const confirm = useCallback(({ title, message, confirmText = 'Confirm', type = 'warning', onConfirm }) => {
    setModalConfig({ title, message, confirmText, type, onConfirm });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    setIsOpen(false);
  }, [modalConfig]);

  return {
    isOpen,
    title: modalConfig.title,
    message: modalConfig.message,
    confirmText: modalConfig.confirmText,
    type: modalConfig.type,
    confirm,
    close,
    handleConfirm
  };
};

export default useConfirm;
