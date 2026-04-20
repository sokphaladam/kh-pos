"use client";

import { products } from "@/app/storybook/product";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";

export function ProductVariantCombobox({
  onChange,
  value: initialValue,
}: {
  value?: string;
  onChange: (value: { value: string; label: string }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(initialValue ?? "");

  const data = React.useMemo(() => {
    return products.map((p) => {
      return {
        value: p.id,
        label: p.name,
      };
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs"
          size={"sm"}
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : "Select product variant..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="text-xs">
          <CommandInput
            placeholder="Search  product variant..."
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty>No product variant found.</CommandEmpty>
            <CommandGroup>
              {data?.map((x) => {
                return (
                  <CommandItem
                    key={x.value}
                    value={x.value}
                    onSelect={(c) => {
                      setValue(c === value ? "" : c);
                      setOpen(false);
                      onChange(x);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === x.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {x.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
