import { useQuerySlotList } from "@/app/hooks/use-query-slot";
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
import { Slot } from "@/dataloader/slot-loader";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";

interface Props {
  data: Slot[];
  slotSelected: string;
  onSlotSelected: (slot: string, slotName?: string) => void;
  all?: boolean;
  fullWidth?: boolean;
}

export function ProductSlotCombobox(props: Props) {
  const { currentWarehouse } = useAuthentication();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuerySlotList({
    keyword: "",
    warehouseId: currentWarehouse?.id,
    offset: 0,
    limit: 10000,
  });

  if (isLoading) {
    return <></>;
  }

  const list = props.all
    ? (data?.result.data as unknown as Slot[])
    : props.data;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            `justify-between border-t-0 border-x-0 rounded-none shadow-none hover:bg-transparent`,
            props.fullWidth ? "w-full" : "w-[200px]",
          )}
        >
          {props.slotSelected && list
            ? list.find((slot) => slot.id === props.slotSelected)?.name
            : "Select Slot..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" sideOffset={4} align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder="Search slot..."
            className="h-9"
            autoFocus={true}
          />
          <CommandList className="max-h-60 overflow-auto">
            <CommandEmpty>No Slot found.</CommandEmpty>
            <CommandGroup>
              {list &&
                list.map((slot, idx) => {
                  const slotId = String(slot.id);
                  return (
                    <CommandItem
                      tabIndex={idx}
                      role="option"
                      key={slotId}
                      value={slotId}
                      onSelect={(v) => {
                        if (v !== props.slotSelected) {
                          props.onSlotSelected(v, slot.name);
                          setOpen(!open);
                        }
                      }}
                    >
                      {slot.name} {slot.posSlot ? "(POS)" : ""}
                      <Check
                        className={cn(
                          "ml-auto",
                          props.slotSelected === slotId
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
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
