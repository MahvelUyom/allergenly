// Runs `prisma migrate deploy` during Vercel production builds.
//
// DATABASE_URL points at Supabase's transaction pooler (port 6543), which
// can't hold the session-level lock Prisma takes while migrating, so the
// command hangs there. For this one command we use DIRECT_URL if it's set,
// otherwise the same pooler host on port 5432 (session mode), which
// supports migrations. The app itself keeps using DATABASE_URL.
//
// A time limit makes a stuck migration fail the build instead of hanging
// it; a failed build leaves the current deployment live.
import { spawn } from "node:child_process";

const TIMEOUT_MS = Number(process.env.MIGRATE_TIMEOUT_MS) || 3 * 60 * 1000;

export function migrationUrl(env) {
  if (env.DIRECT_URL) return env.DIRECT_URL;
  const raw = env.DATABASE_URL;
  if (!raw) return raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") {
    url.port = "5432";
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
  }
  return url.toString();
}

function describe(raw) {
  try {
    const u = new URL(raw);
    return `${u.hostname}:${u.port || "5432"}`;
  } catch {
    return "(unparseable URL)";
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(`[migrate] VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}: skipping migrations (production only).`);
    return;
  }
  const url = migrationUrl(process.env);
  if (!url) {
    console.error("[migrate] No DATABASE_URL or DIRECT_URL set.");
    process.exit(1);
  }
  console.log(`[migrate] Running prisma migrate deploy against ${describe(url)}`);

  const child = spawn("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
    shell: process.platform === "win32",
  });
  const timer = setTimeout(() => {
    console.error(`[migrate] Timed out after ${TIMEOUT_MS / 1000}s; failing the build so the current deployment stays live.`);
    child.kill("SIGKILL");
    process.exit(1);
  }, TIMEOUT_MS);
  child.on("exit", (code) => {
    clearTimeout(timer);
    if (code !== 0) {
      console.error(`[migrate] prisma migrate deploy exited with code ${code}.`);
      process.exit(code ?? 1);
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate-deploy.mjs")) {
  main();
}
