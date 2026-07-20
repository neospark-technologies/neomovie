import { NextRequest, NextResponse } from "next/server";
import { decryptStreamToken } from "@/lib/security";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Access Denied: Missing secure stream token", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const streamUrl = decryptStreamToken(token);

  if (!streamUrl || (!streamUrl.startsWith("http://") && !streamUrl.startsWith("https://"))) {
    return new NextResponse("Access Denied: Invalid, expired, or tampered stream token", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const userAgent =
      request.headers.get("user-agent") ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    const fetchHeaders: Record<string, string> = {
      "User-Agent": userAgent,
      Accept: "*/*",
      "Accept-Encoding": "identity",
    };

    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    // Set a 6-second connection timeout; if upstream hangs, fall back to direct 307 redirect
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let response: Response;
    try {
      response = await fetch(streamUrl, {
        headers: fetchHeaders,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn(`Upstream proxy fetch failed (${fetchErr?.message}), redirecting directly (307) to CDN:`, streamUrl);
      return NextResponse.redirect(streamUrl, 307);
    }

    if (!response.ok && response.status !== 206) {
      // If upstream rejects the server proxy (e.g. 403 or 5xx due to IP restriction), redirect directly to client
      if (response.status === 403 || response.status >= 500) {
        console.warn(`Upstream proxy returned status ${response.status}, redirecting client directly (307)`);
        return NextResponse.redirect(streamUrl, 307);
      }
      return new NextResponse(`Upstream debrid stream error: ${response.status}`, {
        status: response.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Range, Content-Type, Authorization"
    );
    responseHeaders.set(
      "Access-Control-Expose-Headers",
      "Content-Range, Content-Length, Accept-Ranges"
    );

    const contentType =
      response.headers.get("content-type") || "video/mp4";
    responseHeaders.set("Content-Type", contentType);

    const acceptRanges = response.headers.get("accept-ranges");
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    const contentRange = response.headers.get("content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    const contentLength = response.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Stream proxy error:", error);
    if (streamUrl) {
      return NextResponse.redirect(streamUrl, 307);
    }
    return new NextResponse(`Stream proxy failed: ${error.message}`, {
      status: 500,
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
    },
  });
}
