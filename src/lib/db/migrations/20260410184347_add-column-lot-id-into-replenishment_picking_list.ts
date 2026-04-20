import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE \`replenishment_picking_list\`
      ADD COLUMN \`lot_id\` VARCHAR(255) NOT NULL,
      DROP PRIMARY KEY,
      ADD PRIMARY KEY (\`variant_id\`, \`slot_id\`, \`replenishment_id\`, \`lot_id\`);
  `);
}

export async function down(): Promise<void> {}
