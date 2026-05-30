import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PrestamoItem = {
  activoId?: number;
  consumibleId?: number;
  cantidad: number;
};

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const usuarioId = Number(body.usuarioId ?? 0);
    const items = Array.isArray(body.items) ? body.items as PrestamoItem[] : [];
    const fechaSalida = body.fechaSalida ? new Date(String(body.fechaSalida)) : new Date();
    const fechaDevolucion = body.fechaDevolucion ? new Date(String(body.fechaDevolucion)) : null;
    const notas = body.notas ? String(body.notas).trim() : null;
    const creadoPorId = body.creadoPorId ? Number(body.creadoPorId) : null;

    if (!usuarioId || items.length === 0) {
      return NextResponse.json({ error: "Usuario y elementos del préstamo son obligatorios." }, { status: 400 });
    }

    const prestamo = await prisma.$transaction(async (tx) => {
      const createdPrestamo = await tx.prestamo.create({
        data: {
          usuarioId,
          estado: "ACTIVO",
          fechaSalida,
          fechaDevolucion,
          notas,
        },
      });

      for (const item of items) {
        if (item.activoId) {
          const activo = await tx.activo.findUnique({ where: { id: item.activoId } });
          if (!activo || activo.estado !== "DISPONIBLE") {
            throw new Error(`Activo ${item.activoId} no disponible`);
          }

          await tx.activo.update({
            where: { id: item.activoId },
            data: { estado: "PRESTADO" },
          });

          await tx.prestamoDetalle.create({
            data: {
              prestamoId: createdPrestamo.id,
              activoId: item.activoId,
              cantidad: item.cantidad || 1,
            },
          });
        }

        if (item.consumibleId) {
          const consumible = await tx.consumible.findUnique({ where: { id: item.consumibleId } });
          const cantidad = item.cantidad || 1;
          if (!consumible || consumible.stock < cantidad) {
            throw new Error(`Consumible ${item.consumibleId} sin stock suficiente`);
          }

          await tx.consumible.update({
            where: { id: item.consumibleId },
            data: { stock: consumible.stock - cantidad },
          });

          await tx.prestamoDetalle.create({
            data: {
              prestamoId: createdPrestamo.id,
              consumibleId: item.consumibleId,
              cantidad: cantidad,
            },
          });
        }
      }

      await tx.movimiento.create({
        data: {
          tipo: "PRESTAMO",
          entity: "Prestamo",
          entityId: createdPrestamo.id,
          descripcion: `Registro de préstamo para usuario ${usuarioId}`,
          creadoPorId,
          prestamoId: createdPrestamo.id,
        },
      });

      return createdPrestamo;
    });

    return NextResponse.json({ prestamo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo registrar el préstamo." }, { status: 500 });
  }
}
