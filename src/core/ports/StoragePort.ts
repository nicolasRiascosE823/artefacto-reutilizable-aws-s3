export interface StoragePort {
  upload(file: Buffer, key: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
}