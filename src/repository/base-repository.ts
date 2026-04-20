import { Knex } from "knex";

export type ValueOrKnexRaw<T> = {
  [P in keyof T]: T[P] | Knex.Raw;
};

export default class BaseRepository<T, K = string> {
  protected tableName: string = "";
  protected idColumnName = "id";
  protected tx: Knex;
  protected selectColumns: string | string[] = "*";

  constructor(tx: Knex) {
    this.tx = tx;
  }

  getTableName() {
    return this.tableName;
  }

  async all(): Promise<T[]> {
    return await this.tx(this.tableName).select<unknown>(...this.selectColumns);
  }

  async limitedList(offset: number, limit: number): Promise<T[]> {
    return await this.tx(this.tableName)
      .select<unknown>(...this.selectColumns)
      .offset(offset)
      .limit(limit);
  }

  async findById(id: K): Promise<T> {
    return this.tx
      .table(this.tableName)
      .where({ [this.idColumnName]: id })
      .first<unknown>(...this.selectColumns);
  }

  async findByCustomFieldIds(
    column: string,
    ids: number[],
    preserveOrder = false
  ): Promise<T[]> {
    const rows = await this.tx
      .table(this.tableName)
      .whereIn(column, ids)
      .select<unknown>(...this.selectColumns);

    if (!preserveOrder) return rows;

    return ids.map((id) => {
      const item = rows.find((x: T) => x[column as keyof T] === id);
      if (!item) return null;
      return item;
    });
  }

  async findByIdForUpdate(id: K): Promise<T> {
    return this.tx
      .table(this.tableName)
      .where({ [this.idColumnName]: id })
      .forUpdate()
      .first<unknown>(...this.selectColumns);
  }

  async findByIds(
    ids: readonly K[],
    preserveOrder = false,
    columns: string | string[] = "*"
  ): Promise<(T | null)[]> {
    if (ids.length === 0) return [];

    const rows: T[] = (await this.tx
      .table(this.tableName)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .whereIn(this.idColumnName as any, ids as any)
      .select(columns || this.selectColumns)) as T[];

    if (!preserveOrder) return rows;

    return ids.map((id) => {
      const item = rows.find((x) => x[this.idColumnName as keyof T] === id);
      if (!item) return null;
      return item;
    });
  }

  async insert(value: ValueOrKnexRaw<T>): Promise<number> {
    const result = await this.tx.table(this.tableName).insert(value);
    return result[0];
  }

  async insertMerge(value: ValueOrKnexRaw<T>) {
    await this.tx.table(this.tableName).insert(value).onConflict().merge();
  }

  async insertMany(values: T[]) {
    await this.tx.table(this.tableName).insert(values);
  }

  async update(id: K, value: ValueOrKnexRaw<T>): Promise<boolean> {
    return this.tx
      .table(this.tableName)
      .where({ [this.idColumnName]: id })
      .update(value);
  }

  async updateByCondition(
    condition: Partial<T>,
    value: ValueOrKnexRaw<T>
  ): Promise<boolean> {
    return this.tx.table(this.tableName).where(condition).update(value);
  }
}
