import {
  table_product_category,
  table_supplier,
  table_warehouse_slot,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import * as ExcelJS from "exceljs";
import { Knex } from "knex";
import path from "path";
import { ProductCategory } from "./product-category";
import { ProductOptionService, ProductOptionsInput } from "./product-options";
import { ProductInput, ProductServiceV2 } from "./product-v2";
import { ProductVariant, ProductVariantService } from "./product-variant";
import { SlotMovementService } from "./slot-movement";

export interface ExcelRow {
  id: string;
  barcode: string;
  title: string;
  description: string;
  vendorName: string;
  cost: number;
  rsp: number;
  estimationGP: number;
  category: string;
  stocks: number;
  variant: string;
  image: string;
}

export class UploadFromExcel {
  constructor(
    protected knex: Knex,
    protected user: UserInfo,
    protected excelFilePath: string,
  ) {}

  async uploadProducts(dataInput?: ExcelRow[]) {
    const data = dataInput ? dataInput : await this.readExcel();

    // Group rows by row.id so that rows sharing an id map to the same product
    const groupedById = new Map<string, ExcelRow[]>();
    for (const row of data) {
      const existing = groupedById.get(row.id);
      if (existing) {
        existing.push(row);
      } else {
        groupedById.set(row.id, [row]);
      }
    }

    const groups = Array.from(groupedById.entries());
    const length = groups.length;
    console.log(`Total product groups to process: ${length}`);
    let processed = 0;

    for (const [productId, rows] of groups) {
      processed++;
      const firstRow = rows[0];
      console.log(
        `Processing group ${processed} of ${length}: ${firstRow.description} (${rows.length} variant(s))`,
      );

      await this.knex.transaction(async (trx) => {
        const posSlot = await getPosSlot(trx, this.user.currentWarehouseId!);

        // Check whether the product already exists in the database
        const existingProduct = await trx
          .table("product")
          .where("id", productId)
          .first();

        const productVariantService = new ProductVariantService(
          trx,
          this.user,
          productId,
        );

        if (!existingProduct) {
          // --- Create new product ---
          const supplier = await getSupplierByName(trx, firstRow.vendorName);
          const productBasic: ProductInput = {
            title: firstRow.title,
            description: firstRow.description,
            supplierId: supplier ? supplier.id : null,
            isForSale: true,
          };
          const productService = new ProductServiceV2(trx, this.user);
          await productService.createProduct(productBasic, productId);

          // product category
          const category = await getCategoryByName(trx, firstRow.category);
          const productCategory = new ProductCategory(
            trx,
            this.user,
            productId,
          );
          await productCategory.updateProductCategories([
            { categoryId: category.id! },
          ]);

          // Build one option with deduplicated values (guard against duplicate variant names in the group)
          const optionId = generateId();
          const seenValues = new Map<string, { id: string; value: string }>();
          const optionValues = rows.map((row) => {
            const val = row.variant || "default";
            if (!seenValues.has(val)) {
              seenValues.set(val, { id: generateId(), value: val });
            }
            return seenValues.get(val)!;
          });
          const uniqueOptionValues = Array.from(seenValues.values());

          const productOptionService = new ProductOptionService(
            trx,
            this.user,
            productId,
          );
          const productOptions: ProductOptionsInput = [
            { id: optionId, name: "option", values: uniqueOptionValues },
          ];
          await productOptionService.createProductOptions(productOptions);

          // Create a variant per row
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const variant: ProductVariant = {
              id: generateId(),
              name: optionValues[i].value,
              optionValues: [optionValues[i]],
              purchasedCost: row.cost,
              compositeVariants: [],
              barcode: row.barcode !== "" ? row.barcode : undefined,
              price: row.rsp,
              isComposite: false,
              available: true,
              isDefault: i === 0,
              visible: true,
            };
            await productVariantService.createProductVariant(
              variant,
              row.image,
            );

            if (row.stocks > 0 && posSlot) {
              const stockMovementService = new SlotMovementService(trx);
              const trxId = await stockMovementService.stockin({
                variantId: variant.id,
                slotId: posSlot.id!,
                productLot: {
                  variantId: variant.id,
                  lotNumber: null,
                  expiredAt: undefined,
                  manufacturedAt: undefined,
                  costPerUnit: row.cost,
                },
                qty: row.stocks,
                createdBy: this.user,
                transactionType: "STOCK_IN",
              });
              console.log("Stock in transaction ID:", trxId);
            }
          }
        } else {
          // --- Product already exists – add variants only ---
          const productOptionService = new ProductOptionService(
            trx,
            this.user,
            productId,
          );
          const existingOptions = await productOptionService.getProductOption();
          const existingOption = existingOptions[0]; // assumes single option created by this class

          const now = Formatter.getNowDateTime();

          for (const row of rows) {
            const valueName = row.variant || "default";

            // Reuse existing option value or insert a new one
            let existingOptionValue = existingOption.values.find(
              (v) => v.value === valueName,
            );
            if (!existingOptionValue) {
              existingOptionValue = { id: generateId(), value: valueName };
              await trx.table("product_option_value").insert({
                id: existingOptionValue.id,
                product_option_id: existingOption.id,
                value: existingOptionValue.value,
                created_at: now,
              });
            }
            const optionValue = existingOptionValue;

            const variant: ProductVariant = {
              id: generateId(),
              name: optionValue.value,
              optionValues: [optionValue],
              purchasedCost: row.cost,
              compositeVariants: [],
              barcode: row.barcode !== "" ? row.barcode : undefined,
              price: row.rsp,
              isComposite: false,
              available: true,
              isDefault: false,
              visible: true,
            };
            await productVariantService.createProductVariant(variant);

            if (row.stocks > 0 && posSlot) {
              const stockMovementService = new SlotMovementService(trx);
              const trxId = await stockMovementService.stockin({
                variantId: variant.id,
                slotId: posSlot.id!,
                productLot: {
                  variantId: variant.id,
                  lotNumber: null,
                  expiredAt: undefined,
                  manufacturedAt: undefined,
                  costPerUnit: row.cost,
                },
                qty: row.stocks,
                createdBy: this.user,
                transactionType: "STOCK_IN",
              });
              console.log("Stock in transaction ID:", trxId);
            }
          }
        }

        await productVariantService.triggerVariant(productId);
      });
    }
  }

  private async readExcel(): Promise<ExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    const fullPath = path.resolve(this.excelFilePath);

    // Read the Excel file
    await workbook.xlsx.readFile(fullPath);

    // Get the first worksheet (assuming data is in the first sheet)
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("No worksheet found in the Excel file");
    }

    const excelData: ExcelRow[] = [];

    // Skip the header row (assuming row 1 contains headers)
    // Iterate through rows starting from row 2
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const rowData: ExcelRow = {
        id: this.getCellValue(row.getCell(1)) || generateId(), // Column A
        barcode: this.getCellValue(row.getCell(2)) || "", // Column B
        title: this.getCellValue(row.getCell(3)) || "", // Column C
        description: this.getCellValue(row.getCell(4)) || "", // Column D
        vendorName: this.getCellValue(row.getCell(5)) || "", // Column E
        cost: this.getNumericValue(row.getCell(6)) || 0, // Column F
        rsp: this.getNumericValue(row.getCell(7)) || 0, // Column G
        estimationGP: this.getNumericValue(row.getCell(8)) || 0, // Column H
        category: this.getCellValue(row.getCell(9)) || "", // Column I
        stocks: this.getNumericValue(row.getCell(10)) || 0, // Column J
        variant: this.getCellValue(row.getCell(11)) || "", // Column K
        image: this.getCellValue(row.getCell(12)) || "", // Column L
      };

      // Only add rows that have at least a barcode or description
      if (rowData.barcode || rowData.description) {
        excelData.push(rowData);
      }
    });

    return excelData;
  }

  private getCellValue(cell: ExcelJS.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) {
      return "";
    }
    return String(cell.value).trim();
  }

  private getNumericValue(cell: ExcelJS.Cell): number {
    if (!cell || cell.value === null || cell.value === undefined) {
      return 0;
    }
    const numValue = Number(cell.value);
    return isNaN(numValue) ? 0 : numValue;
  }
}

