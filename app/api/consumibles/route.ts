import { NextRequest, NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageRole(role: string | null) {
  return role === "admin" || role === "editor";
}

function canDeleteRole(role: string | null) {
  return role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { categoria: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [consumibles, total] = await Promise.all([
      prisma.consumible.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.consumible.count({ where }),
    ]);

    return NextResponse.json(
      {
        consumibles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching consumibles:", error);
    return NextResponse.json(
      { error: "Error fetching consumibles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
    }

    if (role === "lectura") {
      return NextResponse.json({ error: "No tienes permisos para crear consumibles." }, { status: 403 });
    }

    const body = await request.json();
    const { name, categoria, stock, stockMinimo } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del consumible es requerido" },
        { status: 400 }
      );
    }

    const consumible = await prisma.consumible.create({
      data: {
        name,
        categoria: categoria || null,
        stock: stock || 0,
        stockMinimo: stockMinimo || 5,
      },
    });

    return NextResponse.json(consumible, { status: 201 });
  } catch (error) {
    console.error("Error creating consumible:", error);
    return NextResponse.json(
      { error: "Error creating consumible" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!canManageRole(role)) {
      return NextResponse.json({ error: "No tienes permisos para modificar consumibles." }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body.id ?? 0);
    const name = String(body.name || "").trim();
    const categoria = body.categoria ? String(body.categoria).trim() : null;
    const stock = Number(body.stock ?? 0);
    const stockMinimo = Number(body.stockMinimo ?? 5);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de consumible inválido." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "El nombre del consumible es requerido" }, { status: 400 });
    }

    const consumible = await prisma.consumible.update({
      where: { id },
      data: {
        name,
        categoria,
        stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
        stockMinimo: Number.isFinite(stockMinimo) ? Math.max(1, stockMinimo) : 5,
      },
    });

    return NextResponse.json({ consumible });
  } catch (error) {
    console.error("Error updating consumible:", error);
    return NextResponse.json({ error: "Error updating consumible" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!canDeleteRole(role)) {
      return NextResponse.json({ error: "No tienes permisos para eliminar consumibles." }, { status: 403 });
    }

    const id = Number(request.nextUrl.searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de consumible inválido." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.prestamoDetalle.deleteMany({ where: { consumibleId: id } });
      await tx.movimiento.deleteMany({ where: { consumibleId: id } });
      await tx.consumible.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting consumible:", error);
    return NextResponse.json({ error: "Error deleting consumible" }, { status: 500 });
  }
}

