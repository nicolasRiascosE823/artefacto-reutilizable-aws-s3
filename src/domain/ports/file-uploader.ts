export interface FileUploaderPort {
    upload(fileName: string, content: Buffer, bucket: string): Promise<void>;
}