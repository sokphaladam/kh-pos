import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  duration: number;
  setDuration: (d: number) => void;
}

export function SelectPeriod(props: Props) {
  return (
    <Select
      value={props.duration.toString()}
      onValueChange={(v) => props.setDuration(Number(v))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">Today</SelectItem>
        <SelectItem value="7">This Week</SelectItem>
        <SelectItem value="30">This Month</SelectItem>
        <SelectItem value="365">This Year</SelectItem>
      </SelectContent>
    </Select>
  );
}
