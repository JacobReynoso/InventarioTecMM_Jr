import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { description: "Administrador del sistema" },
    create: { name: "admin", description: "Administrador del sistema" },
  });

  await prisma.role.upsert({
    where: { name: "usuario" },
    update: { description: "Acceso básico para usuarios" },
    create: { name: "usuario", description: "Acceso básico para usuarios" },
  });

  const readOnlyRole = await prisma.role.upsert({
    where: { name: "lectura" },
    update: { description: "Acceso de solo lectura" },
    create: { name: "lectura", description: "Acceso de solo lectura" },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: { description: "Puede crear, modificar y ver, pero no eliminar" },
    create: { name: "editor", description: "Puede crear, modificar y ver, pero no eliminar" },
  });

  const adminPassword = await hash("admin123", 10);
  const alumnoPassword = await hash("alu123", 10);
  const asistentePassword = await hash("asis123", 10);

  await prisma.user.upsert({
    where: { email: "admin@instituto.edu" },
    update: { name: "Administrador", password: adminPassword },
    create: {
      name: "Administrador",
      email: "admin@instituto.edu",
      password: adminPassword,
      role: { connect: { id: adminRole.id } },
    },
  });

  await prisma.user.upsert({
    where: { email: "alu@instituto.edu" },
    update: { name: "Alumno", password: alumnoPassword, role: { connect: { id: readOnlyRole.id } } },
    create: {
      name: "Alumno",
      email: "alu@instituto.edu",
      password: alumnoPassword,
      role: { connect: { id: readOnlyRole.id } },
    },
  });

  await prisma.user.upsert({
    where: { email: "asis@instituto.edu" },
    update: { name: "Asistente", password: asistentePassword, role: { connect: { id: editorRole.id } } },
    create: {
      name: "Asistente",
      email: "asis@instituto.edu",
      password: asistentePassword,
      role: { connect: { id: editorRole.id } },
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
