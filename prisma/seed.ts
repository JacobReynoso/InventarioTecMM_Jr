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

  // Limpiar activos y consumibles existentes
  await prisma.prestamoDetalle.deleteMany({});
  await prisma.prestamo.deleteMany({});
  await prisma.asignacion.deleteMany({});
  await prisma.movimiento.deleteMany({});
  await prisma.activo.deleteMany({});
  await prisma.consumible.deleteMany({});

  // Crear solo los activos especificados
  await prisma.activo.createMany({
    data: [
      { name: "PC Mac", barcode: "MAC-2026-001", ubicacion: "Aula 1", descripcion: "Computadora Mac" },
      { name: "Laptop Alienware", barcode: "AW-2026-002", ubicacion: "Aula 2", descripcion: "Laptop gaming Alienware" },
      { name: "SmartTv LG", barcode: "LG-2026-003", ubicacion: "Sala de conferencias", descripcion: "SmartTV LG 55 pulgadas" },
      { name: "Proyector Epson", barcode: "EP-2026-004", ubicacion: "Sala de conferencias", descripcion: "Proyector multimedia Epson" },
      { name: "Cable HDMI", barcode: "HDMI-2026-005", ubicacion: "Almacén", descripcion: "Cable HDMI 2.0" },
      { name: "Extensión", barcode: "EXT-2026-006", ubicacion: "Almacén", descripcion: "Extensión eléctrica 10m" },
      { name: "Teclado", barcode: "KEY-2026-007", ubicacion: "Almacén", descripcion: "Teclado mecánico inalámbrico" },
      { name: "Mouse", barcode: "MSE-2026-008", ubicacion: "Almacén", descripcion: "Mouse inalámbrico" },
      { name: "Router", barcode: "RTR-2026-009", ubicacion: "Almacén", descripcion: "Router WiFi 6" },
      { name: "Switch", barcode: "SWI-2026-010", ubicacion: "Almacén", descripcion: "Switch de red 24 puertos" },
    ],
  });

  // No crear consumibles para simplificar el demo
  await prisma.consumible.createMany({
    data: [
      { name: "Cartucho de tinta negro", categoria: "Suministros", stock: 0, stockMinimo: 3 },
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
