import { S3Adapter } from '../../src/infrastructure/aws/S3Adapter';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);
const adapter = new S3Adapter('test-bucket', 'us-east-1');

// Mock mejorado para errores de AWS
class MockAwsError extends Error {
  readonly $fault: 'client' | 'server' = 'client';
  readonly $metadata = {
    httpStatusCode: 400,
    requestId: "mock-request-id",
    attempts: 1,
    totalRetryDelay: 0
  };
  readonly $service = "S3";
  readonly $retryable = { throttling: false };
}

describe('S3Adapter', () => {
  beforeEach(() => s3Mock.reset());

  const mockStream = (content: string) => sdkStreamMixin(Readable.from([content]));

  describe('upload()', () => {
    it('should upload successfully', async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      await expect(adapter.upload(Buffer.from('test'), 'file.txt'))
        .resolves.toBe('s3://test-bucket/file.txt');
    });

    it('should throw on AWS error with correct message', async () => {
      const error = new MockAwsError('AWS Upload Error');
      s3Mock.on(PutObjectCommand).rejects(error);
      
      await expect(adapter.upload(Buffer.from('test'), 'file.txt'))
        .rejects.toThrow('Failed to upload file: AWS Upload Error');
    });
  });

  describe('download()', () => {
    it('should download successfully', async () => {
      s3Mock.on(GetObjectCommand).resolves({ Body: mockStream('file content') });
      const result = await adapter.download('file.txt');
      expect(result.toString()).toBe('file content');
    });

    it('should throw on empty body', async () => {
      s3Mock.on(GetObjectCommand).resolves({});
      await expect(adapter.download('file.txt'))
        .rejects.toThrow('S3 object body is undefined');
    });

    it('should throw on AWS error with correct message', async () => {
      const error = new MockAwsError('AWS Download Error');
      s3Mock.on(GetObjectCommand).rejects(error);
      
      await expect(adapter.download('file.txt'))
        .rejects.toThrow('Failed to download file: AWS Download Error');
    });

    it('should throw on network error', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Network Error'));
      await expect(adapter.download('file.txt'))
        .rejects.toThrow('Failed to download file: Network Error');
    });
  });

  describe('delete()', () => {
    it('should delete successfully', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});
      await expect(adapter.delete('file.txt')).resolves.toBeUndefined();
    });

    it('should throw on AWS error with correct message', async () => {
      const error = new MockAwsError('AWS Delete Error');
      s3Mock.on(DeleteObjectCommand).rejects(error);
      
      await expect(adapter.delete('file.txt'))
        .rejects.toThrow('Failed to delete file: AWS Delete Error');
    });

    it('should throw on permission error', async () => {
      const error = new MockAwsError('Access Denied');
      error.$metadata.httpStatusCode = 403;
      s3Mock.on(DeleteObjectCommand).rejects(error);
      
      await expect(adapter.delete('file.txt'))
        .rejects.toThrow('Failed to delete file: Access Denied');
    });
  });

  describe('listFiles()', () => {
    it('should list files successfully', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'file1.txt', LastModified: new Date(), Size: 100 },
          { Key: 'file2.txt', LastModified: new Date(), Size: 200 }
        ]
      });
      await expect(adapter.listFiles()).resolves.toEqual(['file1.txt', 'file2.txt']);
    });

    it('should return empty array when no files', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });
      await expect(adapter.listFiles()).resolves.toEqual([]);
    });

    it('should return empty array when Contents is undefined', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({});
      await expect(adapter.listFiles()).resolves.toEqual([]);
    });

    it('should throw on AWS error with correct message', async () => {
      const error = new MockAwsError('AWS List Error');
      s3Mock.on(ListObjectsV2Command).rejects(error);
      
      await expect(adapter.listFiles())
        .rejects.toThrow('Failed to list files: AWS List Error');
    });

    it('should handle prefix parameter', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'folder/file1.txt' }]
      });
      await expect(adapter.listFiles('folder/')).resolves.toEqual(['folder/file1.txt']);
    });
  });

  describe('handleError()', () => {
    it('should handle plain objects', () => {
      const error = JSON.stringify({ key: 'value' });
      
      expect(() => (adapter as any).handleError(error, 'Test', 'CODE'))
        .toThrow('Test: {"key":"value"}');
    });

    it('should handle Error instances', () => {
      const error = new Error('Test Error');
      expect(() => (adapter as any).handleError(error, 'Test', 'CODE'))
        .toThrow('Test: Test Error');
    });

    it('should handle objects with toString()', () => {
      const error = { toString: () => 'Custom Error' };
      expect(() => (adapter as any).handleError(error, 'Test', 'CODE'))
        .toThrow('Test: Custom Error');
    });

    it('should handle strings', () => {
      expect(() => (adapter as any).handleError('string error', 'Test', 'CODE'))
        .toThrow('Test: string error');
    });

    it('should handle numbers', () => {
      expect(() => (adapter as any).handleError(42, 'Test', 'CODE'))
        .toThrow('Test: 42');
    });

    it('should handle null', () => {
      expect(() => (adapter as any).handleError(null, 'Test', 'CODE'))
        .toThrow('Test: null');
    });

    it('should handle undefined', () => {
      expect(() => (adapter as any).handleError(undefined, 'Test', 'CODE'))
        .toThrow('Test: undefined');
    });
  });
});