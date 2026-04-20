import {
  useCreateSupplierProductPrice,
  useDeleteSupplierProductPrice,
  useQuerySupplierProductPrice,
  useUpdateSupplierProductPrice,
} from "@/app/hooks/use-query-supplier-product-price";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { createSheet } from "@/components/create-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SheetHeader } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthentication } from "contexts/authentication-context";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FormSupplierProductPrice } from "./form/form-supplier-product-price";
import { formSupplierProductPriceType } from "./form/form-supplier-product-price-schema";

export const sheetSupplierProductPriceList = createSheet<{
  productVariantId: string;
  productName: string;
  productPrice?: number;
}>(({ productVariantId, productName, productPrice }) => {
  const { currency } = useAuthentication();
  const { showDialog } = useCommonDialog();
  const { trigger, isMutating: isDeleteLoading } =
    useDeleteSupplierProductPrice();
  const { trigger: createTrigger, isMutating: isCreating } =
    useCreateSupplierProductPrice();
  const { trigger: updateTrigger, isMutating: isUpdating } =
    useUpdateSupplierProductPrice();
  const { data, isLoading, mutate } = useQuerySupplierProductPrice(1000, 0, {
    productVariantId,
    orderByPrice: "asc",
  });
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [price, setPrice] = useState(0);
  const [scheduledPrice, setScheduledPrice] = useState(0);
  const [scheduledAt, setScheduledAt] = useState<string | undefined>(undefined);

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
              if (res.success === true) {
                mutate();
                setOpen(false);
                setSupplierId("");
                setPrice(0);
                setScheduledAt(undefined);
                setScheduledPrice(0);
                setId("");
              }
            },
          },
        ],
      });
    },
    [showDialog, trigger, mutate]
  );

  const onCreate = useCallback(
    (value: formSupplierProductPriceType) => {
      createTrigger([
        {
          productVariantId: value.productVariantId,
          supplierId: value.supplierId,
          price: value.price,
        },
      ])
        .then((res) => {
          if (res.success) {
            toast.success("Supplier Product Price created");
            mutate();
            setOpen(false);
            setSupplierId("");
            setPrice(0);
            setScheduledAt(undefined);
            setScheduledPrice(0);
          } else {
            toast.error("Field to create Supplier Product Price");
          }
        })
        .catch(() => {
          toast.error("Field to create Supplier Product Price");
        });
    },
    [createTrigger, mutate]
  );

  const onUpdate = useCallback(
    async (value: formSupplierProductPriceType) => {
      try {
        const result = await updateTrigger({
          id: id,
          price: value.price,
          productVariantId: value.productVariantId,
          supplierId: value.supplierId,
          scheduledAt: value.scheduledAt,
          scheduledPrice: value.scheduledPrice,
        });
        // The API returns { success: boolean, result?: any, error?: string }
        if (result && typeof result === "object" && "success" in result) {
          const response = result as { success: boolean; error?: string };
          if (response.success) {
            toast.success("Supplier product price updated successfully");
            mutate();
            setOpen(false);
            setSupplierId("");
            setPrice(0);
            setScheduledAt(undefined);
            setScheduledPrice(0);
            setId("");
          } else {
            toast.error(
              response.error || "Failed to save supplier product price"
            );
          }
        } else {
          toast.success("Supplier product price updated successfully");
          mutate();
          setOpen(false);
          setSupplierId("");
          setPrice(0);
          setScheduledAt(undefined);
          setScheduledPrice(0);
          setId("");
        }
      } catch (error) {
        toast.error("An error occurred while saving");
        console.error(error);
      }
    },
    [updateTrigger, mutate, id]
  );

  return (
    <>
      <SheetHeader>
        Manage Pricing Supplier - {productName} - {currency}
        {productPrice}
      </SheetHeader>
      <div className="my-4 space-y-4">
        <Button
          size={"sm"}
          variant={open ? "default" : "outline"}
          className="my-3"
          onClick={() => {
            if (open) {
              setOpen(false);
              setSupplierId("");
              setPrice(0);
              setScheduledAt(undefined);
              setScheduledPrice(0);
            } else {
              setOpen(true);
            }
          }}
          disabled={isCreating || isUpdating || isLoading}
        >
          {open ? "Close Form" : "Add Supplier Pricing"}
        </Button>
        {open && (
          <FormSupplierProductPrice
            initialData={{
              price,
              supplierId,
              productVariantId: productVariantId,
              productTitle: productName,
              scheduledAt,
              scheduledPrice,
            }}
            disableProduct
            isEdit={!!id}
            loading={isCreating || isUpdating}
            onSave={(value) => {
              if (id) {
                onUpdate(value);
              } else {
                onCreate(value);
              }
            }}
          />
        )}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-nowrap text-xs">#</TableHead>
                  <TableHead className="text-nowrap text-xs">
                    Supplier
                  </TableHead>
                  <TableHead className="text-nowrap text-xs">Price</TableHead>
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
                {data?.result?.data.map((row, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-nowrap text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        {row.supplier?.name}
                      </TableCell>
                      <TableCell className="text-nowrap text-xs">
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          {currency}
                          {row.price}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.scheduledPrice ? (
                          <Badge className="bg-rose-500 hover:bg-rose-600">
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
                            setId(row.id ?? "");
                            setSupplierId(row.supplier?.id ?? "");
                            setPrice(row.price);
                            setScheduledPrice(row.scheduledPrice ?? 0);
                            setScheduledAt(row.scheduledAt ?? undefined);
                            setOpen(true);
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
        </Card>
      </div>
    </>
  );
});
