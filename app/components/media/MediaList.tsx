"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
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
import FileCopyStatus from "../FileCopyStatus";

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const [showBin, setShowBin] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProgressBarOpen, setIsProgressBarOpen] = useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >("all");

  // Store validatedFiles in state so it can be updated for selection
  const [validatedFiles, setValidatedFiles] = useState<MediaFile[]>([]);

  // Compute selectedFiles from validatedFiles
  const selectedFiles = useMemo(
    () => validatedFiles.filter((file) => file.isSelected),
    [validatedFiles]
  );
  const sortedFiles = useMemo(
    () => sortFiles(validatedFiles, libraries),
    [validatedFiles, libraries]
  );
  const binnedFiles = useMemo(
    () => sortFiles(validatedFiles, libraries, true),
    [validatedFiles, libraries]
  );

  useEffect(() => {
    setValidatedFiles(
      files.map((file) => ({
        ...file,
        errors: validateData(file),
        isSelected: false,
      }))
    );
  }, [files]);

  // Re-validate files when they change (e.g., after edit)
  useEffect(() => {
    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        errors: validateData(file),
      }))
    );
  }, [files]);

  useEffect(() => {
    const keys = Object.keys(sortedFiles);
    if (keys.length === 0) return;

    setSelectedKeys((prev) => {
      const availableKeys = Object.keys(sortedFiles);
      const keys: (string | number)[] =
        prev === "all" ? availableKeys : Array.from(prev);
      return new Set(
        keys.filter((key) => availableKeys.includes(key.toString()))
      );
    });
  }, [sortedFiles]);

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

    return Array.from(uniqueTitles).map((title) => {
      const showFiles = files.filter((file) => file.mediaInfo.title === title);

      return (
        <AccordionItem
          key={title}
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
    return files.map((file) => {
      const title = file.mediaInfo.title || "Not set";
      const label = createFilename(file.mediaInfo);

      return (
        <AccordionItem
          key={file.id || file.path || label}
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

  function handleSelect(
    e: ChangeEvent<HTMLInputElement>,
    updatedFiles: MediaFile | MediaFile[]
  ) {
    const selected = e.currentTarget.checked;
    setValidatedFiles((prev) => {
      return prev.map((file) => {
        if (Array.isArray(updatedFiles)) {
          if (updatedFiles.some((f) => f.id === file.id)) {
            return { ...file, isSelected: selected };
          }
        } else {
          if (file.id === updatedFiles.id) {
            return { ...file, isSelected: selected };
          }
        }
        return file;
      });
    });
  }

  function handleSelectionChange(keys: "all" | Set<string | number>) {
    let updatedKeys =
      keys === "all" ? [...Object.keys(sortedFiles), "bin"] : Array.from(keys);
    const previousKeys =
      selectedKeys === "all"
        ? [...Object.keys(sortedFiles), "bin"]
        : Array.from(selectedKeys);

    if (updatedKeys.includes("bin") && !previousKeys.includes("bin")) {
      updatedKeys = ["bin"];
    } else if (updatedKeys.includes("bin") && previousKeys.includes("bin")) {
      updatedKeys = updatedKeys.filter((key) => key !== "bin");
    }

    setShowBin((isShowed) => {
      const binSelected = updatedKeys.includes("bin");
      if ((binSelected && isShowed) || (!isShowed && !binSelected)) {
        setValidatedFiles((prev) =>
          prev.map((file) => ({ ...file, isSelected: false }))
        );
      }
      return !binSelected;
    });
    setSelectedKeys(new Set(updatedKeys));
  }

  function handleDelete() {
    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isSelected: false,
        isIgnored: file.isSelected ? true : file.isIgnored,
      }))
    );
  }

  function handleRestore() {
    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isSelected: false,
        isIgnored: file.isSelected ? false : file.isIgnored,
      }))
    );
  }

  function handleClose(unselectAll = false) {
    setIsModalOpen(false);
    if (unselectAll) {
      setValidatedFiles((prev) =>
        prev.map((file) => ({ ...file, isSelected: false }))
      );
    }
  }

  function handleEdit() {
    setIsModalOpen(true);
  }

  function handleSaveMediaInfo(form: {
    title?: string;
    isSeasonEnabled?: boolean;
    season?: number;
    isEpisodeEnabled?: boolean;
    episode?: number;
    isYearEnabled?: boolean;
    year?: number;
    library?: string | Set<string>;
    incrementEpisodes?: boolean;
  }) {
    let counter = 0;
    selectedFiles.forEach((file) => {
      const newMediaInfo = { ...file.mediaInfo };
      if (form.title) newMediaInfo.title = form.title.trim();
      if (!form.isSeasonEnabled) newMediaInfo.season = undefined;
      else if (!isNaN(form.season as number)) newMediaInfo.season = form.season;
      if (!form.isEpisodeEnabled) newMediaInfo.episode = undefined;
      else if (!isNaN(form.episode as number))
        newMediaInfo.episode = (form.episode as number) + counter;
      if (!form.isYearEnabled) newMediaInfo.year = undefined;
      else if (!isNaN(form.year as number)) newMediaInfo.year = form.year;
      file.mediaInfo = newMediaInfo;
      if (form.library && form.library !== "all") {
        const key =
          typeof form.library === "string"
            ? form.library
            : Array.from(form.library)[0];
        file.library = libraries.find((library) => library.name === key) ?? {};
      }
      if (form.incrementEpisodes) counter += 1;
    });

    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        errors: validateData(file),
        isSelected: false,
      }))
    );
    setIsModalOpen(false);
  }

  async function handleSave() {
    const updatedFiles = validatedFiles.filter((file) => !file.isIgnored);

    const filesWithErrors = updatedFiles.map((file) => ({
      ...file,
      errors: validateData(file),
    }));
    const incompleteFiles = filesWithErrors.filter(
      (file) => file.errors && file.errors.length > 0
    );
    if (incompleteFiles.length > 0) {
      console.error("Some files are missing informations.");
    }

    try {
      setIsProgressBarOpen(true);
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(updatedFiles),
      });

      const data = await response.json();
      if (data.ok) {
        console.log("File job started");
      }
    } catch (error) {
      console.error(error);
      setIsProgressBarOpen(false);
    }
  }

  function closeProgressBar() {
    setIsProgressBarOpen(false);
  }

  if (files.length > 0) {
    return (
      <div className="px-1 py-5 h-full max-h-full flex flex-col gap-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          <Accordion
            className="flex-col h-full overflow-y-auto px-1 py-3"
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedKeys}
            selectionMode="multiple"
          >
            {[
              ...Object.entries(sortedFiles).map(([key, files]) => (
                <AccordionItem
                  key={key || "not-set"}
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
                      key={key || "not-set"}
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
          saveInProgress={isProgressBarOpen}
          showBin={showBin}
        />

        <MediaEditForm
          files={selectedFiles}
          libraries={libraries}
          isOpen={isModalOpen}
          onClose={handleClose}
          onSaveMediaInfo={handleSaveMediaInfo}
        />

        <FileCopyStatus isOpen={isProgressBarOpen} onClose={closeProgressBar} />
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
