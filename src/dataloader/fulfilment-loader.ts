import { table_fulfilment, table_fulfilment_detail } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createFulfilmentLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_fulfilment[] = await db.table<table_fulfilment>('fulfilment').whereIn('id', keys);

    const orderLoader = LoaderFactory.orderLoader(db);

    return await Promise.all(
      keys.map(async key => {
        const row = rows.find(f => f.id === key);
        if(!row) return null
        return {
          ...row,
          order: row.order_id ? await orderLoader.load(row.order_id || '') : null
        };
      })
    )
  })
}

export function createFulfilmentDetailByTransactionIDLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_fulfilment_detail[] = await db.table<table_fulfilment_detail>('fulfilment_detail').whereIn('transaction_id', keys);
    
    const fulfilmentLoader = LoaderFactory.fulfilmentLoader(db);

    return await Promise.all(
      keys.map(async key => {
        const row = rows.find(f => f.transaction_id === key);
        if(!row) return null;
        return {
          ...row,
          fulfilment: row.fulfilment_id ? await fulfilmentLoader.load(row.fulfilment_id || '') : null,
        }
      })
    )
  })
}