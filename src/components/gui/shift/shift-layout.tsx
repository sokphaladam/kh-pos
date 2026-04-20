"use client";
import { useQueryShift } from "@/app/hooks/use-query-shift";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Pagination } from "@/components/pagination";
import SkeletonTableList from "@/components/skeleton-table-list";
import { TopToolbar } from "@/components/top-toolbar";
import { Badge } from "@/components/ui/badge";
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
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { Formatter } from "@/lib/formatter";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { ShiftDireactPrint } from "./print/direct-print";
import { shiftDetailDialog } from "./shift-detail-dialog";
import { shiftDialog } from "./shift-dialog";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function ShiftLayout(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const { user, currentShift, mutate } = useAuthentication();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const { formatForDisplay, currencyCode } = useCurrencyFormat();

  const [id, setId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    mutate: refetch,
    isValidating,
  } = useQueryShift(user?.id, limit, offset);

  const onOpenShift = useCallback(async () => {
    const res = await shiftDialog.show({ status: "OPEN" });
    if (typeof res === "string") {
      mutate();
      refetch();
    }
  }, [mutate, refetch]);

  const onCloseShift = useCallback(async () => {
    const id = currentShift?.shift_id;
    if (id) {
      const res = await shiftDialog.show({
        status: "CLOSE",
        id: id || undefined,
      });
      if (res === "CLOSE") {
        mutate();
        refetch();
      }
    }
  }, [currentShift, mutate, refetch]);

  if (isLoading || isValidating) return <SkeletonTableList />;

  return (
    <div className="w-full space-y-4">
      <TopToolbar
        onAddNew={currentShift ? onCloseShift : onOpenShift}
        lable={currentShift ? "Close Shift" : "Open Shift"}
        text={"Shift"}
        data={null}
        disabled={!props.allowCreate}
      />
      <Card className="shadow-md">
        <CardHeader className="space-y-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-2xl font-bold">Shift Management</CardTitle>
          <CardDescription className="text-base">
            Manage your shifts and track cash flow performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-sm font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold">
                  Opened By
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold">
                  Opened Date
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold">
                  Closed Date
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-right">
                  Opening Cash
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-right">
                  Closing Cash
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-right">
                  Actual Cash
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-right">
                  Total Sale
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-right">
                  Difference
                </TableHead>
                <TableHead className="text-nowrap text-sm font-semibold text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data &&
                data.result?.data.map((item, idx) => {
                  const cashDiffUsd = item.receipt
                    ? item.receipt.cashDiffUsd
                    : 0;
                  const cashDiffKhr = item.receipt
                    ? item.receipt.cashDiffKhr
                    : 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-nowrap">
                        <Badge
                          className={
                            item.status === "CLOSE"
                              ? "bg-green-600 hover:bg-green-700 text-white font-medium"
                              : "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          }
                          variant="default"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-nowrap text-sm font-medium">
                        {item.opened_by?.fullname || "-"}
                      </TableCell>
                      <TableCell className="text-nowrap text-sm text-muted-foreground">
                        {item.opened_at || "-"}
                      </TableCell>
                      <TableCell className="text-nowrap text-sm text-muted-foreground">
                        {item.closed_at || "-"}
                      </TableCell>
                      <TableCell className="text-nowrap text-right">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-green-700">
                            {formatForDisplay(
                              Number(item.opened_cash_usd || 0)
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {currencyCode === "USD"
                              ? Formatter.formatCurrencyKH(
                                  Number(item.opened_cash_khr || 0)
                                )
                              : `$${Number(item.opened_cash_khr || 0).toFixed(
                                  2
                                )}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-nowrap text-right">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-blue-700">
                            {Number(item.closed_cash_usd) > 0
                              ? `${formatForDisplay(
                                  Number(item.closed_cash_usd || 0)
                                )}`
                              : "--"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Number(item.closed_cash_khr || 0) > 0
                              ? currencyCode === "USD"
                                ? Formatter.formatCurrencyKH(
                                    Number(item.closed_cash_khr || 0)
                                  )
                                : `$${Number(item.closed_cash_khr || 0).toFixed(
                                    2
                                  )}`
                              : "--"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-nowrap text-right">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-indigo-700">
                            {Number(item.actual_cash_usd || 0) > 0
                              ? `${formatForDisplay(
                                  Number(item.actual_cash_usd || 0)
                                )}`
                              : "--"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Number(item.actual_cash_khr || 0) > 0
                              ? currencyCode === "USD"
                                ? Formatter.formatCurrencyKH(
                                    Number(item.actual_cash_khr || 0)
                                  )
                                : `$${Number(item.actual_cash_khr || 0).toFixed(
                                    2
                                  )}`
                              : "--"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-nowrap text-right">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-indigo-700">
                            {formatForDisplay(Number(item.receipt.sales || 0))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Qty. of bills: {item.receipt.orders}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-nowrap text-right">
                        {item.status === "CLOSE" ? (
                          <div className="space-y-1">
                            <div
                              className={
                                Number(cashDiffUsd || 0) < 0
                                  ? "text-sm font-bold text-red-600"
                                  : Number(cashDiffUsd || 0) > 0
                                  ? "text-sm font-bold text-green-600"
                                  : "text-sm font-semibold text-gray-600"
                              }
                            >
                              {Number(cashDiffUsd || 0) !== 0 &&
                                (Number(cashDiffUsd || 0) > 0 ? "+" : "")}
                              {formatForDisplay(cashDiffUsd || 0)}
                            </div>
                            <div
                              className={
                                (cashDiffKhr || 0) < 0
                                  ? "text-xs font-medium text-red-600"
                                  : (cashDiffKhr || 0) > 0
                                  ? "text-xs font-medium text-green-600"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              {Number(cashDiffKhr || 0) !== 0 &&
                                (Number(cashDiffKhr || 0) > 0 ? "+" : "")}
                              {currencyCode === "USD"
                                ? Formatter.formatCurrencyKH(
                                    Number(cashDiffKhr || 0 || 0)
                                  )
                                : `$${Number(cashDiffKhr || 0).toFixed(2)}`}
                            </div>
                          </div>
                        ) : (
                          <>--</>
                        )}
                      </TableCell>
                      <TableCell className="text-nowrap text-center">
                        <BasicMenuAction
                          value={item}
                          items={[
                            {
                              label: "Print",
                              onClick: () => setId(item.shift_id),
                            },
                            {
                              label: "View Details",
                              onClick: async () => {
                                await shiftDetailDialog.show(item);
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {data?.result?.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No shifts found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start by opening a new shift
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <Pagination
            limit={limit}
            offset={offset}
            totalPerPage={data?.result?.data.length || 0}
            total={data?.result?.total || 0}
            text="Shift"
          />
        </CardFooter>
      </Card>
      {id && (
        <ShiftDireactPrint shiftId={id} onPrintComplete={() => setId(null)} />
      )}
    </div>
  );
}
