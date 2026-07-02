import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

export const s3 = new S3Client({
  endpoint: process.env.UPLOAD_ENDPOINT, // MinIO API port
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET || "minioadmin",
  },
  forcePathStyle: true, // required for MinIO
});
