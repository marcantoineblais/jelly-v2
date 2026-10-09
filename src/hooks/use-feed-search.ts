"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { FeedResponse } from "@/src/app/api/downloads/feed/route";
import { isAbortError } from "@/src/libs/fetch-error";
import { useToast } from "@/src/providers/ToastProvider";
import useFetch from "./use-fetch";

/**
 * Torrent feed search that can be cancelled (slow indexers) and is aborted
 * automatically when the component unmounts.
 */
export default function useFeedSearch() {
  const { fetchData } = useFetch();
  const toast = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  /**
   * Resolves with the results, an empty list on error (already reported by
   * useFetch), or null when the search was cancelled.
   */
  const search = useCallback(
    async (params: URLSearchParams): Promise<FeedItem[] | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data } = await fetchData<FeedResponse>(
          `/api/downloads/feed?${params.toString()}`,
          { setIsLoading: setIsSearching, signal: controller.signal },
        );
        return data.items;
      } catch (err) {
        if (isAbortError(err)) {
          toast.info("Search cancelled");
          return null;
        }
        return [];
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [fetchData, toast],
  );

  return { search, cancel, isSearching };
}
