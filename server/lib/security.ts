import { createHash, randomBytes } from "node:crypto";
import type { H3Event } from "nitro/h3";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function newToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Minimal in-memory rate limiter. Good enough for a single-instance demo;
 * a production deployment would back this with a shared store.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function getClientIp(event: H3Event): string {
  const fwd = event.node.req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return event.node.req.socket?.remoteAddress || "unknown";
}

export function getBearer(event: H3Event): string | null {
  const auth = event.node.req.headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    return token.length >= 16 ? token : null;
  }
  return null;
}
