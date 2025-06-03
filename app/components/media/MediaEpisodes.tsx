"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ReactNode, useEffect, useState } from "react";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { AccordionData } from "@/app/types/AccordionData";

const MediaEpisodes = ({
  files = [],
  selectFile = () => {},
  unSelectFile = () => {},
}: {
  files: MediaFile[];
  selectFile?: () => void;
  unSelectFile?: () => void;
}) => {
  const [episodes, setEpisodes] = useState<AccordionData[]>([]);
  const [refs, setRefs] = useState<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const episodes = files.map((file, i) => {
      const title = createFilename(file.mediaInfo) || "No title";
      const info = file.mediaInfo ?? {};
      const season = info.season
        ? `Season ${formatNumber(info.season)}`
        : "No season";
      const episode = info.episode
        ? `Episode ${formatNumber(info.episode)}`
        : "No episode";
      const type = info.type ? info.type : "No type";
      const elements = [
        { label: "File path", article: file.path },
        { label: "File name", article: file.name },
        { label: "Title", article: title },
        { label: "Season", article: season },
        { label: "Episode", article: episode },
        { label: "Media type", article: type },
      ].map(({ label, article }, i) => (
        <li key={i} className="pb-1.5">
          <div className="flex flex-col">
            <label className="text-sm">{label}</label>
            <article
              ref={(ref) => {
                refs[i] = ref;
                if (i === elements.length - 1) {
                  setRefs([...refs]);
                }
              }}
              className="overflow-x-hidden text-nowrap no-scrollbar"
            >
              {article}
            </article>
          </div>
        </li>
      ));

      return {
        key: i,
        textValue: title,
        title: title,
        node: <ul>{elements}</ul>,
      };
    });

    setEpisodes(episodes);
  }, [files]);

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

    refs.forEach((el) => animateScroll(el));

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
