import { StoragePort } from "../ports/StoragePort";
import { StorageError } from "../../shared/errors/StorageError";
import logger from "../../shared/logger/logger";
import { MetricsService } from "../../shared/metrics/MetricsService";

export class FileManager {
  constructor(
    private readonly storage: StoragePort,
    private readonly metrics: MetricsService = new MetricsService(),
    private readonly operationTimeouts = {
      upload: 5000,
      download: 5000,
      delete: 3000,
      listFiles: 10000
    }
  ) {}

  async uploadFile(file: Buffer, key: string, customTimeout?: number): Promise<string> {
    this.validateBuffer(file, "File");
    this.validateKey(key);
    this.validateKeyFormat(key);

    const timeout = customTimeout ?? this.operationTimeouts.upload;

    try {
      const result = await this.withTimeout(
        this.storage.upload(file, key),
        timeout,
        `Upload operation timed out after ${timeout}ms`
      );
      
      this.metrics.trackSuccess("upload");
      logger.info("File uploaded successfully", { key, size: file.length });
      return result;
    } catch (error) {
      this.metrics.trackFailure("upload");
      logger.error("File upload failed", { key, error });
      throw this.handleStorageError(error, "upload", key);
    }
  }

  async downloadFile(key: string, customTimeout?: number): Promise<Buffer> {
    this.validateKey(key);
    this.validateKeyFormat(key);

    const timeout = customTimeout ?? this.operationTimeouts.download;

    try {
      const result = await this.withTimeout(
        this.storage.download(key),
        timeout,
        `Download operation timed out after ${timeout}ms`
      );
      
      this.metrics.trackSuccess("download");
      logger.info("File downloaded successfully", { key });
      return result;
    } catch (error) {
      this.metrics.trackFailure("download");
      logger.error("File download failed", { key, error });
      throw this.handleStorageError(error, "download", key);
    }
  }

  async deleteFile(key: string, customTimeout?: number): Promise<void> {
    this.validateKey(key);
    this.validateKeyFormat(key);

    const timeout = customTimeout ?? this.operationTimeouts.delete;

    try {
      await this.withTimeout(
        this.storage.delete(key),
        timeout,
        `Delete operation timed out after ${timeout}ms`
      );
      
      this.metrics.trackSuccess("delete");
      logger.info("File deleted successfully", { key });
    } catch (error) {
      this.metrics.trackFailure("delete");
      logger.error("File deletion failed", { key, error });
      throw this.handleStorageError(error, "delete", key);
    }
  }

  async listFiles(prefix?: string, customTimeout?: number): Promise<string[]> {
    const timeout = customTimeout ?? this.operationTimeouts.listFiles;

    try {
      const result = await this.withTimeout(
        this.storage.listFiles(prefix),
        timeout,
        `List files operation timed out after ${timeout}ms`
      );
      
      this.metrics.trackSuccess("listFiles");
      logger.info("Files listed successfully", { prefix, count: result.length });
      return result;
    } catch (error) {
      this.metrics.trackFailure("listFiles");
      logger.error("List files operation failed", { prefix, error });
      throw this.handleStorageError(error, "list files", prefix);
    }
  }

  // --- Métodos de validación privados ---
  private validateKey(key: string): void {
    if (!key || key.trim().length === 0) {
      logger.warn("Validation failed - Empty key provided");
      throw new StorageError("Key cannot be empty", "EMPTY_KEY_ERROR");
    }
  }

  private validateKeyFormat(key: string): void {
    const forbiddenChars = /[\\:*?"<>|]/;
    if (forbiddenChars.test(key)) {
      logger.warn("Validation failed - Invalid key format", { key });
      throw new StorageError(
        `Key contains invalid characters: ${key}`,
        "INVALID_KEY_FORMAT"
      );
    }
  }

  private validateBuffer(buffer: Buffer, bufferName: string): void {
    if (!buffer || buffer.length === 0) {
      logger.warn("Validation failed - Empty buffer", { bufferName });
      throw new StorageError(
        `${bufferName} cannot be empty`,
        "EMPTY_BUFFER_ERROR"
      );
    }
  }

  // --- Manejo de errores y timeouts ---
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  private handleStorageError(
    error: unknown,
    operation: string,
    context?: string
  ): StorageError {
    if (error instanceof StorageError) {
      return error;
    }

    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";

    return new StorageError(
      `Failed to ${operation}: ${errorMessage}`,
      "STORAGE_OPERATION_FAILED",
      context ? { context } : undefined
    );
  }
}