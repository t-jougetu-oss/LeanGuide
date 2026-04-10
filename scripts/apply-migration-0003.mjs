import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

// .env.local を手動で読む
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) {
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const migration = readFileSync(
  "drizzle/0003_familiar_steve_rogers.sql",
  "utf-8"
);
const statements = migration
  .split("--> statement-breakpoint")
  .map((s) => s.trim().replace(/;\s*$/, ""))
  .filter(Boolean);

console.log(`Applying ${statements.length} statements...`);

for (const stmt of statements) {
  console.log("→", stmt.replace(/\s+/g, " ").slice(0, 90));
  await sql.query(stmt);
}

// drizzle migration journal を更新
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf-8"));
const entry = journal.entries.find(
  (e) => e.tag === "0003_familiar_steve_rogers"
);

if (entry) {
  await sql.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await sql.query(
    `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`
  );
  const hash = crypto.createHash("sha256").update(migration).digest("hex");
  await sql.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
    [hash, entry.when]
  );
  console.log("✓ Recorded migration in drizzle.__drizzle_migrations");
}

console.log("✅ Migration 0003 applied");
