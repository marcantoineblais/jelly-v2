import { twMerge } from "tailwind-merge";

export default function H2({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <h2
      className={twMerge(
        "w-full text-center text-xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h2>
  );
}
