import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

const BUILD_PLACEHOLDER_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable&connect_timeout=1";

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return BUILD_PLACEHOLDER_DATABASE_URL;
  }
  throw new Error("DATABASE_URL is not set");
}

function isNeonConnectionString(url: string): boolean {
  return /\.neon\.tech\b/i.test(url) || /neon\.database\./i.test(url);
}

function configureNeonWebSocket(): void {
  if (typeof globalThis.WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }
}

function createPool(connectionString: string): Pool {
  const serverless =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  return new Pool({
    connectionString,
    max: serverless ? 1 : 10,
    connectionTimeoutMillis: serverless ? 15_000 : 10_000,
    idleTimeoutMillis: serverless ? 20_000 : 30_000,
  });
}

function createPrisma(): PrismaClient {
  const connectionString = resolveDatabaseUrl();

  if (isNeonConnectionString(connectionString)) {
    configureNeonWebSocket();
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }

  const pool = globalForPrisma.pool ?? createPool(connectionString);
  if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrisma();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
