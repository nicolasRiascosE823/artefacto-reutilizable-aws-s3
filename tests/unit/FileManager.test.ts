import { FileManager } from '../../src/core/useCases/FileManager';
import { StoragePort } from '../../src/core/ports/StoragePort';
import { StorageError } from '../../src/shared/errors/StorageError';
import logger from '../../src/shared/logger/logger';
import { MetricsService } from '../../src/shared/metrics/MetricsService';

// Mock del logger para no generar logs durante las pruebas
jest.mock('../../src/shared/logger/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('FileManager', () => {
  let fileManager: FileManager;
  let mockStorage: jest.Mocked<StoragePort>;
  let mockMetrics: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockStorage = {
      upload: jest.fn(),
      download: jest.fn(),
      delete: jest.fn(),
      listFiles: jest.fn()
    };

    mockMetrics = {
      trackSuccess: jest.fn(),
      trackFailure: jest.fn(),
      getMetrics: jest.fn()
    } as unknown as jest.Mocked<MetricsService>;

    fileManager = new FileManager(mockStorage, mockMetrics);
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileBuffer = Buffer.from('test content');
      mockStorage.upload.mockResolvedValue('s3://bucket/key');

      const result = await fileManager.uploadFile(fileBuffer, 'valid-key.txt');

      expect(result).toBe('s3://bucket/key');
      expect(mockStorage.upload).toHaveBeenCalledWith(fileBuffer, 'valid-key.txt');
      expect(mockMetrics.trackSuccess).toHaveBeenCalledWith('upload');
      expect(logger.info).toHaveBeenCalledWith(
        'File uploaded successfully', 
        { key: 'valid-key.txt', size: fileBuffer.length }
      );
    });

    it('should throw for empty file', async () => {
      await expect(fileManager.uploadFile(Buffer.from(''), 'empty-key.txt'))
        .rejects.toThrow(new StorageError('File cannot be empty', 'EMPTY_BUFFER_ERROR'));
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Validation failed - Empty buffer', 
        { bufferName: 'File' }
      );
    });

    it('should throw for invalid key format', async () => {
      await expect(fileManager.uploadFile(Buffer.from('test'), 'invalid*key.txt'))
        .rejects.toThrow(new StorageError(
          'Key contains invalid characters: invalid*key.txt', 
          'INVALID_KEY_FORMAT'
        ));
    });

    it('should track failure on storage error', async () => {
      const error = new Error('Storage failure');
      mockStorage.upload.mockRejectedValue(error);

      await expect(fileManager.uploadFile(Buffer.from('test'), 'valid.txt'))
        .rejects.toThrow(new StorageError(
          'Failed to upload: Storage failure', 
          'STORAGE_OPERATION_FAILED',
          { context: 'valid.txt' }
        ));

      expect(mockMetrics.trackFailure).toHaveBeenCalledWith('upload');
      expect(logger.error).toHaveBeenCalledWith(
        'File upload failed', 
        { key: 'valid.txt', error }
      );
    });

    it('should throw timeout error', async () => {
      mockStorage.upload.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
      );

      await expect(fileManager.uploadFile(Buffer.from('test'), 'valid.txt', 50))
        .rejects.toThrow('Upload operation timed out after 50ms');
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const fileBuffer = Buffer.from('content');
      mockStorage.download.mockResolvedValue(fileBuffer);

      const result = await fileManager.downloadFile('valid-key.txt');

      expect(result).toEqual(fileBuffer);
      expect(mockMetrics.trackSuccess).toHaveBeenCalledWith('download');
      expect(logger.info).toHaveBeenCalledWith(
        'File downloaded successfully', 
        { key: 'valid-key.txt' }
      );
    });

    it('should throw for empty key', async () => {
      await expect(fileManager.downloadFile(''))
        .rejects.toThrow(new StorageError('Key cannot be empty', 'EMPTY_KEY_ERROR'));
    });

    it('should handle storage errors', async () => {
      const error = new Error('Not found');
      mockStorage.download.mockRejectedValue(error);

      await expect(fileManager.downloadFile('missing.txt'))
        .rejects.toThrow(new StorageError(
          'Failed to download: Not found', 
          'STORAGE_OPERATION_FAILED',
          { context: 'missing.txt' }
        ));
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockStorage.delete.mockResolvedValue(undefined);

      await fileManager.deleteFile('valid-key.txt');

      expect(mockStorage.delete).toHaveBeenCalledWith('valid-key.txt');
      expect(mockMetrics.trackSuccess).toHaveBeenCalledWith('delete');
      expect(logger.info).toHaveBeenCalledWith(
        'File deleted successfully', 
        { key: 'valid-key.txt' }
      );
    });

    it('should throw for invalid key format', async () => {
      await expect(fileManager.deleteFile('invalid|key.txt'))
        .rejects.toThrow(new StorageError(
          'Key contains invalid characters: invalid|key.txt', 
          'INVALID_KEY_FORMAT'
        ));
    });
  });

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      mockStorage.listFiles.mockResolvedValue(['file1.txt', 'file2.txt']);

      const result = await fileManager.listFiles('prefix/');

      expect(result).toEqual(['file1.txt', 'file2.txt']);
      expect(mockMetrics.trackSuccess).toHaveBeenCalledWith('listFiles');
      expect(logger.info).toHaveBeenCalledWith(
        'Files listed successfully', 
        { prefix: 'prefix/', count: 2 }
      );
    });

    it('should handle empty prefix', async () => {
      mockStorage.listFiles.mockResolvedValue(['file1.txt']);

      const result = await fileManager.listFiles();

      expect(result).toEqual(['file1.txt']);
      expect(mockStorage.listFiles).toHaveBeenCalledWith(undefined);
    });

    it('should track failure on error', async () => {
      const error = new Error('Connection failed');
      mockStorage.listFiles.mockRejectedValue(error);

      await expect(fileManager.listFiles('prefix/'))
        .rejects.toThrow(new StorageError(
          'Failed to list files: Connection failed', 
          'STORAGE_OPERATION_FAILED',
          { context: 'prefix/' }
        ));

      expect(mockMetrics.trackFailure).toHaveBeenCalledWith('listFiles');
    });
  });

  describe('validation', () => {
    it('should validate key format correctly', () => {
      const invalidKeys = ['file*name', 'path/to?file', 'file<name', 'file>name'];
      invalidKeys.forEach(key => {
        expect(() => (fileManager as any).validateKeyFormat(key)).toThrow(StorageError);
      });

      const validKeys = ['file-name', 'path/to/file', 'file.name', '123_file'];
      validKeys.forEach(key => {
        expect(() => (fileManager as any).validateKeyFormat(key)).not.toThrow();
      });
    });
  });

  describe('error handling', () => {
    it('should wrap generic errors as StorageError', () => {
      const error = new Error('Test error');
      const result = (fileManager as any).handleStorageError(error, 'test op', 'ctx');

      expect(result).toBeInstanceOf(StorageError);
      expect(result.message).toBe('Failed to test op: Test error');
      expect(result.metadata).toEqual({ context: 'ctx' });
    });

    it('should preserve StorageError instances', () => {
      const originalError = new StorageError('Original', 'CODE', { key: 'value' });
      const result = (fileManager as any).handleStorageError(originalError, 'test op');

      expect(result).toBe(originalError);
    });
  });
  describe('deleteFile error handling', () => {
    it('should track failure and log error when storage.delete fails', async () => {
      const testError = new Error('Delete failed');
      const testKey = 'problem-file.txt';
      
      // Configurar el mock para rechazar con un error
      mockStorage.delete.mockRejectedValue(testError);

      // Ejecutar y verificar que lanza el error
      await expect(fileManager.deleteFile(testKey))
        .rejects.toThrow(new StorageError(
          'Failed to delete: Delete failed',
          'STORAGE_OPERATION_FAILED',
          { context: testKey }
        ));

      // Verificar que se llamó a trackFailure
      expect(mockMetrics.trackFailure).toHaveBeenCalledWith('delete');

      // Verificar que se registró el error correctamente
      expect(logger.error).toHaveBeenCalledWith(
        'File deletion failed',
        {
          key: testKey,
          error: testError
        }
      );

      // Verificar que se transformó el error correctamente
      expect(mockStorage.delete).toHaveBeenCalledWith(testKey);
    });

    it('should handle StorageError from storage without wrapping', async () => {
      const storageError = new StorageError('Already deleted', 'FILE_NOT_FOUND');
      const testKey = 'non-existent.txt';
      
      mockStorage.delete.mockRejectedValue(storageError);

      await expect(fileManager.deleteFile(testKey))
        .rejects.toThrow(storageError); // Debe mantener el error original

      // Aún debe registrar el error
      expect(logger.error).toHaveBeenCalledWith(
        'File deletion failed',
        {
          key: testKey,
          error: storageError
        }
      );
    });
  });
  describe('constructor', () => {
  it('should initialize with default metrics service when not provided', () => {
    const manager = new FileManager(mockStorage);
    expect(manager).toBeInstanceOf(FileManager);
  });

  it('should use provided metrics service', () => {
    const customMetrics = new MetricsService();
    const manager = new FileManager(mockStorage, customMetrics);
    expect(manager).toBeInstanceOf(FileManager);
  });
});
});