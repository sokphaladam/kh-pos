import { useQueryInventoryTransaction } from "@/app/hooks/use-invetory";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import SkeletonTableList from "@/components/skeleton-table-list";
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
import { InventoryTransaction } from "@/dataloader/inventory-transaction-loader";
import moment from "moment-timezone";
import { useSearchParams } from "next/navigation";
import React from "react";

function getTransactionNameByType(
  type: InventoryTransaction["transactionType"]
) {
  switch (type) {
    case "SALE":
      return "Product Sale";
    case "PURCHASE":
      return "Purchase Order";
    case "STOCK_IN":
      return "Stock In";
    case "STOCK_OUT":
      return "Stock Out";
    case "ADJUSTMENT_IN":
      return "Adjustment In";
    case "ADJUSTMENT_OUT":
      return "Adjustment Out";
    case "REPLENISHMENT":
      return "Replenishment";
    case "REPLENISHMENT_OUT":
      return "Replenishment";
    case "COMPOSE_IN":
      return "Compose In";
    case "COMPOSE_OUT":
      return "Compose Out";
    case "TRANSFER_IN":
      return "Transfer In";
    case "TRANSFER_OUT":
      return "Transfer Out";
    case "CONVERSION_IN":
      return "Conversion In";
    case "CONVERSION_OUT":
      return "Conversion Out";
    case "DAMAGE":
      return "Damage";
    case "RETURN":
      return "Return";
    default:
      return type?.replace(/_/g, " ") || "-";
  }
}

export function TransactionList() {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || 30);
  const status = searchParams.get("status");

  const { data, isLoading } = useQueryInventoryTransaction(
    offset,
    limit,
    status ? status : undefined
  );

  if (isLoading) {
    return <SkeletonTableList />;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Product
                </TableHead>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Transaction
                </TableHead>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Slot
                </TableHead>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Date
                </TableHead>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Quantity
                </TableHead>
                <TableHead className="text-nowrap text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.result?.data.map((transaction) => {
                const transactionStatus = getTransactionNameByType(
                  transaction.transactionType
                );
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium flex flex-row items-center gap-2 max-w-[180px] truncate">
                      {transaction.variant?.basicProduct?.images?.[0]?.url && (
                        <ImageWithFallback
                          src={transaction.variant.basicProduct.images[0].url}
                          alt={
                            transaction.variant.basicProduct.title || "Product"
                          }
                          className="w-8 h-8 rounded border object-cover bg-white mr-2"
                          height={32}
                          width={32}
                          title={
                            transaction.variant?.basicProduct?.title ||
                            "Product"
                          }
                        />
                      )}
                      <span
                        className="truncate"
                        title={
                          transaction.variant?.basicProduct?.title
                            ? String(transaction.variant?.basicProduct?.title)
                            : undefined
                        }
                      >
                        {transaction.variant?.basicProduct?.title}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-200 font-semibold text-nowrap">
                      {transactionStatus}
                    </TableCell>
                    <TableCell
                      className="text-nowrap max-w-[120px] truncate"
                      title={
                        transaction.slot?.name +
                        (transaction.slot?.posSlot ? " (POS)" : "")
                      }
                    >
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {transaction.slot?.name}{" "}
                        {transaction.slot?.posSlot ? "(POS)" : ""}
                      </span>
                      <br />
                      <small
                        className="text-gray-400"
                        title={transaction.slot?.warehouse.name}
                      >
                        {transaction.slot?.warehouse.name}
                      </small>
                    </TableCell>
                    <TableCell className="text-nowrap text-gray-500 dark:text-gray-400">
                      {moment(transaction.createdAt).format("MMM DD, YYYY")}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700 dark:text-blue-300 text-center">
                      {transaction.transactionType === "SALE"
                        ? Math.abs(transaction.qty)
                        : transaction.qty}
                    </TableCell>
                    <TableCell className="font-semibold text-green-700 dark:text-green-300 text-center">
                      {transaction.transactionType === "SALE"
                        ? `$${Math.abs(
                            Number(transaction.productLot?.costPerUnit) *
                              transaction.qty
                          )}`
                        : `${transaction.qty >= 0 ? "" : "-"}$${(
                            Number(transaction.productLot?.costPerUnit) *
                            transaction.qty
                          )
                            .toString()
                            .replace("-", "")}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        {data?.result && (
          <CardFooter>
            <Pagination
              limit={limit}
              offset={offset}
              total={data.result.total}
              totalPerPage={data?.result?.data.length || 0}
              text="Transactions"
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
