import AWS from 'aws-sdk';
import { S3ReaderAdapter } from '../../../src/infrastructure/aws/s3-reader';

const mockGetObject = jest.fn();

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => ({
      getObject: mockGetObject
    }))
  };
});

describe('S3ReaderAdapter', () => {
  let adapter: S3ReaderAdapter;

  beforeEach(() => {
    adapter = new S3ReaderAdapter();
    jest.clearAllMocks();
  });

  it('should return file content as buffer', async () => {
    const buffer = Buffer.from('mock content');
    mockGetObject.mockReturnValueOnce({
      promise: jest.fn().mockResolvedValue({ Body: buffer })
    });

    const result = await adapter.read('file.txt', 'my-bucket');

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: 'my-bucket',
      Key: 'file.txt'
    });

    expect(result).toEqual(buffer);
  });

  it('should throw an error if Body is missing', async () => {
    mockGetObject.mockReturnValueOnce({
      promise: jest.fn().mockResolvedValue({})
    });

    await expect(adapter.read('missing.txt', 'my-bucket')).rejects.toThrow('Archivo no encontrado o vacío');
  });
});
