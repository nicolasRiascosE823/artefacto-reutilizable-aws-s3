import AWS from 'aws-sdk';
import { S3UploaderAdapter } from '../../../src/infrastructure/aws/s3-uploader';

jest.mock('aws-sdk', () => {
  const putObjectMock = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });

  return {
    S3: jest.fn(() => ({
      putObject: putObjectMock
    }))
  };
});

describe('S3UploaderAdapter', () => {
  it('should call S3.putObject with correct parameters', async () => {
    const adapter = new S3UploaderAdapter();
    const fileName = 'test.txt';
    const content = Buffer.from('mock content');
    const bucket = 'test-bucket';

    await expect(adapter.upload(fileName, content, bucket)).resolves.toBeUndefined();

    const s3Instance = (AWS.S3 as unknown as jest.Mock).mock.results[0].value;
    expect(s3Instance.putObject).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: fileName,
      Body: content
    });
  });
});
