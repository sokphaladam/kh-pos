import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: "http://10.100.10.68:9002", // MinIO API port
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true, // required for MinIO
});
