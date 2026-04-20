import { Knex } from "knex";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import getAuthFromToken, {
  getCustomerAuthFromToken,
  mapUserRole,
  UserAuth,
  UserInfo,
} from "./get-auth-from-token";
import { Logger, LogLevel } from "../logger";
import withDatabaseApi from "./with-database-api";
import { table_user } from "@/generated/tables/table_user";
import { table_user_role } from "@/generated/tables";
import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  getWarehouseInfo,
  isInWarehouseZone,
} from "@/classes/authentication/customer-auth";

export default function withAuthApi<
  ParamType = unknown,
  InputType = unknown,
  OutputType = unknown,
  SearchParamType = unknown,
>(
  callback: (props: {
    db: Knex;
    req: NextRequest;
    body?: InputType;
    params?: ParamType;
    searchParams?: SearchParamType;
    logger: Logger;
    userAuth: UserAuth;
  }) => Promise<NextResponse<OutputType>>,
  authType: ("ADMIN" | "CUSTOMER" | "PUBLIC")[] = ["ADMIN"],
) {
  return withDatabaseApi<ParamType, InputType, OutputType, SearchParamType>(
    async ({ db, req, body, params, searchParams }) => {
      const headerList = await headers();
      const token = headerList.get("authorization")?.startsWith("Bearer ")
        ? headerList.get("authorization")?.split(" ")[1]
        : "";

      if (!token && !authType.includes("PUBLIC")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" } as OutputType,
          { status: 401 },
        );
      }

      const userAuth: UserAuth = {
        admin: undefined,
        customer: undefined,
      };

      const user = await getAuthFromToken(db, token || "");

      if (user) {
        userAuth.admin = user;
      }

      const customerAuth = await getCustomerAuthFromToken(db, token || "");
      // for walk-in customer, we will use system admin as userAuth.admin
      if (customerAuth) {
        userAuth.customer = customerAuth;
        if (customerAuth.isWalkin && !userAuth.admin) {
          const warehouse = await getWarehouseInfo(
            db,
            customerAuth.warehouseId,
          );
          if (warehouse) {
            const isInZone = isInWarehouseZone(
              warehouse,
              customerAuth.lat!,
              customerAuth.lng!,
            );
            if (isInZone) {
              // get system admin for walk-in customer
              const sysAdmin = await getSystemAdmin(
                customerAuth.warehouseId,
                db,
              );
              if (sysAdmin) {
                userAuth.admin = sysAdmin;
              }
            }
          }
        }
      }

      // check auth type with requested auth type
      const isAuthorized = authType.some((type) => {
        if (type === "ADMIN" && userAuth.admin) {
          return true;
        }
        if (type === "CUSTOMER" && userAuth.customer) {
          return true;
        }
        if (type === "PUBLIC") {
          console.log("Public API accessed:", req.nextUrl.pathname);
          return true;
        }
        return false;
      });

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" } as OutputType,
          { status: 401 },
        );
      }

      const logger = new Logger(db, user, [LogLevel.Log, LogLevel.Sever]);

      if (req.method !== "GET") {
        const methodToAction: Record<string, "create" | "update" | "delete"> = {
          post: "create",
          put: "update",
          delete: "delete",
        };
        const action = methodToAction[req.method.toLowerCase()] || "update";

        logger.serverLog(req.nextUrl.pathname, {
          action,
          table_name: req.nextUrl.pathname,
          key: "",
          content: { body },
        });
      }

      const response = await callback({
        db,
        req,
        body,
        params,
        searchParams,
        logger,
        userAuth,
      });

      return response;
    },
  );
}

async function getSystemAdmin(
  warehouseId: string,
  db: Knex,
): Promise<UserInfo | null> {
  const user = await db<table_user>("user")
    .where({ is_system_admin: 1, warehouse_id: warehouseId })
    .first();
  if (!user) {
    return null;
  }
  // get user role
  const userRole: table_user_role = await db("user_role")
    .where({ id: user.role_id })
    .first();
  const warehouseLoader = LoaderFactory.warehouseLoader(db);
  return {
    id: user.id,
    username: user.username,
    phoneNumber: user.phone_number,
    token: user.token,
    fullname: user.fullname,
    profile: user.profile,
    roleId: user.role_id,
    currentWarehouseId: user.warehouse_id,
    warehouse: user.warehouse_id
      ? await warehouseLoader.load(user.warehouse_id)
      : null,
    role: mapUserRole(userRole, user.id || ""),
  } as UserInfo;
}
