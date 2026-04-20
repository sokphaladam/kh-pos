/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryProductVariantTransaction } from "@/app/hooks/use-query-product";
import { ProductV2 } from "@/classes/product-v2";
import { createSheet } from "@/components/create-sheet";
import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { LoaderCircle } from "lucide-react";
import { ProductSubInfo } from "./product-sub-info";

const transactionTypeConfig: Record<string, { color: string; label: string }> =
  {
    STOCK_IN: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      label: "Stock In",
    },
    STOCK_OUT: {
      color:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      label: "Stock Out",
    },
    ADJUSTMENT_IN: {
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      label: "Adjustment In",
    },
    ADJUSTMENT_OUT: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      label: "Adjustment Out",
    },
  };

export const sheetProductTransaction = createSheet<{
  product: ProductV2 | null;
  variantId?: string;
}>(({ variantId, product }) => {
  const { data, isLoading, isValidating } = useQueryProductVariantTransaction(
    variantId || ""
  );
  const total = data?.result?.reduce(
    (a, b) => {
      return {
        qty: a.qty + b.qty,
        value:
          a.value + b.qty * Number.parseFloat(b.productLot?.costPerUnit || "0"),
      };
    },
    { qty: 0, value: 0 }
  ) || { qty: 0, value: 0 };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Transaction</SheetTitle>
        {/* <SheetDescription>
          Track all stock movements and adjustments
        </SheetDescription> */}
      </SheetHeader>
      <div className="my-4">
        {isLoading && (
          <div>
            <LoaderCircle className="animate-spin" />
          </div>
        )}
        <ProductSubInfo product={product!} variantId={variantId} />
        <br />
        {data && !isValidating && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs"></TableHead>
                <TableHead className="text-xs">
                  <div className="flex items-center">Date</div>
                </TableHead>
                <TableHead className="text-xs">Product Lot</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-right text-xs">Quantity</TableHead>
                <TableHead className="text-right text-xs">Value</TableHead>
                <TableHead className="text-xs">Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell></TableCell>
                <TableCell colSpan={4} className="font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  <span
                    className={
                      total.qty < 0 ? "text-red-500" : "text-green-500"
                    }
                  >
                    {total.qty < 0 ? "-" : "+"}
                    {total.qty}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${total.value.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              {data.result?.map((transaction, idx) => {
                const typeConfig = transactionTypeConfig[
                  transaction.transactionType!
                ] || {
                  color: "bg-gray-100 text-gray-800",
                  label: transaction.transactionType,
                };
                const isNegativeQty = transaction.qty < 0;
                const absQty = Math.abs(transaction.qty);
                const totalValue =
                  absQty *
                  Number.parseFloat(transaction.productLot?.costPerUnit || "0");
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-xs">
                      {Formatter.date(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        {transaction.productLot?.lotNumber && (
                          <span>lot: {transaction.productLot?.lotNumber}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          exp: {transaction.productLot?.expiredDate}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span>
                          {transaction.slot?.name}{" "}
                          {transaction.slot?.posSlot ? "(POS)" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(transaction.slot as any).warehouse.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      <span
                        className={
                          isNegativeQty ? "text-red-500" : "text-green-500"
                        }
                      >
                        {isNegativeQty ? "-" : "+"}
                        {absQty}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      ${totalValue.toFixed(2)}
                      <div className="text-xs text-muted-foreground">
                        ${transaction.productLot?.costPerUnit}/unit
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-normal">
                            {transaction.createdBy?.fullname}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
});
