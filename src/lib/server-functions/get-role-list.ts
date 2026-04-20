import { NextResponse } from "next/server";
import withAuthApi from "./with-auth-api";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { ResponseType } from "@/lib/types";
import { z } from "zod";

export interface Role {
  id: string;
  role: string;
  permissions?: string;
}

// Zod schemas for validation
export const createRoleSchema = z.object({
  role: z
    .string()
    .min(1, "Role name is required")
    .max(50, "Role name must be 50 characters or less"),
  permissions: z.string().min(1, "Permissions are required"),
});

export const updateRoleSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
  role: z
    .string()
    .min(1, "Role name is required")
    .max(50, "Role name must be 50 characters or less"),
  permissions: z.string().min(1, "Permissions are required"),
});

export const deleteRoleSchema = z.object({
  id: z
    .array(z.string().min(1, "Role ID is required"))
    .min(1, "At least one role ID is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;

export const getRoleList = withAuthApi<unknown, unknown, Role[]>(
  async ({ db }) => {
    const roles = await db
      .table("user_role")
      .select("id", "role", "permissions")
      .orderBy("created_at", "desc");
    return NextResponse.json(roles);
  }
);

export const createRole = withAuthApi<
  unknown,
  CreateRoleInput,
  ResponseType<{ message: string }>
>(async ({ db, body, logger }) => {
  try {
    const input = createRoleSchema.parse(body);

    // Check if role already exists
    const existingRole = await db
      .table("user_role")
      .select("id")
      .where("role", input.role)
      .first();

    if (existingRole) {
      return NextResponse.json(
        { error: "Role already exists", success: false },
        { status: 409 }
      );
    }

    // Create new role
    const [newRole] = await db
      .table("user_role")
      .insert({
        id: generateId(),
        role: input.role,
        permissions: input.permissions,
        created_at: Formatter.getNowDateTime(),
        is_default: 0,
      })
      .returning("*");

    logger.serverLog("role:create", {
      action: "create",
      table_name: "user_role",
      key: newRole.id,
    });

    return NextResponse.json(
      {
        message: "Role created successfully",
        success: true,
        result: { message: "Role created successfully" },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Validation failed",
          success: false,
        },
        { status: 400 }
      );
    }
    throw error;
  }
});

export const updateRole = withAuthApi<
  unknown,
  UpdateRoleInput,
  ResponseType<{ message: string }>
>(async ({ db, body }) => {
  try {
    const input = updateRoleSchema.parse(body);

    const existingRole = await db
      .table("user_role")
      .select("id")
      .where("id", input.id)
      .first();

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found", success: false },
        { status: 404 }
      );
    }

    await db
      .table("user_role")
      .update({
        role: input.role,
        permissions: input.permissions,
      })
      .where("id", input.id);

    return NextResponse.json(
      {
        message: "Role updated successfully",
        success: true,
        result: { message: "Role updated successfully" },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Validation failed",
          success: false,
        },
        { status: 400 }
      );
    }
    throw error;
  }
});

export const deleteRole = withAuthApi<
  unknown,
  DeleteRoleInput,
  ResponseType<{ message: string }>
>(async ({ db, body }) => {
  try {
    const input = deleteRoleSchema.parse(body);

    await db
      .table("user_role")
      .whereIn("id", input.id)
      .update({ is_deleted: 1 });
    return NextResponse.json(
      {
        message: "Role deleted successfully",
        success: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Validation failed",
          success: false,
        },
        { status: 400 }
      );
    }
    throw error;
  }
});
