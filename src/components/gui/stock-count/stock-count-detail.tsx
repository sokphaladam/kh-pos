"use client";

import { useQueryStockCount } from "@/app/hooks/use-query-stock-count";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export function StockCountDetailView() {
  const t = useTranslations("stockCount");
  const router = useRouter();
  const { currencyCode } = useAuthentication();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQueryStockCount(id);
  const count = data?.result;

  const money = (amount: number) =>
    formatCurrency(Math.abs(amount), currencyCode);
  const signed = (amount: number) =>
    amount === 0 ? money(0) : `${amount < 0 ? "-" : "+"}${money(amount)}`;

  if (isLoading || !count) return <LoadingState label={t("loading")} />;

  const net = count.gainAmount - count.lossAmount;
  const diffItems = count.items.filter((i) => i.diffQty !== 0).length;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/stock-counting")}
          aria-label={t("detail.back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            {t("detail.title", { date: count.countDate })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {count.slot?.name} · {count.createdBy?.fullname} ·{" "}
            {moment(count.createdAt).format("DD MMM YYYY, HH:mm")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("detail.counted")} value={String(count.items.length)} />
        <Stat label={t("detail.differences")} value={String(diffItems)} />
        <Stat
          label={t("detail.loss")}
          value={count.lossAmount > 0 ? `-${money(count.lossAmount)}` : money(0)}
          className={count.lossAmount > 0 ? "text-destructive" : undefined}
        />
        <Stat
          label={t("detail.net")}
          value={signed(net)}
          className={
            net < 0 ? "text-destructive" : net > 0 ? "text-success" : undefined
          }
          sub={
            count.gainAmount > 0
              ? `${t("detail.gain")} +${money(count.gainAmount)}`
              : undefined
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("detail.item")}</TableHead>
                <TableHead className="text-xs text-right">
                  {t("detail.system")}
                </TableHead>
                <TableHead className="text-xs text-right">
                  {t("detail.countedQty")}
                </TableHead>
                <TableHead className="text-xs text-right">
                  {t("detail.diff")}
                </TableHead>
                <TableHead className="text-xs text-right">
                  {t("detail.unitCost")}
                </TableHead>
                <TableHead className="text-xs text-right">
                  {t("detail.amount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {count.items.map((item) => {
                const image = item.variant?.basicProduct?.images?.find(
                  (img) => img.productVariantId === item.variant?.id,
                )?.url;
                const variantName =
                  item.variant?.name &&
                  !["Default", "ns"].includes(item.variant.name)
                    ? ` (${item.variant.name})`
                    : "";
                const tone =
                  item.diffQty < 0
                    ? "text-destructive"
                    : item.diffQty > 0
                      ? "text-success"
                      : "text-muted-foreground";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ImageWithFallback
                          src={image}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded border object-contain"
                        />
                        <span className="text-sm font-medium">
                          {item.variant?.basicProduct?.title}
                          {variantName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.systemQty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.countedQty}
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", tone)}>
                      {item.diffQty === 0
                        ? t("detail.match")
                        : item.diffQty > 0
                          ? `+${item.diffQty}`
                          : item.diffQty}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatCurrency(item.unitCost, currencyCode, {
                        maximumFractionDigits: 6,
                      })}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-medium whitespace-nowrap", tone)}
                    >
                      {item.diffAmount === 0 ? "—" : signed(item.diffAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold", className)}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
