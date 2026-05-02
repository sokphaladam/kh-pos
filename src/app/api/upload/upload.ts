import { s3 } from "@/lib/minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function uploadFileMinIO(req: Request) {
  const { fileName, fileContent } = await req.json();

  const command = new PutObjectCommand({
    Bucket: "images",
    Key: fileName,
    Body: Buffer.from(fileContent, "base64"), // if sending base64
    ContentType: "image/jpeg", // adjust as needed
  });

  await s3.send(command);

  return NextResponse.json(
    {
      url: `https://image.mood.international/images/${fileName}`,
    },
    { status: 200 },
  );
}

export async function getFileMinIo() {
  return NextResponse.json({ message: "Hello from Next.js App Router API!" });
}
