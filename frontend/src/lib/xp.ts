import { prisma } from "@/lib/prisma";

export async function awardXp(userId: number, kind: string, refKey: string, amount: number): Promise<number> {
  if (amount <= 0) return 0;
  try {
    await prisma.xpEvent.create({ data: { userId, kind, refKey, amount } });
  } catch {
    return 0; // already awarded
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  const newXp = (user?.xp ?? 0) + amount;
  const newLevel = Math.floor(newXp / 100) + 1;
  await prisma.user.update({ where: { id: userId }, data: { xp: newXp, level: newLevel } });
  return amount;
}
