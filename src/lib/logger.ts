import { table_user_activity_logs } from "@/generated/tables";
import { Knex } from "knex";
import { v4 } from "uuid";
import { UserInfo } from "./server-functions/get-auth-from-token";
import { Formatter } from "./formatter";

export interface Metadata {
  [key: string]: unknown; // Allows additional metadata properties
}
export interface UserLogActivityInput {
  action: "create" | "update" | "delete";
  table_name: string | null;
  key: string;
  content?: Metadata | null;
}

export enum LogLevel {
  Sever = "SERVER",
  Debug = "DEBUG",
  Info = "INFO",
  Log = "LOG",
  Warn = "WARN",
  Error = "ERROR",
}

export class Logger {
  private table: string = "user_activity_logs";
  private user: UserInfo | null = null;
  private level: LogLevel[] = [];
  private db?: Knex;

  constructor(
    db?: Knex,
    user: UserInfo | null = null,
    level: LogLevel[] = [
      LogLevel.Debug,
      LogLevel.Info,
      LogLevel.Warn,
      LogLevel.Error,
      LogLevel.Log,
    ]
  ) {
    this.db = db;
    this.user = user;
    this.level = level;
  }
  /**
   * Logs server activity with the provided message and metadata.
   * This method saves the log to the database and then logs it to the console if the appropriate log level is enabled.
   *
   * @param message - The message to be logged.
   * @param metadata - The metadata associated with the log entry, conforming to the UserLogActivityInput interface.
   * @returns void
   */
  serverLog(message: string, metadata: UserLogActivityInput) {
    this.save(metadata).then((res) => {
      if (this.shouldLog(LogLevel.Sever)) {
        console.log(this.formatLog(LogLevel.Sever, message, res));
      }
    });
  }

  /**
   * Logs a message with the LOG level if the current logger configuration allows it.
   *
   * @param message - The main log message to be displayed.
   * @param metadata - Additional structured data to be included with the log entry.
   * @returns void
   */
  log(message: string, metadata: Metadata) {
    if (this.shouldLog(LogLevel.Log)) {
      console.log(this.formatLog(LogLevel.Log, message, metadata));
    }
  }

  info(message: string, metadata: Metadata) {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(this.formatLog(LogLevel.Info, message, metadata));
    }
  }
  warn(message: string, metadata: Metadata) {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(this.formatLog(LogLevel.Warn, message, metadata));
    }
  }

  error(message: string, metadata: Metadata) {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(this.formatLog(LogLevel.Error, message, metadata));
    }
  }

  debug(message: string, metadata: Metadata) {
    if (this.shouldLog(LogLevel.Debug)) {
      console.debug(this.formatLog(LogLevel.Debug, message, metadata));
    }
  }

  private async save(log: UserLogActivityInput) {
    if (!this.user) {
      throw new Error("No user information available.");
    }
    if (!this.db) {
      throw new Error("No database connection available.");
    }

    const log_id = v4();
    const timestamp = Formatter.getNowDateTime();
    const logs = {
      ...log,
      log_id,
      content: log.content || null,
      user_id: this.user.id,
      timestamp: timestamp,
    };
    await this.db.table<table_user_activity_logs>(this.table).insert(logs);
    return logs;
  }

  private shouldLog(level: LogLevel): boolean {
    // In development and testing environments, log all levels, but not in production.
    if (process.env.NODE_ENV === "production") return false;

    return this.level.includes(level);
  }

  private formatLog(level: LogLevel, message: string, metadata: Metadata) {
    const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false }); // HH:MM:SS format
    const logLabel = `${level}  ${timestamp} (${
      level === LogLevel.Sever ? "server " : ""
    }logger) ${message}`;
    const metadataStr = JSON.stringify(metadata, null, 2);

    return `${logLabel} ${metadataStr}`;
  }
}

// only client side purposes
export const logger = new Logger();
