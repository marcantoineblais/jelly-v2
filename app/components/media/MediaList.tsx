"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import { useEffect, useState } from "react";
import MediaSeasons from "./MediaSeasons";
import H2 from "../elements/H2";
import { AccordionData } from "@/app/types/AccordionData";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";

const MediaList = ({ files = [] }: { files: MediaFile[] }) => {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>(
    new SortedMedia(files)
  );
  const [selectedMedias, setSelectedMedia] = useState<MediaFile[]>([]);
  const [shows, setShows] = useState<AccordionData[]>([]);
  const [movies, setMovies] = useState<AccordionData[]>([]);

  useEffect(() => {
    const updateSortedFiles = () => setSortedFiles(new SortedMedia(files));
    const selectFile = (file: MediaFile) => {
      setSelectedMedia((selectedMedias) => {
        selectedMedias.push(file);
        return [...selectedMedias];
      });
    };

    const unSelectFile = (file: MediaFile) => {
      setSelectedMedia((selectedMedias) => {
        return selectedMedias.filter(selectedFile => selectedFile !== file);
      });
    };

    const showsData = Object.entries(sortedFiles.shows).map(
      ([title, show], i) => {
        return {
          key: i,
          textValue: title,
          title: title,
          node: (
            <MediaSeasons
              key={i}
              files={show}
              title={title}
              selectFile={selectFile}
              unSelectFile={unSelectFile}
            />
          ),
        };
      }
    );

    const moviesData = sortedFiles.movies.map((movie, i) => {
      const title = createFilename(movie.mediaInfo);
      return {
        key: i,
        textValue: title,
        title: title,
        node: null,
      };
    });

    setShows(showsData);
    setMovies(moviesData);
  }, [files, sortedFiles]);

  if (shows.length > 0 || movies.length > 0) {
    return (
      <>
        <Accordion
          className="px-1 py-3"
          defaultExpandedKeys={shows.length > 0 ? "0" : "1"}
        >
          {shows.length > 0 ? (
            <AccordionItem
              key={"0"}
              title={<H2 className="text-left">Shows</H2>}
              textValue="Shows"
            >
              <Accordion isCompact>
                {shows.map(({ title, textValue, key, node }) => {
                  return (
                    <AccordionItem
                      key={key}
                      title={title}
                      textValue={textValue}
                    >
                      {node}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </AccordionItem>
          ) : (
            <></>
          )}

          {movies.length > 0 ? (
            <AccordionItem
              key={"1"}
              title={<H2 className="text-left">Movies</H2>}
              textValue="Movies"
            >
              <Accordion isCompact>
                {movies.map(({ title, textValue, key, node }) => {
                  return (
                    <AccordionItem
                      key={key}
                      title={title}
                      textValue={textValue}
                    >
                      {node}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </AccordionItem>
          ) : (
            <></>
          )}
        </Accordion>
      </>
    );
  } else {
    return (
      <div>
        <H2>Nothing to show</H2>
      </div>
    );
  }
};

export default MediaList;
