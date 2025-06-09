import { faEye, faPen, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const FileSelectionBox = ({ disabled = true }: { disabled?: boolean }) => {
  return (
    <div className="py-3 px-5 flex items-center justify-center gap-5 bg-gradient-to-b from-emerald-600/35 to-90% to-emerald-950/35 text-white shadow-md shadow-black/50 rounded-sm">
      <button
        type="button"
        title="Edit"
        className="border-2 border-white py-1.5 px-3 w-16 bg-neutral-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        disabled={disabled}
        >
        <FontAwesomeIcon icon={faPen} size="xl" />
      </button>
      <button
        type="button"
        title="Hide"
        className="border-2 border-white py-1.5 px-3 w-16 bg-amber-800 rounded-sm cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-default"
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faEye} size="xl" />
      </button>
      <button
        type="button"
        title="Save"
        className="border-2 border-white py-1.5 px-3 w-16 bg-sky-800 rounded-sm cursor-pointer duration-200"
      >
        <FontAwesomeIcon icon={faSave} size="xl" />
      </button>
    </div>
  );
};

export default FileSelectionBox;
