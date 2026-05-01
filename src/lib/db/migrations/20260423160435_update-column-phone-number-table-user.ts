import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE \`user\` 
      DROP INDEX \`phone_number\`
  `);
}

export async function down(): Promise<void> {}
