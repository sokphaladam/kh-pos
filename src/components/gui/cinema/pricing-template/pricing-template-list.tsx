"use client";
import {
  useDeletePricingTemplate,
  useQueryPricingTemplate,
} from "@/app/hooks/use-query-pricing-template";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { TopToolbar } from "@/components/top-toolbar";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { Formatter } from "@/lib/formatter";
import { useCallback } from "react";
import { sheetPricingTemplate } from "./sheet-pricing-template";
import { table_pricing_template } from "@/generated/tables";
import { useCommonDialog } from "@/components/common-dialog";
import { toast } from "sonner";
import SkeletonTableList from "@/components/skeleton-table-list";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

const TIME_SLOT_LABELS: Record<string, string> = {
  matinee: "Matinee",
  evening: "Evening",
  late_night: "Late Night",
  all_day: "All Day",
};

const DAY_TYPE_LABELS: Record<string, string> = {
  weekday: "Weekday",
  weekend: "Weekend",
  holiday: "Holiday",
  all_days: "All Days",
};

const TIME_SLOT_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  matinee: "default",
  evening: "secondary",
  late_night: "destructive",
  all_day: "outline",
};

const DAY_TYPE_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  weekday: "default",
  weekend: "secondary",
  holiday: "destructive",
  all_days: "outline",
};

export function PricingTemplateList(props: WithLayoutPermissionProps) {
  const { showDialog } = useCommonDialog();
  const { data, isLoading, mutate, isValidating } = useQueryPricingTemplate();
  const { trigger, isMutating } = useDeletePricingTemplate();

  const onAddNew = useCallback(async () => {
    const sheet = await sheetPricingTemplate.show({});
    if (sheet) {
      mutate();
    }
  }, [mutate]);

  const onEdit = useCallback(
    async (edit: table_pricing_template) => {
      const sheet = await sheetPricingTemplate.show({
        edit: {
          id: edit.template_id,
          template_name: edit.template_name || "",
          time_slot: edit.time_slot,
          day_type: edit.day_type,
          extra_seat_prices: edit.extra_seat_prices || null,
        },
      });
      if (sheet) {
        mutate();
      }
    },
    [mutate]
  );

  const onDelete = useCallback(
    (id: string) => {
      const find = data?.result?.find((f) => f.template_id === id);
      showDialog({
        title: "Delete Pricing Template",
        content: `Are you sure you want to delete the pricing template "${find?.template_name}"?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true) {
                toast.success(res.result || "Pricing template deleted");
                mutate();
              } else {
                toast.error(res.error || "Delete pricing template failed");
              }
            },
          },
        ],
      });
    },
    [data, showDialog, trigger, mutate]
  );

  if (isLoading || isValidating) {
    return <SkeletonTableList />;
  }

  return (
    <div className="w-full">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onAddNew}
        data={null}
        text="Pricing Template"
      />
      <Card>
        <CardHeader>
          <CardTitle>Pricing Templates</CardTitle>
          <CardDescription>
            Manage pricing templates for different time slots and day types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap ">#</TableHead>
                <TableHead className="text-nowrap ">Template Name</TableHead>
                <TableHead className="text-nowrap ">Time Slot</TableHead>
                <TableHead className="text-nowrap ">Day Type</TableHead>
                <TableHead className="text-nowrap ">
                  Extra Seat Prices
                </TableHead>
                <TableHead className="text-nowrap ">Created Date</TableHead>
                <TableHead className="text-nowrap ">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.result && data.result.length > 0 ? (
                data.result.map((item, idx) => {
                  return (
                    <TableRow key={item.template_id}>
                      <TableCell className="text-nowrap ">{idx + 1}</TableCell>
                      <TableCell className="text-nowrap  font-medium">
                        {item.template_name}
                      </TableCell>
                      <TableCell className="text-nowrap ">
                        <Badge
                          variant={
                            TIME_SLOT_COLORS[item.time_slot] || "default"
                          }
                        >
                          {TIME_SLOT_LABELS[item.time_slot] || item.time_slot}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-nowrap ">
                        <Badge
                          variant={DAY_TYPE_COLORS[item.day_type] || "default"}
                        >
                          {DAY_TYPE_LABELS[item.day_type] || item.day_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.extra_seat_prices &&
                        Object.keys(item.extra_seat_prices).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.extra_seat_prices)
                              .slice(0, 3)
                              .map(([type, price]) => (
                                <Badge key={type} variant="outline">
                                  {type}: ${price}
                                </Badge>
                              ))}
                            {Object.keys(item.extra_seat_prices).length > 3 && (
                              <Badge variant="outline">
                                +
                                {Object.keys(item.extra_seat_prices).length - 3}{" "}
                                more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-nowrap">
                        {Formatter.date(item.created_at)}
                      </TableCell>
                      <TableCell className="text-nowrap ">
                        <BasicMenuAction
                          resource="pricing-template"
                          value={item}
                          onEdit={() => onEdit(item)}
                          onDelete={() => onDelete(item.template_id)}
                          disabled={isMutating}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No pricing templates found. Click &quot;Add New&quot; to
                    create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
