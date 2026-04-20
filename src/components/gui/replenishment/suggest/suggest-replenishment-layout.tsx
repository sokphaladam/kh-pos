"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useQueryReplenishmentSuggestionByWarehouse } from "@/app/hooks/use-query-replenishment";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReplenishmentSuggestionProduct } from "@/classes/replenishment";
import SkeletonTableList from "@/components/skeleton-table-list";
import { useAuthentication } from "../../../../../contexts/authentication-context";
import ReplenishmentProductList from "./suggest-replenishment-list";
import { cn } from "@/lib/utils";

export default function ReplenishmentSuggestionLayout() {
  const { user } = useAuthentication();

  const { data: warehouseData, isLoading } =
    useQueryReplenishmentSuggestionByWarehouse(user?.currentWarehouseId ?? "");

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement>>({});
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (warehouseData.length > 0) {
      const first = warehouseData[0];
      setOpenSections({
        [first.warehouseId]: true,
      });
      setSelected(first.warehouseId);
    }
  }, [warehouseData]);

  useEffect(() => {
    if (!isLoading && warehouseData.length > 0) {
      const list: Record<string, string[]> = {};
      for (const warehouse of warehouseData) {
        if (warehouse.items.length > 0) {
          list[warehouse.warehouseId] = warehouse.items
            .filter((f) => f.sourceStock > 0)
            .map((m) => m.id);
        }
      }

      setSelectedItems(list);
    }
  }, [isLoading, warehouseData]);

  // Scroll to section
  const scrollToSection = (warehouseId: string) => {
    if (sectionRefs.current[warehouseId]) {
      sectionRefs.current[warehouseId]?.scrollIntoView({ behavior: "smooth" });

      // Ensure section is open
      setOpenSections((prev) => ({
        ...prev,
        [warehouseId]: true,
      }));
      setSelected(warehouseId);
    }
  };

  // Handle section open state change
  const handleOpenChange = (warehouseId: string, open: boolean) => {
    setOpenSections((prev) => ({
      ...prev,
      [warehouseId]: open,
    }));
  };

  const onToggleCheckBox = useCallback(
    (warehouseId: string, variantId: string) => {
      setSelectedItems((prev) => {
        const currentItems = prev[warehouseId] ?? [];

        const isAlreadySelected = currentItems.includes(variantId);
        const updatedItems = isAlreadySelected
          ? currentItems.filter((id) => id !== variantId) // Remove if selected
          : [...currentItems, variantId]; // Add if not selected

        return {
          ...prev,
          [warehouseId]: updatedItems,
        };
      });
    },
    []
  );

  const toggleSelectAll = useCallback(
    (
      type: "deselect" | "select",
      warehouseId: string,
      items: ReplenishmentSuggestionProduct[]
    ) => {
      setSelectedItems((prev) => {
        const newSelected = { ...prev };

        if (type === "select") {
          // Filter only items with sourceStock > 0
          const validIds = items
            .filter((item) => item.sourceStock > 0)
            .map((item) => item.id);

          newSelected[warehouseId] = validIds;
        } else if (type === "deselect") {
          delete newSelected[warehouseId]; // Or: newSelected[warehouseId] = [];
        }

        return newSelected;
      });
    },
    []
  );

  if (isLoading) {
    return <SkeletonTableList />;
  }
  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white py-4 border mb-6 px-4 rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Product Replenishment</h1>
          <p className="text-muted-foreground">
            Manage stock levels across warehouses
          </p>
        </div>

        {/* Warehouse navigation */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {warehouseData
              .filter((warehouse) => warehouse.items.length > 0)
              .map((warehouse) => (
                <Button
                  key={warehouse.warehouseId}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  onClick={() => scrollToSection(warehouse.warehouseId)}
                >
                  <Building2 className="h-4 w-4" />
                  {warehouse.name}
                  <Badge variant="secondary" className="ml-1">
                    {warehouse.total}
                  </Badge>
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* Warehouse sections */}
      <div className="space-y-8">
        {warehouseData
          .filter((warehouse) => warehouse.items.length > 0)
          .map((warehouse) => {
            const selecteds = selectedItems[warehouse.warehouseId] ?? [];

            const isOpen = openSections[warehouse.warehouseId] || false;

            return (
              <section
                key={warehouse.warehouseId}
                id={warehouse.warehouseId}
                ref={(el: HTMLDivElement | null) => {
                  sectionRefs.current[warehouse.warehouseId] =
                    el as HTMLDivElement;
                }}
                className={cn(
                  "bg-white rounded-lg border shadow-sm",
                  selected !== warehouse.warehouseId && "hidden"
                )}
              >
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    handleOpenChange(warehouse.warehouseId, open)
                  }
                >
                  {/* Section header */}
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4 flex justify-between items-center cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <h2 className="text-xl font-semibold">
                            {warehouse.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {warehouse.items.length} products need replenishment
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary"
                        >
                          {selecteds.length} selected
                        </Badge>

                        <div className="h-8 w-8 flex items-center justify-center">
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Section content */}
                  <CollapsibleContent className="border-t">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Showing {warehouse.total} products
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {selecteds.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectAll(
                                  "deselect",
                                  warehouse.warehouseId,
                                  warehouse.items
                                );
                              }}
                            >
                              Deselect All ({selecteds.length})
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectAll(
                                  "select",
                                  warehouse.warehouseId,
                                  warehouse.items
                                );
                              }}
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                      </div>
                      <ReplenishmentProductList
                        selectedItems={
                          selectedItems[warehouse.warehouseId] ?? []
                        }
                        onToggleSelect={(variantId) =>
                          onToggleCheckBox(warehouse.warehouseId, variantId)
                        }
                        data={warehouse.items}
                        werehouse={{
                          name: warehouse.name,
                          id: warehouse.warehouseId,
                        }}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </section>
            );
          })}
      </div>
    </div>
  );
}
