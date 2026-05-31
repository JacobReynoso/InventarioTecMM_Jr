import { NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 50);
  const search = String(url.searchParams.get("search") ?? "").trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { barcode: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, activos] = await Promise.all([
    prisma.activo.count({ where }),
    prisma.activo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ]);

  return NextResponse.json({ activos, pagination: { page, limit, total } });
}

export async function POST(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
    }

    if (role === "lectura") {
      return NextResponse.json({ error: "No tienes permisos para crear." }, { status: 403 });
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const barcode = body.barcode ? String(body.barcode).trim() : null;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const estado = String(body.estado ?? "DISPONIBLE").toUpperCase();

    if (!name) {
      return NextResponse.json({ error: "El nombre del activo es obligatorio." }, { status: 400 });
    }

    if (!["DISPONIBLE", "PRESTADO", "MANTENIMIENTO", "RETIRADO"].includes(estado)) {
      return NextResponse.json({ error: "Estado de activo inválido." }, { status: 400 });
    }

    const activo = await prisma.activo.create({
      data: {
        name,
        barcode,
        descripcion,
        ubicacion,
        estado: estado as "DISPONIBLE" | "PRESTADO" | "MANTENIMIENTO" | "RETIRADO",
      },
    });

    return NextResponse.json({ activo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el activo." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
    }

    if (role === "lectura") {
      return NextResponse.json({ error: "No tienes permisos para modificar." }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de activo inválido." }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const barcode = body.barcode ? String(body.barcode).trim() : null;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const estado = String(body.estado ?? "DISPONIBLE").toUpperCase();

    if (!name) {
      return NextResponse.json({ error: "El nombre del activo es obligatorio." }, { status: 400 });
    }

    if (!["DISPONIBLE", "PRESTADO", "MANTENIMIENTO", "RETIRADO"].includes(estado)) {
      return NextResponse.json({ error: "Estado de activo inválido." }, { status: 400 });
    }

    const activo = await prisma.activo.update({
      where: { id },
      data: {
        name,
        barcode,
        descripcion,
        ubicacion,
        estado: estado as "DISPONIBLE" | "PRESTADO" | "MANTENIMIENTO" | "RETIRADO",
      },
    });

    return NextResponse.json({ activo });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el activo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const role = getRequestRole(request);

    if (!role) {
      return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
    }

    if (role === "editor" || role === "lectura") {
      return NextResponse.json({ error: "No tienes permisos para eliminar." }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id") ?? 0);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de activo inválido." }, { status: 400 });
    }

    await prisma.activo.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el activo." }, { status: 500 });
  }
}
