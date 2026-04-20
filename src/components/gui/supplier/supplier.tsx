"use client";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Supplier as ISupplier } from "@/lib/server-functions/supplier";
import { createSupplierSheet } from "./create-supplier-sheet";
import { createDialog } from "@/components/create-dialog";
import { Fragment, useCallback } from "react";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Formatter } from "@/lib/formatter";
import { useDeleteSupplier } from "@/app/hooks/use-query-supplier";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Checkbox } from "@/components/ui/checkbox";

export interface Props {
  data: ISupplier;
  index: number;
  onSuccess: (data: ISupplier | null, id?: string) => void;
}

export default function Supplier({ data, onSuccess, index }: Props) {
  return (
    <TableRow>
      <TableCell className="text-nowrap text-xs">{index}</TableCell>
      <TableCell className="font-medium text-xs max-w-[150px]">
        <div className="truncate" title={data.name ?? "N/A"}>
          {data.name ?? "N/A"}
        </div>
      </TableCell>
      <TableCell className="font-medium text-xs max-w-[120px]">
        <div className="truncate" title={data.contactName ?? "N/A"}>
          {data.contactName ?? "N/A"}
        </div>
      </TableCell>
      <TableCell>
        <Checkbox disabled checked={data.isConsignment} />
      </TableCell>
      <TableCell className="md:table-cell text-nowrap text-xs">
        {data.contactPhone ?? "N/A"}
      </TableCell>
      <TableCell className="md:table-cell text-xs max-w-[200px]">
        <div className="truncate" title={data.address ?? "N/A"}>
          {data.address ?? "N/A"}
        </div>
      </TableCell>

      <TableCell className="md:table-cell text-xs max-w-[150px]">
        <div className="truncate" title={data.note || ""}>
          {data.note ?? "N/A"}
        </div>
      </TableCell>
      <TableCell className="md:table-cell text-nowrap text-xs">
        {Formatter.date(data.createdAt)}
      </TableCell>
      <TableCell className="text-nowrap text-xs">
        <BasicMenuAction
          value={data}
          resource="supplier"
          onEdit={async () => {
            await createSupplierSheet
              .show({
                supplierId: data.id,
              })
              .then((r) => onSuccess(r));
          }}
          onDelete={async () => {
            await deleteSupplierDialog
              .show({ id: data.id })
              .then((r) => r?.id && onSuccess(null, r.id));
          }}
        />
      </TableCell>
    </TableRow>
  );
}

const deleteSupplierDialog = createDialog<{ id: string }, { id?: string }>(
  ({ close, id }) => {
    const { trigger, isMutating } = useDeleteSupplier();

    const onDeleteSupplier = useCallback(() => {
      trigger({ id }).then(() => {
        close({ id });
      });
    }, [close, trigger, id]);

    return (
      <Fragment>
        <DialogHeader>
          <DialogTitle>Delete Supplier</DialogTitle>
        </DialogHeader>
        <div>Are you sure? you want to delete this supplier?</div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => close({})}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDeleteSupplier}>
            Delete
            {isMutating && <LoaderIcon className="w-4 h-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </Fragment>
    );
  }
);
