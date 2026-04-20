"use client";

import { useCallback, useMemo, useState } from "react";
import { GroupProduct, ProductGroupResult } from "@/classes/product-group";
import {
  useMutationAssignProductToGroup,
  useMutationAssignWarehouseToGroup,
  useMutationCreateProductGroup,
  useMutationUnassignProductFromGroup,
  useMutationUnassignWarehouseFromGroup,
  useMutationUpdateProductGroup,
} from "@/app/hooks/use-query-product-group";
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import SearchProductPicker from "@/components/search-product-picker";
import { MaterialInput } from "@/components/ui/material-input";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  X,
  ChevronDown,
  Check,
  Package,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { ResponseType } from "@/lib/types";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/generate-id";

interface SelectedProduct {
  productId: string;
  productVariantId: string;
  label: string;
}

interface SelectedWarehouse {
  warehouseId: string;
  name: string;
}

interface Props {
  edit?: ProductGroupResult;
  close: (value: boolean) => void;
}

export function ProductGroupForm({ edit, close }: Props) {
  const [groupName, setGroupName] = useState(edit?.groupName ?? "");
  const [description, setDescription] = useState(edit?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<SelectedProduct[]>(
    edit?.products.map((p) => ({
      productId: p.productId,
      productVariantId: p.productVariantId,
      label:
        p.product?.title ??
        String(p.variant?.sku ?? `${p.productId} / ${p.productVariantId}`),
    })) ?? [],
  );

  const [warehouses, setWarehouses] = useState<SelectedWarehouse[]>(
    edit?.warehouses.map((w) => ({
      warehouseId: w.warehouseId,
      name: w.warehouse?.name ?? w.warehouseId,
    })) ?? [],
  );

  const { trigger: createGroup } = useMutationCreateProductGroup();
  const { trigger: updateGroup } = useMutationUpdateProductGroup();
  const groupId = useMemo(() => (edit ? edit.groupId : generateId()), [edit]);
  const { trigger: assignProducts } = useMutationAssignProductToGroup(groupId);
  const { trigger: unassignProducts } =
    useMutationUnassignProductFromGroup(groupId);
  const { trigger: assignWarehouses } =
    useMutationAssignWarehouseToGroup(groupId);
  const { trigger: unassignWarehouses } =
    useMutationUnassignWarehouseFromGroup(groupId);
  const { data: warehouseData } = useWarehouseList(100, 0);
  const allWarehouses = warehouseData?.result?.data ?? [];

  const addProduct = useCallback(
    (item: ProductSearchResult) => {
      const exists = products.some(
        (p) =>
          p.productId === item.productId &&
          p.productVariantId === item.variantId,
      );
      if (exists) return;
      setProducts((prev) => [
        ...prev,
        {
          productId: item.productId,
          productVariantId: item.variantId,
          label: item.productTitle + (item.sku ? ` (${item.sku})` : ""),
        },
      ]);
    },
    [products],
  );

  const removeProduct = useCallback((productVariantId: string) => {
    setProducts((prev) =>
      prev.filter((p) => p.productVariantId !== productVariantId),
    );
  }, []);

  const addWarehouse = useCallback(
    (warehouse: { id: string; name: string }) => {
      const exists = warehouses.some((w) => w.warehouseId === warehouse.id);
      if (exists) return;
      setWarehouses((prev) => [
        ...prev,
        { warehouseId: warehouse.id, name: warehouse.name },
      ]);
    },
    [warehouses],
  );

  const removeWarehouse = useCallback((warehouseId: string) => {
    setWarehouses((prev) => prev.filter((w) => w.warehouseId !== warehouseId));
  }, []);

  const handleSave = useCallback(async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (edit) {
        // Compute all diffs upfront (sync) before any async operation
        const origVariantIds = new Set(
          edit.products.map((p) => p.productVariantId),
        );
        const currentVariantIds = new Set(
          products.map((p) => p.productVariantId),
        );
        const toAssignProducts: GroupProduct[] = products
          .filter((p) => !origVariantIds.has(p.productVariantId))
          .map((p) => ({
            productId: p.productId,
            productVariantId: p.productVariantId,
          }));
        const toUnassignProducts: GroupProduct[] = edit.products
          .filter((p) => !currentVariantIds.has(p.productVariantId))
          .map((p) => ({
            productId: p.productId,
            productVariantId: p.productVariantId,
          }));

        const origWarehouseIds = new Set(
          edit.warehouses.map((w) => w.warehouseId),
        );
        const currentWarehouseIds = new Set(
          warehouses.map((w) => w.warehouseId),
        );
        const toAssignWarehouses = warehouses
          .filter((w) => !origWarehouseIds.has(w.warehouseId))
          .map((w) => w.warehouseId);
        const toUnassignWarehouses = edit.warehouses
          .filter((w) => !currentWarehouseIds.has(w.warehouseId))
          .map((w) => w.warehouseId);

        // Run each async step sequentially — each waits for the previous to finish
        await updateGroup({ groupId: edit.groupId, groupName, description });
        if (toAssignProducts.length > 0) await assignProducts(toAssignProducts);
        if (toUnassignProducts.length > 0)
          await unassignProducts(toUnassignProducts);
        if (toAssignWarehouses.length > 0)
          await assignWarehouses({
            warehouseIds: toAssignWarehouses,
          });
        if (toUnassignWarehouses.length > 0)
          await unassignWarehouses({
            warehouseIds: toUnassignWarehouses || [],
          });

        toast.success("Product group updated");
      } else {
        // Step 1: create the group record
        const res = (await createGroup({
          groupId,
          groupName,
          description,
        })) as ResponseType<string>;

        if (!res?.result) {
          setError("Failed to create product group");
          return;
        }

        // Step 2: assign products (waits for step 1)
        if (products.length > 0) {
          await assignProducts(
            products.map((p) => ({
              productId: p.productId,
              productVariantId: p.productVariantId,
            })),
          );
        }

        // Step 3: assign warehouses (waits for step 2)
        if (warehouses.length > 0) {
          await assignWarehouses({
            warehouseIds: warehouses.map((w) => w.warehouseId),
          });
        }

        toast.success("Product group created");
      }

      close(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    edit,
    groupName,
    description,
    products,
    warehouses,
    createGroup,
    updateGroup,
    assignProducts,
    unassignProducts,
    assignWarehouses,
    unassignWarehouses,
    close,
    groupId,
  ]);

  const [warehouseOpen, setWarehouseOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Basic info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            General
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-3">
          <MaterialInput
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
          <MaterialInput
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
          />
        </div>
      </div>

      {/* Products picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Products
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Search and select product variants to include in this group
          </Label>
          {/* Tag container */}
          <div
            className={cn(
              "rounded-md border border-input bg-background transition-colors",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
            )}
          >
            {products.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                {products.map((p) => (
                  <Badge
                    key={p.productVariantId}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 h-6 max-w-[240px] font-normal"
                  >
                    <span className="truncate">{p.label}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${p.label}`}
                      className="shrink-0 rounded-full p-0.5 hover:bg-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring"
                      onClick={() => removeProduct(p.productVariantId)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="p-1.5">
              <SearchProductPicker
                label=""
                onChange={addProduct}
                clearInput
                variant="standard"
              />
            </div>
          </div>
          {products.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {products.length} product variant
              {products.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>

      {/* Warehouses picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Warehouses
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <WarehouseIcon className="h-3.5 w-3.5" />
            Select warehouses this group applies to
          </Label>
          <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
                role="combobox"
                aria-expanded={warehouseOpen}
                className={cn(
                  "w-full rounded-md border border-input bg-background text-left transition-colors",
                  "hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  warehouses.length > 0 ? "p-2" : "px-3 py-2.5",
                )}
              >
                <div className="flex flex-wrap gap-1.5 items-center">
                  {warehouses.length === 0 ? (
                    <span className="text-sm text-muted-foreground flex-1">
                      Select warehouses...
                    </span>
                  ) : (
                    <>
                      {warehouses.map((w) => (
                        <Badge
                          key={w.warehouseId}
                          variant="secondary"
                          className="gap-1 pl-2 pr-1 h-6 font-normal"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{w.name}</span>
                          <span
                            role="button"
                            aria-label={`Remove ${w.name}`}
                            className="shrink-0 rounded-full p-0.5 hover:bg-foreground/10 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWarehouse(w.warehouseId);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </Badge>
                      ))}
                    </>
                  )}
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      warehouseOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0 shadow-md"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Search warehouse..."
                  className="h-9"
                />
                <CommandEmpty>No warehouse found.</CommandEmpty>
                <CommandGroup>
                  {allWarehouses.map((w) => {
                    const isSelected = warehouses.some(
                      (sw) => sw.warehouseId === w.id,
                    );
                    return (
                      <CommandItem
                        key={w.id}
                        value={w.name}
                        onSelect={() => {
                          if (isSelected) {
                            removeWarehouse(w.id);
                          } else {
                            addWarehouse({ id: w.id, name: w.name });
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-primary",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {w.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {warehouses.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
          {error}
        </p>
      )}

      <SheetFooter className="pt-2">
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : edit ? "Update Group" : "Create Group"}
        </Button>
      </SheetFooter>
    </div>
  );
}
