import { S3FileManagerService, S3UploaderAdapter, S3ReaderAdapter } from '../src';

describe('index.ts exports', () => {
  it('should export S3FileManagerService', () => {
    expect(S3FileManagerService).toBeDefined();
  });

  it('should export S3UploaderAdapter', () => {
    expect(S3UploaderAdapter).toBeDefined();
  });

  it('should export S3ReaderAdapter', () => {
    expect(S3ReaderAdapter).toBeDefined();
  });
});