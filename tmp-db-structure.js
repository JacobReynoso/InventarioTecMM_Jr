const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('TABLES:');
    for (const row of tables) {
      console.log(`- ${row.table_name}`);
    }
    console.log('\nCOLUMNS:');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    let currentTable = null;
    for (const col of columns) {
      if (col.table_name !== currentTable) {
        currentTable = col.table_name;
        console.log(`\n${currentTable}`);
      }
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
