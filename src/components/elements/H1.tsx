import { pressStart2p } from "@/src/fonts";
import { twMerge } from "tailwind-merge";

export default function H1({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <h1
      className={twMerge(
        "w-full text-center text-3xl text-gradient",
        pressStart2p.className,
        className,
      )}
    >
      {children}
    </h1>
  );
}
