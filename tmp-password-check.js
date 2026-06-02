const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const users = await prisma.user.findMany();
    const bad = users.filter(u => !/^[\$]2[aby]\$/.test(u.password));
    console.log('total users', users.length);
    console.log('bad password format users', bad.length);
    console.log(bad.map(u => ({ id: u.id, email: u.email, password: u.password })));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
