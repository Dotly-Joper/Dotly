import type { ZodError } from "zod";

export interface ValidationDetail {
  path: PropertyKey[];
  message: string;
}

export class NotFoundError extends Error {
  name = "NotFoundError";
}

export class ValidationError extends Error {
  name = "ValidationError";
  details: ValidationDetail[];

  constructor(message: string, details: ValidationDetail[]) {
    super(message);
    this.details = details;
  }

  static fromZod(error: ZodError): ValidationError {
    return new ValidationError(
      "Invalid request body",
      error.issues.map(({ path, message }) => ({ path, message })),
    );
  }
}
