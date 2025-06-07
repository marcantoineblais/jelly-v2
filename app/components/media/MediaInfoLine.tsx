import { useEffect, useRef } from "react";

const MediaInfoLine = ({
  label = "",
  content = "",
}: {
  label?: string;
  content?: string;
}) => {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const cancelInterval = () => {
      if (interval) clearInterval(interval);
    }
    const animateScroll = () => {
      const ref = articleRef.current
      if (!ref) return;

      interval = setInterval(() => {
        ref.scrollLeft += 1;

        if (ref.scrollLeft >= ref.scrollWidth - ref.clientWidth) {
          cancelInterval();
          setTimeout(() => {
            ref.scrollLeft = 0;
          }, 2000);

          setTimeout(() => {
            animateScroll();
          }, 4000);
        }
      }, 10);
    };

    animateScroll();

    return () => {
      cancelInterval();
    };
  }, [articleRef]);
  return (
    <li className="pb-1.5">
      <div className="flex flex-col">
        <label className="text-sm">{label}</label>
        <article
          ref={articleRef}
          className="overflow-x-hidden text-nowrap no-scrollbar"
        >
          {content}
        </article>
      </div>
    </li>
  );
};

export default MediaInfoLine;
