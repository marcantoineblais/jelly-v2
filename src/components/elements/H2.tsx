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
      className={twMerge("w-full text-center text-2xl font-medium", className)}
    >
      {children}
    </h2>
  );
}
