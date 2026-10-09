import type { NextConfig } from "next";

// The browser only ever talks to this Next.js app. Requests to /backend/*
// are forwarded to the Express API, so there is no CORS and the admin login
// cookie stays first-party (it is set on the frontend's own domain).
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
