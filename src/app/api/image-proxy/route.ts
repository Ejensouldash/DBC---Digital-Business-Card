import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  // 1. Require authenticated session
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsed = new URL(url);

    // 2. Enforce secure protocols
    if (parsed.protocol !== "https:" && (process.env.NODE_ENV === "production" || parsed.protocol !== "http:")) {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    // 3. SSRF Protection: Block internal, private, loopback, and metadata network endpoints
    const hostname = parsed.hostname.toLowerCase();
    const isPrivateOrInternal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname);

    if (isPrivateOrInternal) {
      return new NextResponse("Access to internal host denied", { status: 403 });
    }

    // 4. Origin Whitelist: Only permit configured R2 storage or site origin
    const allowedHosts = new Set<string>();
    if (env.R2_PUBLIC_URL) {
      try {
        allowedHosts.add(new URL(env.R2_PUBLIC_URL).hostname.toLowerCase());
      } catch {}
    }
    if (env.NEXT_PUBLIC_SITE_URL) {
      try {
        allowedHosts.add(new URL(env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase());
      } catch {}
    }

    if (allowedHosts.size > 0 && !allowedHosts.has(hostname)) {
      return new NextResponse("Host not allowed", { status: 403 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse("Failed to fetch image", { status: res.status });
    }

    // 5. Enforce image-only MIME type and maximum payload size
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MiB

    // Early rejection via header if present
    const contentLength = Number(res.headers.get("content-length"));
    if (contentLength && contentLength > MAX_IMAGE_BYTES) {
      return new NextResponse("Image too large", { status: 413 });
    }

    if (!res.body) {
      return new NextResponse("Empty response body", { status: 400 });
    }

    // Stream-based byte counting to prevent unbounded memory allocation
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > MAX_IMAGE_BYTES) {
          await reader.cancel("Response size exceeded 10 MiB limit");
          return new NextResponse("Image too large", { status: 413 });
        }
        chunks.push(value);
      }
    }

    // Combine chunks into single Uint8Array
    const combined = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new NextResponse(combined, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": env.NEXT_PUBLIC_SITE_URL,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
