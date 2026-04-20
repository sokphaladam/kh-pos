import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryPrinters } from "@/app/hooks/use-query-printer";
import { LoaderIcon } from "lucide-react";

interface PrinterSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function PrinterSelect({
  value,
  onChange,
  label = "Printer",
  placeholder = "Select a printer",
}: PrinterSelectProps) {
  const { printers, isLoading } = useQueryPrinters();

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}{" "}
        <span className="text-gray-700 font-normal italic">(optional)</span>
      </Label>
      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? null : val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
          {isLoading && <LoaderIcon className="h-4 w-4 animate-spin" />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No printer</SelectItem>
          {printers.map((printer) => (
            <SelectItem key={printer.id} value={printer.id}>
              {printer.name} ({printer.printerName})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
