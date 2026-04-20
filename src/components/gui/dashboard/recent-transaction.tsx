/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryInventoryTransaction } from "@/app/hooks/use-invetory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import moment from "moment-timezone";
import SkeletonTableList from "@/components/skeleton-table-list";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";

interface Props {
  offset?: number;
  limit?: number;
  status?: string[];
  title?: string;
}

export function RecentTrasaction(props: Props) {
  const { data, isLoading, isValidating } = useQueryInventoryTransaction(
    props.offset || 0,
    props.limit || 5,
    props.status?.join(",")
  );

  if (isLoading || isValidating) {
    return <SkeletonTableList />;
  }

  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <span className="font-semibold text-orange-700 dark:text-orange-300 text-lg">
          {props.title || "Recent Transactions"}
        </span>
      </div>
      {data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Product
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Transaction
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Slot
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">
                Quantity
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.result?.data.map((x) => {
              let transaction = "";
              switch (x.transactionType) {
                case "SALE":
                  transaction = `Product Sale`;
                  break;
                case "PURCHASE":
                  transaction = `Purchase Order`;
                  break;
                case "STOCK_IN":
                  transaction = `Stock In`;
                  break;
                case "STOCK_OUT":
                  transaction = `Stock Out`;
                  break;
                case "ADJUSTMENT_IN":
                  transaction = `Adjustment In`;
                  break;
                case "ADJUSTMENT_OUT":
                  transaction = `Adjustment Out`;
                  break;
                case "REPLENISHMENT":
                  transaction = `Replenishment`;
                  break;
                case "REPLENISHMENT_OUT":
                  transaction = `Replenishment`;
                  break;
                case "COMPOSE_IN":
                  transaction = `Compose In`;
                  break;
                case "COMPOSE_OUT":
                  transaction = `Compose Out`;
                  break;
                default:
                  transaction = "-";
                  break;
              }
              return (
                <TableRow
                  key={x.id}
                  className="hover:bg-orange-50 dark:hover:bg-orange-900 transition text-xs align-middle"
                >
                  <TableCell className="font-medium flex flex-row items-center gap-2 max-w-[180px] truncate">
                    {x.variant?.basicProduct?.images?.[0]?.url && (
                      <ImageWithFallback
                        src={x.variant.basicProduct.images[0].url}
                        alt={x.variant.basicProduct.title || "Product"}
                        className="w-8 h-8 rounded border object-cover bg-white mr-2"
                        height={32}
                        width={32}
                        title={x.variant?.basicProduct?.title || "Product"}
                      />
                    )}
                    <span
                      className="truncate"
                      title={
                        x.variant?.basicProduct?.title
                          ? String(x.variant?.basicProduct?.title)
                          : undefined
                      }
                    >
                      {x.variant?.basicProduct?.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-200 font-semibold text-nowrap">
                    {transaction}
                  </TableCell>
                  <TableCell
                    className="text-nowrap max-w-[120px] truncate"
                    title={x.slot?.name + (x.slot?.posSlot ? " (POS)" : "")}
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {x.slot?.name} {x.slot?.posSlot ? "(POS)" : ""}
                    </span>
                    <br />
                    <small
                      className="text-gray-400"
                      title={(x.slot as any).warehouse.name}
                    >
                      {(x.slot as any).warehouse.name}
                    </small>
                  </TableCell>
                  <TableCell className="text-nowrap text-gray-500 dark:text-gray-400">
                    {moment(x.createdAt).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell className="font-semibold text-blue-700 dark:text-blue-300 text-center">
                    {x.transactionType === "SALE" ? Math.abs(x.qty) : x.qty}
                  </TableCell>
                  <TableCell className="font-semibold text-green-700 dark:text-green-300 text-center">
                    {x.transactionType === "SALE"
                      ? `$${Math.abs(
                          Number(x.productLot?.costPerUnit) * x.qty
                        )}`
                      : `${x.qty >= 0 ? "" : "-"}$${(
                          Number(x.productLot?.costPerUnit) * x.qty
                        )
                          .toString()
                          .replace("-", "")}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {props.limit && data?.result ? (
        <Pagination
          limit={props.limit || 5}
          offset={props.offset || 0}
          total={data?.result?.total || 0}
          totalPerPage={data?.result?.data.length || 0}
          text="returns"
        />
      ) : (
        <></>
      )}
    </div>
  );
}
