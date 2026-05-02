import {
  table_product_category,
  table_supplier,
  table_user,
  table_user_role,
  table_warehouse_slot,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateUserToken } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import * as ExcelJS from "exceljs";
import { Knex } from "knex";
import path from "path";
import { ProductCategory } from "./product-category";
import { ProductOptionService, ProductOptionsInput } from "./product-options";
import { ProductInput, ProductServiceV2 } from "./product-v2";
import { ProductVariant, ProductVariantService } from "./product-variant";
import { SlotMovementService } from "./slot-movement";
import bcrypt from "bcryptjs";

export interface ExcelRow {
  barcode: string;
  description: string;
  vendorName: string;
  cost: number;
  rsp: number;
  estimationGP: number;
  category: string;
  stocks: number;
}

export interface UserExcelRow {
  fullName: string;
  username: string;
  phoneNumber: string;
  position: string;
  profile: string;
}

export class UploadFromExcel {
  constructor(
    protected knex: Knex,
    protected user: UserInfo,
    protected excelFilePath: string,
  ) {}

  async uploadProducts(dataInput?: ExcelRow[]) {
    const data = dataInput ? dataInput : await this.readExcel();
    const length = data.length;
    console.log(`Total rows to process: ${length}`);
    let processed = 0;
    console.log(`Starting upload of products...`);
    for (const row of data) {
      processed++;
      console.log(
        `Processing row ${processed} of ${length}: ${row.description}`,
      );
      await this.knex.transaction(async (trx) => {
        // get supplier info
        const supplier = await getSupplierByName(trx, row.vendorName);
        // product basic
        const productBasic: ProductInput = {
          title: row.description,
          description: row.description,
          supplierId: supplier ? supplier.id : null,
          isForSale: true,
        };
        const productService = new ProductServiceV2(trx, this.user);
        const productId = await productService.createProduct(productBasic);
        // product category
        const category = await getCategoryByName(trx, row.category);
        const productCategory = new ProductCategory(trx, this.user, productId);
        await productCategory.updateProductCategories([
          {
            categoryId: category.id!,
          },
        ]);

        // product option
        const productOptionService = new ProductOptionService(
          trx,
          this.user,
          productId,
        );

        const productOptions: ProductOptionsInput = [
          {
            values: [
              {
                id: generateId(),
                value: "default",
              },
            ],
            id: generateId(),
            name: "option",
          },
        ];
        await productOptionService.createProductOptions(productOptions);

        // product variant
        const productVariantService = new ProductVariantService(
          trx,
          this.user,
          productId,
        );

        const variant: ProductVariant = {
          id: generateId(),
          name: "default",
          optionValues: productOptions[0].values,
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

        await productVariantService.triggerVariant(productId);

        // update stock
        if (row.stocks > 0) {
          const posSlot = await getPosSlot(trx, this.user.currentWarehouseId!);
          const stockMovementService = new SlotMovementService(trx);
          const trxId = await stockMovementService.stockin({
            variantId: variant.id,
            slotId: posSlot!.id!,
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
      });
    }
  }

  async uploadUsers(dataInput: UserExcelRow[]) {
    const data = dataInput ? dataInput : await this.readUserExcel();
    const length = data.length;
    console.log(`Total user rows to process: ${length}`);
    let processed = 0;
    console.log(`Starting upload of users...`);
    for (const row of data) {
      processed++;
      console.log(
        `Processing user row ${processed} of ${length}: ${row.username}`,
      );

      await this.knex.transaction(async (trx) => {
        const hashedPassword = await bcrypt.hash("123456", 10);
        const role = await trx("user_role")
          .where("role", "=", row.position)
          .first();

        const roleId = role ? role.id : generateId();

        if (!role) {
          await trx.table<table_user_role>("role").insert({
            id: roleId,
            role: row.position,
            created_at: Formatter.getNowDateTime(),
            is_default: 0,
            permissions: {
              order: "create,read,update,delete",
              restaurant: "read,delete,create,update",
              "order-preparation": "read,create,update,delete",
            },
          });
        }

        const defaultSystemAdmin = await trx
          .table<table_user>("user")
          .where("is_system_admin", 1)
          .where("is_deleted", 0)
          .where("is_dev", 0)
          .where("warehouse_id", this.user.currentWarehouseId!)
          .first();

        const user: table_user = {
          id: generateId(),
          username: row.username,
          phone_number: row.phoneNumber,
          password: hashedPassword,
          fullname: row.fullName,
          profile: row.profile,
          role_id: roleId,
          created_at: Formatter.getNowDateTime(),
          created_by: defaultSystemAdmin ? defaultSystemAdmin.id : null,
          token: generateUserToken(),
          warehouse_id: this.user.currentWarehouseId!,
          is_system_admin: 0,
          is_dev: 0,
          is_deleted: 0,
        };

        await trx.table<table_user>("user").insert(user);
      });
    }
  }

  private async readUserExcel(): Promise<UserExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    const fullPath = path.resolve(this.excelFilePath);

    // Read the Excel file
    await workbook.xlsx.readFile(fullPath);
    // Get the first worksheet (assuming data is in the first sheet)
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("No worksheet found in the Excel file");
    }
    const excelData: UserExcelRow[] = [];
    // Skip the header row (assuming row 1 contains headers)
    // Iterate through rows starting from row 2
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const rowData: UserExcelRow = {
        fullName: this.getCellValue(row.getCell(1)) || "", // Column A
        username: this.getCellValue(row.getCell(2)) || "", // Column B
        phoneNumber: this.getCellValue(row.getCell(3)) || "", // Column C
        position: this.getCellValue(row.getCell(4)) || "", // Column D
        profile: this.getCellValue(row.getCell(5)) || "", // Column E
      };
      // Only add rows that have at least a username or fullName
      if (rowData.username || rowData.fullName) {
        excelData.push(rowData);
      }
    });
    return excelData;
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
        barcode: this.getCellValue(row.getCell(1)) || "", // Column A
        description: this.getCellValue(row.getCell(2)) || "", // Column B
        vendorName: this.getCellValue(row.getCell(3)) || "", // Column C
        cost: this.getNumericValue(row.getCell(4)) || 0, // Column D
        rsp: this.getNumericValue(row.getCell(5)) || 0, // Column E
        estimationGP: this.getNumericValue(row.getCell(6)) || 0, // Column F
        category: this.getCellValue(row.getCell(7)) || "", // Column G
        stocks: this.getNumericValue(row.getCell(8)) || 0, // Column H
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
