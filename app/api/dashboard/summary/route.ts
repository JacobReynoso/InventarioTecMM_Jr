import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [activosTotal, activosDisponibles, activosPrestados, consumiblesTotal, consumiblesBajo] = await Promise.all([
      prisma.activo.count(),
      prisma.activo.count({ where: { estado: "DISPONIBLE" } }),
      prisma.activo.count({ where: { estado: "PRESTADO" } }),
      prisma.consumible.count(),
      prisma.consumible.count({ where: { stock: { lt: 5 } } }),
    ]);

    return NextResponse.json({ activosTotal, activosDisponibles, activosPrestados, consumiblesTotal, consumiblesBajo });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo cargar el resumen del dashboard." }, { status: 500 });
  }
}
