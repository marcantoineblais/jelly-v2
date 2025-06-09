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

const MediaList = ({ files = [] }: { files: MediaFile[] }) => {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>({
    shows: [],
    movies: [],
  });
  const [showsNodes, setShowsNodes] = useState<JSX.Element[]>([]);
  const [moviesNodes, setMoviesNodes] = useState<JSX.Element[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    setSortedFiles(sortFiles(files));
  }, [files]);

  useEffect(() => {
    const uniqueTitles = new Set<string>();

    sortedFiles.shows.forEach((file) =>
      uniqueTitles.add(file.mediaInfo.title || "")
    );

    const showsNodes = Array.from(uniqueTitles).map((title, i) => {
      const files = sortedFiles.shows.filter(
        (file) => file.mediaInfo.title === title
      );

      return (
        <AccordionItem
          key={i}
          textValue={title}
          title={
            <MediaCheckbox
              files={files}
              label={title}
              isSelected={files.every((file) => file.isSelected)}
              isIndeterminate={files.some((file) => file.isSelected)}
              onSelect={handleSelect}
            />
          }
        >
          <MediaShow files={files} handleSelect={handleSelect} />
        </AccordionItem>
      );
    });

    const moviesNodes = sortedFiles.movies.map((file, i) => {
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

    setShowsNodes(showsNodes);
    setMoviesNodes(moviesNodes);
  }, [sortedFiles]);

  useEffect(() => {
    const selectedShows = sortedFiles.shows.filter(file => file.isSelected);
    const selectedMovies = sortedFiles.movies.filter(file => file.isSelected);

    setSelectedFiles([...selectedShows, ...selectedMovies]);
  }, [sortedFiles])

  function sortFiles(files: MediaFile[]) {
    const sortedFiles = {
      movies: files
        .filter((file) => file.mediaInfo?.type === "movie")
        .sort(sortMediaFiles),
      shows: files
        .filter((file) => file.mediaInfo?.type === "show")
        .sort(sortMediaFiles),
    };

    return sortedFiles;
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

  if (files.length > 0) {
    return (
      <div className="px-1 py-5 h-full max-h-full flex flex-col gap-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          <Accordion className="h-full overflow-y-auto px-1 py-3" defaultExpandedKeys={"0"}>
            {showsNodes.length > 0 ? (
              <AccordionItem
                key={"0"}
                title={<H2 className="text-left">Shows</H2>}
                textValue="Shows"
              >
                <Accordion isCompact>{showsNodes}</Accordion>
              </AccordionItem>
            ) : null}

            {moviesNodes.length > 0 ? (
              <AccordionItem
                key={showsNodes.length > 0 ? "1" : "0"}
                title={<H2 className="text-left">Movies</H2>}
                textValue="Movies"
              >
                <Accordion isCompact>{moviesNodes}</Accordion>
              </AccordionItem>
            ) : null}
          </Accordion>
        </div>

        <FileSelectionBox disabled={selectedFiles.length === 0} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <H2>Nothing to show</H2>
      <p>Add some content and come back later.</p>
    </div>
  );
};

export default MediaList;
