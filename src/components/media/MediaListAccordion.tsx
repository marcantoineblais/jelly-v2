"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { SortedMedia } from "@/src/types/SortedMedia";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faFilm,
  faFolder,
  faTv,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { twJoin } from "tailwind-merge";
import { formatDataSize } from "@/src/libs/format-data-size";
import LibrarySectionContent from "./LibrarySectionContent";
import CheckboxInput from "../ui/CheckboxInput";
import Collapse from "../ui/Collapse";

interface MediaListAccordionProps {
  sections: SortedMedia;
  openSections: Set<string>;
  onToggleSection: (key: string) => void;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
  keyPrefix?: string;
}

/** List of library cards (one per library), each collapsible. */
export default function MediaListAccordion({
  sections,
  openSections,
  onToggleSection,
  onSelect,
  onEditOne,
  keyPrefix = "",
}: MediaListAccordionProps) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([name, files], index) => {
        const key = `${keyPrefix}${name || "not-set"}`;
        const isOpen = openSections.has(key);
        const type = files[0]?.library.type;
        const selectedCount = files.filter((f) => f.isSelected).length;
        const allSelected = files.length > 0 && selectedCount === files.length;
        const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
        const errorCount = files.filter(
          (f) => (f.errors?.length ?? 0) > 0,
        ).length;
        const icon =
          type === "show" ? faTv : type === "movie" ? faFilm : faFolder;

        return (
          <motion.section
            key={key}
            layout="position"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="card overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3">
              <CheckboxInput
                id={`section-${key}`}
                checked={allSelected}
                isIndeterminate={selectedCount > 0 && !allSelected}
                onChange={(value) => onSelect(value, files)}
              />
              <button
                type="button"
                onClick={() => onToggleSection(key)}
                aria-expanded={isOpen}
                className="min-w-0 grow flex items-center gap-3 text-left cursor-pointer group"
              >
                <span
                  className={twJoin(
                    "size-9 shrink-0 rounded-xl flex items-center justify-center ring-1 ring-inset",
                    type === "show"
                      ? "bg-info/10 text-info ring-info/20"
                      : "bg-primary/10 text-primary ring-primary/20",
                  )}
                >
                  <FontAwesomeIcon icon={icon} className="text-sm" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate font-semibold text-text">
                    {name || "Not set"}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {files.length} file{files.length > 1 ? "s" : ""}
                    {totalSize > 0 && ` · ${formatDataSize(totalSize)}`}
                    {selectedCount > 0 && (
                      <span className="text-primary-light">
                        {` · ${selectedCount} selected`}
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-danger-light">
                        {` · ${errorCount} need${errorCount > 1 ? "" : "s"} info`}
                      </span>
                    )}
                  </span>
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={twJoin(
                    "shrink-0 text-sm text-text-muted transition-transform duration-300 group-hover:text-text",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </header>

            <Collapse isOpen={isOpen}>
              <div className="px-2 pb-2 pt-1 border-t border-border/60">
                <LibrarySectionContent
                  sectionKey={key}
                  files={files}
                  onSelect={onSelect}
                  onEditOne={onEditOne}
                />
              </div>
            </Collapse>
          </motion.section>
        );
      })}
    </div>
  );
}
