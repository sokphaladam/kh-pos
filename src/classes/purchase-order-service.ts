import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_supplier_po_addition_cost,
  table_supplier_purchase_order,
  table_supplier_purchase_order_detail,
  table_user,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Supplier } from "@/lib/server-functions/supplier";
import { WarehouseResponseType } from "@/lib/types";
import { Knex } from "knex";

export type PurchaseOrderItemStatus =
  | "pending"
  | "received"
  | "cancelled"
  | "to_create"
  | "to_delete";

export type PurchaseOrderStatus =
  | "draft"
  | "approved"
  | "completed"
  | "deleted"
  | "closed";

export interface AdditionalCost {
  id?: string;
  supplierPoId?: string;
  name?: string | null;
  cost?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: PurchaseOrderItemStatus;
}

export interface PurchaseOrderItem {
  id?: string;
  name?: string | null;
  stock?: number | null;
  sku?: string | null;
  qty?: number | null;
  amount?: number | null;
  purchaseCost?: string | null;
  receivedQty?: number | null;
  productVariantId?: string | null;
  supplierPoId?: string;
  status?: PurchaseOrderItemStatus;
  image?: string | null;
}

export interface SupplierPurchaseOrderInput {
  id?: string;
  supplierId?: string | null;
  status?: PurchaseOrderStatus | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  purchasedAt?: string | null;
  expectedAt?: string | null;
  received?: number | null;
  note?: string | null;
  items?: PurchaseOrderItem[];
  warehouseId?: string | null;
  additionalCosts?: AdditionalCost[];
}

export interface SupplierPurchaseOrder
  extends Omit<SupplierPurchaseOrderInput, "items" | "additionalCosts"> {
  poIncrement?: string;
  total?: string | null;
  totalQty?: number;
  supplier?: Supplier | null;
  warehouse?: WarehouseResponseType;
  receivedTotal?: number;
}

export interface SupplierPurchaseOrderDetail
  extends SupplierPurchaseOrderInput {
  total?: string | null;
  totalQty?: number;
  poIncrement: string;
  supplier?: Supplier | null;
  warehouse?: Partial<WarehouseResponseType>;
  createdBy?: Partial<UserInfo>;
}
export interface PurchaseOrderFilter {
  supplierId?: string | null;
  warehouseId?: string;
  limit?: number;
  offset?: number;
  status?: PurchaseOrderStatus;
}

export class PurchaseOrderService {
  private user: UserInfo | null = null;

  constructor(protected trx: Knex.Transaction, user: UserInfo) {
    this.user = user;
    this.trx = trx;
  }

  private calulateTotalCost(
    items: PurchaseOrderItem[],
    additionalCosts: AdditionalCost[]
  ) {
    let totalAmount = 0;
    const itemTotalAmount = items?.reduce(
      (acc, curr) => acc + (curr.amount ?? 0),
      0
    );

    if (itemTotalAmount) {
      totalAmount += itemTotalAmount;
    }

    const additionalCostsAmount = additionalCosts?.reduce(
      (acc, curr) => acc + parseFloat(curr.cost ?? ""),
      0
    );

    if (additionalCostsAmount) {
      totalAmount += additionalCostsAmount;
    }

    return totalAmount.toString();
  }

  private async createPurchaseOrderItem(
    purchaseOrderId: string,
    items: PurchaseOrderItem[]
  ) {
    const orderInput: table_supplier_purchase_order_detail[] = items.map(
      (item) => ({
        id: generateId(),
        supplier_purchase_order_id: purchaseOrderId,
        product_variant_id: item.productVariantId || "",
        quantity: item.qty || 1,
        purchased_cost: item.purchaseCost || "",
        status: "pending",
        received_qty: 0,
        created_at: Formatter.getNowDateTime(),
        updated_at: null,
      })
    );
    await this.trx
      .table<table_supplier_purchase_order_detail[]>(
        "supplier_purchase_order_detail"
      )
      .insert(orderInput);
  }

