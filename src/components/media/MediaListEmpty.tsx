"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInbox,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import Spinner from "../ui/Spinner";

interface MediaListEmptyProps {
  title?: string;
  message?: string;
  isLoading?: boolean;
  icon?: IconDefinition;
  action?: ReactNode;
}

export default function MediaListEmpty({
  isLoading = false,
  title = "Nothing to show",
  message = "Add some content and come back later.",
  icon = faInbox,
  action,
}: MediaListEmptyProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 py-12 px-6 text-center animate-fade-in-up">
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
            <div className="relative size-16 rounded-2xl bg-surface-elevated border border-border-strong flex items-center justify-center shadow-card">
              <FontAwesomeIcon icon={icon} className="text-2xl text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <p className="mt-1 text-sm text-text-muted max-w-xs">{message}</p>
          </div>
          {action}
        </>
      )}
    </div>
  );
}
