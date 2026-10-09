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
        "w-full text-center text-3xl font-bold tracking-tight text-gradient",
        className,
      )}
    >
      {children}
    </h1>
  );
}
