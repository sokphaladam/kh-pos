"use client";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";

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

import React, { useCallback } from "react";
import { Pagination } from "@/components/pagination";
import { Formatter } from "@/lib/formatter";
import { toast } from "sonner";
import { SlotDetail } from "@/classes/slot";
import { useDeleteSlot } from "@/app/hooks/use-query-slot";
import { createSlotSheet } from "./sheet-slot-create";

interface Props {
  data: SlotDetail[];
  limit: number;
  offset: number;
  total: number;
  onDelete?: (v: string) => void;
  onEdit?: (v: string) => void;
}

export function SlotList(props: Props) {
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating } = useDeleteSlot();
  const totalPerPage = props.data.length;
  const total = props.total;

  const onDeleteWarehouse = useCallback(
    (id: string) => {
      const find = props.data.find((f) => f.id === id);
      showDialog({
        title: "Delete warehouse",
        content: `Are your sure you want to delete slot ${find?.name}?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true && props.onDelete) {
                props.onDelete(id);
                toast.success("Slot deleted");
              } else {
                toast.error(res.error || "Delete warehouse failed");
              }
            },
          },
        ],
      });
    },
    [props, showDialog, trigger]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse slot</CardTitle>
        <CardDescription>Manage your slot</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">Name</TableHead>
              <TableHead className="text-nowrap text-xs">Created at</TableHead>
              <TableHead className="text-nowrap text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data.map((x, idx) => {
              const name = x.posSlot ? x.name + " (POS)" : x.name;
              return (
                <React.Fragment key={x.id}>
                  <TableRow>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {idx + 1 + props.offset}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {name}
                    </TableCell>
                    <TableCell className="font-medium text-nowrap text-xs">
                      {Formatter.date(x.createdAt)}
                    </TableCell>
                    <TableCell className="text-right text-nowrap text-xs">
                      <BasicMenuAction
                        value={x}
                        resource="slot"
                        onDelete={() => onDeleteWarehouse(x.id!)}
                        onEdit={async () => {
                          const res = await createSlotSheet.show({
                            edit: {
                              id: x.id!,
                              slotName: x.name,
                              warehouseId: x.warehouseId,
                              forReplenishment: Boolean(x.forReplenishment),
                            },
                          });
                          if (res !== null && props.onEdit) {
                            props.onEdit(x.id!);
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
          text="slots"
        />
      </CardFooter>
    </Card>
  );
}
