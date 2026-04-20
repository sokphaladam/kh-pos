import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface TypePosValue {
  system_type: string;
  shared_order_draft: boolean;
}

interface TypePosProps {
  value: string;
  onChange?: (value: string) => void;
}

const DEFAULT_VALUE: TypePosValue = {
  system_type: "",
  shared_order_draft: false,
};

const SYSTEM_TYPES = [
  { value: "MART", label: "Mart" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CINEMA", label: "Cinema" },
];

function parseValue(raw: string): TypePosValue {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      system_type: parsed.system_type ?? DEFAULT_VALUE.system_type,
      shared_order_draft:
        parsed.shared_order_draft ?? DEFAULT_VALUE.shared_order_draft,
    };
  } catch {
    return { ...DEFAULT_VALUE };
  }
}

export function TypePos({ value, onChange }: TypePosProps) {
  const parsed = parseValue(value);

  const handleChange = (patch: Partial<TypePosValue>) => {
    onChange?.(JSON.stringify({ ...parsed, ...patch }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">System Type</Label>
        <Select
          value={parsed.system_type}
          onValueChange={(v) => {
            const input = {
              system_type: v,
              shared_order_draft: parsed.shared_order_draft,
            };
            if (v === "RESTAURANT") {
              input.shared_order_draft = true;
            }
            handleChange(input);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select system type" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {["MART", "CINEMA"].includes(parsed.system_type) ? (
        <div className="flex items-center gap-3">
          <Switch
            id="shared-order-draft"
            checked={parsed.shared_order_draft}
            onCheckedChange={(checked) =>
              handleChange({ shared_order_draft: checked })
            }
            disabled={parsed.system_type === "RESTAURANT"}
          />
          <Label
            htmlFor="shared-order-draft"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {parsed.shared_order_draft
              ? "Shared order draft enabled"
              : "Shared order draft disabled"}
          </Label>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
