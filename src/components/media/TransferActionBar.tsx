"use client";

import {
  faArrowRightFromBracket,
  faBan,
  faCheckDouble,
  faPen,
  faRotateLeft,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { quickTransition, springTransition } from "@/src/libs/motion";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";

type TransferActionBarProps = {
  selectedCount: number;
  /** Number of files that a transfer would move. */
  transferCount: number;
  isBinView: boolean;
  onEdit: () => void;
  onIgnore: () => void;
  onRestore: () => void;
  onTransfer: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  isTransferDisabled?: boolean;
  isTransferring?: boolean;
};

/** Sticky action bar of the Transfers page. */
export default function TransferActionBar({
  selectedCount,
  transferCount,
  isBinView,
  onEdit,
  onIgnore,
  onRestore,
  onTransfer,
  onClearSelection,
  onSelectAll,
  isTransferDisabled = false,
  isTransferring = false,
}: TransferActionBarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      className="glass rounded-2xl border border-border-strong shadow-2xl shadow-black/60 p-2 pl-3 flex items-center gap-2"
    >
      <div className="min-w-0 grow flex items-center gap-2 h-10">
        <AnimatePresence mode="wait" initial={false}>
          {hasSelection ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={quickTransition}
              className="flex items-center gap-2 min-w-0"
            >
              <IconButton
                icon={faXmark}
                ariaLabel="Clear selection"
                onClick={onClearSelection}
                className="size-8 shrink-0 rounded-lg flex items-center justify-center bg-white/5 hover:bg-surface-hover"
              />
              <span className="text-sm font-semibold text-text whitespace-nowrap tabular-nums">
                {selectedCount}
                <span className="font-normal text-text-muted"> selected</span>
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={quickTransition}
              onClick={onSelectAll}
              className="flex items-center gap-2 min-w-0 text-sm text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              <FontAwesomeIcon icon={faCheckDouble} className="text-xs" />
              <span className="truncate">Select all</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {hasSelection && (
          <motion.div
            key="selection-actions"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={quickTransition}
            className="flex items-center gap-2"
          >
            {!isBinView && (
              <Button
                color="default"
                onClick={onEdit}
                title="Edit selected files"
                className="px-3 min-w-0"
              >
                <FontAwesomeIcon icon={faPen} className="text-xs" />
                <span className="max-sm:hidden">Edit</span>
              </Button>
            )}
            {isBinView ? (
              <Button
                color="default"
                onClick={onRestore}
                title="Restore selected files"
                className="px-3 min-w-0"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                <span>Restore</span>
              </Button>
            ) : (
              <Button
                color="default"
                onClick={onIgnore}
                title="Move selected files to the bin"
                className="px-3 min-w-0 hover:text-warning"
              >
                <FontAwesomeIcon icon={faBan} className="text-xs" />
                <span className="max-sm:hidden">Ignore</span>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isBinView && (
        <Button
          color="primary"
          onClick={onTransfer}
          isDisabled={isTransferDisabled}
          isLoading={isTransferring}
          title="Move all files to their library"
          className="px-4"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
          <span>Transfer</span>
          {transferCount > 0 && (
            <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-black/20 text-[11px] leading-5 tabular-nums">
              {transferCount}
            </span>
          )}
        </Button>
      )}
    </motion.div>
  );
}
