import "server-only";

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

// Neon Object Storage bucket declared in neon.ts (access: public_read).
export const AVATARS_BUCKET = "avatars";

// Credentials, endpoint and region come from the AWS_* vars Neon injects.
// Neon requires path-style addressing.
const s3 = new S3Client({ forcePathStyle: true });

export function publicObjectUrl(key: string): string {
  return `${env.AWS_ENDPOINT_URL_S3.replace(/\/$/, "")}/${AVATARS_BUCKET}/${key}`;
}

export async function putPublicObject(
  key: string,
  body: Uint8Array | string,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: AVATARS_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are versioned per upload, so objects never change in place.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: AVATARS_BUCKET, Key: key }));
}

// Deletes every object under a prefix, e.g. all of one user's images ("<userId>/").
export async function deleteObjectsWithPrefix(prefix: string): Promise<number> {
  let deleted = 0;
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: AVATARS_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const keys = (page.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : []));
    await Promise.all(keys.map(deleteObject));
    deleted += keys.length;
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}

export async function checkBucket(): Promise<void> {
  await s3.send(new HeadBucketCommand({ Bucket: AVATARS_BUCKET }));
}
