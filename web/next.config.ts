import type { NextConfig } from "next";

import pkg from "./package.json";

const authDevSessionEpoch =
  process.env.NODE_ENV === "production"
    ? undefined
    : String(Date.now());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    ...(authDevSessionEpoch
      ? { AUTH_DEV_SESSION_EPOCH: authDevSessionEpoch }
      : {}),
  },
};

export default nextConfig;
