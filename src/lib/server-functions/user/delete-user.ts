import { table_user } from "@/generated/tables";
import { Knex } from "knex";

export default async function deleteUser(db: Knex, id: string) {
  try {
    await db
      .table<table_user>("user")
      .where("id", id)
      .update({ is_deleted: 1 });

    return {
      success: true,
      result: { message: "Delete user #" + id },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * @deprecated no longer in use
 */
export async function deleteUserRoles(db: Knex, id: string[]) {
  try {
    await db
      //@ts-expect-error ignore
      .table<table_user_roles>("user_roles")
      .whereIn("id", id)
      .update({ is_deleted: 1 });

    return {
      success: true,
      result: { message: "Delete role user " + id.join(",") },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
