import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["firebase-admin", "firebase-admin/app", "firebase-admin/auth"],
};

export default nextConfig;
