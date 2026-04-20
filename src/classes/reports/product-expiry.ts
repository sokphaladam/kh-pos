import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Slot } from "@/dataloader/slot-loader";
import { table_inventory, table_setting } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { ProductCategory } from "@/repository/product-category-repository";
import { Knex } from "knex";

export interface ExpiryProduct {
  variant: ProductVariantType;
  slot: Slot;
  expiryDate: string;
  quantity: number;
  value: number;
  status: "expired" | "urgent" | "critical" | "warning" | "ok";
  categories: ProductCategory[];
  daysLeft: number;
}

interface ProductExpirySelect {
  product_id: string;
  variant_id: string;
  slot_id: string;
  expired_at: Date;
  quantity: number;
  value: number;
  status: "expired" | "urgent" | "critical" | "warning" | "ok";
  days_left: number;
}

export interface ExpiryFilters {
  search?: string;
  slotId?: string;
  categoryId?: string;
  timeFrame: "expired" | "urgent" | "critical" | "warning" | "all_products";
}
export interface SummaryExpiryStatus {
  status: "expired" | "urgent" | "critical" | "warning" | "ok";
  qty: number;
  value: number;
  uniqueProductCount: number;
}

export interface ProductExpiryReport {
  productList: ExpiryProduct[];
  dashboard: SummaryExpiryStatus[];
  slots: Slot[];
  categories: ProductCategory[];
  expiryTimeFrame?: {
    urgent: number;
    critical: number;
    warning: number;
  };
}

export class productExpiry {
  constructor(protected knex: Knex, protected user: UserInfo) {}

  private async getExpiringSlots(totalProducts: ExpiryProduct[]) {
    const slots = totalProducts.map((x) => x.slot);
    const uniqueSlots = slots.filter(
      (slot, idx, arr) => arr.findIndex((s) => s.id === slot.id) === idx
    );
    return uniqueSlots;
  }

  private async getExpiringCategories(totalProducts: ExpiryProduct[]) {
    const categories = totalProducts.flatMap((x) => x.categories);
    const uniqueCategories = categories.filter(
      (category, idx, arr) =>
        arr.findIndex((c) => c.categoryId === category.categoryId) === idx
    );
    return uniqueCategories;
  }

  private getSummaryExpiryStatus(totalProducts: ProductExpirySelect[]) {
    const results: SummaryExpiryStatus[] = [];
    const expiredProducts = totalProducts.filter((x) => x.status === "expired");
    results.push({
      status: "expired",
      qty: expiredProducts.reduce((sum, x) => sum + Number(x.quantity), 0),
      value: expiredProducts.reduce((sum, x) => sum + Number(x.value), 0),
      uniqueProductCount: new Set(expiredProducts.map((x) => x.variant_id))
        .size,
    });

    const urgentProducts = totalProducts.filter((x) => x.status === "urgent");
    results.push({
      status: "urgent",
      qty: urgentProducts.reduce((sum, x) => sum + Number(x.quantity), 0),
      value: urgentProducts.reduce((sum, x) => sum + Number(x.value), 0),
      uniqueProductCount: new Set(urgentProducts.map((x) => x.variant_id)).size,
    });
    const criticalProducts = totalProducts.filter(
      (x) => x.status === "critical"
    );
    results.push({
      status: "critical",
      qty: criticalProducts.reduce((sum, x) => sum + Number(x.quantity), 0),
      value: criticalProducts.reduce((sum, x) => sum + Number(x.value), 0),
      uniqueProductCount: new Set(criticalProducts.map((x) => x.variant_id))
        .size,
    });
    const warningProducts = totalProducts.filter((x) => x.status === "warning");
    results.push({
      status: "warning",
      qty: warningProducts.reduce((sum, x) => sum + Number(x.quantity), 0),
      value: warningProducts.reduce((sum, x) => sum + Number(x.value), 0),
      uniqueProductCount: new Set(warningProducts.map((x) => x.variant_id))
        .size,
    });
    return results;
  }

  async getProductExpiry(): Promise<ProductExpiryReport> {
    const today = Formatter.getNowDate();
    let expiryTimeFrame = {
      urgent: 5,
      critical: 7,
      warning: 30,
    };
    const expirySetting: table_setting = await this.knex
      .table("setting")
      .where("option", "EXPIRY_SETTING")
      .first();
    if (expirySetting && expirySetting.value) {
      expiryTimeFrame = JSON.parse(expirySetting?.value);
    }

    const query = this.knex
      .table<table_inventory>("inventory")
      .innerJoin(
        "product_variant",
        "inventory.variant_id",
        "product_variant.id"
      )
      .innerJoin("product", "product_variant.product_id", "product.id")
      .innerJoin("product_lot", "inventory.lot_id", "product_lot.id") // join to get cost of each product
      .innerJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .where("qty", ">", 0)
      .where("warehouse_slot.warehouse_id", this.user.currentWarehouseId!)
      .groupBy(
        "inventory.variant_id",
        "inventory.slot_id",
        "inventory.expired_at"
      )
      .select(
        this.knex.raw(
          `
        product.id as product_id,
        inventory.variant_id,
        inventory.slot_id,
        inventory.expired_at,
        SUM(inventory.qty) as quantity,
        SUM(inventory.qty * product_lot.cost_per_unit) as value,
        CASE
          WHEN inventory.expired_at < :today THEN 'expired'
          WHEN Date(inventory.expired_at) <= :today + INTERVAL ${expiryTimeFrame["urgent"]} day THEN 'urgent'
          WHEN inventory.expired_at <= :today + INTERVAL ${expiryTimeFrame["critical"]} day THEN 'critical'
          WHEN inventory.expired_at <= :today + INTERVAL ${expiryTimeFrame["warning"]} day THEN 'warning'
          ELSE 'ok'
        END as status,
        CASE
          WHEN inventory.expired_at < :today THEN 0
          ELSE TIMESTAMPDIFF(DAY, :today, inventory.expired_at)
        END as days_left
      `,
          { today }
        )
      )
      .whereRaw(
        `expired_at <= :today + INTERVAL ${expiryTimeFrame["warning"]} day`,
        {
          today,
        }
      );

    const totalProducts = await query
      .clone()
      .orderBy("inventory.expired_at")
      .orderBy("inventory.variant_id");

    const summary = this.getSummaryExpiryStatus(totalProducts);

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.knex,
      this.user.currentWarehouseId!
    );
    const slotLoader = LoaderFactory.slotLoader(this.knex);
    const categoryLoader = LoaderFactory.categoryByProductLoader(this.knex);

    const results = await Promise.all(
      totalProducts.map(async (x) => {
        return {
          variant: await variantLoader.load(x.variant_id),
          slot: await slotLoader.load(x.slot_id),
          expiryDate: Formatter.dateTime(x.expired_at),
          quantity: x.quantity,
          value: x.value,
          status: x.status,
          categories: await categoryLoader.load(x.product_id),
          daysLeft: Number(x.days_left || 0),
        } as ExpiryProduct;
      })
    );

    const expirySlots = await this.getExpiringSlots(results);
    const expiryCategories = await this.getExpiringCategories(results);

    return {
      productList: results,
      dashboard: summary,
      slots: expirySlots,
      categories: expiryCategories,
      expiryTimeFrame,
    };
  }
}
