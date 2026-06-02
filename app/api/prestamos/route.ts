import { NextRequest, NextResponse } from "next/server";
import { getRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PrestamoItem = {
  activoId?: number;
  consumibleId?: number;
  cantidad: number;
};

type PrestamoEstado = "PENDIENTE" | "ACTIVO" | "DEVUELTO" | "CANCELADO";

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
    const estado = searchParams.get("estado") || "";

    const skip = (page - 1) * limit;

    const where = estado
      ? {
          estado: {
            in: estado.split(",").map((s) => s.trim() as PrestamoEstado),
          },
        }
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
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: "Token no enviado." }, { status: 401 });
    }

    if (role === "lectura") {
      return NextResponse.json({ error: "No tienes permisos para registrar préstamos." }, { status: 403 });
    }

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

    // Validar disponibilidad de stock primero
    let allItemsAvailable = true;
    for (const item of items) {
      if (item.activoId) {
        const activo = await prisma.activo.findUnique({ where: { id: item.activoId } });
        if (!activo || activo.estado !== "DISPONIBLE") {
          allItemsAvailable = false;
          break;
        }
      }
      if (item.consumibleId) {
        const consumible = await prisma.consumible.findUnique({ where: { id: item.consumibleId } });
        const cantidad = item.cantidad || 1;
        if (!consumible || consumible.stock < cantidad) {
          allItemsAvailable = false;
          break;
        }
      }
    }

    const prestamo = await prisma.$transaction(async (tx) => {
      // Si hay stock, crear ACTIVO; si no, crear PENDIENTE
      const estado: PrestamoEstado = allItemsAvailable ? "ACTIVO" : "PENDIENTE";
      
      const createdPrestamo = await tx.prestamo.create({
        data: {
          usuarioId,
          estado,
          fechaSalida,
          fechaDevolucion,
          notas,
        },
      });

      // Solo procesar inventario si estado es ACTIVO
      if (allItemsAvailable) {
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
      } else {
        // Si es PENDIENTE, solo crear los detalles sin afectar el inventario
        for (const item of items) {
          if (item.activoId) {
            await tx.prestamoDetalle.create({
              data: {
                prestamoId: createdPrestamo.id,
                activoId: item.activoId,
                cantidad: item.cantidad || 1,
              },
            });
          }

          if (item.consumibleId) {
            await tx.prestamoDetalle.create({
              data: {
                prestamoId: createdPrestamo.id,
                consumibleId: item.consumibleId,
                cantidad: item.cantidad || 1,
              },
            });
          }
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

    return NextResponse.json({ 
      prestamo,
      insufficientStock: !allItemsAvailable,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating prestamo:", error);
    return NextResponse.json({ error: "No se pudo registrar el préstamo." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!canManageRole(role)) {
      return NextResponse.json({ error: "No tienes permisos para modificar préstamos." }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body.id ?? 0);
    const usuarioId = Number(body.usuarioId ?? 0);
    const items = Array.isArray(body.items) ? (body.items as PrestamoItem[]) : [];
    const estado = String(body.estado || "ACTIVO") as PrestamoEstado;
    const fechaSalida = body.fechaSalida ? new Date(String(body.fechaSalida)) : new Date();
    const fechaDevolucion = body.fechaDevolucion ? new Date(String(body.fechaDevolucion)) : null;
    const notas = body.notas ? String(body.notas).trim() : null;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de préstamo inválido." }, { status: 400 });
    }

    if (!usuarioId || items.length === 0) {
      return NextResponse.json({ error: "Usuario y elementos del préstamo son obligatorios." }, { status: 400 });
    }

    if (!["PENDIENTE", "ACTIVO", "DEVUELTO", "CANCELADO"].includes(estado)) {
      return NextResponse.json({ error: "Estado de préstamo inválido." }, { status: 400 });
    }

    const prestamo = await prisma.$transaction(async (tx) => {
      const existing = await tx.prestamo.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!existing) {
        throw new Error("Prestamo no encontrado");
      }

      for (const detalle of existing.detalles) {
        if (detalle.activoId) {
          await tx.activo.update({
            where: { id: detalle.activoId },
            data: { estado: "DISPONIBLE" },
          });
        }

        if (detalle.consumibleId) {
          const consumible = await tx.consumible.findUnique({ where: { id: detalle.consumibleId } });
          if (consumible) {
            await tx.consumible.update({
              where: { id: detalle.consumibleId },
              data: { stock: consumible.stock + detalle.cantidad },
            });
          }
        }
      }

      await tx.prestamoDetalle.deleteMany({ where: { prestamoId: id } });

      const shouldAffectInventory = estado === "ACTIVO" || estado === "PENDIENTE";

      for (const item of items) {
        if (item.activoId) {
          if (shouldAffectInventory) {
            const activo = await tx.activo.findUnique({ where: { id: item.activoId } });
            if (!activo || activo.estado !== "DISPONIBLE") {
              throw new Error(`Activo ${item.activoId} no disponible`);
            }

            await tx.activo.update({
              where: { id: item.activoId },
              data: { estado: "PRESTADO" },
            });
          }

          await tx.prestamoDetalle.create({
            data: {
              prestamoId: id,
              activoId: item.activoId,
              cantidad: item.cantidad || 1,
            },
          });
        }

        if (item.consumibleId) {
          const cantidad = item.cantidad || 1;
          if (shouldAffectInventory) {
            const consumible = await tx.consumible.findUnique({ where: { id: item.consumibleId } });
            if (!consumible || consumible.stock < cantidad) {
              throw new Error(`Consumible ${item.consumibleId} sin stock suficiente`);
            }

            await tx.consumible.update({
              where: { id: item.consumibleId },
              data: { stock: consumible.stock - cantidad },
            });
          }

          await tx.prestamoDetalle.create({
            data: {
              prestamoId: id,
              consumibleId: item.consumibleId,
              cantidad,
            },
          });
        }
      }

      const updated = await tx.prestamo.update({
        where: { id },
        data: {
          usuarioId,
          estado,
          fechaSalida,
          fechaDevolucion,
          notas,
        },
        include: {
          detalles: {
            include: {
              activo: true,
              consumible: true,
            },
          },
        },
      });

      await tx.movimiento.create({
        data: {
          tipo: "MODIFICACION",
          entity: "Prestamo",
          entityId: id,
          descripcion: `Actualización de préstamo ${id}`,
          prestamoId: id,
        },
      });

      return updated;
    });

    return NextResponse.json({ prestamo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar el préstamo." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!canDeleteRole(role)) {
      return NextResponse.json({ error: "No tienes permisos para eliminar préstamos." }, { status: 403 });
    }

    const id = Number(request.nextUrl.searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID de préstamo inválido." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.prestamo.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!existing) {
        throw new Error("Prestamo no encontrado");
      }

      for (const detalle of existing.detalles) {
        if (detalle.activoId) {
          await tx.activo.update({
            where: { id: detalle.activoId },
            data: { estado: "DISPONIBLE" },
          });
        }

        if (detalle.consumibleId) {
          const consumible = await tx.consumible.findUnique({ where: { id: detalle.consumibleId } });
          if (consumible) {
            await tx.consumible.update({
              where: { id: detalle.consumibleId },
              data: { stock: consumible.stock + detalle.cantidad },
            });
          }
        }
      }

      await tx.prestamoDetalle.deleteMany({ where: { prestamoId: id } });
      await tx.movimiento.deleteMany({ where: { prestamoId: id } });
      await tx.prestamo.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo eliminar el préstamo." }, { status: 500 });
  }
}
