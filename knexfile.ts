import dotenv from "dotenv";
import { Knex } from "knex";

dotenv.config();
// Update with your config settings.
const dbConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: process.env.DB_MAIN,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./src/lib/db/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./src/lib/db/seeds",
    },
  },
  production: {
    client: "mysql2",
    connection: process.env.DB_MAIN,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./src/lib/db/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./src/lib/db/seeds",
    },
  },
};

export default dbConfig;
