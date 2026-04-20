import knex, { Knex } from "knex";
import dotenv from "dotenv";
import dbConfig from "../../knexfile";
dotenv.config();

// Interface for database connection with query method
interface DatabaseConnection {
  query: (sql: string, callback: (err: Error | null) => void) => void;
}

let knexInstance: Knex | null = null;
let signalHandlersRegistered = false;

// Graceful shutdown function
const gracefulShutdown = async () => {
  if (knexInstance) {
    console.log("Closing database connection...");
    await knexInstance.destroy();
    knexInstance = null;
  }
};

// Register signal handlers once at module level
if (!signalHandlersRegistered) {
  // Handle process termination signals
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("exit", gracefulShutdown);
  signalHandlersRegistered = true;
}

// Create a new Knex instance
function createKnexInstance(): Knex {
  const config = dbConfig[process.env.NODE_ENV || "development"];
  return knex({
    ...config,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false,
      ...config.pool,
      // Add connection setup
      afterCreate: function (
        conn: unknown,
        done: (err: Error | null, conn?: unknown) => void,
      ) {
        // Type assertion for database connection
        const connection = conn as DatabaseConnection;

        // Set connection timeout for MySQL/MariaDB
        if (config.client === "mysql" || config.client === "mysql2") {
          connection.query(
            "SET wait_timeout=28800;",
            function (err: Error | null) {
              if (err) {
                console.error("Failed to set connection timeout:", err);
              }
              done(err, conn);
            },
          );
        } else {
          // For other database types, just proceed
          done(null, conn);
        }
      },
    },
  });
}

export default async function getKnex(): Promise<Knex> {
  if (!knexInstance) {
    knexInstance = createKnexInstance();
  }

  return knexInstance;
}

// Synchronous version for backward compatibility (not recommended for new code)
export function getKnexSync(): Knex {
  if (!knexInstance) {
    knexInstance = createKnexInstance();
  }
  return knexInstance;
}

// Export a function to manually close the connection if needed
export async function closeKnex(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
  }
}
