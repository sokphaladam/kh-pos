"use client";

import { useDeletePromotionSet } from "@/app/hooks/use-query-promotion-set";
import type { PromotionSetResponse } from "@/classes/promotion-set";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { describePromotionSet, isWithinDailyHours } from "@/lib/promotion-set";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { sheetPromotionSet } from "./sheet-promotion-set";
import { usePromotionSetI18n } from "./use-promotion-set-i18n";

interface Props {
  total: number;
  data: PromotionSetResponse[];
  limit: number;
  offset: number;
  onChanged: () => void;
}

type Status = "active" | "offHours" | "paused" | "scheduled" | "expired";

function statusOf(p: PromotionSetResponse, now: string): Status {
  if (!p.isActive) return "paused";
  if (p.startAt && now < p.startAt) return "scheduled";
  if (p.endAt && now > p.endAt) return "expired";
  if (!isWithinDailyHours(p, now)) return "offHours";
  return "active";
}

const STATUS_CLASS: Record<Status, string> = {
  active: "bg-success/15 text-success border-success/30",
  offHours: "bg-warning/15 text-warning border-warning/30",
  scheduled: "bg-info/15 text-info border-info/30",
  paused: "text-muted-foreground",
  expired: "text-muted-foreground",
};

export function ListPromotionSet(props: Props) {
  const { showDialog } = useCommonDialog();
  const { t, currencySymbol, summaryLabels, errorMessage } =
    usePromotionSetI18n();
  const tCommon = useTranslations("common");
  const { trigger: remove, isMutating } = useDeletePromotionSet();
  const now = Formatter.getNowDateTime();

  const period = (p: PromotionSetResponse) => {
    const start = p.startAt?.slice(0, 10);
    const end = p.endAt?.slice(0, 10);
    if (!start && !end) return t("list.always");
    if (start && end) return `${start} → ${end}`;
    return start
      ? t("list.from", { date: start })
      : t("list.until", { date: end! });
  };

  const onDelete = useCallback(
    (item: PromotionSetResponse) => {
      showDialog({
        title: t("list.deleteTitle"),
        content: t("list.deleteContent", { title: item.title }),
        actions: [
          {
            text: tCommon("delete"),
            onClick: async () => {
              const res = await remove({ id: item.id });
              if (res.success) {
                toast.success(t("list.deleted"));
                props.onChanged();
              } else {
                toast.error(errorMessage(res.error, "list.deleteFailed"));
              }
            },
          },
        ],
      });
    },
    [props, remove, showDialog, t, tCommon, errorMessage],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("list.title")}</CardTitle>
        <CardDescription>{t("list.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {props.data.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={t("list.emptyTitle")}
            description={t("list.emptyDescription")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("list.colName")}</TableHead>
                <TableHead className="text-xs">{t("list.colSet")}</TableHead>
                <TableHead className="text-nowrap text-xs">
                  {t("list.colPeriod")}
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  {t("list.colPerOrder")}
                </TableHead>
                <TableHead className="text-nowrap text-xs">
                  {t("list.colBranch")}
                </TableHead>
                <TableHead className="text-xs">{t("list.colStatus")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.data.map((item) => {
                const status = statusOf(item, now);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">
                      {item.title}
                      {item.priority !== 0 && (
                        <span className="ml-1 text-muted-foreground">
                          {t("list.priority", { value: item.priority })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[380px]">
                      {describePromotionSet(
                        item.items,
                        currencySymbol,
                        summaryLabels,
                      )}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {period(item)}
                      {item.dailyStartTime && item.dailyEndTime && (
                        <div className="text-muted-foreground">
                          {t("list.dailyHours", {
                            start: item.dailyStartTime,
                            end: item.dailyEndTime,
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {item.maxApplyPerOrder
                        ? t("list.maxPerOrder", {
                            count: item.maxApplyPerOrder,
                          })
                        : t("list.unlimited")}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {t(
                        item.warehouseId
                          ? "list.thisBranch"
                          : "list.allBranches",
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={STATUS_CLASS[status]}>
                        {t(`status.${status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      <BasicMenuAction
                        resource="discount"
                        value={item}
                        disabled={isMutating}
                        onEdit={async () => {
                          const saved = await sheetPromotionSet.show({
                            edit: item,
                          });
                          if (saved) props.onChanged();
                        }}
                        onDelete={() => onDelete(item)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {props.total > 0 && (
        <CardFooter>
          <Pagination
            limit={props.limit}
            offset={props.offset}
            total={props.total}
            totalPerPage={props.data.length}
            text={t("list.paginationText")}
          />
        </CardFooter>
      )}
    </Card>
  );
}
