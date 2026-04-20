import {
  useMutationReturnStockIn,
  useQueryReturnStockIn,
} from "@/app/hooks/use-query-return";
import { useCommonDialog } from "@/components/common-dialog";
import { createSheet } from "@/components/create-sheet";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SkeletonTableList from "@/components/skeleton-table-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export const sheetReturnStockIn = createSheet<{ id: string }, unknown>(
  ({ id, close }) => {
    const { showDialog } = useCommonDialog();
    const { data, isLoading } = useQueryReturnStockIn(id);
    const { trigger, isMutating } = useMutationReturnStockIn();

    const onReturnStock = useCallback(() => {
      showDialog({
        title: "Return Stock",
        content:
          "Do you want to proceed with returning the item(s) to the selected slot?",
        actions: [
          {
            text: "Yes",
            onClick: async () => {
              trigger({
                id,
              })
                .then((res) => {
                  if (!!res.result) {
                    toast.success("Return item was stock in");
                    close(true);
                  } else {
                    toast.error("Failed to return stock in");
                  }
                })
                .catch(() => {
                  toast.error("Failed to return stock in");
                });
            },
          },
        ],
      });
    }, [close, id, showDialog, trigger]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>Stock Info</SheetTitle>
          <SheetDescription>Returned items go into this slot.</SheetDescription>
        </SheetHeader>
        <div className="my-4">
          <Card>
            <CardContent>
              {isLoading ? (
                <div>
                  <SkeletonTableList />
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-nowrap">
                          Product
                        </TableHead>
                        <TableHead className="text-xs text-nowrap">
                          Slot
                        </TableHead>
                        <TableHead className="text-xs text-nowrap">
                          Return Quantity
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.result &&
                        data?.result?.map((x, idx) => {
                          const image = x.variant?.basicProduct?.images.find(
                            (f) => f.productVariantId === x.variant?.id
                          )?.url;
                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-xs text-nowrap">
                                <div className="flex flex-row gap-2 items-center">
                                  <div className="w-[40px]">
                                    <ImageWithFallback
                                      alt=""
                                      src={image}
                                      title={
                                        x.variant?.basicProduct?.title
                                          ?.split(" ")
                                          .map((x) => x.charAt(0))
                                          .join("") || ""
                                      }
                                      className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
                                      height={35}
                                      width={35}
                                      fallbackClassName="w-[35px] h-[35px]"
                                    />
                                  </div>
                                  <div>
                                    {x.variant?.basicProduct?.title} (
                                    {x.variant?.name})
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-nowrap">
                                {x.slot?.name} {x.slot?.posSlot ? "(POS)" : ""}
                              </TableCell>
                              <TableCell className="text-xs text-nowrap text-center">
                                {x.qty}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <SheetFooter>
          <Button size={"sm"} onClick={onReturnStock} disabled={isMutating}>
            Return Stock
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: undefined }
);
