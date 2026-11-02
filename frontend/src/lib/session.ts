import { headers } from "next/headers";
import { firebaseAdminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function getSessionUserId(): Promise<number | null> {
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  if (!firebaseAdminAuth) return null;
  let decoded: { uid: string; email?: string; name?: string };
  try {
    decoded = await firebaseAdminAuth.verifyIdToken(token);
  } catch {
    return null;
  }

  const email = decoded.email;
  if (!email) return null;

  let user = await prisma.user.findFirst({
    where: { OR: [{ firebaseUid: decoded.uid }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: decoded.name || email.split("@")[0],
        email,
        firebaseUid: decoded.uid,
        onboardingCompleted: false,
      },
    });
  } else if (!user.firebaseUid) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid: decoded.uid },
    });
  }

  return user.id;
}
