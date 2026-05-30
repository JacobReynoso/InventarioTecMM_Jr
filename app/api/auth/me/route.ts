import { NextResponse, NextRequest } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
  }

  const payload = verifyToken(token) as { userId?: number } | null;
  if (!payload?.userId) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role?.name || "usuario",
  });
}
