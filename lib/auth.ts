import { verify, sign } from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const EXPIRES_IN = "2h";

export function createToken(payload: Record<string, unknown>) {
  return sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getBearerToken(request: Pick<NextRequest, "headers"> | Request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "").trim();
}

export function getRequestRole(request: Pick<NextRequest, "headers"> | Request) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token) as { role?: string } | null;
  return typeof payload?.role === "string" ? payload.role : null;
}
