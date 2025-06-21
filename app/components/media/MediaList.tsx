"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import { ChangeEvent, useEffect, useState } from "react";
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
import MediaEditForm from "./MediaEditForm";
import { validateData } from "@/app/libs/files/validateData";
import { createFilename } from "@/app/libs/files/createFilename";
import { body } from "framer-motion/client";

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>({});
  const [binnedFiles, setBinnedFiles] = useState<SortedMedia>({});
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [showBin, setShowBin] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    files.forEach(file => file.errors = validateData(file));
    setSortedFiles(sortFiles(files, libraries));
  }, [files, libraries]);

  function sortFiles(
    files: MediaFile[],
    libraries: MediaLibrary[],
    binned: boolean = false
  ) {
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
    });

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
      const label = createFilename(file.mediaInfo);

      return (
        <AccordionItem
          key={i}
          textValue={title}
          title={
            <MediaCheckbox
              files={file}
              label={label}
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
        setSortedFiles(sortFiles(files, libraries));
        setBinnedFiles(sortFiles(files, libraries, true));
      }

      return !binSelected;
    });
  }

  function handleSelect(
    e: ChangeEvent<HTMLInputElement>,
    updatedFiles: MediaFile | MediaFile[]
  ) {
    const selected = e.currentTarget.checked;
    if (Array.isArray(updatedFiles)) {
      updatedFiles.forEach((file) => (file.isSelected = selected));
    } else {
      updatedFiles.isSelected = selected;
    }

    setSortedFiles({ ...sortedFiles });
    setBinnedFiles({ ...binnedFiles });
    setSelectedFiles(files.filter((file) => file.isSelected));
  }

  function handleEdit() {
    setIsModalOpen(true);
  }

  function handleDelete() {
    selectedFiles.forEach((file) => {
      file.isIgnored = true;
      file.isSelected = false;
    });

    setSelectedFiles([]);
    setSortedFiles(sortFiles(files, libraries));
    setBinnedFiles(sortFiles(files, libraries, true));
  }

  function handleRestore() {
    selectedFiles.forEach((file) => {
      file.isIgnored = false;
      file.isSelected = false;
    });

    setSelectedFiles([]);
    setSortedFiles(sortFiles(files, libraries));
    setBinnedFiles(sortFiles(files, libraries, true));
  }

  function handleClose(unselectAll = false) {
    setIsModalOpen(false);

    if (unselectAll) {
      selectedFiles.forEach((file) => {
        file.isSelected = false
        file.errors = validateData(file);
      });
      setSelectedFiles([]);
    }

    setSortedFiles(sortFiles(files, libraries));
  }

  async function handleSave() {
    const updatedFiles = files.filter((file) => !file.isIgnored);
    updatedFiles.forEach(file => file.errors = validateData(file));
    
    const incompleteFiles = updatedFiles.filter(file => file.errors && file.errors.length > 0);
    if (incompleteFiles.length > 0) {
      console.error("Some files are missing informations.");
    }

    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(updatedFiles)
    });

    const { data } = await response.json();
    console.log(data);
    
  }

  if (files.length > 0) {
    return (
      <div className="px-1 py-5 h-full max-h-full flex flex-col gap-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          <Accordion
            className="flex-col h-full overflow-y-auto px-1 py-3"
            onSelectionChange={handleSelectionChange}
          >
            {[
              ...Object.entries(sortedFiles).map(([key, files], i) => (
                <AccordionItem
                  key={i}
                  textValue={key || "Not set"}
                  title={<H2 className="text-left">{key || "Not set"}</H2>}
                >
                  {renderNode(files)}
                </AccordionItem>
              )),
              <AccordionItem
                key={"bin"}
                textValue="Recycle bin"
                indicator={<FontAwesomeIcon icon={faTrash} size="2x" />}
                disableIndicatorAnimation
              >
                <Accordion isCompact>
                  {Object.entries(binnedFiles).map(([key, files]) => (
                    <AccordionItem
                      key={key || "Not set"}
                      textValue={key || "Not set"}
                      title={<H3 className="text-left">{key || "Not set"}</H3>}
                    >
                      {renderNode(files)}
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionItem>,
            ]}
          </Accordion>
        </div>

        <FileSelectionBox
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onSave={handleSave}
          disabled={selectedFiles.length === 0}
          showBin={showBin}
        />

        <MediaEditForm
          files={selectedFiles}
          libraries={libraries}
          isOpen={isModalOpen}
          onClose={handleClose}
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
