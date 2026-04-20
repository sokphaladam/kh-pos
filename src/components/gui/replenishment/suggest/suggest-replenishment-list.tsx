"use client";
import { useCreateReplenishment } from "@/app/hooks/use-query-replenishment";
import {
  ReplenishmentCreateType,
  ReplenishmentSuggestionProduct,
} from "@/classes/replenishment";
import { ImageWithFallback } from "@/components/image-with-fallback";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import {
  useFieldArray,
  useForm,
  UseFormReturn,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { useAuthentication } from "../../../../../contexts/authentication-context";

export interface ReplenishmentItem extends ReplenishmentSuggestionProduct {
  variantId: string;
  sentQty: number;
  costPerUnit: number;
  amount: number;
}
interface ReplenishmentItemListProps {
  index: number;
  isSelected: boolean;
  item: ReplenishmentItem;
  form: UseFormReturn<FormValues, unknown, FormValues>;
  onToggleSelecte: (checked: boolean) => void;
  currency?: string;
}

export function ReplenishmentItemList(props: ReplenishmentItemListProps) {
  const { item, isSelected, form, onToggleSelecte, index, currency } = props;

  const sentQty = useWatch({
    control: form.control,
    name: `replenishmentDetails.${index}.sentQty`,
  });

  const costPerUnit = useWatch({
    control: form.control,
    name: `replenishmentDetails.${index}.costPerUnit`,
  });

  useEffect(() => {
    const qty = Number(sentQty) || 0;
    const cost = Number(costPerUnit) || 0;
    const totalAmount = qty * cost;

    form.setValue(`replenishmentDetails.${index}.amount`, totalAmount, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [sentQty, costPerUnit, index, form]);

  const image = useMemo(() => {
    return (
      item.basicProduct?.images.find((i) => i.productVariantId === item.id) ||
      item.basicProduct?.images[0]
    );
  }, [item]);

  return (
    <TableRow
      key={item.id}
      className={cn(item.sourceStock === 0 && "bg-gray-100")}
    >
      <TableCell className="table-cell text-nowrap text-xs">
        <ImageWithFallback
          src={image?.url + ""}
          alt={item.basicProduct?.title + ""}
          className="w-[35px] h-[35px] border border-dotted rounded-md object-contain"
          height={35}
          width={35}
          title={item?.basicProduct?.title + ""}
        />
      </TableCell>
      <TableCell className="font-medium table-cell text-nowrap text-xs">
        <div className="flex flex-col">
          <div>
            {item.basicProduct?.title} ({item.name})
          </div>
          <span className="text-xs">SKU: {item.sku}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium table-cell text-nowrap text-xs">
        {item.sourceStock}
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        {item.stock ?? "0"}
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        {item.lowStockQty}
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        {item.idealStockQty ?? "N/A"}
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        {(item?.idealStockQty ?? 0) - Number(item.stock || 0)}
      </TableCell>
      <TableCell className="table-cell  w-[120px] text-nowrap text-xs">
        <FormField
          control={form.control}
          name={`replenishmentDetails.${index}.sentQty`}
          rules={
            isSelected
              ? {
                  required: "Sent quantity is required",
                  min: { value: 1, message: "Must be greater than 0" },
                  max: {
                    value: item.sourceStock,
                    message: "Cannot be greater than source stock!",
                  },
                }
              : {}
          }
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <MaterialInput
                  value={field.value}
                  disabled={!isSelected}
                  error={fieldState.error?.message}
                  type="number"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage className="line-clamp-1" />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="table-cell w-[120px]">
        <FormField
          control={form.control}
          name={`replenishmentDetails.${index}.costPerUnit`}
          rules={
            isSelected
              ? {
                  required: "Cost per unit is required",
                  min: { value: 0, message: "Must be greater than 0" },
                }
              : {}
          }
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="flex flex-row items-center">
                  <div>{currency}</div>
                  <MaterialInput
                    value={field.value}
                    disabled={!isSelected}
                    type="number"
                    error={fieldState.error?.message}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage className="line-clamp-1" />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell>
        {currency}
        {Number(form.getValues(`replenishmentDetails.${index}.amount`)).toFixed(
          2
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="group relative">
              <Checkbox
                className="cursor-pointer data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5"
                onCheckedChange={onToggleSelecte}
                checked={isSelected}
                disabled={item.sourceStock === 0}
              />
              {isSelected && (
                <div className="absolute invisible group-hover:visible bg-black text-white text-xs rounded p-1 right-6 top-0 w-60 z-10">
                  Uncheck to remove this item from your replenishment order
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

type FormValues = Omit<ReplenishmentCreateType, "replenishmentDetails"> & {
  fromWarehouseId: string;
  toWarehouseId: string;
  status: ReplenishmentCreateType["status"];
  replenishmentDetails: ReplenishmentItem[];
};

export default function ReplenishmentProductList({
  data,
  werehouse,
  selectedItems,
  onToggleSelect,
}: {
  selectedItems: string[];
  data: ReplenishmentSuggestionProduct[];
  onToggleSelect: (variantId: string) => void;
  werehouse: { name: string; id: string };
}) {
  const form = useForm<FormValues>();

  const { user, currency } = useAuthentication();

  const mainWarehouse = user?.warehouse;
  const router = useRouter();
  const { trigger: create, isMutating: isCreating } = useCreateReplenishment();
  const { fields } = useFieldArray({
    control: form.control,
    name: "replenishmentDetails",
    keyName: "fieldId",
  });

  const replenishmentDetails = useWatch({
    control: form.control,
    name: "replenishmentDetails",
  });

  const { totalSent, totalCost } = useMemo(() => {
    return (replenishmentDetails ?? []).reduce(
      (acc, item) => {
        if (selectedItems.includes(item.variantId)) {
          const sentQty = Number(item.sentQty) || 0;
          const cost = Number(item.costPerUnit) || 0;

          acc.totalSent += sentQty;
          acc.totalCost += sentQty * cost;
        }
        return acc;
      },
      { totalSent: 0, totalCost: 0 }
    );
  }, [replenishmentDetails, selectedItems]);

  useEffect(() => {
    if (data.length > 0) {
      form.reset({
        fromWarehouseId: mainWarehouse?.id,
        toWarehouseId: werehouse.id,
        status: "draft",
        replenishmentDetails: data.map((item) => {
          const sentQty =
            item.idealStockQty && item.idealStockQty < item.sourceStock
              ? item.idealStockQty
              : item.sourceStock;
          return {
            ...item,
            fieldId: item.id,
            sentQty,
            costPerUnit: Number(item.purchasedCost || 0),
            amount: 0,
            variantId: item.id,
          };
        }),
      });
    }
  }, [data, form, mainWarehouse, werehouse]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      const replenishmentDetails = values.replenishmentDetails
        .filter((r) => selectedItems.includes(r.variantId))
        .map((r) => ({
          variantId: r.variantId,
          sentQty: Number(r.sentQty),
          costPerUnit: Number(r.costPerUnit),
        }));

      const input = {
        ...values,
        replenishmentDetails,
      };

      create(input)
        .then((r) => {
          if (r.success) {
            router.back();
            toast.success("Created replenishment");
          }

          if (r.error) {
            toast.error(r.error);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    },
    [create, router, selectedItems]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sr-only text-nowrap text-xs">
                Image
              </TableHead>
              <TableHead className="text-nowrap text-xs">Product</TableHead>
              <TableHead className="text-nowrap text-xs">Your Stock</TableHead>
              <TableHead className="text-nowrap text-xs">
                {werehouse.name}&apos;s Stock
              </TableHead>
              <TableHead className="text-nowrap text-xs">
                Low Stock Qty
              </TableHead>
              <TableHead className="text-nowrap text-xs">
                Ideal Stock Qty
              </TableHead>
              <TableHead className="text-nowrap text-xs">To Stock In</TableHead>
              <TableHead className="text-nowrap text-xs">Qty to Send</TableHead>
              <TableHead className="text-nowrap text-xs">
                Cost Per Unit
              </TableHead>
              <TableHead className="text-nowrap text-xs">Amount</TableHead>
              <TableHead className="sr-only">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <ReplenishmentItemList
                  form={form}
                  index={index}
                  isSelected={isSelected}
                  key={item.fieldId}
                  item={item}
                  currency={currency}
                  onToggleSelecte={() => {
                    if (item.sourceStock < 1) {
                      toast.error(
                        "This product variant don't have enough stock to replenishement!"
                      );
                    } else {
                      onToggleSelect(item.variantId);
                    }
                  }}
                />
              );
            })}
          </TableBody>
        </Table>
        <CardFooter className="border-t bg-gray-50 p-4 flex justify-between items-center">
          <div>
            <p className="font-medium">
              Total qty to send: {totalSent} • Total Cost: ${totalCost}
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="outline">
              Create
              {isCreating && <LoadingSpinner />}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Form>
  );
}
