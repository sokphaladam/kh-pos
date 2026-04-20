"use client";

import { useDeleteUser } from "@/app/hooks/use-query-user";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { Pagination } from "@/components/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import Image from "next/image";
import { useCallback } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { createUserSheet } from "./sheet-user-create";
import { userResetPassword } from "./user-reset-password";

interface Props {
  data: UserInfo[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  limit: number;
  offset: number;
  total: number;
}

export function UserList({
  data: users,
  onDelete,
  onEdit,
  offset,
  limit,
  total,
}: Props) {
  const { user: currentUser } = useAuthentication();
  const { showDialog } = useCommonDialog();
  const { trigger } = useDeleteUser();
  const totalPerPage = users.length;

  const onDeleteUser = useCallback(
    (id: string) => {
      const find = users.find((f) => f.id === id);
      showDialog({
        title: "Delete user",
        content: `Are your sure want to delete user ${find?.fullname}?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true && onDelete) {
                onDelete(id);
              }
            },
          },
        ],
      });
    },
    [users, onDelete, showDialog, trigger]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>User</CardTitle>
        <CardDescription>
          Manage your user and view their performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">Profile</TableHead>
              <TableHead className="text-nowrap text-xs">Fullname</TableHead>
              <TableHead className="text-nowrap text-xs">Username</TableHead>
              <TableHead className="text-nowrap text-xs">
                Phone Number
              </TableHead>
              <TableHead className="text-nowrap text-xs">Role</TableHead>
              <TableHead className="text-nowrap text-xs">Warehouse</TableHead>
              <TableHead className="text-nowrap text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users as UserInfo[]).map((user, index) => {
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {index + 1 + offset}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.profile && (
                      <Image
                        alt="Product image"
                        className="aspect-square rounded-md object-cover"
                        height="32"
                        src={user.profile}
                        width="32"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.fullname}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.username}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.phoneNumber}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.role ? user.role.role : "No Role"}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {user.warehouse?.name}
                  </TableCell>
                  <TableCell className="flex flex-row justify-end font-medium text-nowrap text-xs">
                    <BasicMenuAction
                      value={user}
                      resource="users"
                      onEdit={async () => {
                        const res = await createUserSheet.show({
                          edit: {
                            id: user.id,
                            fullname: user.fullname,
                            password: "",
                            phoneNumber: user.phoneNumber,
                            profile: user.profile,
                            username: user.username,
                            roleId: user.roleId || "",
                            warehouseId: user.currentWarehouseId || "",
                          },
                        });
                        if (res !== null && onEdit) {
                          onEdit(user.id);
                        }
                      }}
                      onDelete={
                        user.id === currentUser?.id
                          ? undefined
                          : () => onDeleteUser(user.id)
                      }
                      items={
                        String(currentUser?.role?.role).toLowerCase() ===
                          "owner" && user.id !== currentUser?.id
                          ? [
                              {
                                label: "Reset Password",
                                onClick: async () => {
                                  await userResetPassword.show({
                                    userId: user.id,
                                  });
                                },
                              },
                            ]
                          : []
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={limit}
          offset={offset}
          total={total}
          totalPerPage={totalPerPage}
          text="users"
        />
      </CardFooter>
    </Card>
  );
}
