"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";

type ModalContextType = {
  subscribe: (id: string, onClose: () => void) => void;
  unsubscribe: (id: string) => void;
  handleNewModalOpen: (id: string) => void;
};

type Subscription = Map<string, () => void>;

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const subscriptionRef = useRef<Subscription>(new Map());
  const subscribe = useCallback((id: string, onClose: () => void) => {
    subscriptionRef.current.set(id, onClose);
  }, []);

  const unsubscribe = useCallback((id: string) => {
    subscriptionRef.current.delete(id);
  }, []);

  const handleNewModalOpen = useCallback((id: string) => {
    subscriptionRef.current.forEach((onClose, key) => {
      if (key !== id) {
        if (onClose) {
          onClose();
        }
      }
    });
  }, []);

  return (
    <ModalContext.Provider
      value={{
        subscribe,
        unsubscribe,
        handleNewModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModalSubscription() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalSubscription must be used within a ModalProvider");
  }
  return context;
}
