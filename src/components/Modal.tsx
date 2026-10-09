"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/src/libs/motion";

import IconButton from "./ui/IconButton";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMount?: () => void;
  /** Called once the closing animation has finished. */
  onUnmount?: () => void;
  isLoading?: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOutsideClick?: boolean;
};

const DURATION = 0.3;

// Portals need `document`, which only exists after hydration.
const subscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export default function Modal({
  isOpen,
  onClose,
  onMount,
  onUnmount,
  title,
  children,
  footer,
  closeOnOutsideClick = false,
  isLoading = false,
}: ModalProps) {
  const isClient = useIsClient();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) onMount?.();
    wasOpenRef.current = isOpen;
  }, [isOpen, onMount]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.dataset.modalOpen = "true";
    return () => {
      document.removeEventListener("keydown", handler);
      delete document.body.dataset.modalOpen;
    };
  }, [isOpen, onClose]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onUnmount}>
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onPointerDown={() => closeOnOutsideClick && onClose()}
        >
          <motion.div
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.97 }}
            transition={{ duration: DURATION, ease: EASE_OUT }}
            onPointerDown={(e) => e.stopPropagation()}
            data-loading={isLoading || undefined}
            className="max-md:w-full md:min-w-md w-max max-w-2xl max-h-[calc(100dvh-1rem)] flex flex-col bg-surface-card border border-border-strong rounded-2xl shadow-2xl shadow-black/70 overflow-hidden data-loading:opacity-0"
          >
            <div className="w-full flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <h2 className="text-base font-semibold text-text">{title}</h2>
              <IconButton
                onClick={onClose}
                icon={faXmark}
                ariaLabel="Close"
                className="size-8 rounded-full flex items-center justify-center hover:bg-surface-hover"
              />
            </div>
            <div className="w-full px-5 pb-4 pt-1 overflow-y-auto grow min-h-0">
              {children}
            </div>
            {footer && (
              <div className="w-full flex justify-end gap-2 px-5 py-3.5 border-t border-border bg-surface/40 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
