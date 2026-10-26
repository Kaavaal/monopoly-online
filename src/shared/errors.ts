// Errors that carry an HTTP status. Domain and app code throw these; shared/http.ts renders them.

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export const notFound = (message: string): AppError => new AppError(404, 'not_found', message);
export const conflict = (message: string): AppError => new AppError(409, 'conflict', message);
export const invalid = (message: string): AppError => new AppError(400, 'invalid', message);
