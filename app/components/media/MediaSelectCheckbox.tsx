import { MediaFile } from "@/app/types/MediaFile";
import { Checkbox } from "@heroui/react";
import { useEffect, useState } from "react";

const MediaSelectCheckbox = ({
  file,
  label = "",
  selected = false,
}: {
  file: MediaFile;
  label?: string;
  selected?: boolean;
}) => {
  const [isSelected, setIsSelected] = useState<boolean>(
    file.isSelected ?? false
  );

  useEffect(() => {
    file.isSelected = isSelected;
  }, [isSelected, file]);

  useEffect(() => {
    setIsSelected(file.isSelected ?? false);
  }, [file]);

  return (
    <div className="flex gap-3 items-center">
      <Checkbox isSelected={isSelected} onValueChange={setIsSelected} />
      <span>{label}</span>
    </div>
  );
};

export default MediaSelectCheckbox;
