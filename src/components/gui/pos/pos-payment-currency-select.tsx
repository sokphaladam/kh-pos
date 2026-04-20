import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  value: string;
  setValue: (value: string) => void;
}

export function POSPaymentCurrencySelect(props: Props) {
  const { currencyCode } = useCurrencyFormat();
  return (
    <Select value={props.value} onValueChange={props.setValue}>
      <SelectTrigger className="h-[36px] text-sm font-medium">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs text-gray-500">
            Select Currency
          </SelectLabel>
          <SelectItem value={"USD"} className="font-medium">
            <div className="flex items-center gap-2">
              <span className="text-green-600">
                {currencyCode === "USD" ? "$" : "៛"}
              </span>
              <span>{currencyCode === "USD" ? "USD" : "KHR"}</span>
              <span className="text-xs text-gray-500">
                {currencyCode === "USD" ? "US Dollar" : "Cambodian Riel"}
              </span>
            </div>
          </SelectItem>
          <SelectItem value={"KHR"} className="font-medium">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">
                {currencyCode === "USD" ? "៛" : "$"}
              </span>
              <span>{currencyCode === "USD" ? "KHR" : "USD"}</span>
              <span className="text-xs text-gray-500">
                {currencyCode === "USD" ? "Cambodian Riel" : "US Dollar"}
              </span>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
