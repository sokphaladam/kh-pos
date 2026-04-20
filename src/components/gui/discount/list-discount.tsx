import { useDeleteDiscount } from "@/app/hooks/use-query-discount";
import { WarehouseV2ResponseType } from "@/classes/warehouse";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { Pagination } from "@/components/pagination";
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
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { DiscountType } from "@/lib/types";
import moment from "moment-timezone";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { BindProductDiscount } from "./bind-product-discount";
import { sheetDiscount } from "./sheet-discount";

interface Props {
  total: number;
  data: DiscountType[];
  limit: number;
  offset: number;
  onDelete?: (v: string) => void;
  onEdit?: (v: string) => void;
  onApplied?: () => void;
}

export function ListDiscount(props: Props) {
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating } = useDeleteDiscount();
  const { currency } = useAuthentication();
  const totalPerPage = props.data.length;
  const total = props.total;

  const onDeleteDiscount = useCallback(
    (id: string) => {
      const find = props.data.find((f) => f.id === id);
      showDialog({
        title: "Delete Discount",
        content: `Are your sure you want to delete discount "${find?.title}"?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true && props.onDelete) {
                props.onDelete(id);
                toast.success(
                  res.result?.message || "Discount has been deleted"
                );
              } else {
                toast.error(res.error || "Failed delete discount");
              }
            },
          },
        ],
      });
    },
    [props, showDialog, trigger]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discount</CardTitle>
        <CardDescription>
          Manage your discount and view their performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">Name</TableHead>
              <TableHead className="text-nowrap text-xs">Discount</TableHead>
              <TableHead className="text-nowrap text-xs">Applie On</TableHead>
              <TableHead className="text-nowrap text-xs">
                Created Date
              </TableHead>
              <TableHead className="text-nowrap text-xs">Created By</TableHead>
              <TableHead className="text-nowrap text-xs">Warehouse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data.map((item) => {
              const isAppliedAll = item.applied?.some(
                (f) => !!f.is_applied_all
              );
              const mapProducts = item.applied?.filter((f) => !!f.product_id);
              const mapCategories = item.applied?.filter(
                (f) => !!f.category_id
              );
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {`${item.discountType === "AMOUNT" ? currency : ""} ${
                      item.value
                    }${item.discountType === "AMOUNT" ? "" : "%"}`}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">{`${
                    isAppliedAll
                      ? "All Products"
                      : (mapProducts?.length || 0) > 0
                      ? "Specific Products"
                      : "Categories"
                  } ${
                    isAppliedAll
                      ? ""
                      : `(${mapProducts?.length || mapCategories?.length})`
                  }`}</TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {moment(item.createdAt).format("YYYY-MM-DD")}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {item.createdBy
                      ? (item.createdBy as UserInfo).fullname
                      : ""}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    {item.warehouse
                      ? (item.warehouse as WarehouseV2ResponseType).name
                      : ""}
                  </TableCell>
                  <TableCell className="text-right text-nowrap text-xs">
                    <BasicMenuAction
                      resource="discount"
                      value={item}
                      onDelete={() => onDeleteDiscount(item.id!)}
                      onEdit={async () => {
                        const res = await sheetDiscount.show({
                          edit: {
                            id: item.id,
                            title: item.title,
                            value: item.value,
                            discountType: item.discountType,
                            warehouseId: item.warehouseId,
                            description: item.description,
                          },
                        });
                        if (res) {
                          props.onEdit?.(item.id);
                        }
                      }}
                      disabled={isMutating}
                      items={[
                        {
                          label: "Applies to Products",
                          onClick: async () => {
                            const res = await BindProductDiscount.show({
                              discount: item,
                            });
                            if (res) {
                              props.onApplied?.();
                            }
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
      </CardContent>
      <CardFooter>
        <Pagination
          limit={props.limit}
          offset={props.offset}
          total={total}
          totalPerPage={totalPerPage}
          text="discounts"
        />
      </CardFooter>
    </Card>
  );
}
