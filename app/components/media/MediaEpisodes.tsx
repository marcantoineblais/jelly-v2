"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { MouseEvent, useEffect, useState } from "react";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem, Checkbox } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { AccordionData } from "@/app/types/AccordionData";

const MediaEpisodes = ({
  files = [],
  showCheckbox = true,
  selectedMedias = [],
  toggleFile = () => {},
  toggleShowCheckboxes = () => {},
}: {
  files: MediaFile[];
  showCheckbox?: boolean;
  selectedMedias: MediaFile[];
  toggleFile?: (file: MediaFile) => void;
  toggleShowCheckboxes?: () => void;
}) => {
  const [episodes, setEpisodes] = useState<AccordionData[]>([]);
  const [refs, setRefs] = useState<(HTMLElement | null)[][]>([]);

  useEffect(() => {
    const displayCheckbox = (e: MouseEvent, file: MediaFile) => {      
      e.preventDefault();
      toggleShowCheckboxes();
      toggleFile(file);
    };

    const episodes = files.map((file, i) => {
      const filename = createFilename(file.mediaInfo) || "No title";
      const isSelected = selectedMedias.includes(file);
      const title = (
        <div
          className="flex gap-3 items-center"
          onContextMenu={(e) => displayCheckbox(e, file)}
        >
          {showCheckbox && (
            <Checkbox
              onChange={() => toggleFile(file)}
              isSelected={isSelected}
            />
          )}
          <span>{filename}</span>
        </div>
      );
      const info = file.mediaInfo ?? {};
      const season = info.season ? `${formatNumber(info.season)}` : "None";
      const episode = info.episode ? `${formatNumber(info.episode)}` : "None";
      const type = info.type ? info.type : "No type";
      const elements = [
        { label: "File path", value: file.path },
        { label: "Original file name", value: file.name },
        { label: "Title", value: filename },
        { label: "Season", value: season },
        { label: "Episode", value: episode },
        { label: "Media type", value: type },
      ].map(({ label, value }, j) => (
        <li key={j} className="pb-1.5">
          <div className="flex flex-col">
            <label className="text-sm">{label}</label>
            <article
              ref={(ref) => {
                setRefs((refs) => {
                  if (!refs[i]) refs[i] = [];

                  refs[i][j] = ref;
                  return [...refs];
                });
              }}
              className="overflow-x-hidden text-nowrap no-scrollbar"
            >
              {value}
            </article>
          </div>
        </li>
      ));

      return {
        key: i,
        textValue: filename,
        title: title,
        node: <ul>{elements}</ul>,
      };
    });

    setEpisodes(episodes);
  }, [files, showCheckbox, toggleFile, toggleShowCheckboxes, selectedMedias]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const animateScroll = (el: HTMLElement | null) => {
      if (!el) return;

      const interval = setInterval(() => {
        el.scrollLeft += 1;

        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
          clearInterval(interval);
          setTimeout(() => {
            el.scrollLeft = 0;
          }, 2000);

          setTimeout(() => {
            animateScroll(el);
          }, 4000);
        }
      }, 10);

      intervals.push(interval);
    };

    refs.forEach((episode) => {
      if (episode) {
        episode.forEach((el) => animateScroll(el));
      }
    });

    return () => {
      intervals.forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, [refs]);

  return (
    <Accordion isCompact>
      {episodes.map((episode) => (
        <AccordionItem
          title={episode.title}
          key={episode.key}
          textValue={episode.textValue}
        >
          {episode.node}
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default MediaEpisodes;