  private async createAdditionalCostItems(
    purchaseOrderId: string,
    additionalCosts: AdditionalCost[]
  ) {
    await this.trx.table("supplier_po_addition_cost").insert(
      additionalCosts.map((cost) => ({
        id: generateId(),
        supplier_po_id: purchaseOrderId,
        name: cost.name,
        cost: cost.cost,
        created_at: Formatter.getNowDateTime(),
        status: "pending",
      }))
    );
  }

  async createPurchaseOrder(
    data: SupplierPurchaseOrderInput
  ): Promise<SupplierPurchaseOrder | undefined> {
    const now = Formatter.getNowDateTime();
    const purchaseOrderId = generateId();

    const totalAmount = this.calulateTotalCost(
      data.items ?? [],
      data.additionalCosts ?? []
    );

    await this.trx
      .table<table_supplier_purchase_order>("supplier_purchase_order")
      .insert({
        id: purchaseOrderId,
        supplier_id: data.supplierId || "",
        status: data.status || "draft",
        total: totalAmount,
        created_at: now,
        updated_at: now,
        warehouse_id: data.warehouseId ?? "",
        purchased_at: data.purchasedAt,
        expected_at: data.expectedAt,
        note: data.note,
        created_by: this.user?.id,
      });

    if (data.items && data.items.length > 0) {
      await this.createPurchaseOrderItem(purchaseOrderId, data.items);
    }

    if (data.additionalCosts && data.additionalCosts.length > 0) {
      await this.createAdditionalCostItems(
        purchaseOrderId,
        data.additionalCosts
      );
    }

    return data;
  }

  async updatePurchaseOrder(
    data: SupplierPurchaseOrderInput
  ): Promise<SupplierPurchaseOrderInput | undefined> {
    const now = Formatter.getNowDateTime();

    const purchaseOrderId = data.id;

    if (!purchaseOrderId) {
      return undefined;
    }

    try {
      // filter all remaining item for update
      const remianingItemToUpdate = data.items?.filter(
        (item) => item.status !== "to_delete"
      );

      // filter all remaining additional cost item for update
      const additionalCostToUpdate = data.additionalCosts?.filter(
        (item) => item.status !== "to_delete"
      );

      const totalAmount = this.calulateTotalCost(
        remianingItemToUpdate ?? [],
        additionalCostToUpdate ?? []
      );

      await this.trx
        .table<table_supplier_purchase_order>("supplier_purchase_order")
        .where({ id: purchaseOrderId })
        .update({
          status: data.status || "draft",
          total: totalAmount,
          updated_at: now,
          purchased_at: data.purchasedAt,
          expected_at: data.expectedAt,
          note: data.note,
        });

      const orderItemToCreate = (data?.items ?? []).filter(
        (item) => item.status === "to_create"
      );

      if (orderItemToCreate.length > 0) {
        await this.createPurchaseOrderItem(purchaseOrderId, orderItemToCreate);
      }

      const additionalCostToCreate = (data?.additionalCosts ?? []).filter(
        (item) => item.status === "to_create"
      );

      if (additionalCostToCreate.length > 0) {
        await this.createAdditionalCostItems(
          purchaseOrderId,
          additionalCostToCreate
        );
      }

      const orderItemToDeleteIds = data.items // in case purchase order item removed from the list
        ?.filter((item) => item.status === "to_delete")
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id));

