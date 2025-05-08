export interface FileReaderPort {
    read(fileName: string, bucket: string): Promise<Buffer>;
}