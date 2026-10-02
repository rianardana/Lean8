import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Yan', email: 'yan@leanmode.app', currentWeight: 86, targetWeight: 65 } })
  await prisma.user.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Wahyu', email: 'wahyu@leanmode.app', currentWeight: 86, targetWeight: 65 } })
}
main().finally(() => prisma.$disconnect())
