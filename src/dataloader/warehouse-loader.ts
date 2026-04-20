import { table_warehouse } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export interface Warehouse {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  address?: string;
  image?: string;
  useMainBranchVisibility?: boolean;
}

export function createWarehouseLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_warehouse[] = await db("warehouse").whereIn("id", keys);

    return keys.map((key) => {
      const x = rows.find((u) => u.id === key);
      if (!x) return null;
      return {
        id: x.id || "",
        name: x.name || "",
        isMain: Boolean(x.is_main) || false,
        createdAt: x.created_at || "",
        updatedAt: x.updated_at || "",
        phone: x.phone || undefined,
        address: x.address || undefined,
        image: x.image || undefined,
        useMainBranchVisibility: Boolean(x.use_main_branch_visibility) || false,
      } as Warehouse;
    });
  });
}
