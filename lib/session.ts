export function getTokenRoleFromToken(token: string | null) {
  if (!token) {
    return null;
  }

  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    return null;
  }

  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}