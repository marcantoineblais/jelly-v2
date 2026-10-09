"use client";

import { MediaFile } from "@/src/types/MediaFile";
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
import { getSelectionStats } from "@/src/libs/files/getSelectionStats";
import { fadeInUp, staggerDelay } from "@/src/libs/motion";
import LibrarySectionContent from "./LibrarySectionContent";
import CheckboxInput from "../ui/CheckboxInput";
import Collapse from "../ui/Collapse";

type LibrarySectionCardProps = {
  sectionKey: string;
  name: string;
  files: MediaFile[];
  index?: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
};

/** Collapsible card listing the files headed to one library. */
export default function LibrarySectionCard({
  sectionKey,
  name,
  files,
  index = 0,
  isOpen,
  onToggle,
  onSelect,
  onEditOne,
}: LibrarySectionCardProps) {
  const type = files[0]?.library.type;
  const {
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    errorCount,
    totalSize,
  } = getSelectionStats(files);
  const icon = type === "show" ? faTv : type === "movie" ? faFilm : faFolder;

  return (
    <motion.section
      layout="position"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ ...fadeInUp.transition, delay: staggerDelay(index, 0.05) }}
      className="card overflow-hidden"
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <CheckboxInput
          id={`section-${sectionKey}`}
          checked={isAllSelected}
          isIndeterminate={isPartiallySelected}
          onChange={(value) => onSelect(value, files)}
        />
        <button
          type="button"
          onClick={onToggle}
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
                <span className="text-primary-light">{` · ${selectedCount} selected`}</span>
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
            sectionKey={sectionKey}
            files={files}
            onSelect={onSelect}
            onEditOne={onEditOne}
          />
        </div>
      </Collapse>
    </motion.section>
  );
}
