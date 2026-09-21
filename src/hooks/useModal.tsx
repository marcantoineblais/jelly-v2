import { useCallback, useEffect, useId, useState } from "react";

import { useModalSubscription } from "../providers/ModalProvider";

export default function useModal() {
  const modalId = useId();
  const { handleNewModalOpen, subscribe, unsubscribe } = useModalSubscription();
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    handleNewModalOpen(modalId);
    setIsOpen(true);
  }, [handleNewModalOpen, modalId]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    subscribe(modalId, onClose);
    return () => {
      unsubscribe(modalId);
    };
  }, [subscribe, unsubscribe, modalId, onClose]);
  return { isOpen, onOpen, onClose };
}
