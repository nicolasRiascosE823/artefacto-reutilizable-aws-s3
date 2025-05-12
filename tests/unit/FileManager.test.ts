import { FileManager } from '../../src/core/useCases/FileManager';
import { StoragePort } from '../../src/core/ports/StoragePort';
import { StorageError } from '../../src/shared/errors/StorageError';

// Mock completo de StoragePort
const mockStorage: jest.Mocked<StoragePort> = {
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  listFiles: jest.fn(),
};

const fileManager = new FileManager(mockStorage);

describe('FileManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile()', () => {
    it('should call storage.upload with valid input', async () => {
      mockStorage.upload.mockResolvedValue('s3://path/file.txt');
      await fileManager.uploadFile(Buffer.from('test'), 'file.txt');
      expect(mockStorage.upload).toHaveBeenCalledWith(Buffer.from('test'), 'file.txt');
    });

    it('should throw if file is empty', async () => {
      await expect(fileManager.uploadFile(Buffer.from(''), 'file.txt')).rejects.toThrow(
        new StorageError('File cannot be empty', 'EMPTY_FILE_ERROR')
      );
    });
  });

  describe('downloadFile()', () => {
    it('should call storage.download with valid key', async () => {
      mockStorage.download.mockResolvedValue(Buffer.from('content'));
      await fileManager.downloadFile('file.txt');
      expect(mockStorage.download).toHaveBeenCalledWith('file.txt');
    });

    it('should throw if key is empty', async () => {
      await expect(fileManager.downloadFile('')).rejects.toThrow(
        new StorageError('Key cannot be empty', 'EMPTY_KEY_ERROR')
      );
    });
  });

  // Tests para deleteFile() y listFiles()...
});