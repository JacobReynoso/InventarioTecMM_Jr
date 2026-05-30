import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const usuarios = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Nombre, correo y contraseña son obligatorios." }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      role: { connectOrCreate: { where: { name: "usuario" }, create: { name: "usuario", description: "Acceso básico" } } },
    },
  });

  return NextResponse.json({ usuario: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
