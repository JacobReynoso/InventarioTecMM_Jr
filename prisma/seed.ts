import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { description: "Administrador del sistema" },
    create: { name: "admin", description: "Administrador del sistema" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "usuario" },
    update: { description: "Acceso básico para usuarios" },
    create: { name: "usuario", description: "Acceso básico para usuarios" },
  });

  const password = await hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@instituto.edu" },
    update: { name: "Administrador", password },
    create: {
      name: "Administrador",
      email: "admin@instituto.edu",
      password,
      role: { connect: { id: adminRole.id } },
    },
  });

  await prisma.activo.createMany({
    data: [
      { name: "Laptop Dell", barcode: "DL-2026-001", ubicacion: "Aula 1", descripcion: "Laptop para docentes" },
      { name: "Proyector Epson", barcode: "EP-3003", ubicacion: "Sala de conferencias", descripcion: "Proyector multimedia" },
    ],
  });

  await prisma.consumible.createMany({
    data: [
      { name: "Cartucho de tinta negro", categoria: "Suministros", stock: 12, stockMinimo: 3 },
      { name: "Papel A4", categoria: "Papel", stock: 240, stockMinimo: 50 },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
