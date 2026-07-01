/** Normalized error surfaced to the RN client (see api-integrator charter). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly provider: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponseBody() {
    return {
      error: this.message,
      status: this.status,
      provider: this.provider,
      retryable: this.retryable,
    };
  }
}
