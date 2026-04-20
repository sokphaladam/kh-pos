"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AccountingSettingProps {
  value: string;
  onChange?: (value: string) => void;
}

export function AccountingSetting({ value, onChange }: AccountingSettingProps) {
  const checked = value === "1";

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={checked}
        onCheckedChange={(val) => onChange?.(val ? "1" : "0")}
      />
      <Label>{checked ? "Enabled" : "Disabled"}</Label>
    </div>
  );
}
