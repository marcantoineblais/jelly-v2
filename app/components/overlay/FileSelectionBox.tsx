import {
  faPen,
  faSave,
  faTrash,
  faTrashRestore,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FileSelectionBox({
  onEdit = () => {},
  onDelete = () => {},
  onRestore = () => {},
  onSave = () => {},
  disabled = true,
  saveInProgress = false,
  showBin = true,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onSave?: () => void;
  disabled?: boolean;
  saveInProgress?: boolean;
  showBin?: boolean;
}) {
  return (
    <div className="py-3 px-5 flex items-center justify-center gap-5 bg-linear-to-b from-emerald-600/35 to-90% to-emerald-950/35 text-white shadow-md shadow-black/50 rounded-sm">
      <button
        type="button"
        title="Edit"
        className="border-2 border-white py-1.5 px-3 w-16 bg-neutral-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        disabled={!showBin || disabled}
        onClick={onEdit}
      >
        <FontAwesomeIcon icon={faPen} size="xl" />
      </button>

      {showBin ? (
        <button
          type="button"
          title="Delete"
          className="border-2 border-white py-1.5 px-3 w-16 bg-amber-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
          disabled={disabled}
          onClick={onDelete}
        >
          <FontAwesomeIcon icon={faTrash} size="xl" />
        </button>
      ) : (
        <button
          type="button"
          title="Restore"
          className="border-2 border-white py-1.5 px-3 w-16 bg-amber-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
          disabled={disabled}
          onClick={onRestore}
        >
          <FontAwesomeIcon icon={faTrashRestore} size="xl" />
        </button>
      )}

      <button
        type="button"
        title="Save"
        className="border-2 border-white py-1.5 px-3 w-16 bg-sky-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        onClick={onSave}
        disabled={saveInProgress}
      >
        <FontAwesomeIcon icon={faSave} size="xl" />
      </button>
    </div>
  );
}
