import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

interface Props {
  value: string;
  setValue: (v: string) => void;
}

export function WarehouseDropdown(props: Props) {
  const { data } = useWarehouseList(100, 0);

  return (
    <Select value={props.value} onValueChange={(e) => props.setValue(e)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select app" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Warehouse</SelectLabel>
          {data?.result?.data.map((x) => (
            <SelectItem value={x.id} key={x.id}>
              {x.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
