import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_inventory_transactions } from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";

export class InventoryTransactionService {
  constructor(protected trx: Knex, protected user: UserInfo) {}

  async getProductVariantTransactions(variantId: string) {
    const transactions = await this.trx
      .table<table_inventory_transactions>("inventory_transactions")
      .innerJoin(
        "warehouse_slot",
        "warehouse_slot.id",
        "inventory_transactions.slot_id"
      )
      .where({
        variant_id: variantId,
        "warehouse_slot.warehouse_id": this.user.currentWarehouseId,
      })
      .select("inventory_transactions.*")
      .orderBy("created_at", "desc");

    const inventoryTransactionLoader = LoaderFactory.inventoryTransactionLoader(
      this.trx,
      this.user.currentWarehouseId!
    );

    return await Promise.all(
      transactions.map(async (transaction) => {
        return await inventoryTransactionLoader.load(transaction.id);
      })
    );
  }

  async getTransactions(
    offset: number,
    limit: number,
    type?: string[] // Replace 'string' with the correct type if you have a union or enum for transaction types
  ) {
    const query = this.trx
      .table<table_inventory_transactions>("inventory_transactions")
      .innerJoin(
        "warehouse_slot",
        "warehouse_slot.id",
        "inventory_transactions.slot_id"
      )
      .where({
        "warehouse_slot.warehouse_id": this.user.currentWarehouseId,
      })
      .select("inventory_transactions.*")
      .orderBy("created_at", "desc");

    if (type && type.length > 0) {
      query.whereIn("transaction_type", type);
    }

    const inventoryTransactionLoader = LoaderFactory.inventoryTransactionLoader(
      this.trx,
      this.user.currentWarehouseId!
    );

    const rowsCount = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();
    const total = rowsCount ? rowsCount.total : 0;

    const transactions = await query.clone().offset(offset).limit(limit);

    return {
      total,
      data: await Promise.all(
        transactions.map(async (transaction) => {
          return await inventoryTransactionLoader.load(transaction.id);
        })
      ),
    };
  }
}
