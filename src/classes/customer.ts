import { LoaderFactory } from "@/dataloader/loader-factory";
import { Warehouse } from "@/dataloader/warehouse-loader";
import { table_customer } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { Order } from "./order";

interface CustomerProps {
  customerName: string;
  phoneNumber: string;
  address: string;
  warehouseId: string;
  createdBy: string;
  type: "general" | "delivery";
  extraPrice?: number;
}

export interface Customer {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  createdAt: string;
  createdBy: UserInfo | null;
  warehouse: Warehouse | null;
  orders: Order[];
  type: "general" | "delivery";
  extraPrice: string | null;
}

export class CustomerService {
  constructor(protected tx: Knex) {}

  async createCustomer({
    customerName,
    phoneNumber,
    address,
    warehouseId,
    createdBy,
    type,
    extraPrice,
  }: CustomerProps) {
    const now = Formatter.getNowDateTime();
    const customerId = generateId();
    await this.tx.table<table_customer>("customer").insert({
      id: customerId,
      customer_name: customerName,
      address: address,
      phone: phoneNumber,
      pos_warehouse_id: warehouseId,
      created_by: createdBy,
      created_at: now,
      customer_type: type,
      extra_price: extraPrice ? String(extraPrice) : null,
    });
    return customerId;
  }

  async getCustomerList({
    limit,
    offset,
    warehouseId,
    phone,
    type,
  }: {
    limit: number;
    offset: number;
    warehouseId: string;
    phone?: string;
    type?: "general" | "delivery";
  }) {
    const query = this.tx
      .table<table_customer>("customer")
      .where({ pos_warehouse_id: warehouseId, is_active: 1 })
      .whereNotNull("phone");

    if (phone) {
      query.andWhere("phone", "like", `%${phone}%`);
    }

    if (type) {
      query.andWhere("customer_type", type);
    }

    const total = await query
      .clone()
      .count<{ count: number }>("id as count")
      .first();

    const customers = await query
      .select("*")
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    const userLoader = LoaderFactory.userLoader(this.tx);
    const warehouseLoader = LoaderFactory.warehouseLoader(this.tx);

    const result = await Promise.all(
      customers.map(async (customer) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: any[] = [];
        return {
          id: customer.id,
          customerName: customer.customer_name,
          phone: customer.phone,
          address: customer.address,
          type: customer.customer_type || "general",
          createdAt: Formatter.dateTime(customer.created_at),
          createdBy: customer.created_by
            ? await userLoader.load(customer.created_by)
            : null,
          warehouse: customer.pos_warehouse_id
            ? await warehouseLoader.load(customer.pos_warehouse_id)
            : null,
          orders: (orders || []) as unknown as Order[],
          extraPrice: customer.extra_price,
        } as Customer;
      }),
    );

    return {
      total: total ? total.count : 0,
      data: result,
    };
  }

  async getCustomerById(customerId: string) {
    const customer = await this.tx
      .table<table_customer>("customer")
      .where({ id: customerId })
      .first();

    if (!customer) return null;

    const userLoader = LoaderFactory.userLoader(this.tx);
    const warehouseLoader = LoaderFactory.warehouseLoader(this.tx);

    return {
      id: customer.id,
      customerName: customer.customer_name,
      phone: customer.phone,
      address: customer.address,
      createdAt: Formatter.dateTime(customer.created_at),
      type: customer.customer_type || "general",
      extraPrice: customer.extra_price,
      createdBy: customer.created_by
        ? await userLoader.load(customer.created_by)
        : null,
      warehouse: customer.pos_warehouse_id
        ? await warehouseLoader.load(customer.pos_warehouse_id)
        : null,
      orders: [],
    } as Customer;
  }

  async updateCustomer(customerId: string, updates: Partial<CustomerProps>) {
    await this.tx
      .table<table_customer>("customer")
      .where({ id: customerId })
      .update({
        customer_name: updates.customerName,
        phone: updates.phoneNumber,
        address: updates.address,
        pos_warehouse_id: updates.warehouseId,
        customer_type: updates.type,
        extra_price: updates.extraPrice ? String(updates.extraPrice) : null,
        updated_at: Formatter.getNowDateTime(),
      });
    return customerId;
  }

  async deleteCustomer(customerId: string) {
    await this.tx
      .table<table_customer>("customer")
      .where({ id: customerId })
      .update({
        is_active: 0,
        updated_at: Formatter.getNowDateTime(),
      });
    return customerId;
  }
}
