import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { pool } from "@workspace/db";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: "student" | "admin";
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authTokenId?: string;
    }
  }
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required to sign access tokens.");
}

const accessTokenLifetimeSeconds = 60 * 60 * 24 * 7;
const scryptAsync = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });

const base64url = (value: string) => Buffer.from(value).toString("base64url");
const signatureFor = (value: string) =>
  createHmac("sha256", sessionSecret).update(value).digest("base64url");

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [scheme, salt, savedHex] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !savedHex) return false;
  const actual = await scryptAsync(password, salt);
  const expected = Buffer.from(savedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAccessToken(user: AuthUser) {
  const now = Math.floor(Date.now() / 1000);
  const tokenId = randomUUID();
  const payload = {
    sub: String(user.id),
    role: user.role,
    jti: tokenId,
    iat: now,
    exp: now + accessTokenLifetimeSeconds,
  };
  const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(payload))}`;
  const token = `${unsigned}.${signatureFor(unsigned)}`;
  await pool.query(
    "INSERT INTO sessions (token_id, user_id, expires_at) VALUES ($1, $2, to_timestamp($3))",
    [tokenId, user.id, payload.exp],
  );
  return { token, tokenId, expiresIn: accessTokenLifetimeSeconds };
}

function decodeToken(token: string): { userId: number; tokenId: string; role: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signatureFor(unsigned));
  const received = Buffer.from(parts[2] ?? "");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as {
      sub?: string;
      role?: string;
      jti?: string;
      exp?: number;
    };
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || !payload.jti || !payload.exp || payload.exp <= Date.now() / 1000) {
      return null;
    }
    return { userId, tokenId: payload.jti, role: payload.role ?? "student" };
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = decodeToken(token);
  if (!decoded) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  try {
    const result = await pool.query<{
      id: number;
      name: string;
      email: string;
      mobile: string;
      role: "student" | "admin";
    }>(
      `SELECT u.id, u.name, u.email, u.mobile, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_id = $1 AND s.user_id = $2 AND s.expires_at > NOW()`,
      [decoded.tokenId, decoded.userId],
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ message: "Your session has expired. Please sign in again." });
      return;
    }
    req.authUser = user;
    req.authTokenId = decoded.tokenId;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.authUser?.role !== "admin") {
    res.status(403).json({ message: "Administrator access is required." });
    return;
  }
  next();
}