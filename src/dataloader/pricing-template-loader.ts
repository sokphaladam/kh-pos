import { table_pricing_template } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createPricingTemplateLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_pricing_template[] = await db
      .table<table_pricing_template>("pricing_template")
      .whereNull("deleted_at")
      .whereIn("template_id", keys);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.find((row) => row.template_id === key);

        if (!row) return null;

        return {
          id: row.template_id || "",
          templateName: row.template_name,
          timeSlot: row.time_slot,
          dayType: row.day_type,
          extraSeatPrices: row.extra_seat_prices || null,
        };
      })
    );
  });
}
