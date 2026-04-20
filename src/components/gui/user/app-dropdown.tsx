import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string;
  setValue: (v: string) => void;
}

export function AppDropdown(props: Props) {
  const items = ["IMS", "POS", "BOM"];

  return (
    <Select value={props.value} onValueChange={(e) => props.setValue(e)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select app" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>App</SelectLabel>
          {items.map((x) => (
            <SelectItem value={x} key={x}>
              {x}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
