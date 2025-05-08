import { S3 } from 'aws-sdk';
import { FileUploaderPort } from '../../domain/ports/file-uploader';

export class S3UploaderAdapter implements FileUploaderPort {
  private readonly s3 = new S3();

  async upload(fileName: string, content: Buffer, bucket: string): Promise<void> {
    await this.s3
      .putObject({
        Bucket: bucket,
        Key: fileName,
        Body: content
      })
      .promise();
  }
}