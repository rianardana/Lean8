// Run: node scripts/generate-vapid.cjs
// Outputs VAPID keys for .env / Vercel env vars (required for Android PWA Web Push).
try {
  const webpush = require("web-push");
  const keys = webpush.generateVAPIDKeys();
  console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
  console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
  console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
  console.log("VAPID_SUBJECT=mailto:admin@leanmode.app");
  console.log("CRON_SECRET=<set-a-random-secret>");
} catch (e) {
  console.error("Failed. Run `npm install` in frontend/ first.", e && e.message ? e.message : e);
  process.exit(1);
}
