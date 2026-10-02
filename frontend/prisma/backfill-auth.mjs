// One-off backfill: set email + credential login for existing users.
// Run: node prisma/backfill-auth.mjs
import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => (err ? reject(err) : resolve(`${salt}:${key.toString('hex')}`)),
    );
  });
}

const ACCOUNTS = [
  { id: 1, email: 'yan@leanmode.app', password: 'leanmode123' },
  { id: 2, email: 'wahyu@leanmode.app', password: 'leanmode123' },
];

async function main() {
  for (const a of ACCOUNTS) {
    const user = await prisma.user.findUnique({ where: { id: a.id } });
    if (!user) { console.log(`user ${a.id} not found, skip`); continue; }
    if (!user.email) {
      await prisma.user.update({ where: { id: a.id }, data: { email: a.email } });
      console.log(`set email for user ${a.id} -> ${a.email}`);
    }
    const existing = await prisma.account.findFirst({ where: { providerId: 'credential', userId: a.id } });
    if (!existing) {
      const password = await hashPassword(a.password);
      await prisma.account.create({
        data: { providerId: 'credential', accountId: String(a.id), userId: a.id, password },
      });
      console.log(`created credential account for user ${a.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
