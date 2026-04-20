import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createWarehouseGroupByGroupIdLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db("warehouse_groups").whereIn("group_id", keys);

    const warehouseLoader = LoaderFactory.warehouseLoader(db);

    return Promise.all(
      keys.map((key) => {
        const x = rows.filter((u) => u.group_id === key);
        if (!x) return [];
        return Promise.all(
          x.map(async (y) => {
            return {
              groupId: y.group_id,
              warehouseId: y.warehouse_id,
              warehouse: y.warehouse_id
                ? await warehouseLoader.load(y.warehouse_id)
                : null,
            };
          }),
        );
      }),
    );
  });
}
