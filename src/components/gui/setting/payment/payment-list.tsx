import {
  useDeletePaymentMethod,
  useQueryPaymentMethod,
} from "@/app/hooks/use-query-payment";
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
import { Formatter } from "@/lib/formatter";
import { useCallback } from "react";
import { sheetPayment } from "./sheet-payment";
import { table_payment_method } from "@/generated/tables";
import { useCommonDialog } from "@/components/common-dialog";
import { toast } from "sonner";
import SkeletonTableList from "@/components/skeleton-table-list";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

export function PaymentList(props: WithLayoutPermissionProps) {
  const { showDialog } = useCommonDialog();
  const { data, isLoading, mutate, isValidating } = useQueryPaymentMethod();
  const { trigger, isMutating } = useDeletePaymentMethod();

  const onAddNew = useCallback(async () => {
    const sheet = await sheetPayment.show({});
    if (sheet) {
      mutate();
    }
  }, [mutate]);

  const onEdit = useCallback(
    async (edit: table_payment_method) => {
      const sheet = await sheetPayment.show({
        edit: {
          id: edit.method_id,
          method: edit.method || "",
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
      const find = data?.result?.find((f) => f.method_id === id);
      showDialog({
        title: "Delete Payment Method",
        content: `Are your sure you want to delete payment method ${find?.method}?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true) {
                toast.success(res.result || "Payment method deleted");
                mutate();
              } else {
                toast.error(res.error || "Delete payment method failed");
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
        text="Payment"
      />
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Customer can pay for goods or services during a transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap text-xs">#</TableHead>
                <TableHead className="text-nowrap text-xs">Method</TableHead>
                <TableHead className="text-nowrap text-xs">
                  Created Date
                </TableHead>
                <TableHead className="text-nowrap text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.result?.map((item, idx) => {
                return (
                  <TableRow key={item.method_id}>
                    <TableCell className="text-nowrap text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {item.method}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      {Formatter.dateTime(item.created_at)}
                    </TableCell>
                    <TableCell className="text-nowrap text-xs">
                      <BasicMenuAction
                        resource="payment"
                        value={item}
                        onEdit={() => onEdit(item)}
                        onDelete={() => onDelete(item.method_id)}
                        disabled={isMutating}
                      />
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
