"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import IconButton from "./ui/IconButton";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMount?: () => void;
  onUnmount?: () => void;
  isLoading?: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOutsideClick?: boolean;
};

const FADE_DURATION = 300;

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
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpenRef = useRef(false);
  const mountModal = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        if (unmountTimeoutRef.current) {
          clearTimeout(unmountTimeoutRef.current);
          unmountTimeoutRef.current = null;
        }
        setIsMounted(true);
        if (!wasOpenRef.current) {
          wasOpenRef.current = true;
          onMount?.();
        }
        return;
      }

      if (!wasOpenRef.current) return;

      wasOpenRef.current = false;
      setIsVisible(false);
      unmountTimeoutRef.current = setTimeout(() => {
        setIsMounted(false);
        unmountTimeoutRef.current = null;
        onUnmount?.();
      }, FADE_DURATION);
    },
    [onUnmount, onMount],
  );

  useEffect(() => {
    startTransition(() => mountModal(isOpen));
  }, [isOpen, mountModal]);

  useEffect(() => {
    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isMounted]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isMounted) return;
    document.body.dataset.modalOpen = "true";
    return () => {
      delete document.body.dataset.modalOpen;
    };
  }, [isMounted]);

  function handleOutsideClick() {
    if (closeOnOutsideClick) {
      onClose();
    }
  }

  if (!isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 opacity-0 transition-opacity data-visible:opacity-100"
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
      data-visible={isVisible || undefined}
      role="alert"
      aria-live="assertive"
      aria-labelledby={title}
      tabIndex={-1}
      onPointerDown={handleOutsideClick}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        data-loading={isLoading || undefined}
        className="max-md:w-[calc(100dvw-1rem)] md:min-w-md w-max max-w-2xl max-h-[calc(100dvh-1rem)] flex flex-col bg-surface-card border border-border rounded-lg shadow-lg overflow-hidden data-loading:opacity-0"
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      >
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <IconButton onClick={onClose} icon={faXmark} ariaLabel="Close" />
        </div>
        <div className="w-full px-4 py-4 overflow-y-auto grow min-h-0">
          {children}
        </div>
        {footer && (
          <div className="w-full flex justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
