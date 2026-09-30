import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.cyakiyqnpfveneucekyu:d3UTr8J8qlRUS8rw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function main() {
  const email = 'demo@example.com';
  const password = 'password123';
  
  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email,
      name: 'Demo User',
      passwordHash: hashedPassword,
    },
  });
  
  console.log(`Demo account ready: ${user.email} / ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
