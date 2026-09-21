import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  isRequired?: boolean;
} & React.LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({
  htmlFor,
  className,
  children,
  isRequired,
  ...props
}: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className={twMerge(
        "block text-sm font-medium text-text-secondary mb-1",
        className,
      )}
      {...props}
    >
      {children}
      {isRequired && (
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
