import { table_bind_user, table_user } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateUserToken } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { LoaderFactory } from "@/dataloader/loader-factory";

export const BindUserSchema = z.array(
  z.object({
    warehouseId: z.string(),
    userId: z.string(),
    group: z.number(),
    isMain: z.boolean().optional(),
    isNew: z.boolean().optional(),
  }),
);

export type BindUserProps = z.infer<typeof BindUserSchema>;

export class BindUserService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async getBindUserGroup(userId: string) {
    const row = await this.tx
      .table("bind_user")
      .where(
        "group",
        "=",
        this.tx
          .table("bind_user")
          .where("user_id", "=", userId)
          .select("group"),
      )
      .first();

    if (!!row) return row.group;

    const lastGroupRow = await this.tx
      .table("bind_user")
      .orderBy("group", "desc")
      .first();

    return lastGroupRow ? lastGroupRow.group + 1 : 1;
  }

  async createBindUser(input: BindUserProps) {
    await this.tx.transaction(async (trx) => {
      const user: table_user = await trx
        .table<table_user>("user")
        .where({ id: input.find((f) => !!f.isMain)?.userId })
        .first();

      const existingBindUsers: table_bind_user = await trx
        .table("bind_user")
        .where({ user_id: user.id })
        .first();

      const bindUsersWillCreate: table_user[] = [];
      const mainUserGroup: table_bind_user[] = [];

      if (!existingBindUsers) {
        mainUserGroup.push({
          user_id: user.id || "",
          group: input.at(0)?.group || 0,
          is_main_user: 1,
        });
      }

      for (const item of input.filter((f) => !!f.isNew)) {
        const userId = generateId();
        const token = generateUserToken();
        const hashedPassword = await bcrypt.hash(user.phone_number, 10);

        bindUsersWillCreate.push({
          id: userId,
          username: generateId().slice(0, 8),
          phone_number: user.phone_number,
          fullname: user.fullname,
          profile: user.profile,
          role_id: user.role_id,
          token,
          is_dev: user.is_dev ? 1 : 0,
          warehouse_id: item.warehouseId,
          created_by: this.user.id || "",
          created_at: Formatter.getNowDateTime(),
          password: hashedPassword,
          is_deleted: 0,
          is_system_admin: 0,
        });

        mainUserGroup.push({
          user_id: userId,
          group: item.group,
          is_main_user: item.isMain ? 1 : 0,
        });
      }

      const bindUsersWillDelete: table_bind_user[] = await trx
        .table("bind_user")
        .where("group", "=", input.at(0)?.group || 0)
        .whereNotIn(
          "user_id",
          input.filter((f) => !f.isNew).map((f) => f.userId),
        );

      if (bindUsersWillDelete.length > 0) {
        const bindUserIdsWillDelete: number[] = bindUsersWillDelete.map(
          (b) => b.id || 0,
        );

        await trx
          .table("bind_user")
          .whereIn("id", bindUserIdsWillDelete)
          .delete();

        await trx
          .table("user")
          .whereIn(
            "id",
            bindUsersWillDelete.map((b) => b.user_id),
          )
          .update({
            is_deleted: 1,
          });
      }

      if (bindUsersWillCreate.length > 0) {
        await trx.table("user").insert(bindUsersWillCreate);
      }

      if (mainUserGroup.length > 0) {
        await trx.table("bind_user").insert(mainUserGroup);
      }
    });
  }

  async getBindUsersList(userId: string) {
    const rows = await this.tx
      .table("bind_user")
      .where(
        "group",
        "=",
        this.tx
          .table("bind_user")
          .where("user_id", "=", userId)
          .select("group"),
      );

    if (rows.length === 0) return [];

    const userLoader = LoaderFactory.userLoader(this.tx);

    return Promise.all(
      rows.map(async (row) => {
        return {
          userId: row.user_id,
          group: row.group,
          isMain: row.is_main_user === 1,
          user: await userLoader.load(row.user_id || ""),
        };
      }),
    );
  }
}
