import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { LoaderIcon } from "lucide-react";
import { Fragment, useCallback } from "react";
import { SupplierPurchaseOrder } from "@/classes/purchase-order-service";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createPurchaseOrderSheet } from "./create-purchase-order-sheet";
import { purchaseOrderDetailSheet } from "./purchase-order-detail-sheet";
import { createReceiveSheet } from "./create-receive-sheet";
import { useDeletePurchaseOrder } from "@/app/hooks/use-query-purchase-order";
import { cn } from "@/lib/utils";
import { KeyedMutator } from "swr";
import { Pagination } from "@/components/pagination";
import LoadingSpinner from "@/components/loading-spinner";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface PurchaseOrderListProps {
  loading: boolean;
  limit: number;
  offset: number;
  data: SupplierPurchaseOrder[];
  onSuccess: (item: SupplierPurchaseOrder | undefined) => void;
  mutate: KeyedMutator<{
    result: SupplierPurchaseOrder[];
  }>;
}
export default function PurchaseOrderList({
  loading,
  limit,
  offset,
  data,
  onSuccess,
  mutate,
}: PurchaseOrderListProps) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order</CardTitle>
          <CardDescription>Manage your purchase order.</CardDescription>
        </CardHeader>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sm:table-cell text-xs">
                    ID
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Date</TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Supplier
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Store</TableHead>
                  <TableHead className="text-nowrap text-xs">Status</TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Recieved
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Expected on
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Total</TableHead>
                  <TableHead>
                    <span>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => {
                  return (
                    <PurchaseOrderItem
                      onSuccess={onSuccess}
                      key={index}
                      data={item}
                      mutate={mutate}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}

        <CardFooter>
          <Pagination
            offset={offset}
            limit={limit}
            text="Items"
            total={data.length ?? 0}
            totalPerPage={data.length ?? 0}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

function PurchaseOrderItem({
  data,
  onSuccess,
  mutate,
}: Pick<PurchaseOrderListProps, "onSuccess" | "mutate"> & {
  data: SupplierPurchaseOrder;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  let reciveStatus = "";

  if (
    Number(data.received) > 0 &&
    Number(data.received) < Number(data.totalQty)
  ) {
    reciveStatus = "Receiving";
  }

  if (Number(data.received) === Number(data.totalQty)) {
    reciveStatus = "Received";
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-nowrap text-xs">
        #{data.poIncrement}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {Formatter.date(data.purchasedAt)}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {data.supplier?.name}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {data.warehouse?.name}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        <Badge
          variant={"outline"}
          className={cn(
            "uppercase text-xs",
            data.status === "completed" ? "border-green-500" : "",
            data.status === "closed" ? "opacity-50" : "",
          )}
        >
          {data.status ?? "N/A"}
        </Badge>
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {reciveStatus} {data.received ?? "0"} of {data.totalQty}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {data?.expectedAt ? Formatter.date(data.expectedAt) : "N/A"}
      </TableCell>
      <TableCell className="font-medium text-nowrap text-xs">
        {formatForDisplay(data?.receivedTotal ?? 0)} /{" "}
        {formatForDisplay(data.total ?? 0)}
      </TableCell>
      <TableCell>
        <BasicMenuAction
          resource="purchase-order"
          value={data}
          items={[
            {
              label: data.status === "draft" ? "Approve" : "View Details",
              onClick: async () => {
                await purchaseOrderDetailSheet
                  .show({ id: data.id! })
                  .then(() => {
                    onSuccess({ id: "1", received: 0 });
                  });
              },
            },
            ...(data.status === "approved"
              ? [
                  {
                    label: "Create Receive",
                    onClick: async () => {
                      await createReceiveSheet.show({
                        purchaseOrderId: data.id!,
                        onReceiveItems: () => {
                          // The API call is now handled internally in the sheet
                          mutate();
                        },
                      });
                    },
                  },
                ]
              : []),
          ]}
          onEdit={
            data.status !== "completed"
              ? async () => {
                  await createPurchaseOrderSheet
                    .show({
                      purchaseOrderId: data.id!,
                    })
                    .then((r) => {
                      if (r) {
                        mutate();
                      }
                    });
                }
              : undefined
          }
          onDelete={
            data.status !== "completed"
              ? async () => {
                  await deletePurchaseOrderDialog
                    .show({ id: data.id! })
                    .then((r) => {
                      if (r?.id) {
                        onSuccess({ ...data, status: "deleted" });
                      }
                    });
                }
              : undefined
          }
        />
      </TableCell>
    </TableRow>
  );
}

const deletePurchaseOrderDialog = createDialog<{ id: string }, { id?: string }>(
  ({ close, id }) => {
    const { trigger, isMutating } = useDeletePurchaseOrder();

    const onDeleteSupplier = useCallback(() => {
      trigger({ id }).then((r) => {
        if (r.success) {
          toast.success("Purchase order deleted");
        }
        close({ id });
      });
    }, [close, trigger, id]);

    return (
      <Fragment>
        <DialogHeader>
          <DialogTitle>Delete Purchase Order</DialogTitle>
        </DialogHeader>
        <div>Are you sure? you want to delete this purchase order?</div>

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
  },
);
