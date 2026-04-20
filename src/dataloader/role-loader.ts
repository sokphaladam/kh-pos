import { table_user_role } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createRoleLoader(db: Knex): DataLoader<string, unknown> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_user_role[] = await db.table('user_role').whereIn('id', keys);

    return keys.map(key => {
      const role = rows.find(u => u.id === key);
      if(role) {
        return {
          id: role.id,
          role: role.role
        }
      }
    })
  })
}