import { UserInput } from "@/lib/types";
import { Knex } from "knex";

export async function updateUser(db: Knex, input: UserInput) {
  try {
    return await db.transaction(async (trx) => {
      const userInput = {
        fullname: input.fullname,
        phone_number: input.phoneNumber,
        profile: input.profile,
        role_id: input.roleId || "",
        warehouse_id: input.warehouseId || "",
      };

      await db
        .table("user")
        .where({ id: input.id })
        .update(userInput)
        .transacting(trx);

      return {
        success: true,
        result: { message: "Update user #" + input.id },
      };
    });
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
