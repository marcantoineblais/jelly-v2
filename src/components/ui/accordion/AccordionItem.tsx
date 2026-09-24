"use client";

import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { startTransition, useEffect, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";

import {
  ParentItemOpenContext,
  useAccordionContext,
  useAccordionLevel,
} from "./Accordion";
import IconButton from "../IconButton";

type AccordionItemProps = {
  id: string;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  chevronSize?: "xs" | "sm";
  disableLabelClick?: boolean;
  hideChevron?: boolean;
  error?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function AccordionItem({
  id,
  header,
  children,
  className,
  headerClassName,
  chevronSize = "sm",
  hideChevron = false,
  disableLabelClick = false,
  error = false,
  ...props
}: AccordionItemProps) {
  const { isOpen, onToggle, contentOnly } = useAccordionContext();
  const accordionLevel = useAccordionLevel();
  const isItemOpen = isOpen(id);

  const [isRendered, setIsRendered] = useState(isItemOpen);

  function handleClick() {
    if (disableLabelClick) return;
    onToggle(id);
  }

  useEffect(() => {
    if (isItemOpen) {
      startTransition(() => setIsRendered(true));
      return;
    }

    const timeout = setTimeout(() => setIsRendered(false), 200);
    return () => clearTimeout(timeout);
  }, [isItemOpen]);

  if (contentOnly) return children;

  return (
    <ParentItemOpenContext.Provider value={isItemOpen}>
      <div
        data-disabled={disableLabelClick || undefined}
        data-main-accordion={accordionLevel === 1 || undefined}
        className={twMerge(
          "data-main-accordion:py-4 pl-2 rounded-md data-main-accordion:shadow-btn",
          className,
        )}
      >
        <div
          data-error={error || undefined}
          className={twMerge(
            "w-full flex items-center gap-2",
            "data-error:text-danger",
            headerClassName,
          )}
        >
          <div>
            {!hideChevron && (
              <IconButton
                icon={faChevronRight}
                ariaLabel="toggle"
                size={chevronSize}
                onClick={handleClick}
                data-open={isItemOpen || undefined}
                className={twJoin(
                  "transition-transform duration-200",
                  "data-open:rotate-90",
                )}
              />
            )}
          </div>
          <div
            className={twJoin(
              "pl-4 w-full flex items-center gap-2 cursor-pointer overflow-hidden",
              "group-data-disabled/accordion-item:cursor-default",
            )}
            onClick={handleClick}
          >
            {header}
          </div>
        </div>
        <div
          data-open={isItemOpen || undefined}
          className={twJoin(
            "grid grid-rows-[0fr] transition-[grid-template-rows] duration-200",
            "data-open:grid-rows-[1fr]",
          )}
        >
          <div className="overflow-hidden" {...props}>
            {isRendered && children}
          </div>
        </div>
      </div>
    </ParentItemOpenContext.Provider>
  );
}
