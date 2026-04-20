/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_customer_order,
  table_order_detail_modifier,
  table_print_queue,
  table_product,
  table_product_categories,
  table_product_category,
  table_product_variant,
  table_restaurant_tables,
  table_setting,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { getOrderDetail } from "./order";

interface Printers {
  printers: PrinterInfo[];
  print_server_ip: string;
}

interface PrinterInfo {
  name: string;
  printer_name: string;
  ip: string;
  port: number;
  id: string;
}

export class PrintToKitchenService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async getPrintQueues() {
    const setting = await this.tx
      .table("setting")
      .where({
        option: "PRINT_SERVER",
        warehouse: this.user.currentWarehouseId,
      })
      .first();

    const printerSettings = JSON.parse(setting?.value || "{}");

    const printerSettingGroupBy = printerSettings.group_by || "ITEM";

    const printQueues: table_print_queue[] = await this.tx
      .table<table_print_queue>("print_queue")
      .where("warehouse_id", this.user.currentWarehouseId)
      .orderBy("id")
      .select();

    if (printerSettingGroupBy === "TABLE") {
      const groupedQueues: any[] = [];

      for (const queue of printQueues) {
        const existingGroup = groupedQueues.find(
          (g) =>
            g.order_id === queue.order_id &&
            g.printer_info.id === queue.printer_info.id,
        );

        if (existingGroup) {
          const index = groupedQueues.indexOf(existingGroup);
          const existingContent = groupedQueues[index].content;
          const newContent = queue.content as any[];
          groupedQueues[index].content = [
            ...existingContent,
            {
              type: "text",
              style: {
                fontFamily: "Hanuman, 'Courier New', Courier, monospace",
              },
              value: "*****************************",
            },
            ...newContent.slice(4),
          ];
          groupedQueues[index].id = `${groupedQueues[index].id},${queue.id}`;
          groupedQueues[index].order_detail_id =
            `${groupedQueues[index].order_detail_id},${queue.order_detail_id}`;
          groupedQueues[index].item_price =
            `${groupedQueues[index].item_price},${queue.item_price}`;
        } else {
          groupedQueues.push(queue);
        }
      }

      return groupedQueues;
    }

    return printQueues;
  }

  async deletePrintQueue(ids: number[]) {
    const items = await this.tx
      .table("print_queue")
      .whereIn("id", ids)
      .select();

    if (items.length > 0) {
      await this.tx.table("print_kitchen_log").insert(
        items.map((item) => ({
          order_id: item.order_id || "",
          order_detail_id: item.order_detail_id || "",
          item_price: item.item_price || "0",
          printed_at: Formatter.getNowDateTime(),
          content: JSON.stringify(item.content),
          printer_info: JSON.stringify(item.printer_info),
        })),
      );
    }

    await this.tx.table("print_queue").whereIn("id", ids).delete();
    return true;
  }

  async printOrderToKitchen(orderItemId: string, qty: number) {
    const orderItem = await getOrderDetail(orderItemId, this.tx);
    if (!orderItem?.variant_id)
      throw new Error("Order item variant ID not found");

    const printer = await getPrinterInfo(
      orderItem?.variant_id,
      this.tx,
      this.user,
    );
    if (!printer) return;

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.tx,
      this.user.currentWarehouseId!,
    );

    const productVariant = await variantLoader.load(
      orderItem?.variant_id || "",
    );

    const modifiers = await getOrderDetailModifiers(orderItemId, this.tx);
    const table = await getTableDetails(orderItem.order_id!, this.tx);
    const orderByUser = await this.tx
      .table("user")
      .where("id", orderItem.created_by)
      .first();
    const contentToPrint: Record<string, unknown>[] = [
      {
        type: "image",
        url: "https://s9.kh1.co/12d44b8ec749071f404ae797cffcaa30.webp",
        width: "160px", // width of image in px; default: auto
        height: "80px",
        style: {
          margin: "10 0px 0 0px",
        },
      },
      {
        type: "text",
        value: `តុលេខ: ${table?.table_name}`,
        style: {
          fontSize: "20px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      },
      {
        type: "text",
        value: `កាលបរិច្ឆេទ: ${Formatter.getNowDateTime()}`,
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      },
      {
        type: "text",
        value: `បញ្ជាទិញដោយ: ${orderByUser?.fullname}`,
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      },
    ];

    if (table.section === "delivery") {
      contentToPrint.push({
        type: "text",
        value: "ប្រភេទ: វេចខ្ចប់",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      });
    }

    contentToPrint.push(
      {
        type: "text",
        value: `ចំនួន: x${qty}`,
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      },
      {
        type: "text",
        value: "--------------------------------",
        style: {
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      },
      {
        type: "text",
        value: `ទំនិញ:   ${productVariant?.basicProduct?.title} (${productVariant?.name})`,
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
          whiteSpace: "pre-wrap",
          width: "257px",
          display: "block",
          wordBreak: "break-word",
        },
      },
    );

    if (modifiers.length > 0) {
      for (const m of modifiers) {
        contentToPrint.push({
          type: "text",
          value: `   + ${m.modifier}`,
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
          },
        });
      }
    }

    const existingQueue = await this.tx
      .table("print_kitchen_log")
      .where("order_detail_id", orderItemId);

    if (existingQueue.length > 0) {
      contentToPrint.push({
        type: "text",
        value: `***** Resend to Kitchen By ${this.user.fullname} (${existingQueue.length}) *****`,
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
        },
      });
    }

    const result = await this.tx.table("print_queue").insert({
      created_at: Formatter.getNowDateTime(),
      created_by: this.user.id,
      content: JSON.stringify(contentToPrint),
      printer_info: JSON.stringify(printer),
      warehouse_id: this.user.currentWarehouseId,
      order_id: orderItem.order_id,
      order_detail_id: orderItemId,
      item_price: orderItem.price?.toString() || "0",
    });

    // Get the inserted record ID
    const queueId = Array.isArray(result) ? result[0] : result;

    return queueId;
  }
}

