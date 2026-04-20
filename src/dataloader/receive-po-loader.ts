import { table_receive_po_detail, table_supplier_purchase_order } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createSupplierPurchaseOrderLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_supplier_purchase_order[] = await db.table<table_supplier_purchase_order>('supplier_purchase_order').whereIn('id', keys);

    return Promise.all(
      keys.map(async key => {
        const row = rows.find(f => f.id === key);
        if(!row) return null
        return row
      })
    )
  })
}

export function createReceivedPOLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db.table('receive_po').whereIn('id', keys);

    const po = LoaderFactory.supplierPurchaseOrderLoader(db);

    return Promise.all(
      keys.map(async key => {
        const row = rows.find(f => f.id === key);
        if(!row) return null
        return {
          ...row,
          po: row.po_Id ? await po.load(row.po_Id) : null
        }
      })
    )
  })
}

export function receivePOBytransactionIDLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_receive_po_detail[] = await db.table<table_receive_po_detail>('receive_po_detail').whereIn('transaction_id', keys);

    const receivePOLoader = LoaderFactory.receivePOLoader(db);

    return Promise.all(
      keys.map(async key => {
        const row = rows.find(f => f.transaction_id === key);
        if(!row) return null
        return {
          ...row,
          receive: row.receive_id ? await receivePOLoader.load(row.receive_id) : null
        }
      })
    )
  })
}