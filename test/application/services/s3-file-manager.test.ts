import { S3FileManagerService } from '../../../src/application/services/s3-file-manager';
import { FileUploaderPort } from '../../../src/domain/ports/file-uploader';
import { FileReaderPort } from '../../../src/domain/ports/file-reader';

describe('S3FileManagerService', () => {
  let uploader: jest.Mocked<FileUploaderPort>;
  let reader: jest.Mocked<FileReaderPort>;
  let service: S3FileManagerService;

  beforeEach(() => {
    uploader = { upload: jest.fn() };
    reader = { read: jest.fn() };
    service = new S3FileManagerService(uploader, reader);
  });

  it('should upload a file', async () => {
    await service.upload('file.txt', Buffer.from('data'), 'bucket');
    expect(uploader.upload).toHaveBeenCalledWith('file.txt', Buffer.from('data'), 'bucket');
  });

  it('should read a file', async () => {
    const content = Buffer.from('mock content');
    reader.read.mockResolvedValue(content);

    const result = await service.read('file.txt', 'bucket');

    expect(reader.read).toHaveBeenCalledWith('file.txt', 'bucket');
    expect(result).toEqual(content);
  });
});
