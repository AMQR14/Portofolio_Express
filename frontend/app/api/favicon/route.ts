import { NextResponse } from "next/server";

// Same env var used by next.config.ts rewrites
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function GET(request: Request) {
  try {
    const res = await fetch(`${BACKEND_URL}/profile`, {
      next: { revalidate: 60 }, // re-fetch at most once per minute
    });
    const data = await res.json() as {
      success?: boolean;
      data?: { avatar?: string };
    };

    const avatarUrl = data?.success && data?.data?.avatar;

    if (typeof avatarUrl === "string" && avatarUrl.startsWith("http")) {
      // Redirect browser directly to the hosted avatar image
      return NextResponse.redirect(avatarUrl, { status: 307 });
    }
  } catch {
    // fall through to static favicon
  }

  // Fall back to the built-in favicon.ico
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/favicon.ico`, { status: 307 });
}
