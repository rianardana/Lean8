const fs = require("fs");
const path = require("path");
// load .env.local
const envPath = path.join(process.cwd(), ".env.local");
const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
for (const line of lines) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2];
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[m[1]] = v.replace(/\\n/g, "\n");
}
const admin = require("firebase-admin");
if (!admin.getApps().length) {
  admin.initializeApp({
    credential: admin.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}
(async () => {
  const { getAuth } = require("firebase-admin/auth");
  const auth = getAuth();
  const customToken = await auth.createCustomToken("diag-user", { email: "diag@example.com" });
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) { console.log("TOKEN ERROR:", JSON.stringify(data)); return; }
  for (const p of ["/api/auth-debug", "/api/dashboard", "/api/stats"]) {
    const apiRes = await fetch("http://localhost:3000" + p, {
      headers: { Authorization: `Bearer ${data.idToken}` },
    });
    console.log(p, apiRes.status, await apiRes.text());
  }
})();
