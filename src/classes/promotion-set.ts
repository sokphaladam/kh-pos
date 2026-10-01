import {
  table_promotion_set,
  table_promotion_set_item,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import {
  PromotionSetDefinition,
  PromotionSetItem,
  isPromotionSetEnabled,
} from "@/lib/promotion-set";
import { Knex } from "knex";
import moment from "moment-timezone";
import { z } from "zod";

export const promotionSetItemInputSchema = z.object({
  id: z.string().optional(),
  matchType: z.enum(["VARIANT", "PRODUCT", "CATEGORY"]),
  matchId: z.string().min(1, "targetRequired"),
  qty: z.number().int().min(1),
  discountType: z.enum(["PERCENTAGE", "AMOUNT"]),
  discountValue: z.number().min(0),
});

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validation messages are translation keys (messages/<locale>/discount.json,
 * `promotionSet.errors.*`); the admin UI translates them.
 */
export const promotionSetInputSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1, "titleRequired"),
    description: z.string().optional().nullable(),
    warehouseId: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    dailyStartTime: z
      .string()
      .regex(HH_MM, "timeFormat")
      .nullable()
      .optional(),
    dailyEndTime: z
      .string()
      .regex(HH_MM, "timeFormat")
      .nullable()
      .optional(),
    maxApplyPerOrder: z.number().int().min(0).nullable().optional(),
    priority: z.number().int().default(0),
    items: z.array(promotionSetItemInputSchema).min(1, "itemsRequired"),
  })
  .superRefine((v, ctx) => {
    if (!v.items.some((i) => i.discountValue > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "rewardRequired",
      });
    }
    for (const [idx, i] of v.items.entries()) {
      if (i.discountType === "PERCENTAGE" && i.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", idx, "discountValue"],
          message: "percentTooHigh",
        });
      }
    }
    if (!!v.dailyStartTime !== !!v.dailyEndTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dailyEndTime"],
        message: "hoursIncomplete",
      });
    } else if (v.dailyStartTime && v.dailyStartTime === v.dailyEndTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dailyEndTime"],
        message: "hoursEqual",
      });
    }
    if (v.startAt && v.endAt && v.startAt > v.endAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endAt"],
        message: "endBeforeStart",
      });
    }
  });

export type PromotionSetInput = z.infer<typeof promotionSetInputSchema>;

/** A promotion set as returned by the API (definition + audit fields). */
export interface PromotionSetResponse extends PromotionSetDefinition {
  createdAt: string | null;
  updatedAt: string | null;
}

/** MySQL TIME "17:00:00" -> "17:00". */
function toHourMinute(v: unknown): string | null {
  return typeof v === "string" && v.length >= 5 ? v.slice(0, 5) : null;
}

export class PromotionSetService {
  constructor(protected db: Knex) {}

  async list(
    warehouseId: string | null,
    limit: number,
    offset: number,
  ): Promise<{ items: PromotionSetResponse[]; total: number }> {
    const query = this.db
      .table<table_promotion_set>("promotion_set")
      .whereNull("deleted_at");
    if (warehouseId) {
      query.andWhere((qb) =>
        qb.where("warehouse_id", warehouseId).orWhereNull("warehouse_id"),
      );
    }

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const rows: table_promotion_set[] = await query
      .clone()
      .select()
      .orderBy([
        { column: "priority", order: "desc" },
        { column: "created_at", order: "desc" },
      ])
      .limit(limit)
      .offset(offset);

    return { items: await this.hydrate(rows), total: Number(total || 0) };
  }

