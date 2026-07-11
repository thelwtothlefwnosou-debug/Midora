import { getPgConnectionString, loadEnv } from "./db-env";

async function main() {
  loadEnv();
  const connectionString = getPgConnectionString();
  if (!connectionString) {
    console.log("MISSING_DB_PASSWORD");
    process.exit(2);
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("SELECT 1");
    console.log("DB_CONNECTION_OK");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("DB_CONNECTION_FAILED", err instanceof Error ? err.message : err);
  process.exit(1);
});