async function getOrderDetailModifiers(orderItemId: string, tx: Knex) {
  return await tx
    .table<table_order_detail_modifier>("order_detail_modifier")
    .leftJoin(
      "modifier_items",
      "order_detail_modifier.modifier_item_id",
      "modifier_items.id",
    )
    .where("order_detail_modifier.order_detail_id", orderItemId)
    .orderByRaw("order_detail_modifier.modifier_item_id IS NULL ASC")
    .select(
      tx.raw(`
        COALESCE(modifier_items.name, order_detail_modifier.notes) AS modifier,
        order_detail_modifier.price
    `),
    );
}

async function getTableDetails(orderId: string, tx: Knex) {
  return await tx
    .table<table_restaurant_tables>("restaurant_tables")
    .innerJoin<table_customer_order>(
      "customer_order",
      "customer_order.table_number",
      "restaurant_tables.id",
    )
    .where("customer_order.order_id", orderId)
    .select("restaurant_tables.*")
    .first<table_restaurant_tables>();
}

async function getPrinterInfo(
  productVariantId: string,
  tx: Knex,
  user: UserInfo,
) {
  const query = tx
    .table<table_product>("product")
    .innerJoin<table_product_variant>(
      "product_variant",
      "product.id",
      "product_variant.product_id",
    )
    .innerJoin<table_product_categories>(
      "product_categories",
      "product.id",
      "product_categories.product_id",
    )
    .innerJoin<table_product_category>(
      "product_category",
      "product_categories.category_id",
      "product_category.id",
    )
    .innerJoin(
      "warehouse_category_printer",
      "warehouse_category_printer.category_id",
      "product_category.id",
    )
    .where({
      "product_variant.id": productVariantId,
      "warehouse_category_printer.warehouse_id": user.currentWarehouseId,
    })
    .select(
      "product_category.*",
      "warehouse_category_printer.printer_id as printer",
    );

  const rows: (table_product_category & { printer: string })[] = await query;

  for (const row of rows) {
    if (row.printer) {
      const printer = await getPrinterById(row.printer, tx, user);
      if (printer) return printer;
    }
  }
  return null;
}

async function getPrinterById(printerId: string, tx: Knex, user?: UserInfo) {
  const printerSettings = await tx
    .table<table_setting>("setting")
    .where({
      option: "PRINT_SERVER",
      warehouse: user?.currentWarehouseId,
    })
    .first();
  try {
    const printerValues: Printers = JSON.parse(printerSettings.value);
    const { printers, print_server_ip } = printerValues;
    const foundPrinter = printers.find((d) => d.id === printerId);
    if (foundPrinter) {
      return {
        ...foundPrinter,
        print_server_ip,
      };
    }
    return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}
