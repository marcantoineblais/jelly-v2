"use client";

import H2 from "../elements/H2";
import { Spinner } from "@heroui/react";

interface MediaListEmptyProps {
  isLoading: boolean;
}

export default function MediaListEmpty({ isLoading }: MediaListEmptyProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-3">
      {isLoading ? (
        <>
          <Spinner size="lg" />
          <p>Loading files…</p>
        </>
      ) : (
        <>
          <H2>Nothing to show</H2>
          <p>Add some content and come back later.</p>
        </>
      )}
    </div>
  );
}
