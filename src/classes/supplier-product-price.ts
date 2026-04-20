import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { table_supplier_product_prices } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Supplier } from "@/lib/server-functions/supplier";
import { Knex } from "knex";

export interface CreateSupplierProductPrice {
  supplierId: string;
  productVariantId: string;
  price: number;
  effectDate?: string | null;
}

export interface UpdateSupplierProductPrice extends CreateSupplierProductPrice {
  id: string;
  scheduledPrice?: number | null;
  scheduledAt?: string | null;
}

export interface SupplierProductPrice {
  id?: string;
  variant: ProductVariantType | null;
  price: number;
  effectDate?: string | null;
  scheduledPrice?: number | null;
  scheduledAt?: string | null;
  createdBy: UserInfo | null;
  updatedBy: UserInfo | null;
  supplier: Supplier | null;
}

export class SupplierProductPriceService {
  constructor(protected knex: Knex, protected user: UserInfo) {}

  async getSupplierProductPrices(
    supplierId?: string,
    productVariantId?: string,
    orderBy?: {
      price?: "asc" | "desc";
    },
    offset?: number,
    limit?: number,
    search?: string
  ): Promise<{ data: SupplierProductPrice[]; total: number }> {
    const query = this.knex
      .table("supplier_product_prices")
      .where("supplier_product_prices.deleted_at", null);

    if (search) {
      const pattern = `%${String(search || "").trim()}%`;
      query
        .innerJoin(
          "supplier",
          "supplier.id",
          "supplier_product_prices.supplier_id"
        )
        .innerJoin(
          "product_variant",
          "product_variant.id",
          "supplier_product_prices.product_variant_id"
        )
        .innerJoin("product", "product.id", "product_variant.product_id")
        .where(function () {
          this.where("product.title", "like", pattern).orWhere(
            "supplier.name",
            "like",
            pattern
          );
        });

      if (orderBy && orderBy.price) {
        query.orderBy("supplier_product_prices.price", orderBy.price);
      }
    } else {
      if (supplierId) {
        query.where("supplier_product_prices.supplier_id", supplierId);
      }

      if (productVariantId) {
        query.where(
          "supplier_product_prices.product_variant_id",
          productVariantId
        );
      }

      if (orderBy && orderBy.price) {
        query.orderBy("supplier_product_prices.price", orderBy.price);
      }
    }

    const { total } = await query
      .clone()
      .count("supplier_product_prices.id as total")
      .first<{ total: number }>();

    const prices: table_supplier_product_prices[] = await query
      .clone()
      .select("supplier_product_prices.*")
      .limit(limit ?? 30)
      .offset(offset ?? 0);

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.knex,
      this.user.currentWarehouseId!
    );
    const supplierLoader = LoaderFactory.supplierLoader(this.knex);

    const userLoader = LoaderFactory.userLoader(this.knex);

    const result = {
      data: await Promise.all(
        prices.map(async (price) => {
          const variant = await variantLoader.load(price.product_variant_id);
          const supplier = await supplierLoader.load(price.supplier_id);
          return {
            id: price.id,
            variant: variant,
            price: parseFloat(price.price),
            effectDate: price.effect_date
              ? Formatter.date(price.effect_date)
              : null,
            scheduledPrice: price.scheduled_price
              ? parseFloat(price.scheduled_price)
              : null,
            scheduledAt: price.scheduled_at
              ? Formatter.date(price.scheduled_at)
              : null,
            createdBy: price.created_by
              ? await userLoader.load(price.created_by)
              : null,
            updatedBy: price.updated_by
              ? await userLoader.load(price.updated_by)
              : null,
            supplier,
          };
        })
      ),
      total,
    };

    return result;
  }

  async getSupplierProductPriceExisting(
    supplierId: string,
    productVariantId: string,
    db: Knex
  ) {
    const existing = await db("supplier_product_prices")
      .where({
        product_variant_id: productVariantId,
        supplier_id: supplierId,
      })
      .first();

    return existing;
  }

  async createSupplierProductPrices(
    input: CreateSupplierProductPrice[]
  ): Promise<boolean> {
    const now = Formatter.getNowDateTime();
    const data = [];

    for (const item of input) {
      const existing = await this.getSupplierProductPriceExisting(
        item.supplierId,
        item.productVariantId,
        this.knex
      );
      if (!existing) {
        data.push({
          supplier_id: item.supplierId,
          product_variant_id: item.productVariantId,
          price: item.price.toFixed(2),
          effect_date: item.effectDate,
          created_by: this.user.id,
          created_at: now,
        });
      }
    }

    if (data.length === 0) return true;

    await this.knex("supplier_product_prices").insert(data);
    return true;
  }

  async updateSupplierProductPrice(
    input: UpdateSupplierProductPrice[]
  ): Promise<boolean> {
    const now = Formatter.getNowDateTime();
    for (const item of input) {
      await this.knex("supplier_product_prices")
        .update({
          supplier_id: item.supplierId,
          product_variant_id: item.productVariantId,
          price: item.price.toFixed(2),
          effect_date: item.effectDate,
          scheduled_price: item.scheduledPrice,
          scheduled_at: item.scheduledAt,
          scheduled_by: item.scheduledPrice ? this.user.id : null,
          updated_by: this.user.id,
          updated_at: now,
        })
        .where("id", item.id);
    }
    return true;
  }

  async deleteSupplierProductPrice(ids: string[]): Promise<boolean> {
    const now = Formatter.getNowDateTime();
    await this.knex("supplier_product_prices")
      .update({
        deleted_at: now,
        deleted_by: this.user.id,
      })
      .whereIn("id", ids);
    return true;
  }
}