      const additionalCostsToDeleteIds = data.additionalCosts // in case additional removed from the list
        ?.filter((item) => item.status === "to_delete")
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id));

      if (orderItemToDeleteIds && orderItemToDeleteIds.length > 0) {
        await this.trx
          .table("supplier_purchase_order_detail")
          .whereIn("id", orderItemToDeleteIds)
          .delete();
      }

      if (additionalCostsToDeleteIds && additionalCostsToDeleteIds.length > 0) {
        await this.trx
          .table("supplier_po_addition_cost")
          .whereIn("id", additionalCostsToDeleteIds)
          .delete();
      }

      if (remianingItemToUpdate && remianingItemToUpdate.length > 0) {
        for (const item of remianingItemToUpdate) {
          await this.trx("supplier_purchase_order_detail")
            .where("id", item.id)
            .update({
              quantity: item.qty || 1,
              purchased_cost: item.purchaseCost || "",
              received_qty: item.receivedQty || 0,
              updated_at: Formatter.getNowDate(),
              status: item.status ?? "pending",
            });
        }
      }

      if (additionalCostToUpdate && additionalCostToUpdate.length > 0) {
        for (const item of additionalCostToUpdate) {
          await this.trx("supplier_po_addition_cost")
            .where({ id: item.id })
            .update({
              name: item.name,
              cost: item.cost,
              updated_at: Formatter.getNowDate(),
            });
        }
      }
      return {
        ...data,
        items: remianingItemToUpdate,
        additionalCosts: remianingItemToUpdate,
      };
    } catch (error) {
      console.error("Error updating purchase order:", error);
      return undefined;
    }
  }

  private async getSupplier(supplierId: string): Promise<Supplier> {
    const raw = await this.trx
      .table("supplier")
      .where({ id: supplierId })
      .first();
    return {
      id: raw.id,
      name: raw.name,
      note: raw.note,
      contactName: raw.contact_name,
      contactEmail: raw.contact_email,
      contactPhone: raw.contact_phone,
      address: raw.address,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  private async getWarehouse(
    warehouseId: string
  ): Promise<WarehouseResponseType> {
    const raw = await this.trx
      .table("warehouse")
      .where({ id: warehouseId })
      .first();

    if (!raw) {
      throw new Error("Warehouse not found");
    }
    return {
      id: raw.id,
      name: raw.name,
      isMain: raw.is_main === 1,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      slot: [],
      lat: raw.lat,
      lng: raw.lng,
    };
  }

  async getPurchaseOrderDetail(
    purchaseOrderId: string
  ): Promise<SupplierPurchaseOrderDetail> {
    const raw = await this.trx
      .table("supplier_purchase_order")
      .where({ id: purchaseOrderId })
      .first();

    if (!raw) {
      throw new Error("Purchase order not found");
    }
    const supplier = await this.getSupplier(raw.supplier_id);

    raw.supplier = supplier;

    const orderItems = await this.trx
      .table("supplier_purchase_order_detail as spod")
      .where({ supplier_purchase_order_id: purchaseOrderId })
      .innerJoin("product_variant as pv", "spod.product_variant_id", "pv.id")
      .innerJoin("product as prod", "pv.product_id", "prod.id")
      .leftJoin("product_images as pi", function () {
        this.on("pi.product_id", "prod.id").andOn(
          "pi.product_variant_id",
          "pv.id"
        );
      })
      .select([
        "spod.*",
        "pv.name",
        "pv.name as variant_name",
        "pv.sku",
        "pv.available",
        "prod.title",
        this.trx.raw("GROUP_CONCAT(pi.image_url) as image_urls"),
      ])
      .groupBy("spod.id");

    const additionalCosts = await this.trx
      .table("supplier_po_addition_cost")
      .where({ supplier_po_id: purchaseOrderId })
      .select<table_supplier_po_addition_cost[]>();

    const userInfo = await this.trx
      .table<table_user>("user")
      .where("id", raw.created_by)
      .select("id", "fullname", "phone_number", "username")
      .first();

    const warehouse = await this.trx
      .table("warehouse")
      .where("id", raw.warehouse_id)
      .select("id", "name")
      .first();

    const variantStock = LoaderFactory.variantStockLoader(
      this.trx,
      raw.warehouse_id
    );

    const items = await Promise.all(
      orderItems.map(async (item) => {
        const x = item.id ? await variantStock.load(item.id) : null;
        const imageUrls = item.image_urls
          ? item.image_urls.split(",")[0]
          : null;
        return {
          id: item.id,
          name: `${item.title} ${item.variant_name}`,
          sku: item.sku,
          stock: x?.stock ?? 0,
          supplierPoId: item.supplier_purchase_order_id,
          productVariantId: item.product_variant_id,
          qty: item.quantity ?? 0,
          purchaseCost: item.purchased_cost,
          status: item.status,
          receivedQty: item.received_qty,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          amount: item.quantity * parseFloat(item.purchased_cost),
          image: imageUrls,
        };
      })
    );

    return {
      id: raw.id,
      supplierId: raw.supplier_id,
      warehouseId: raw.warehouse_id,
      status: raw.status,
      total: raw.total,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      purchasedAt: raw.purchased_at,
      expectedAt: raw.expected_at,
      note: raw.note,
      supplier: raw.supplier,
      received: items.reduce((acc, curr) => acc + curr.receivedQty, 0),
      totalQty: items.reduce((acc, curr) => acc + curr.qty, 0),
      warehouse: {
        id: warehouse?.id,
        name: warehouse?.name,
      },
      createdBy: {
        id: userInfo?.id,
        username: userInfo?.username,
        phoneNumber: userInfo?.phone_number,
        fullname: userInfo?.fullname,
      },
      additionalCosts: additionalCosts.map((item) => {
        return {
          id: item.id,
          name: item.name,
          cost: item.cost,
          status: item.status,
          supplierPoId: item.supplier_po_id!,
        };
      }),

      poIncrement: `PO-00${raw?.po_increment}`,
      items: items,
    };
  }

  async getAllPurchaseOrders({
    supplierId,
    warehouseId,
    limit = 30,
    offset = 0,
    status,
  }: PurchaseOrderFilter): Promise<SupplierPurchaseOrder[]> {
    const raw = await this.trx
      .table("supplier_purchase_order as spo")
      .where("spo.status", "!=", "deleted")
      .modify((query) => {
        if (supplierId) query.where("supplier_id", supplierId);
        if (warehouseId) query.where("warehouse_id", warehouseId);
        if (status) query.where("spo.status", status);
      })
      .leftJoin(
        "supplier_purchase_order_detail as spod",
        "spo.id",
        "spod.supplier_purchase_order_id"
      )
      .select([
        "spo.*",
        this.trx.raw("COALESCE(SUM(spod.received_qty), 0) as total_received"),
        this.trx.raw("COALESCE(SUM(spod.quantity), 0) as total_qty"),
        this.trx.raw(
          "COALESCE(SUM(spod.received_qty * spod.purchased_cost), 0) as total_amount_received"
        ),
      ])
      .groupBy("spo.id")
      .orderBy("spo.created_at", "desc")
      .limit(limit)
      .offset(offset);

    if (!raw) {
      throw new Error("No purchase orders found for the given filter");
    }

    const spoac = await this.trx.table("supplier_po_addition_cost").whereIn(
      "supplier_po_id",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.map((x: any) => x.id)
    );

    const purchaseOrders = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.map(async (item: any) => {
        const supplier = await this.getSupplier(item.supplier_id);

        const warehouse = await this.getWarehouse(item.warehouse_id);

        const additional = spoac.filter((f) => f.supplier_po_id === item.id);
        const additionalCosts = additional.reduce((a, b) => a + b.cost, 0);

        return {
          id: item.id,
          supplierId: item.supplier_id,
          warehouseId: item.warehouse_id,
          status: item.status,
          total: item.total,
          receivedTotal: (
            Number(item.total_amount_received) + Number(additionalCosts)
          ).toFixed(2),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          purchasedAt: item.purchased_at,
          expectedAt: item.expected_at,
          note: item.note,
          supplier: supplier,
          warehouse: warehouse,
          received: item.total_received,
          totalQty: item.total_qty,
          poIncrement: `PO-00${item.po_increment}`,
          additionalCosts,
        };
      })
    );
    return purchaseOrders as SupplierPurchaseOrder[];
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    try {
      await this.trx<table_supplier_purchase_order_detail>(
        "supplier_purchase_order_detail"
      )
        .where("supplier_purchase_order_id", id)
        .update({
          status: "cancelled",
        });

      await this.trx<table_supplier_purchase_order>("supplier_purchase_order")
        .where("id", id)
        .update({
          status: "deleted",
        });
      return true;
    } catch {
      return true;
    }
  }
}
