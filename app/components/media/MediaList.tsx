"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import { ChangeEvent, JSX, useEffect, useState } from "react";
import H2 from "../elements/H2";
import { Accordion, AccordionItem } from "@heroui/react";
import MediaShow from "./MediaShow";
import sortMediaFiles from "@/app/libs/files/sortMediaFiles";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";
import FileSelectionBox from "../overlay/FileSelectionBox";
import H3 from "../elements/H3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { MediaLibrary } from "@/app/types/MediaLibrary";
import { library } from "@fortawesome/fontawesome-svg-core";

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>({});
  const [unknownFiles, setUnknownFiles] = useState<SortedMedia>({});
  const [binnedFiles, setBinnedFiles] = useState<SortedMedia>({});
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [showBin, setShowBin] = useState<boolean>(true);

  useEffect(() => {
    setSortedFiles(sortFiles(files));
  }, [files]);

  function sortFiles(files: MediaFile[], binned: boolean = false) {
    const names: string[] = libraries
      .map((library) => library.name)
      .filter((name) => typeof name === "string");

    const sortedFiles: SortedMedia = {};

    names.forEach((name) => {
      const content = files
        .filter(
          (file) =>
            (file.isIgnored ?? false) === binned && file.library.name === name
        )
        .sort(sortMediaFiles);

      sortedFiles[name] = content;
    });

    Object.entries(sortedFiles).forEach(([key, value]) => {
      if (value.length === 0) {
        delete sortedFiles[key];
      }
    })

    return sortedFiles;
  }

  function createShowsNodes(files: MediaFile[]) {
    const uniqueTitles = new Set<string>();

    files.forEach((file) => uniqueTitles.add(file.mediaInfo.title || ""));

    return Array.from(uniqueTitles).map((title, i) => {
      const showFiles = files.filter((file) => file.mediaInfo.title === title);

      return (
        <AccordionItem
          key={i}
          textValue={title}
          title={
            <MediaCheckbox
              files={showFiles}
              label={title}
              isSelected={showFiles.every((file) => file.isSelected)}
              isIndeterminate={showFiles.some((file) => file.isSelected)}
              onSelect={handleSelect}
            />
          }
        >
          <MediaShow files={showFiles} handleSelect={handleSelect} />
        </AccordionItem>
      );
    });
  }

  function createMoviesNodes(files: MediaFile[]) {
    return files.map((file, i) => {
      const title = file.mediaInfo.title || "Not set";

      return (
        <AccordionItem
          key={i}
          textValue={title}
          title={
            <MediaCheckbox
              files={file}
              label={title}
              isSelected={file.isSelected}
              onSelect={handleSelect}
            />
          }
        >
          <SingleMedia file={file} />
        </AccordionItem>
      );
    });
  }

  function renderNode(files: MediaFile[] = []) {
    const type = files[0]?.library.type ?? null;

    if (type === "show")
      return <Accordion isCompact>{createShowsNodes(files)}</Accordion>;
    else if (type === "movie")
      return <Accordion isCompact>{createMoviesNodes(files)}</Accordion>;
    else return <div className="text-center">Empty</div>;
  }

  function handleSelectionChange(keys: "all" | Set<React.Key>) {
    if (keys === "all") return;

    const selectedKey = Array.from(keys)[0];
    setShowBin((isShowed) => {
      const binSelected = selectedKey === "bin";
      if ((binSelected && isShowed) || (!isShowed && !binSelected)) {
        selectedFiles.forEach((file) => (file.isSelected = false));
        setSelectedFiles([]);
        setSortedFiles(sortFiles(files));
        setBinnedFiles(sortFiles(files, true));
      }

      return !binSelected;
    });
  }

  function handleSelect(
    e: ChangeEvent<HTMLInputElement>,
    files: MediaFile | MediaFile[]
  ) {
    const selected = e.currentTarget.checked;
    if (Array.isArray(files)) {
      files.forEach((file) => (file.isSelected = selected));
    } else {
      files.isSelected = selected;
    }

    setSortedFiles((sortedFiles) => {
      return { ...sortedFiles };
    });
  }

  function handleDelete() {
    selectedFiles.forEach((file) => {
      file.isIgnored = true;
      file.isSelected = false;
    });

    setSelectedFiles([]);
    setSortedFiles(sortFiles(files));
    setBinnedFiles(sortFiles(files, true));
  }

  function handleRestore() {
    selectedFiles.forEach((file) => {
      file.isIgnored = false;
      file.isSelected = false;
    });

    setSelectedFiles([]);
    setSortedFiles(sortFiles(files));
    setBinnedFiles(sortFiles(files, true));
  }

  if (files.length > 0) {
    return (
      <div className="px-1 py-5 h-full max-h-full flex flex-col gap-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          <Accordion
            className="flex-col h-full overflow-y-auto px-1 py-3"
            defaultExpandedKeys={"0"}
            onSelectionChange={handleSelectionChange}
          >
            {Object.entries(sortedFiles).map(([key, files]) => (
              <AccordionItem
                key={key || "Not set"}
                textValue={key || "Not set"}
                title={<H2 className="text-left">{key || "Not set"}</H2>}
              >
                {renderNode(files)}
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <FileSelectionBox
          onDelete={handleDelete}
          onRestore={handleRestore}
          disabled={selectedFiles.length === 0}
          showBin={showBin}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <H2>Nothing to show</H2>
      <p>Add some content and come back later.</p>
    </div>
  );
}
