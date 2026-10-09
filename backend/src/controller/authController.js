const crypto = require("crypto");
const { promisify } = require("util");
const {
  COOKIE_NAME,
  createSessionToken,
  getCookieOptions,
  hasValidSession,
  isTrustedOrigin,
} = require("../middleware/adminAuth");

const scrypt = promisify(crypto.scrypt);
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const isAuthConfigured = () =>
  Boolean(
    process.env.ADMIN_PASSWORD_HASH &&
      process.env.AUTH_SECRET &&
      process.env.AUTH_SECRET.length >= 32,
  );

const verifyPassword = async (password, storedHash) => {
  const [salt, expectedHex, extra] = storedHash.split(":");
  if (
    extra ||
    !/^[a-f0-9]{32}$/i.test(salt || "") ||
    !/^[a-f0-9]{128}$/i.test(expectedHex || "")
  ) {
    return false;
  }

  const actualHash = await scrypt(password, Buffer.from(salt, "hex"), 64);
  const expectedHash = Buffer.from(expectedHex, "hex");
  return crypto.timingSafeEqual(actualHash, expectedHash);
};

const getAttemptRecord = (key) => {
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    const fresh = { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return current;
};

const login = async (req, res) => {
  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ success: false, message: "Untrusted request origin." });
  }
  if (!isAuthConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Admin authentication is not configured on the server.",
    });
  }

  const key = req.ip || req.socket.remoteAddress || "unknown";
  const attempts = getAttemptRecord(key);
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Try again in 15 minutes.",
    });
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!password || password.length > 1024) {
    attempts.count += 1;
    return res.status(401).json({ success: false, message: "Incorrect password." });
  }
  let valid = false;
  try {
    valid = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  } catch (error) {
    console.error("Admin password verification failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify admin credentials.",
    });
  }

  if (!valid) {
    attempts.count += 1;
    return res.status(401).json({ success: false, message: "Incorrect password." });
  }

  loginAttempts.delete(key);
  res.cookie(COOKIE_NAME, createSessionToken(), getCookieOptions());
  return res.status(200).json({ success: true, authenticated: true });
};

const getSession = (req, res) => {
  res.status(200).json({ success: true, authenticated: hasValidSession(req) });
};

const logout = (req, res) => {
  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ success: false, message: "Untrusted request origin." });
  }
  res.clearCookie(COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
  return res.status(200).json({ success: true });
};

module.exports = { getSession, login, logout };
