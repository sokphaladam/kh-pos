"use client";
import { useDeleteWarehouse } from "@/app/hooks/use-query-warehouse";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { ImageWithFallback } from "@/components/image-with-fallback";

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

import { WarehouseV2ResponseType } from "@/classes/warehouse";
import { Pagination } from "@/components/pagination";
import { Formatter } from "@/lib/formatter";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { createWarehouseSheetV2 } from "./sheet-warehouse-create-v2";

interface Props {
  data: WarehouseV2ResponseType[];
  limit: number;
  offset: number;
  total: number;
  onDelete?: (v: string) => void;
  onEdit?: (v: string) => void;
}

export function WarehouseList(props: Props) {
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating } = useDeleteWarehouse();
  const totalPerPage = props.data.length;
  const total = props.total;

  const onDeleteWarehouse = useCallback(
    (id: string) => {
      const find = props.data.find((f) => f.id === id);
      showDialog({
        title: "Delete warehouse",
        content: `Are your sure you want to delete warehouse ${find?.name}?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true && props.onDelete) {
                props.onDelete(id);
                toast.success(res.result?.message || "Warehouse deleted");
              } else {
                toast.error(res.error || "Delete warehouse failed");
              }
            },
          },
        ],
      });
    },
    [props, showDialog, trigger],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse</CardTitle>
        <CardDescription>
          Manage your warehouse and view their performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">Image</TableHead>
              <TableHead className="text-nowrap text-xs">Name</TableHead>
              <TableHead className="text-nowrap text-xs">Owner</TableHead>
              <TableHead className="text-nowrap text-xs">Phone</TableHead>
              <TableHead className="text-nowrap text-xs">Address</TableHead>
              <TableHead className="text-nowrap text-xs">Created at</TableHead>
              <TableHead className="text-nowrap text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data.map((x, idx) => {
              const warehouseName = x.isMain ? x.name + " (Main)" : x.name;
              return (
                <React.Fragment key={x.id}>
                  <TableRow>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {idx + 1 + props.offset}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      <ImageWithFallback
                        src={x.image}
                        alt={`${warehouseName} image`}
                        width={48}
                        height={48}
                        className="rounded-md"
                        fallbackClassName="bg-gray-100"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {warehouseName}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {x.ownerName}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {x.phoneNumber}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {x.address}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {Formatter.date(x.createdAt)}
                    </TableCell>
                    <TableCell className="text-right text-nowrap text-xs">
                      <BasicMenuAction
                        resource="warehouse"
                        value={x}
                        onDelete={() => onDeleteWarehouse(x.id!)}
                        onEdit={async () => {
                          const res = await createWarehouseSheetV2.show({
                            edit: {
                              id: x.id!,
                              warehouseName: x.name,
                              ownerName: x.ownerName!,
                              phoneNumber: x.phoneNumber,
                              address: x.address,
                              image: x.image,
                              lat: x.lat,
                              lng: x.lng,
                              useMainBranchVisibility:
                                x.useMainBranchVisibility,
                            },
                          });
                          if (res !== null) {
                            props.onEdit?.(x.id!);
                          }
                        }}
                        disabled={isMutating}
                      />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination
          limit={props.limit}
          offset={props.offset}
          total={total}
          totalPerPage={totalPerPage}
          text="products"
        />
      </CardFooter>
    </Card>
  );
}
