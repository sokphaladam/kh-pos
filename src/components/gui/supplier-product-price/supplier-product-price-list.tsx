"use client";
import { useDeleteSupplierProductPrice } from "@/app/hooks/use-query-supplier-product-price";
import { SupplierProductPrice } from "@/classes/supplier-product-price";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthentication } from "contexts/authentication-context";
import { useCallback } from "react";
import { updateSupplierProductPriceSheet } from "./sheet-supplier-product-price-update";

interface Props {
  data: SupplierProductPrice[];
  limit: number;
  offset: number;
  total: number;
  onDelete?: (v: string) => void;
  onEdit?: (v: string) => void;
}

export function SupplierProductPriceList(props: Props) {
  const { currency } = useAuthentication();
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating: isDeleteLoading } =
    useDeleteSupplierProductPrice();
  const totalPerPage = props.data.length;
  const total = props.total;

  const onRemoveSupplierProductPrice = useCallback(
    (id: string) => {
      showDialog({
        title: "Delete Supplier Product Price",
        content: `Are your sure want to delete this supplier product price?`,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              const res = await trigger({ id });
              if (res.success === true && props.onDelete) {
                props.onDelete(id);
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
      <CardContent className="p-0">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-nowrap text-xs">#</TableHead>
              <TableHead className="text-nowrap text-xs">Product</TableHead>
              <TableHead className="text-nowrap text-xs">Supplier</TableHead>
              <TableHead className="text-nowrap">Price</TableHead>
              <TableHead className="text-nowrap text-xs">
                Scheduled Price
              </TableHead>
              <TableHead className="text-nowrap text-xs">
                Scheduled At
              </TableHead>
              <TableHead className="text-nowrap text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data.map((row, idx) => {
              const image =
                row.variant?.basicProduct?.images?.find(
                  (f) => f.productVariantId === row.variant?.id
                ) || row.variant?.basicProduct?.images?.[0];
              return (
                <TableRow key={idx}>
                  <TableCell className="text-nowrap text-xs">
                    {idx + 1 + props.offset}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <div className="flex gap-2">
                      <ImageWithFallback
                        src={image?.url || undefined}
                        alt={row.variant?.name || "Product"}
                        title=""
                        width={40}
                        height={40}
                        className="w-12 h-12 flex-shrink-0"
                        fallbackClassName="w-18 h-18 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {row.variant?.basicProduct?.title} (
                          {row.variant?.name})
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.variant?.sku}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {row.supplier?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.supplier?.contactPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-nowrap">
                    <Badge variant={"secondary"} className="font-bold">
                      {currency}
                      {Number(row.price).toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.scheduledPrice ? (
                      <Badge variant={"destructive"}>
                        {currency}
                        {row.scheduledPrice ?? "0.00"}
                      </Badge>
                    ) : (
                      "--"
                    )}
                  </TableCell>
                  <TableCell>{row.scheduledAt ?? "--"}</TableCell>
                  <TableCell className="text-right">
                    <BasicMenuAction
                      value={row}
                      onDelete={() => {
                        onRemoveSupplierProductPrice(row.id ?? "");
                      }}
                      onEdit={async () => {
                        const res = await updateSupplierProductPriceSheet.show({
                          id: row.id ?? "",
                          edit: {
                            price: row.price,
                            productVariantId: row.variant?.id ?? "",
                            supplierId: row.supplier?.id ?? "",
                            scheduledPrice: row.scheduledPrice ?? undefined,
                            scheduledAt: row.scheduledAt ?? undefined,
                            productBarcode: row.variant?.barcode ?? undefined,
                            productTitle: `${row.variant?.basicProduct?.title} (${row.variant?.name})`,
                            productSku: String(row.variant?.sku ?? ""),
                            productImage:
                              row.variant?.basicProduct?.images.find(
                                (f) => f.productVariantId === row.variant?.id
                              )?.url ||
                              row.variant?.basicProduct?.images?.[0]?.url ||
                              undefined,
                            productPrice: Number(row.variant?.price || 0),
                            productStock: row.variant?.stock || 0,
                          },
                        });

                        if (res) {
                          props.onEdit?.(row.id ?? "");
                        }
                      }}
                      disabled={isDeleteLoading}
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
          text="products"
        />
      </CardFooter>
    </Card>
  );
}
