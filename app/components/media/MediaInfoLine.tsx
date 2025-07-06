import { useEffect, useRef } from "react";

export default function MediaInfoLine({
  label = "",
  content = "",
}: {
  label?: string;
  content?: string;
}) {
  const time = 2000; // ms
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const cancelInterval = () => {
      if (timer) {
        clearInterval(timer);
        clearTimeout(timer);
      }
    };

    const animateScroll = () => {
      const ref = articleRef.current;
      if (!ref) return;

      ref.scrollLeft = 0;
      timer = setTimeout(() => {
        timer = setInterval(() => {
          ref.scrollLeft += 1;

          // When section can't scroll anymore
          if (ref.scrollLeft >= ref.scrollWidth - ref.clientWidth) {
            cancelInterval();
            timer = setTimeout(() => {
              animateScroll();
            }, time);
          }
        }, 10);
      }, time);
    };

    animateScroll();

    return () => {
      cancelInterval();
    };
  }, [articleRef]);
  return (
    <li className="w-full pb-1.5">
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
}
