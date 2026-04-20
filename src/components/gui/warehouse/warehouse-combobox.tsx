"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";

interface WarehouseComboboxProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function WarehouseCombobox({
  value,
  onChange,
  disabled,
}: WarehouseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { data } = useWarehouseList(100, 0);
  const warehouses = data?.result?.data || [];

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? selectedWarehouse?.name : "Select warehouse..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search warehouse..." />
          <CommandEmpty>No warehouse found.</CommandEmpty>
          <CommandGroup>
            {warehouses.map((warehouse) => (
              <CommandItem
                key={warehouse.id}
                value={warehouse.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === warehouse.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {warehouse.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
