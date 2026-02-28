import {
  faAdd,
  faArrowRightFromBracket,
  faPen,
  faRemove,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FileSelectionBox({
  onEdit = () => {},
  onDelete = () => {},
  onRestore = () => {},
  onSave = () => {},
  editDisabled = true,
  deleteDisabled = true,
  restoreDisabled = true,
  saveDisabled = true,
  binSelected = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onSave?: () => void;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  restoreDisabled?: boolean;
  saveDisabled?: boolean;
  binSelected?: boolean;
}) {
  return (
    <div className="py-3 px-5 flex items-center justify-center gap-5 bg-linear-to-b from-emerald-600/35 to-90% to-emerald-950/35 text-white shadow-md shadow-black/50 rounded-sm">
      <button
        type="button"
        title="Edit files"
        className="border-2 border-white py-1.5 px-3 w-16 bg-neutral-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        disabled={binSelected || editDisabled}
        onClick={onEdit}
      >
        <FontAwesomeIcon icon={faPen} size="xl" />
      </button>

      {binSelected ? (
        <button
          type="button"
          title="Restore files"
          className="border-2 border-white py-1.5 px-3 w-16 bg-amber-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
          disabled={restoreDisabled}
          onClick={onRestore}
        >
          <FontAwesomeIcon icon={faAdd} size="xl" />
        </button>
      ) : (
        <button
          type="button"
          title="Ignore files"
          className="border-2 border-white py-1.5 px-3 w-16 bg-amber-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          <FontAwesomeIcon icon={faRemove} size="xl" />
        </button>
      )}

      <button
        type="button"
        title="Move files"
        className="border-2 border-white py-1.5 px-3 w-16 bg-sky-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        onClick={onSave}
        disabled={saveDisabled}
      >
        <FontAwesomeIcon icon={faArrowRightFromBracket} size="xl" />
      </button>
    </div>
  );
}
