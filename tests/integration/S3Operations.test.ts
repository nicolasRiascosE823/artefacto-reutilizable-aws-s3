import { S3Adapter } from '../../src/infrastructure/aws/S3Adapter';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);
const adapter = new S3Adapter('test-bucket', 'us-east-1');

describe('S3Adapter Integration (Mocked)', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('should mock upload and download', async () => {
    // Mock de upload
    s3Mock.on(PutObjectCommand).resolves({});
    
    // Mock de download
    const mockStream = sdkStreamMixin(Readable.from(['test content']));
    s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });

    // Prueba
    await adapter.upload(Buffer.from('test'), 'test.txt');
    const result = await adapter.download('test.txt');
    
    expect(result.toString()).toBe('test content');
  });
});