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
