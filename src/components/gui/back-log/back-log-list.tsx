/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutationBacklogResolve } from "@/app/hooks/use-query-back-log";
import { BacklogOrder } from "@/classes/back-log";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import {
  Card,
  CardContent,
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
import { useCallback } from "react";
import { toast } from "sonner";

export function BackLogList({
  data,
  offset,
  total,
  onCompleted,
}: {
  data: BacklogOrder[];
  offset: number;
  total: number;
  onDelete?: (id: string) => void;
  onCompleted?: () => void;
}) {
  const { trigger, isMutating } = useMutationBacklogResolve();

  const onClickResolve = useCallback(
    (id: string) => {
      trigger({
        backlogId: id,
      })
        .then((res) => {
          if (res.success) {
            toast.success("Resolve was done.");
            onCompleted?.();
          } else {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error("Failed to resolve back log.");
        });
    },
    [onCompleted, trigger]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Back Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">Product</TableHead>
              <TableHead className="text-nowrap text-xs">Slot</TableHead>
              <TableHead className="text-nowrap text-xs">
                Current Stock
              </TableHead>
              <TableHead className="text-nowrap text-xs">Quantity</TableHead>
              <TableHead className="text-nowrap text-xs">Created</TableHead>
              <TableHead className="text-nowrap text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((x, i) => {
              const image =
                x.variant?.basicProduct?.images.find(
                  (f) => f.productVariantId === x.variant?.id
                )?.url ||
                x.variant?.basicProduct?.images[0]?.url ||
                "";

              return (
                <TableRow key={x.id}>
                  <TableCell className="text-nowrap text-xs table-cell">
                    {"BL-" + (i + 1 + offset).toString().padStart(3, "0")}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs table-cell relative w-36 truncate">
                    <div className="flex flex-row gap-4">
                      <ImageWithFallback
                        src={image}
                        alt={x.variant?.basicProduct?.title + ""}
                        className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
                        height={35}
                        width={35}
                        title={x.variant?.basicProduct?.title + ""}
                      />
                      <div className="w-full">
                        <div>
                          {x.variant?.basicProduct?.title} ({x.variant?.name})
                        </div>
                        <div>
                          <small>SKU: {x.variant?.sku}</small>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <div>
                      {x.slot?.name} {x.slot?.posSlot ? "(POS)" : ""}
                    </div>
                    <div>
                      <small>{(x.slot as any).warehouse.name}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {x.variant?.slotStock?.find((f) => f.slotId === x.slot?.id)
                      ?.stock ?? 0}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">{x.qty}</TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <div>
                      <div>Created At: {x.createdAt}</div>
                      <div>By: {x.createdBy?.fullname}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <BasicMenuAction
                      value={x}
                      items={[
                        {
                          label: "Resolve",
                          onClick: () => onClickResolve(x.id),
                        },
                      ]}
                      disabled={isMutating}
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
          limit={30}
          offset={offset}
          totalPerPage={data.length || 0}
          total={total}
          text="Backlog"
        />
      </CardFooter>
    </Card>
  );
}
