"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import { useEffect, useState } from "react";
import H2 from "../elements/H2";
import { AccordionData } from "@/app/types/AccordionData";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";
import MediaSelectCheckbox from "./MediaSelectCheckbox";
import SingleMedia from "./SingleMedia";
import MediaSeason from "./MediaSeason";
import { object } from "framer-motion/client";
import MediaShow from "./MediaShow";

const MediaList = ({ files = [] }: { files: MediaFile[] }) => {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>(
    new SortedMedia(files)
  );
  const [shows, setShows] = useState<AccordionData[]>([]);
  const [movies, setMovies] = useState<AccordionData[]>([]);

  useEffect(() => {
    const showsData = Object.entries(sortedFiles.shows).map(
      ([label, show], i) => {
        const seasons = Object.values(show);

        return {
          key: i,
          textValue: label,
          title: label,
          node: <MediaShow key={i} files={seasons} />,
        };
      }
    );

    const moviesData = sortedFiles.movies.map((file, i) => {
      const label = createFilename(file.mediaInfo) || "Not set";
      return {
        key: i,
        textValue: label,
        title: <MediaSelectCheckbox file={file} label={label} />,
        node: <SingleMedia file={file} />,
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
      <div className="w-full h-full flex flex-col justify-center items-center">
        <H2>Nothing to show</H2>
        <p>Add some content and come back later.</p>
      </div>
    );
  }
};

export default MediaList;
