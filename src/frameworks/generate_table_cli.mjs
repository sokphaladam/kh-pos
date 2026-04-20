import * as dotenv from "dotenv";
import * as fs from "fs";
import { fileURLToPath } from "url";

// Helper function to check if a file exists
const fileExists = (path) => {
  try {
    return fs.existsSync(path);
  } catch (err) {
    return err.code !== "ENOENT";
  }
};

// Load dotenv configurations
const envPath = new URL("../../.env", import.meta.url);
const envLocalPath = new URL("../../.env.local", import.meta.url);

// Always try to load .env first (for default values)
if (fileExists(fileURLToPath(envPath))) {
  dotenv.config({ path: envPath });
}

// Then load .env.local if it exists (to override defaults)
if (fileExists(fileURLToPath(envLocalPath))) {
  dotenv.config({ path: envLocalPath });
}

import { program } from "commander";
import pkg, { createConnection } from "mysql2/promise";
import {
  generateTableCreationCode,
  getCurrentDatabaseName,
} from "./generate_table.mjs";
const { createConnection: createConnectionPromise } = pkg;

function getImportFile(prefix) {
  if (!prefix) return "./src/generated/tables.ts";
  return `./src/generated/${prefix}_tables.ts`;
}

function getTableFolder(prefix) {
  if (!prefix) return "./src/generated/tables/";
  return `./src/generated/${prefix}_tables/`;
}

function generateCombinedTableImportFile(prefix) {
  const tables = listGeneratedTable(prefix);
  const finalPrefix = prefix ? `${prefix}_` : "";

  const generatedCode = tables
    .sort()
    .map((x) => `export * from "./${finalPrefix}tables/table_${x}";`)
    .join("\n");

  fs.writeFileSync(getImportFile(prefix), generatedCode + "\n");
}

function listGeneratedTable(prefix) {
  return fs
    .readdirSync(getTableFolder(prefix))
    .map((x) => x.substring(0, x.length - 3).substring(6)); // Adjusted for .mjs
}

async function add(tableName, connection, prefix) {
  let conn;
  if (!connection) {
    conn = await createConnectionPromise({
      host: "localhost",
      user: "root",
      password: "",
      database: "your_default_database",
    });
  } else {
    conn = await createConnection(connection);
  }

  const databaseName = await getCurrentDatabaseName(conn);
  const generatedCode = await generateTableCreationCode(
    conn,
    databaseName,
    tableName,
    prefix
  );

  const finalPrefix = prefix ? `${prefix}_` : "";
  fs.writeFileSync(
    getTableFolder(prefix) + `table_${finalPrefix}${tableName}.ts`,
    generatedCode
  );
  generateCombinedTableImportFile(prefix);
}

program.description("Generating table typescript");
program
  .command("add")
  .argument("<table_name>", "Table name")
  .option("-c, --connection <connection>", "Database connection string")
  .option("-p, --prefix <prefix>", "Table prefix")
  .action((tableName, options) => {
    let connection = options.connection || process.env.DB_MAIN;
    let prefix = options.prefix || "";

    if (!connection) {
      console.log(
        "Warning: No connection string provided. Using default connection."
      );
    }

    add(tableName, connection, prefix)
      .then(() => process.exit(0))
      .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
      });
  });

program.parse();
