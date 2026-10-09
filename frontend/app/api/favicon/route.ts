import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

// Same env var used by next.config.ts rewrites
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic"; // never cache this route on the CDN

/** Crop image to a square and apply a circular PNG mask */
async function makeCircle(buffer: Buffer): Promise<Buffer> {
  const { width = 256, height = 256 } = await sharp(buffer).metadata();
  const size = Math.min(width, height);

  // SVG circle used as the transparency mask
  const circleSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>` +
      `</svg>`,
  );

  return sharp(buffer)
    .resize(size, size, { fit: "cover", position: "center" })
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function GET() {
  try {
    // 1. Fetch the profile to get the avatar URL
    const profileRes = await fetch(`${BACKEND_URL}/profile`, {
      cache: "no-store",
    });
    const data = (await profileRes.json()) as {
      success?: boolean;
      data?: { avatar?: string };
    };

    const avatarUrl = data?.success && data?.data?.avatar;

    if (typeof avatarUrl === "string" && avatarUrl.startsWith("http")) {
      // 2. Download the raw avatar image
      const imgRes = await fetch(avatarUrl, { cache: "no-store" });
      if (imgRes.ok) {
        const rawBuffer = Buffer.from(await imgRes.arrayBuffer());

        // 3. Crop to a circle and return as PNG
        const circleBuffer = await makeCircle(rawBuffer);
        return new NextResponse(new Uint8Array(circleBuffer), {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            // Browser can cache for 60s, but Vercel's edge CDN must NOT cache this
            "Cache-Control": "public, max-age=60, must-revalidate",
            "Vercel-CDN-Cache-Control": "no-store",
          },
        });
      }
    }
  } catch {
    // fall through to static favicon
  }

  // Fall back to the built-in favicon.ico
  try {
    const icoPath = join(process.cwd(), "public", "favicon.ico");
    const icoBuffer = readFileSync(icoPath);
    return new NextResponse(icoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

