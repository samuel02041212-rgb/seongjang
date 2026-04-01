import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

/** `next build` 중 Prisma 모듈이 일부 로딩될 때만 쓰임. 실제 DB 연결은 하지 않음(쿼리 없음). */
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

function createPool(connectionString: string): Pool {
  const serverless =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  return new Pool({
    connectionString,
    // Vercel(서버리스) + Neon: 연결 수 1·짧은 타임아웃이 안정적
    max: serverless ? 1 : 10,
    connectionTimeoutMillis: serverless ? 15_000 : 10_000,
    idleTimeoutMillis: serverless ? 20_000 : 30_000,
  });
}

function createPrisma(): PrismaClient {
  const connectionString = resolveDatabaseUrl();
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

/**
 * 첫 DB 접근 시점에만 연결을 만든다. Vercel 빌드 등에서 모듈만 로드될 때는
 * DATABASE_URL 이 없어도 되게 하려는 목적(런타임·로컬 dev에는 반드시 설정).
 */
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
