import { Knex } from "knex";
import { Formatter } from "../formatter";
import { v4 } from "uuid";
import { table_supplier } from "@/generated/tables";

export interface SupplierInput {
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  note?: string;
  isConsignment?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier extends SupplierInput {
  id: string;
}

export async function createSupplier({
  db,
  input,
}: {
  db: Knex;
  input: SupplierInput;
}) {
  const now = Formatter.getNowDateTime();
  const supId = v4();

  const supplierInput = {
    id: supId,
    name: input.name,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    address: input.address,
    note: input.note,
    is_consignment: input.isConsignment ? 1 : 0,
    created_at: now,
  };

  await db.table<table_supplier>("supplier").insert(supplierInput);

  return supplierInput;
}

export async function updateSupplier({
  db,
  input,
}: {
  db: Knex;
  input: Partial<Supplier>;
}) {
  const now = Formatter.getNowDateTime();

  const updatedFields = {
    ...(input.name && { name: input.name }),
    ...(input.contactName && { contact_name: input.contactName }),
    ...(input.contactEmail && { contact_email: input.contactEmail }),
    ...(input.contactPhone && { contact_phone: input.contactPhone }),
    ...(input.address && { address: input.address }),
    ...(input.note !== undefined && { note: input.note }),
    ...(input.isConsignment !== undefined && {
      is_consignment: input.isConsignment ? 1 : 0,
    }),
    updated_at: now,
  };

  await db
    .table<table_supplier>("supplier")
    .where("id", input.id)
    .update(updatedFields);

  return { id: input.id, ...updatedFields };
}

export async function getSupplierList({
  db,
  limit,
  offset,
  search,
}: {
  limit: number;
  offset: number;
  db: Knex;
  search?: string;
}): Promise<{ suppliers: Supplier[]; total: number }> {
  try {
    const query = db.table<table_supplier>("supplier").whereNull("delete_date");

    if (search && search.trim() !== "") {
      query.where(function () {
        this.where("name", "LIKE", `%${search}%`)
          .orWhere("contact_name", "LIKE", `%${search}%`)
          .orWhere("contact_phone", "LIKE", `%${search}%`);
      });
    }

    // Get total count
    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    // Get paginated results
    const results = await query
      .clone()
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    const suppliers: Supplier[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      note: r.note,
      contactEmail: r.contact_email,
      contactName: r.contact_name,
      contactPhone: r.contact_phone,
      createdAt: r.created_at,
      address: r.address,
      isConsignment: r.is_consignment === 1,
    }));

    return { suppliers, total };
  } catch {
    return { suppliers: [], total: 0 };
  }
}

export async function getSupplierById({
  db,
  id,
}: {
  db: Knex;
  id: string;
}): Promise<Supplier | null> {
  try {
    const result = await db
      .table<table_supplier>("supplier")
      .where("id", id)
      .whereNull("delete_date")
      .first();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      note: result.note,
      contactEmail: result.contact_email,
      contactName: result.contact_name,
      contactPhone: result.contact_phone,
      createdAt: result.created_at,
      address: result.address,
      isConsignment: result.is_consignment === 1,
    };
  } catch {
    return null;
  }
}

export async function deleteSupplier({ db, id }: { db: Knex; id: string }) {
  const now = Formatter.getNowDateTime();
  await db.table<table_supplier>("supplier").where("id", id).update({
    delete_date: now,
  });

  return { id, deleted: true };
}
