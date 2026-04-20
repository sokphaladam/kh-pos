"use client";

import {
  useMutationDeleteProductGroup,
  useQueryProductGroupList,
} from "@/app/hooks/use-query-product-group";
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import { Pagination } from "@/components/pagination";
import { TopToolbar } from "@/components/top-toolbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { productGroupSheet } from "./product-group-sheet";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";

const LIMIT = 20;

export function ProductGroupLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { showDialog } = useCommonDialog();

  const offset = Number(searchParams.get("offset") || "0");
  const warehouseId = searchParams.get("warehouseId") || "";

  const { data: warehouseData } = useWarehouseList(100, 0);
  const warehouses = warehouseData?.result?.data || [];

  const { data, isLoading, mutate } = useQueryProductGroupList({
    limit: LIMIT,
    offset,
    warehouseIds: warehouseId ? [warehouseId] : undefined,
  });

  const { trigger: deleteGroup } = useMutationDeleteProductGroup();

  const groups = data?.result?.result || [];
  const total = data?.result?.total || 0;

  const onAddNew = useCallback(async () => {
    const res = await productGroupSheet.show({});
    if (res) {
      mutate();
    }
  }, [mutate]);

  const onWarehouseChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set("warehouseId", value);
      } else {
        params.delete("warehouseId");
      }
      params.set("offset", "0");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const onDeleteGroup = useCallback(
    async (groupId: string) => {
      showDialog({
        title: "Delete Product Group",
        content: "Are you sure you want to delete this product group?",
        destructive: true,
        actions: [
          {
            onClick: async () => {
              const res = await deleteGroup({ groupId });
              if (res.result) {
                mutate();
              }
            },
            text: "Delete",
          },
        ],
      });
    },
    [deleteGroup, mutate, showDialog],
  );

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar onAddNew={onAddNew} text={"Product Group"} />

      <div className="flex items-center gap-2 px-1">
        <Select value={warehouseId || "all"} onValueChange={onWarehouseChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs">#</TableHead>
                <TableHead className="text-nowrap text-xs">Name</TableHead>
                <TableHead className="text-nowrap text-xs">
                  Description
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  Warehouses
                </TableHead>
                <TableHead className="text-nowrap text-xs">Products</TableHead>
                <TableHead className="text-nowrap text-xs">
                  Created By
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  Created At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : groups.map((group, idx) => (
                    <TableRow key={group.groupId}>
                      <TableCell className="text-xs font-medium text-nowrap">
                        {idx + 1 + offset}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {group.groupName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {group.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {group.warehouses.map((w) => (
                            <Badge
                              key={w.warehouseId}
                              variant="outline"
                              className="text-xs"
                            >
                              {w.warehouse?.name || w.warehouseId}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {group.products.length}
                      </TableCell>
                      <TableCell className="text-xs text-nowrap">
                        {group.createdBy?.fullname || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-nowrap">
                        {Formatter.date(group.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs text-nowrap">
                        <BasicMenuAction
                          onEdit={async () => {
                            const res = await productGroupSheet.show({
                              edit: group,
                            });

                            if (res) {
                              mutate();
                            }
                          }}
                          onDelete={() => onDeleteGroup(group.groupId)}
                          value={group}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && groups.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No product groups found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 0 && (
          <CardFooter>
            <Pagination
              limit={LIMIT}
              offset={offset}
              total={total}
              totalPerPage={groups.length}
              text="groups"
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
