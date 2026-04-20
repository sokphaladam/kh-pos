import { table_setting } from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";

export interface Printer {
  id: string;
  name: string;
  printerName: string;
  ip: string;
  port: number;
}

export class PrintServer {
  constructor(protected knex: Knex, protected user: UserInfo) {}

  async getAllPrinters(): Promise<Printer[]> {
    const printServerSetting = await this.knex
      .table<table_setting>("setting")
      .where("option", "PRINT_SERVER")
      .where("warehouse", this.user.currentWarehouseId)
      .first();

    if (!printServerSetting) {
      return [];
    }
    try {
      const printers = JSON.parse(printServerSetting.value).printers;
      return printers.map(
        (printer: {
          id: string;
          name: string;
          printer_name: string;
          ip: string;
          port: number;
        }) => ({
          id: printer.id,
          name: printer.name,
          printerName: printer.printer_name,
          ip: printer.ip,
          port: printer.port,
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  }
}
