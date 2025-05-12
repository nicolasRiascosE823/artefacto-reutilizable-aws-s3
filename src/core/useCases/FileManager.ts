import { StoragePort } from "../ports/StoragePort";
import { StorageError } from "../../shared/errors/StorageError";

export class FileManager {
  constructor(private readonly storage: StoragePort) {}

  async uploadFile(file: Buffer, key: string): Promise<string> {
    if (!file || file.length === 0) {
      throw new StorageError("File cannot be empty", "EMPTY_FILE_ERROR");
    }
    return this.storage.upload(file, key);
  }

  async downloadFile(key: string): Promise<Buffer> {
    if (!key) {
      throw new StorageError("Key cannot be empty", "EMPTY_KEY_ERROR");
    }
    return this.storage.download(key);
  }

  // Implementa deleteFile() y listFiles()...
}