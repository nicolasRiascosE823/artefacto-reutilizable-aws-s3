import { S3 } from 'aws-sdk';
import { FileReaderPort } from '../../domain/ports/file-reader';

export class S3ReaderAdapter implements FileReaderPort {
  private readonly s3 = new S3();

  async read(fileName: string, bucket: string): Promise<Buffer> {
    const result = await this.s3
      .getObject({
        Bucket: bucket,
        Key: fileName
      })
      .promise();

    if (!result.Body) throw new Error('Archivo no encontrado o vacío');
    return result.Body as Buffer;
  }
}