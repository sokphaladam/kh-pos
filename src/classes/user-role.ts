import { table_user_role } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Knex } from "knex";

export class UserRole {
  constructor(protected tx: Knex) {}
  async getDefaultRole(): Promise<table_user_role> {
    const role = await this.tx
      .table<table_user_role>("user_role")
      .where({ is_default: 1 })
      .first();

    if (!role) {
      // If no default role is found, create a new one
      const newRole: table_user_role = {
        id: generateId(),
        created_at: Formatter.getNowDateTime(),
        is_default: 1,
        role: "OWNER",
        permissions: null,
      };
      await this.tx.table<table_user_role>("user_role").insert(newRole);
      return newRole;
    }
    return role as table_user_role;
  }
}
