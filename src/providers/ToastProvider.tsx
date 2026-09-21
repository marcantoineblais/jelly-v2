"use client";

import IconButton from "@/src/components/ui/IconButton";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  createContext,
  ReactNode,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { twJoin } from "tailwind-merge";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastOptions = {
  duration?: number;
};

type Toast = {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration: number;
  isExiting: boolean;
};

type ToastContextType = {
  show: (message: ReactNode, type?: ToastType, options?: ToastOptions) => void;
  success: (message: ReactNode, options?: ToastOptions) => void;
  error: (message: ReactNode, options?: ToastOptions) => void;
  info: (message: ReactNode, options?: ToastOptions) => void;
  warning: (message: ReactNode, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

type RenderToastParams = {
  toast: Toast;
  index: number;
  isCollapsed: boolean;
  isBuried: boolean;
};

const DEFAULT_DURATION = 5_000;
const EXIT_DURATION = 500;
const ToastContext = createContext<ToastContextType | null>(null);

const toastStyles: Record<
  ToastType,
  {
    icon: typeof faCircleCheck;
    iconClassName: string;
    cardClassName: string;
    backgroundColor: string;
  }
> = {
  success: {
    icon: faCircleCheck,
    iconClassName: "text-success",
    cardClassName: "border-success",
    backgroundColor:
      "color-mix(in srgb, var(--color-success) 10%, var(--color-surface-card))",
  },
  error: {
    icon: faCircleExclamation,
    iconClassName: "text-danger",
    cardClassName: "border-danger",
    backgroundColor:
      "color-mix(in srgb, var(--color-danger) 10%, var(--color-surface-card))",
  },
  info: {
    icon: faCircleInfo,
    iconClassName: "text-primary",
    cardClassName: "border-primary",
    backgroundColor:
      "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-card))",
  },
  warning: {
    icon: faTriangleExclamation,
    iconClassName: "text-warning",
    cardClassName: "border-warning",
    backgroundColor:
      "color-mix(in srgb, var(--color-warning) 10%, var(--color-surface-card))",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const exitTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const viewportRef = useRef<HTMLDivElement>(null);

  const activeToast = useMemo(() => toasts[0], [toasts]);

  useEffect(() => {
    startTransition(() => setIsMounted(true));
  }, []);

  const dismiss = useCallback((id: string) => {
    if (exitTimeouts.current.has(id)) return;

    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast,
      ),
    );
    exitTimeouts.current.set(
      id,
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        exitTimeouts.current.delete(id);
      }, EXIT_DURATION),
    );
  }, []);

  const dismissAll = useCallback(() => {
    exitTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
    exitTimeouts.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    (
      message: ReactNode,
      type: ToastType = "info",
      options: ToastOptions = {},
    ) => {
      const toast = {
        id: crypto.randomUUID(),
        message,
        type,
        duration: options.duration ?? DEFAULT_DURATION,
        isExiting: false,
      };
      setToasts((current) => [...current, toast]);
    },
    [],
  );

  const success = useCallback(
    (message: ReactNode, options?: ToastOptions) =>
      show(message, "success", options),
    [show],
  );
  const error = useCallback(
    (message: ReactNode, options?: ToastOptions) =>
      show(message, "error", options),
    [show],
  );
  const info = useCallback(
    (message: ReactNode, options?: ToastOptions) =>
      show(message, "info", options),
    [show],
  );
  const warning = useCallback(
    (message: ReactNode, options?: ToastOptions) =>
      show(message, "warning", options),
    [show],
  );

  useEffect(() => {
    if (
      isHovered ||
      !activeToast ||
      activeToast.isExiting ||
      activeToast.duration <= 0
    ) {
      return;
    }

    const timeoutId = setTimeout(
      () => dismiss(activeToast.id),
      activeToast.duration,
    );
    return () => clearTimeout(timeoutId);
  }, [activeToast, dismiss, isHovered]);

  useEffect(
    () => () => {
      exitTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
    },
    [],
  );

  useEffect(() => {
    if (toasts.length < 2) {
      startTransition(() => setIsExpanded(false));
    }
  }, [toasts.length]);

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!viewportRef.current?.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded]);

  function handleToastClick() {
    setIsExpanded(true);
  }

  function handleToastDismiss(e: React.MouseEvent, toastId: string) {
    e.stopPropagation();
    dismiss(toastId);
  }

  function renderToast({
    toast,
    index,
    isCollapsed,
    isBuried,
  }: RenderToastParams) {
    const style = toastStyles[toast.type];

    return (
      <div
        key={toast.id}
        className={twJoin(
          "flex items-start gap-3 px-4 py-3",
          "cursor-pointer rounded-lg border bg-surface-card shadow-lg",
          style.cardClassName,
          "opacity-100 transition-opacity duration-500",
          "data-[collapsed=true]:-mt-12 data-[collapsed=true]:opacity-90",
          "data-[buried=true]:pointer-events-none data-[buried=true]:absolute data-[buried=true]:inset-x-0 data-[buried=true]:top-0",
          "data-[exiting=true]:opacity-0",
        )}
        data-buried={isBuried || undefined}
        data-collapsed={isCollapsed || undefined}
        data-exiting={toast.isExiting || undefined}
        style={{
          zIndex: toasts.length - index,
          backgroundColor: style.backgroundColor,
        }}
        onClick={handleToastClick}
      >
        <FontAwesomeIcon
          icon={style.icon}
          className={twJoin("mt-0.5 size-4 shrink-0", style.iconClassName)}
        />
        <div className="min-w-0 flex-1 text-sm text-text">{toast.message}</div>
        <IconButton
          icon={faXmark}
          ariaLabel={"Dismiss"}
          onClick={(e) => handleToastDismiss(e, toast.id)}
        />
      </div>
    );
  }

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, dismiss, dismissAll }}
    >
      {children}
      {isMounted &&
        createPortal(
          <div
            ref={viewportRef}
            className="fixed top-4 right-4 z-60 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
            aria-live="polite"
            aria-relevant="additions"
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          >
            {toasts.slice(0, 2).map((toast, index) =>
              renderToast({
                toast,
                index,
                isCollapsed: !isExpanded && index > 0,
                isBuried: false,
              }),
            )}
            {toasts.length > 2 && (
              <div
                className={twJoin(
                  "relative flex flex-col gap-2",
                  "data-[expanded=false]:-mt-12 data-[expanded=false]:cursor-pointer",
                )}
                data-expanded={isExpanded}
                onClick={() => setIsExpanded(true)}
              >
                {toasts.slice(2).map((toast, index) =>
                  renderToast({
                    toast,
                    index: index + 2,
                    isCollapsed: false,
                    isBuried: !isExpanded && index > 0,
                  }),
                )}
              </div>
            )}
            {!isExpanded && toasts.length > 1 && (
              <button
                type="button"
                className="self-end text-xs text-text-muted hover:text-text"
                onClick={() => setIsExpanded(true)}
              >
                {`${toasts.length} more`}
              </button>
            )}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
