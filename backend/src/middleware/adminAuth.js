const crypto = require("crypto");

const COOKIE_NAME = "portfolio_admin_session";
const SESSION_LENGTH_SECONDS = 7 * 24 * 60 * 60;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3001";

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_LENGTH_SECONDS * 1000,
});

const isTrustedOrigin = (req) => req.get("origin") === FRONTEND_ORIGIN;

const parseCookies = (header = "") =>
  Object.fromEntries(
    header.split(";").map((cookie) => {
      const separator = cookie.indexOf("=");
      if (separator < 0) return ["", ""];
      return [
        cookie.slice(0, separator).trim(),
        cookie.slice(separator + 1).trim(),
      ];
    }),
  );

const sign = (payload) =>
  crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(payload)
    .digest("base64url");

const createSessionToken = () => {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS,
      sid: crypto.randomBytes(32).toString("base64url"),
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const hasValidSession = (req) => {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (
    !token ||
    !process.env.AUTH_SECRET ||
    process.env.AUTH_SECRET.length < 32
  ) {
    return false;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  const expectedSignature = Buffer.from(sign(payload));
  const providedSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== providedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Number.isInteger(session.exp) && session.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const requireAdmin = (req, res, next) => {
  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    !isTrustedOrigin(req)
  ) {
    return res.status(403).json({ success: false, message: "Untrusted request origin." });
  }

  if (!hasValidSession(req)) {
    return res.status(401).json({ success: false, message: "Admin login required." });
  }

  next();
};

module.exports = {
  COOKIE_NAME,
  FRONTEND_ORIGIN,
  SESSION_LENGTH_SECONDS,
  createSessionToken,
  getCookieOptions,
  hasValidSession,
  isTrustedOrigin,
  requireAdmin,
};
