import { useMutationUpdateReplenishmentPickingList } from "@/app/hooks/use-query-replenishment";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { ImageWithFallback } from "@/components/image-with-fallback";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
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
import { Fragment, useCallback } from "react";
import { toast } from "sonner";

interface PickingListInput {
  slotId: string;
  variantId: string;
  qty: number;
  lotId: string;
}
interface PickingListProps {
  enableSave?: boolean;
  onClose: () => void;
  replenishmentId: string;
  data: FindProductInSlotResult[];
}

export default function PickingList({
  data,
  onClose,
  enableSave,
  replenishmentId,
}: PickingListProps) {
  const { trigger, isMutating } =
    useMutationUpdateReplenishmentPickingList(replenishmentId);

  const onUpdatePickingList = useCallback(() => {
    const input = data.map((item) => {
      return {
        variantId: item.variant?.id,
        slotId: item.slot?.id,
        qty: item.qty,
        lotId: item.lot?.id,
      };
    }) as PickingListInput[];
    trigger(input)
      .then((r) => {
        if (r.success) {
          onClose();
          toast.success("Updated replenishment picking list");
        }

        if (r.error) {
          toast.error(r.error);
        }
      })
      .catch((err) => toast.error(err.message));
  }, [trigger, data, onClose]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm rounded-none">
      <CardHeader>
        <CardTitle>Replenishment Picking List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">Product</TableHead>
              <TableHead className="text-nowrap text-xs">Slot</TableHead>
              <TableHead className="text-nowrap text-xs">
                Current Stock
              </TableHead>
              <TableHead className="text-nowrap text-xs">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const image =
                item.variant?.basicProduct?.images.find(
                  (f) => f.productVariantId === item.variant?.id,
                )?.url ||
                item.variant?.basicProduct?.images[0]?.url ||
                "";
              return (
                <Fragment key={index}>
                  <TableRow>
                    <TableCell className="text-nowrap text-xs truncate">
                      <div className="flex flex-row gap-4">
                        <ImageWithFallback
                          src={image}
                          alt={item.variant?.basicProduct?.title + ""}
                          className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
                          height={35}
                          width={35}
                          title={item.variant?.basicProduct?.title + ""}
                        />
                        <div>
                          <div>
                            {item.variant?.basicProduct?.title} (
                            {item.variant?.name})
                          </div>
                          <div>
                            <small>SKU: {item.variant?.sku}</small>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      <div>
                        <span>
                          {item.slot?.name} {item.slot?.posSlot ? "(POS)" : ""}
                        </span>
                        <br />
                        <small>{item.slot?.warehouse?.name}</small>
                      </div>
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {item.variant?.stock}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {item.qty}
                    </TableCell>
                  </TableRow>
                  {!!item.message && (
                    <TableRow className=" hover:bg-white">
                      <TableCell colSpan={4} className="text-xs">
                        <div className="text-sm text-red-500">
                          {item.message}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {enableSave && (
        <CardFooter className="flex flex-row gap-2 items-end justify-end">
          <Button onClick={onUpdatePickingList}>
            Save
            {isMutating && <LoadingSpinner />}
          </Button>
          {/* <Button>Print</Button> */}
        </CardFooter>
      )}
    </Card>
  );
}
