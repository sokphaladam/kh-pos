"use client";

import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthentication } from "contexts/authentication-context";
import { Warehouse, X } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  selectedWarehouseIds?: string[];
  onSelectionChange?: (warehouseIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ReportWarehousePicker({
  selectedWarehouseIds = [],
  onSelectionChange,
  placeholder = "Select branches...",
}: Props) {
  const { user } = useAuthentication();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useWarehouseList(100, 0);

  const selectedWarehouse = useMemo(() => {
    return data?.result?.data?.filter((warehouse) =>
      selectedWarehouseIds?.includes(warehouse.id)
    );
  }, [data, selectedWarehouseIds]);

  const filteredWarehouses = useMemo(() => {
    if (!data?.result?.data) return [];
    return data.result.data.filter((warehouse) =>
      warehouse.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  if (user?.role?.role !== "OWNER") return <></>;

  const handleRemoveWarehouse = (warehouseId: string) => {
    const newSelection = selectedWarehouseIds?.filter(
      (id) => id !== warehouseId
    );
    onSelectionChange?.(newSelection || []);
  };

  const handleSelectWarehouse = (warehouseId: string) => {
    const isSelected = selectedWarehouseIds?.includes(warehouseId);
    let newSelection: string[];

    if (isSelected) {
      newSelection =
        selectedWarehouseIds?.filter((id) => id !== warehouseId) || [];
    } else {
      newSelection = [...(selectedWarehouseIds || []), warehouseId];
    }

    onSelectionChange?.(newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-10 h-auto border-t-0 border-x-0 bg-transparent rounded-none border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200"
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <Warehouse className="h-4 w-4 shrink-0" />
            {selectedWarehouse?.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1 flex-1">
                {selectedWarehouse?.slice(0, 2).map((warehouse) => (
                  <Badge
                    key={warehouse.id}
                    variant="secondary"
                    className="text-xs px-2 py-1 flex items-center gap-1"
                  >
                    {warehouse.name}
                    <div
                      className="inline-flex items-center justify-center h-4 w-4 hover:bg-muted-foreground/20 rounded-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWarehouse(warehouse.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                ))}
                {(selectedWarehouse?.length || 0) > 2 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    +{(selectedWarehouse?.length || 0) - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search branch..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No branches found."}
            </CommandEmpty>
            {filteredWarehouses.map((warehouse) => {
              const isSelected = selectedWarehouseIds?.includes(warehouse.id);
              return (
                <CommandItem
                  key={warehouse.id}
                  value={warehouse.id}
                  onSelect={() => handleSelectWarehouse(warehouse.id)}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{warehouse.name}</div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
