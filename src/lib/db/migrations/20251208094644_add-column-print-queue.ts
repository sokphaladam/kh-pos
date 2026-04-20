import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('print_queue', async (table) => {
    table.string('order_id');
    table.string('order_detail_id');
    table.string('item_price');
  })
}


export async function down(): Promise<void> {}

