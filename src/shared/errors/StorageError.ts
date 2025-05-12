// src/shared/errors/StorageError.ts
export class StorageError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "StorageError";
  }
}