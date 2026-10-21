"use client";

import { useQueryStockCounts } from "@/app/hooks/use-query-stock-count";
import { DateRangePicker } from "@/components/date-range-picker";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { formatCurrency } from "@/lib/currency";
import { useAuthentication } from "contexts/authentication-context";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ClipboardCheck, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const LIMIT = 30;
const DAY = "yyyy-MM-dd";

export function LayoutStockCount(props: WithLayoutPermissionProps) {
  const t = useTranslations("stockCount");
  const { currencyCode } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const now = new Date();
  const from = search.get("from") || format(startOfMonth(now), DAY);
  const to = search.get("to") || format(endOfMonth(now), DAY);
  const offset = Number(search.get("offset") || 0);

  const { data, isLoading } = useQueryStockCounts({
    from,
    to,
    limit: LIMIT,
    offset,
  });
  const rows = data?.result?.data || [];

  const dateRange = useMemo(
    () => ({
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T00:00:00`),
    }),
    [from, to],
  );
  const money = (amount: number) => formatCurrency(amount, currencyCode);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          onClick={() => push(`${pathname}/new`)}
          disabled={!props.allowCreate}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("newCount")}
        </Button>
      </div>

      <div>
        <DateRangePicker
          dateRange={dateRange}
          onChange={(range) => {
            if (!range?.from) return;
            const params = new URLSearchParams(search.toString());
            params.set("from", format(range.from, DAY));
            params.set("to", format(range.to ?? range.from, DAY));
            params.delete("offset");
            push(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      {isLoading ? (
        <LoadingState label={t("loading")} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {from} → {to}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title={t("list.empty")}
                description={t("list.emptyDescription")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("list.date")}</TableHead>
                    <TableHead className="text-xs">{t("list.slot")}</TableHead>
                    <TableHead className="text-xs text-right">
                      {t("list.items")}
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      {t("list.differences")}
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      {t("list.loss")}
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      {t("list.gain")}
                    </TableHead>
                    <TableHead className="text-xs">{t("list.by")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => push(`${pathname}/${row.id}`)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {row.countDate}
                      </TableCell>
                      <TableCell className="text-sm">{row.slot?.name}</TableCell>
                      <TableCell className="text-right">
                        {row.itemCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.diffItemCount}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive whitespace-nowrap">
                        {row.lossAmount > 0 ? `-${money(row.lossAmount)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success whitespace-nowrap">
                        {row.gainAmount > 0 ? `+${money(row.gainAmount)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.createdBy?.fullname}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {rows.length > 0 && (
            <CardFooter>
              <Pagination
                limit={LIMIT}
                offset={offset}
                totalPerPage={rows.length}
                total={data?.result?.total || 0}
                text={t("title")}
              />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
