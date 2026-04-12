import type { NextConfig } from "next";

const authDevSessionEpoch =
  process.env.NODE_ENV === "production"
    ? undefined
    : String(Date.now());

const nextConfig: NextConfig = {
  ...(authDevSessionEpoch
    ? { env: { AUTH_DEV_SESSION_EPOCH: authDevSessionEpoch } }
    : {}),
};

export default nextConfig;
