"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { SortedMedia } from "@/app/types/SortedMedia";
import { useEffect, useState } from "react";
import MediaSeasons from "./MediaSeasons";
import MediaForm from "./MediaForm";
import H2 from "../elements/H2";
import { AccordionData } from "@/app/types/AccordionData";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";
import MediaTitleEditor from "./MediaTitleEditor";

const MediaList = ({ files = [] }: { files: MediaFile[] }) => {
  const [sortedFiles, setSortedFiles] = useState<SortedMedia>(
    new SortedMedia(files)
  );
  const [shows, setShows] = useState<AccordionData[]>([]);
  const [movies, setMovies] = useState<AccordionData[]>([]);

  useEffect(() => {
    const updateSortedFiles = () => setSortedFiles(new SortedMedia(files));

    const showsData = Object.entries(sortedFiles.shows).map(
      ([title, show], i) => {

        return {
          key: i,
          title: <MediaTitleEditor title={title} files={show} updateFiles={() => updateSortedFiles()}/>,
          node: (
            <MediaSeasons
              key={i}
              files={show}
              updateFiles={updateSortedFiles}
            />
          ),
        };
      }
    );

    const moviesData = sortedFiles.movies.map((movie, i) => {
      const title = createFilename(movie.mediaInfo);
      return {
        key: i,
        title: title,
        node: <MediaForm file={movie} key={i} />,
      };
    });

    setShows(showsData);
    setMovies(moviesData);
  }, [files, sortedFiles]);

  if (shows.length > 0 || movies.length > 0) {
    return (
      <Accordion className="px-1 py-3">
        {shows.length > 0 ? (
          <AccordionItem key={0} title={<H2 className="text-left">Shows</H2>}>
            <Accordion isCompact>
              {shows.map(({ title, key, node }) => {
                return (
                  <AccordionItem key={key} title={title}>
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
          <AccordionItem key={1} title={<H2 className="text-left">Movies</H2>}>
            <Accordion isCompact>
              {movies.map(({ title, key, node }) => {
                return (
                  <AccordionItem key={key} title={title}>
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
