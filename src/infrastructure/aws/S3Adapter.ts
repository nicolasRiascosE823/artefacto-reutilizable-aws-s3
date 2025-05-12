import { StoragePort } from "../../core/ports/StoragePort";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { StorageError } from "../../shared/errors/StorageError";

export class S3Adapter implements StoragePort {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(bucketName: string, region: string) {
    this.client = new S3Client({ region });
    this.bucketName = bucketName;
  }

  private handleError(error: unknown, defaultMessage: string, code: string): never {
    const errorMessage = error instanceof Error 
    ? error.message
    : typeof error === 'object' && error !== null
    ? (error as { message?: string }).message || 
      (error as { toString?: () => string }).toString?.() || 
      JSON.stringify(error)
    : String(error);

    throw new StorageError(`${defaultMessage}: ${errorMessage}`, code);
  }

  async upload(file: Buffer, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
      });
      await this.client.send(command);
      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      this.handleError(error, "Failed to upload file", "S3_UPLOAD_ERROR");
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.client.send(command);

      if (!response.Body) {
        throw new StorageError("S3 object body is undefined", "S3_EMPTY_BODY_ERROR");
      }

      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      this.handleError(error, "Failed to download file", "S3_DOWNLOAD_ERROR");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
    } catch (error) {
      this.handleError(error, "Failed to delete file", "S3_DELETE_ERROR");
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });
      const response = await this.client.send(command);
      return response.Contents?.map((object) => object.Key || "") || [];
    } catch (error) {
      this.handleError(error, "Failed to list files", "S3_LIST_ERROR");
    }
  }
}