  async get(id: string): Promise<PromotionSetResponse | null> {
    const row = await this.db
      .table<table_promotion_set>("promotion_set")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!row) return null;
    const [result] = await this.hydrate([row]);
    return result;
  }

  /**
   * Every switched-on promotion set that can still apply to an open order of
   * `warehouseId`. Global sets (no warehouse) apply to every branch.
   *
   * Not filtered by the current time: the engine judges each line by when it
   * was ordered, so a happy-hour set must stay loaded after the happy hour to
   * keep pricing the lines ordered during it. Only sets that ended more than a
   * day ago (no open order can still date from them) are dropped.
   */
  async getActive(warehouseId: string | null): Promise<PromotionSetDefinition[]> {
    const rows: table_promotion_set[] = await this.db
      .table<table_promotion_set>("promotion_set")
      .whereNull("deleted_at")
      .where("is_active", 1)
      .andWhere((qb) => {
        qb.whereNull("warehouse_id");
        if (warehouseId) qb.orWhere("warehouse_id", warehouseId);
      })
      .andWhere((qb) => {
        const dayAgo = moment()
          .tz("Asia/Phnom_Penh")
          .subtract(1, "day")
          .format("YYYY-MM-DD HH:mm:ss");
        qb.whereNull("end_at").orWhere("end_at", ">=", dayAgo);
      });
    if (rows.length === 0) return [];
    return (await this.hydrate(rows)).filter(isPromotionSetEnabled);
  }

  async save(input: PromotionSetInput, userId: string, isNew: boolean) {
    const now = Formatter.getNowDateTime();
    const row = {
      title: input.title,
      description: input.description || null,
      warehouse_id: input.warehouseId || null,
      is_active: input.isActive ? 1 : 0,
      start_at: input.startAt || null,
      end_at: input.endAt || null,
      daily_start_time: input.dailyStartTime || null,
      daily_end_time: input.dailyEndTime || null,
      max_apply_per_order:
        input.maxApplyPerOrder && input.maxApplyPerOrder > 0
          ? input.maxApplyPerOrder
          : null,
      priority: input.priority ?? 0,
      updated_at: now,
      updated_by: userId,
    };

    await this.db.transaction(async (trx) => {
      if (isNew) {
        await trx.table<table_promotion_set>("promotion_set").insert({
          ...row,
          id: input.id,
          created_at: now,
          created_by: userId,
          deleted_at: null,
        });
      } else {
        const updated = await trx
          .table<table_promotion_set>("promotion_set")
          .where({ id: input.id })
          .whereNull("deleted_at")
          .update(row);
        if (!updated) throw new Error("notFound");
      }

      // Items are owned by the set: replace them wholesale.
      await trx
        .table<table_promotion_set_item>("promotion_set_item")
        .where({ promotion_set_id: input.id })
        .delete();
      await trx.table<table_promotion_set_item>("promotion_set_item").insert(
        input.items.map((item, index) => ({
          id: item.id || generateId(),
          promotion_set_id: input.id,
          match_type: item.matchType,
          match_id: item.matchId,
          qty: item.qty,
          discount_type: item.discountType,
          discount_value: String(item.discountValue),
          sort_order: index,
        })),
      );
    });
  }

  async delete(id: string, userId: string) {
    await this.db
      .table<table_promotion_set>("promotion_set")
      .where({ id })
      .update({
        deleted_at: Formatter.getNowDateTime(),
        updated_by: userId,
      });
  }

  private async hydrate(
    rows: table_promotion_set[],
  ): Promise<PromotionSetResponse[]> {
    if (rows.length === 0) return [];
    const items: table_promotion_set_item[] = await this.db
      .table<table_promotion_set_item>("promotion_set_item")
      .whereIn(
        "promotion_set_id",
        rows.map((r) => r.id),
      )
      .orderBy("sort_order");

    const targets = await this.resolveTargets(items);
    const itemsBySet = new Map<string, PromotionSetItem[]>();
    for (const i of items) {
      const list = itemsBySet.get(i.promotion_set_id) ?? [];
      list.push({
        id: i.id,
        matchType: i.match_type ?? "VARIANT",
        matchId: i.match_id,
        matchTitle: targets.get(`${i.match_type}:${i.match_id}`)?.title ?? "",
        matchImage: targets.get(`${i.match_type}:${i.match_id}`)?.image ?? null,
        qty: Number(i.qty ?? 1),
        discountType: i.discount_type ?? "PERCENTAGE",
        discountValue: Number(i.discount_value ?? 0),
      });
      itemsBySet.set(i.promotion_set_id, list);
    }

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      warehouseId: r.warehouse_id,
      isActive: Number(r.is_active ?? 1) === 1,
      startAt: Formatter.toDbDateTime(r.start_at),
      endAt: Formatter.toDbDateTime(r.end_at),
      dailyStartTime: toHourMinute(r.daily_start_time),
      dailyEndTime: toHourMinute(r.daily_end_time),
      maxApplyPerOrder: r.max_apply_per_order,
      priority: Number(r.priority ?? 0),
      items: itemsBySet.get(r.id) ?? [],
      createdAt: Formatter.toDbDateTime(r.created_at),
      updatedAt: Formatter.toDbDateTime(r.updated_at),
    }));
  }

  /**
   * Display name and image for each slot target, keyed
   * `${matchType}:${matchId}`. Images: a variant's own image, else its
   * product's first image; a product's first image; a category's image.
   */
  private async resolveTargets(items: table_promotion_set_item[]) {
    const ids = (type: string) => [
      ...new Set(items.filter((i) => i.match_type === type).map((i) => i.match_id)),
    ];
    const variantIds = ids("VARIANT");
    const productIds = ids("PRODUCT");
    const categoryIds = ids("CATEGORY");
    const out = new Map<string, { title: string; image: string | null }>();

    const [variants, products, categories] = await Promise.all([
      variantIds.length
        ? this.db
            .table("product_variant")
            .join("product", "product.id", "product_variant.product_id")
            .whereIn("product_variant.id", variantIds)
            .select(
              "product_variant.id as id",
              "product_variant.name as name",
              "product_variant.product_id as product_id",
              "product.title as title",
            )
        : [],
      productIds.length
        ? this.db.table("product").whereIn("id", productIds).select("id", "title")
        : [],
      categoryIds.length
        ? this.db
            .table("product_category")
            .whereIn("id", categoryIds)
            .select("id", "title", "image_url")
        : [],
    ]);

    // One query for every product image the slots may need.
    const imageProductIds = [
      ...new Set([
        ...productIds,
        ...(variants as { product_id: string }[]).map((v) => v.product_id),
      ]),
    ];
    const images: {
      product_id: string;
      product_variant_id: string | null;
      image_url: string;
    }[] = imageProductIds.length
      ? await this.db
          .table("product_images")
          .whereIn("product_id", imageProductIds)
          .orderBy([
            { column: "image_order", order: "asc" },
            { column: "created_at", order: "asc" },
          ])
          .select("product_id", "product_variant_id", "image_url")
      : [];
    const firstImage = (productId: string, variantId?: string) =>
      (variantId &&
        images.find((i) => i.product_variant_id === variantId)?.image_url) ||
      images.find((i) => i.product_id === productId)?.image_url ||
      null;

    for (const v of variants as {
      id: string;
      name: string;
      product_id: string;
      title: string;
    }[]) {
      const isDefaultName = !v.name || v.name === v.title || v.name === "Default";
      out.set(`VARIANT:${v.id}`, {
        title: isDefaultName ? v.title : `${v.title} - ${v.name}`,
        image: firstImage(v.product_id, v.id),
      });
    }
    for (const p of products as { id: string; title: string }[]) {
      out.set(`PRODUCT:${p.id}`, { title: p.title, image: firstImage(p.id) });
    }
    // Categories rarely have their own image: fall back to the first product
    // photo in the category so "1 x any meat" still shows a picture.
    const categoryRows = categories as {
      id: string;
      title: string;
      image_url: string | null;
    }[];
    const noImageIds = categoryRows.filter((c) => !c.image_url).map((c) => c.id);
    const categoryFallback: { category_id: string; image_url: string }[] =
      noImageIds.length
        ? await this.db
            .table("product_categories")
            .join(
              "product_images",
              "product_images.product_id",
              "product_categories.product_id",
            )
            .join("product", "product.id", "product_categories.product_id")
            .whereIn("product_categories.category_id", noImageIds)
            .whereNull("product.deleted_at")
            .orderBy([
              { column: "product.title", order: "asc" },
              { column: "product_images.image_order", order: "asc" },
            ])
            .select(
              "product_categories.category_id as category_id",
              "product_images.image_url as image_url",
            )
        : [];

    for (const c of categoryRows) {
      out.set(`CATEGORY:${c.id}`, {
        title: c.title,
        image:
          c.image_url ||
          categoryFallback.find((f) => f.category_id === c.id)?.image_url ||
          null,
      });
    }
    return out;
  }
}
