import { NextResponse } from "next/server";

export async function GET() {
  const info: Record<string, unknown> = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
    privateKeyHasEscapedNewline: process.env.FIREBASE_PRIVATE_KEY?.includes("\\n") ?? false,
    privateKeyHasRealNewline: process.env.FIREBASE_PRIVATE_KEY?.includes("\n") ?? false,
  };
  try {
    const admin = await import("firebase-admin");
    const { getAuth } = await import("firebase-admin/auth");
    if (!admin.getApps().length) {
      admin.initializeApp({
        credential: admin.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
      });
    }
    const auth = getAuth();
    info.firebaseAdminInit = "ok";
  } catch (err) {
    info.firebaseAdminInit = "failed";
    info.firebaseAdminError = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json(info);
}
