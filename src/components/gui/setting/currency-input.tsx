import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const currencies = [
    { value: "KHR", label: "KHR - Cambodian Riel" },
    { value: "USD", label: "USD - US Dollar" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currency-select">Currency</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="currency-select">
            <SelectValue placeholder="Select a currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