async function getSupplierByName(trx: Knex, name: string) {
  // trim name and make case insensitive
  name = name.trim().toLowerCase();
  const supplier = await trx<table_supplier>("supplier")
    .whereRaw("LOWER(name) = ?", [name])
    .first();
  if (!supplier) {
    const newSupplier: table_supplier = {
      id: generateId(),
      name: name,
      created_at: Formatter.getNowDateTime(),
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      address: null,
      note: null,
      is_consignment: null,
      updated_at: null,
      delete_date: null,
    };
    await trx.table<table_supplier>("supplier").insert(newSupplier);
    return newSupplier;
  } else {
    return supplier;
  }
}

async function getCategoryByName(trx: Knex, name: string) {
  name = name.trim().toLowerCase();
  const category = await trx<table_product_category>("product_category")
    .whereRaw("LOWER(title) = ?", [name])
    .first();
  if (!category) {
    const newCategory: table_product_category = {
      id: generateId(),
      title: name,
      created_at: Formatter.getNowDateTime(),
      updated_at: null,
      delete_date: null,
      description: null,
      image_url: null,
      parent_id: null,
    };
    await trx
      .table<table_product_category>("product_category")
      .insert(newCategory);
    return newCategory;
  } else {
    return category;
  }
}

async function getPosSlot(trx: Knex, warehouseId: string) {
  const slot = await trx<table_warehouse_slot>("warehouse_slot")
    .where("warehouse_id", warehouseId)
    .where("pos_slot", 1)
    .first();
  return slot;
}
