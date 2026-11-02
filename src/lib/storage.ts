import "server-only";

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

// Images live in a Cloudflare R2 bucket (S3-compatible API). Uploads go through our Server
// Actions; visitors load them from the bucket's public URL (r2.dev or a custom domain).
// Until the R2_* vars are set the app still runs: images are hidden and uploads fail cleanly.

type R2Config = { client: S3Client; bucket: string; publicUrl: string };

let config: R2Config | null | undefined;

function r2(): R2Config | null {
  if (config !== undefined) return config;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = env;
  config =
    R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL
      ? {
          client: new S3Client({
            region: "auto",
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
          }),
          bucket: R2_BUCKET,
          publicUrl: R2_PUBLIC_URL.replace(/\/$/, ""),
        }
      : null;
  return config;
}

export function isStorageConfigured(): boolean {
  return r2() !== null;
}

function requireR2(): R2Config {
  const r2Config = r2();
  if (!r2Config) throw new Error("R2 storage is not configured (R2_* env vars)");
  return r2Config;
}

export function publicObjectUrl(key: string): string | null {
  const r2Config = r2();
  return r2Config ? `${r2Config.publicUrl}/${key}` : null;
}

export async function putPublicObject(
  key: string,
  body: Uint8Array | string,
  contentType: string,
): Promise<void> {
  const { client, bucket } = requireR2();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are versioned per upload, so objects never change in place.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = requireR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// Deletes every object under a prefix, e.g. all of one user's images ("<userId>/").
export async function deleteObjectsWithPrefix(prefix: string): Promise<number> {
  const { client, bucket } = requireR2();
  let deleted = 0;
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (page.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : []));
    await Promise.all(keys.map(deleteObject));
    deleted += keys.length;
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}

export async function checkBucket(): Promise<void> {
  const { client, bucket } = requireR2();
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}
