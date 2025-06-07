import { MediaFile } from "@/app/types/MediaFile";
import { Checkbox } from "@heroui/react";
import { useEffect, useState } from "react";

const SeasonSelectCheckbox = ({
  files,
  label = "",
}: {
  files: MediaFile[];
  label?: string;
}) => {
  const [isSelected, setIsSelected] = useState<boolean>(
    files.every((file) => file.isSelected)
  );
  const [isIndeterminate, setIsIndeterminate] = useState<boolean>(
    files.some((file) => file.isSelected)
  );

  useEffect(() => {
    if (isIndeterminate) return;

    files.forEach((file) => (file.isSelected = isSelected));
  }, [isSelected, isIndeterminate, files]);

  useEffect(() => {
    if (files.every((file) => file.isSelected)) {
      setIsSelected(true);
      setIsIndeterminate(false);
    } else if (files.some((file) => file.isSelected)) {
      setIsIndeterminate(true);
      setIsSelected(false);
    } else {
      setIsIndeterminate(false);
      setIsSelected(false);
    }
  }, [files]);

  function handleChange(value: boolean) {
    setIsIndeterminate(false)
    setIsSelected(value);
  }

  return (
    <div className="flex gap-3 items-center">
      <Checkbox
        isSelected={isSelected}
        onValueChange={handleChange}
        isIndeterminate={isIndeterminate}
      />
      <span>{label}</span>
    </div>
  );
};

export default SeasonSelectCheckbox;
