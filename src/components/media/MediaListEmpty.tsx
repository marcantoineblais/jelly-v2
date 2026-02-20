"use client";

import H2 from "../elements/H2";
import { Spinner } from "@heroui/react";

interface MediaListEmptyProps {
  title?: string;
  message?: string;
  isLoading?: boolean;
}

export default function MediaListEmpty({
  isLoading = false,
  title = "Nothing to show",
  message = "Add some content and come back later.",
}: MediaListEmptyProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-3">
      {isLoading ? (
        <>
          <Spinner size="lg" />
        </>
      ) : (
        <>
          <H2>{title}</H2>
          <p className="text-center">{message}</p>
        </>
      )}
    </div>
  );
}
