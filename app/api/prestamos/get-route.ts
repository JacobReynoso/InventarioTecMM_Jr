import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const estado = searchParams.get("estado") || "";

    const skip = (page - 1) * limit;

    const where = estado
      ? { estado: estado as any }
      : {};

    const [prestamos, total] = await Promise.all([
      prisma.prestamo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          detalles: {
            include: {
              activo: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                },
              },
              consumible: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.prestamo.count({ where }),
    ]);

    return NextResponse.json(
      {
        prestamos,
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
    console.error("Error fetching prestamos:", error);
    return NextResponse.json(
      { error: "Error fetching prestamos" },
      { status: 500 }
    );
  }
}
