"use client";

import { SearchModeToolbar } from "@/components/search-mode-toolbar";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo } from "react";
import { chartOfAccountForm } from "./form";
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
import { Pagination } from "@/components/pagination";
import { useSearchParams } from "next/navigation";
import SkeletonTableList from "@/components/skeleton-table-list";
import {
  useMutationDeleteChartOfAccount,
  useQueryChartOfAccount,
} from "@/app/hooks/accounting/use-query-chart-of-account";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";

export function ChartOfAccountLayout() {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = 30;

  const { showDialog } = useCommonDialog();

  const { data, isLoading, mutate } = useQueryChartOfAccount(offset, limit);
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useMutationDeleteChartOfAccount();

  const onClickAdd = useCallback(async () => {
    const res = await chartOfAccountForm.show({ data: null });
    if (res) {
      mutate();
    }
  }, [mutate]);

  const onClickEdit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (item: any) => {
      const res = await chartOfAccountForm.show({
        data: {
          id: item.id,
          account_name: item.accountName,
          account_type: item.accountType,
        },
      });
      if (res) {
        mutate();
      }
    },
    [mutate],
  );

  const onClickDelete = useCallback(
    async (id: string) => {
      await showDialog({
        title: "Delete Chart of Account",
        content: "Are you sure you want to delete this chart of account?",
        actions: [
          {
            onClick: async () => {
              try {
                const result = await deleteTrigger({
                  id,
                });
                if (result.success) {
                  toast.success("Chart of account deleted successfully");
                  mutate();
                } else {
                  toast.error("Failed to delete chart of account");
                }
              } catch {
                toast.error("An error occurred while deleting");
              }
            },
            text: "Delete",
          },
        ],
      });
    },
    [deleteTrigger, showDialog, mutate],
  );

  const headerRight = useMemo(() => {
    return (
      <div className="flex flex-row items-center gap-2">
        <Button
          size="sm"
          onClick={onClickAdd}
          className="btn-outline"
          disabled={isDeleting}
        >
          Create New
        </Button>
      </div>
    );
  }, [onClickAdd, isDeleting]);

  if (isLoading) {
    return <SkeletonTableList />;
  }

  const accounts = data?.result?.data || [];
  const total = data?.result?.total || 0;

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <SearchModeToolbar text="Chart of Account" headerRight={headerRight} />

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>
            Manage your accounting chart of accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs">#</TableHead>
                <TableHead className="text-nowrap text-xs">
                  Account Name
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  Account Type
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  Created At
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  Created By
                </TableHead>
                <TableHead className="text-nowrap text-xs w-[80px]">
                  <span>Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No chart of accounts found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell className="text-xs">
                      {offset + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.accountName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.accountType === "revenue"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {account.accountType === "revenue"
                          ? "Revenue"
                          : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {account.createdAt}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {account.createdBy?.fullname || "N/A"}
                    </TableCell>
                    <TableCell>
                      <BasicMenuAction
                        value={account}
                        onEdit={onClickEdit}
                        disabled={isDeleting}
                        onDelete={() => onClickDelete(account.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Pagination
            limit={limit}
            offset={offset}
            total={total}
            totalPerPage={accounts.length}
            text="accounts"
          />
        </CardFooter>
      </Card>
    </div>
  );
}
