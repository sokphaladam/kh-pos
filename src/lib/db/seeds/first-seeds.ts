import { Formatter } from "@/lib/formatter";
import { readFileSync } from "fs";
import { Knex } from "knex";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export async function seed(knex: Knex): Promise<void> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sqlFilePath = resolve(__dirname, "../database.sql");
  const sql = readFileSync(sqlFilePath, "utf8");

  const seedName = "first-seeds";
  const dbName = "bayon";

  await knex.raw(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await knex.raw(`USE \`${dbName}\`;`);

  await knex.schema.hasTable("seeds_log").then(async (exists) => {
    if (!exists) {
      console.log("Creating seeds_log table...");
      await knex.schema.createTable("seeds_log", (table) => {
        table.increments("id").primary();
        table.string("seed_name").notNullable().unique();
        table.timestamp("applied_at").notNullable();
      });
      console.log("seeds_log table created.");
    }
  });

  // Check if the seed has already been applied
  const seedExists = await knex("seeds_log")
    .where({ seed_name: seedName })
    .first();
  if (seedExists) {
    console.log(`Seed "${seedName}" has already been applied. Skipping.`);
    return;
  }

  const statements = sql.split(";");
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
      console.log(`Executing SQL statement: ${trimmedStatement}`);
      await knex.raw(trimmedStatement + ";");
    }
  }

  // Log the seed execution
  await knex("seeds_log").insert({
    seed_name: seedName,
    applied_at: knex.fn.now(),
  });

  // Insert user roles and permissions

  const initialUserRoles = [
    {
      id: "404a9109-d8bd-47c3-8806-ba2b559db018",
      role: "OWNER",
      created_at: Formatter.getNowDateTime(),
      is_default: 1,
      permissions: null,
    },
    {
      id: "a24ad104-bc07-47fd-886c-c26370722192",
      role: "Cashier",
      created_at: Formatter.getNowDateTime(),
      is_default: 0,
      permissions:
        '{"order": "create,read,update", "shift": "create,read,update", "expiry": "create,read,update", "product": "read,create,update", "category": "read", "end-of-day": "create,read,update,delete", "restaurant": "read,update,create", "sale-report": "create,read,update,delete", "sale-breakdown": "create,read,update", "sale-item-report": "create,read,update,delete", "order-preparation": "create,read,update"}',
    },
    {
      id: "c089c2dc-b435-4711-9562-2e772def0dd8",
      role: "SUPERVISOR",
      created_at: Formatter.getNowDateTime(),
      is_default: 0,
      permissions:
        '{"order": "create,read,update", "shift": "create,read,update", "expiry": "create,read,update,delete", "payment": "create,read,update", "product": "create,read,update,delete", "setting": "create,read,update", "category": "create,read,update", "transfer": "create,read,update", "dashboard": "create,read,update,delete", "end-of-day": "create,read,update,delete", "restaurant": "create,read,update", "sale-report": "create,read,update,delete", "transaction": "create,read,update", "purchase-order": "create,read,update", "sale-breakdown": "create,read,update,delete", "sale-item-report": "create,read,update,delete", "order-preparation": "create,read,update"}',
    },
    {
      id: "f7c33b45-0208-4dc0-9795-2819f3e8df7a",
      role: "Service",
      created_at: Formatter.getNowDateTime(),
      is_default: 0,
      permissions:
        '{"order": "create,read,update,delete", "restaurant": "read,delete,create,update", "order-preparation": "read,create,update,delete"}',
    },
  ];

  await knex("user_role").insert(initialUserRoles);

  console.log("Database seeded successfully.");
}
