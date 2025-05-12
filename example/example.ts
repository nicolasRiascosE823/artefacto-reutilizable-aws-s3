// examples/example.ts
import { S3Adapter } from "../src/infrastructure/aws/S3Adapter";
import { FileManager } from "../src/core/useCases/FileManager";

const s3Adapter = new S3Adapter("my-bucket", "us-east-1");
const fileManager = new FileManager(s3Adapter);

async function runExample() {
  try {
    const fileUrl = await fileManager.uploadFile(Buffer.from("Hello, S3!"), "example.txt");
    console.log("File uploaded to:", fileUrl);

    const fileContent = await fileManager.downloadFile("example.txt");
    console.log("File content:", fileContent.toString());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

runExample();