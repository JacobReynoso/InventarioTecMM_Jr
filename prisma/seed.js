/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

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

  const adminPassword = await bcrypt.hash("admin123", 10);
  const alumnoPassword = await bcrypt.hash("alu123", 10);
  const asistentePassword = await bcrypt.hash("asis123", 10);

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
      { name: "Laptop Dell", barcode: "DL-2026-001", ubicacion: "Aula 1", descripcion: "Laptop para docentes", estado: "DISPONIBLE" },
      { name: "Proyector Epson", barcode: "EP-3003", ubicacion: "Sala de conferencias", descripcion: "Proyector multimedia", estado: "DISPONIBLE" },
    ],
    skipDuplicates: true,
  });

  await prisma.consumible.createMany({
    data: [
      { name: "Cartucho de tinta negro", categoria: "Suministros", stock: 12, stockMinimo: 3 },
      { name: "Papel A4", categoria: "Papelería", stock: 240, stockMinimo: 50 },
    ],
    skipDuplicates: true,
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
