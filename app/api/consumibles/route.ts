import { NextRequest, NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

