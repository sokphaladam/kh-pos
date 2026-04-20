import { useQueryPaymentMethod } from "@/app/hooks/use-query-payment";
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
  setValue: (value: string) => void;
}

export function POSPaymentMehtodSelect(props: Props) {
  const { data, isLoading } = useQueryPaymentMethod();

  if (isLoading || !data) {
    return (
      <Select disabled>
        <SelectTrigger className="h-[36px] text-sm">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={props.value} onValueChange={props.setValue}>
      <SelectTrigger className="h-[36px] text-sm">
        <SelectValue placeholder="Payment Method" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs text-gray-500">
            Select Payment Method
          </SelectLabel>
          {data.result?.map((x) => {
            return (
              <SelectItem
                key={x.method_id}
                value={x.method_id}
                className="font-medium"
              >
                {x.method}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
