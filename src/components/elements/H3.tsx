import { twMerge } from "tailwind-merge";

export default function H3({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <h3
      className={twMerge(
        "w-full text-center text-base font-semibold",
        className,
      )}
    >
      {children}
    </h3>
  );
}
