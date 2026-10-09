"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import { fadeTransition } from "@/src/libs/motion";
import Button from "../ui/Button";

/** Warns about files missing info, with a shortcut to select them. */
export default function IncompleteFilesBanner({
  count,
  onSelect,
}: {
  count: number;
  onSelect: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.div
          key="incomplete-files"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={fadeTransition}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-warning shrink-0"
            />
            <p className="grow text-sm text-text-secondary">
              <span className="font-semibold text-text">
                {count} file{count > 1 ? "s" : ""}
              </span>{" "}
              need{count > 1 ? "" : "s"} more info before transferring.
            </p>
            <Button
              size="small"
              color="default"
              onClick={onSelect}
              className="shrink-0"
            >
              Select
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
