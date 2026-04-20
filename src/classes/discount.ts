import { table_discount, table_discount_log } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { Knex } from "knex";

export class DiscountService {
  constructor(protected tx: Knex) {}

  async create(input: table_discount) {
    return await this.tx.table<table_discount>("discount").insert(input);
  }

  async update(id: string, input: table_discount) {
    return await this.tx
      .table<table_discount>("discount")
      .where("discount_id", id)
      .update(input);
  }

  async delete(id: string) {
    return await this.tx
      .table<table_discount>("discount")
      .where("discount_id", id)
      .update({ deleted_at: Formatter.getNowDateTime() });
  }

  async list(limit: number, offset: number, id: string | null, warehouse_id: string | null) {
    const query = this.tx
      .table<table_discount>("discount")
      .where("deleted_at", null);

    if (id) {
      query.where({
        discount_id: id,
      });
    }

    if(warehouse_id) {
      query.where({
        warehouse_id
      })
    }

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const items: table_discount[] = await query
      .clone()
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    return { items, total };
  }

  async createLog(input: table_discount_log[], trx?: Knex.Transaction) {
    const query = this.tx
      .table<table_discount_log>("discount_log")
      .insert(input);

    if (trx) {
      query.transacting(trx);
    }

    return await query.clone();
  }
}
