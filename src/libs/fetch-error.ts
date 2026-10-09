export class FetchError extends Error {
  readonly data: unknown;
  readonly status: number;

  constructor(
    message: string,
    { data, status }: { data: unknown; status: number },
  ) {
    super(message);
    this.name = "FetchError";
    this.data = data;
    this.status = status;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

/** True when a request was cancelled through an AbortController. */
export function isAbortError(error: unknown): boolean {
  if (error instanceof FetchError) return error.status === 499;
  return error instanceof DOMException && error.name === "AbortError";
}
