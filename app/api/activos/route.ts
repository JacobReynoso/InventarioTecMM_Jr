import { NextResponse } from "next/server";
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
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const barcode = body.barcode ? String(body.barcode).trim() : null;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const estado = (String(body.estado ?? "DISPONIBLE").toUpperCase() as
      | "DISPONIBLE"
      | "PRESTADO"
      | "MANTENIMIENTO"
      | "RETIRADO");

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
        estado,
      },
    });

    return NextResponse.json({ activo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo crear el activo." }, { status: 500 });
  }
}
