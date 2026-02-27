import { useCallback } from "react";
import { log } from "../libs/logger";
import { FetchError } from "../libs/fetch-error";
import { addToast } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function useFetch() {
  const router = useRouter();
  const fetchData = useCallback(
    async <T,>(
      url: string,
      {
        method = "GET",
        body,
        headers,
        silent = false,
        setIsLoading = () => {},
        setIsDisabled = () => {},
      }: {
        method?: string;
        body?: BodyInit;
        headers?: HeadersInit;
        silent?: boolean;
        setIsLoading?: (isLoading: boolean) => void;
        setIsDisabled?: (isDisabled: boolean) => void;
      } = {},
    ): Promise<{ data: T; status: number }> => {
      setIsLoading(true);
      setIsDisabled(true);

      try {
        const response = await fetch(url, { method, body, headers });
        log({
          source: "useFetch",
          message: "Response: ",
          data: response,
        });

        if (response.status === 401) {
          router.push("/login");
          throw new FetchError("Session expired", {
            data: {},
            status: 401,
          });
        }

        if (!response.ok) {
          let data: unknown;
          try {
            data = await response.json();
          } catch {
            data = {};
          }
          throw new FetchError(response.statusText, {
            data,
            status: response.status,
          });
        }
        const data = await response.json();
        if (data.ok !== undefined && !data.ok) {
          throw new FetchError(response.statusText, {
            data,
            status: response.status,
          });
        }

        log({
          source: "useFetch",
          message: "Data: ",
          data,
        });
        return { data, status: response.status };
      } catch (error) {
        log({
          source: "useFetch",
          message: "Error: ",
          data: error,
          level: "error",
        });
        if (!silent) {
          addToast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            severity: "danger",
          });
        }

        if (error instanceof FetchError) {
          throw error;
        }
        throw new FetchError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
          { data: {}, status: 500 },
        );
      } finally {
        setIsLoading(false);
        setIsDisabled(false);
      }
    },
    [router],
  );

  return { fetchData };
}
