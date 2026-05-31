import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Administrador del sistema",
  usuario: "Acceso básico para usuarios",
  lectura: "Acceso de solo lectura",
};

function resolveRole(roleName?: string) {
  if (!roleName) {
    return undefined;
  }

  return {
    connectOrCreate: {
      where: { name: roleName },
      create: {
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName] || null,
      },
    },
  };
}

export async function GET() {
  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const role = getRequestRole(request);
  if (!role) {
    return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
  }

  if (role === "lectura") {
    return NextResponse.json({ error: "No tienes permisos para crear usuarios." }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  const roleName = String(body.roleName || body.role || "usuario").trim() || "usuario";

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Nombre, correo y contraseña son obligatorios." }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      role: resolveRole(roleName) ?? {
        connectOrCreate: {
          where: { name: "usuario" },
          create: { name: "usuario", description: ROLE_DESCRIPTIONS.usuario },
        },
      },
    },
    include: { role: true },
  });

  return NextResponse.json(
    {
      usuario: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || null,
      },
    },
    { status: 201 }
  );
}

export async function PUT(request: Request) {
  const role = getRequestRole(request);
  if (!role) {
    return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
  }

  if (role === "lectura") {
    return NextResponse.json({ error: "No tienes permisos para modificar usuarios." }, { status: 403 });
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Se requiere un usuario válido para actualizar." }, { status: 400 });
  }

  const data: {
    name?: string;
    email?: string;
    password?: string;
    role?: ReturnType<typeof resolveRole>;
  } = {};

  if (body.name !== undefined) {
    data.name = String(body.name).trim();
  }

  if (body.email !== undefined) {
    data.email = String(body.email).trim().toLowerCase();
  }

  if (body.password) {
    data.password = await hash(String(body.password), 10);
  }

  if (body.roleName || body.role) {
    data.role = resolveRole(String(body.roleName || body.role).trim());
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  return NextResponse.json({
    usuario: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name || null,
    },
  });
}
