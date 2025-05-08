import { FileUploaderPort } from '../../domain/ports/file-uploader';
import { FileReaderPort } from '../../domain/ports/file-reader';

export class S3FileManagerService {
  constructor(
    private readonly uploader: FileUploaderPort,
    private readonly reader: FileReaderPort
  ) {}

  async upload(fileName: string, content: Buffer, bucket: string): Promise<void> {
    return this.uploader.upload(fileName, content, bucket);
  }

  async read(fileName: string, bucket: string): Promise<Buffer> {
    return this.reader.read(fileName, bucket);
  }
}
