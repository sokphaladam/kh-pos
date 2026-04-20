"use client";

import { useQueryPricingTemplate } from "@/app/hooks/use-query-pricing-template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Receipt, X, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { table_pricing_template } from "@/generated/tables";

interface Props {
  value?: string | null;
  onChange?: (template: table_pricing_template | null) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  allowClear?: boolean;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  matinee: "Matinee",
  evening: "Evening",
  late_night: "Late Night",
  all_day: "All Day",
};

const DAY_TYPE_LABELS: Record<string, string> = {
  weekday: "Weekday",
  weekend: "Weekend",
  holiday: "Holiday",
  all_days: "All Days",
};

export function PricingTemplatePicker({
  value,
  onChange,
  placeholder = "Select pricing template...",
  className,
  error,
  allowClear = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQueryPricingTemplate();

  const selectedTemplate = useMemo(() => {
    if (!value || !data?.result) return null;
    return data.result.find((template) => template.template_id === value);
  }, [data, value]);

  const filteredTemplates = useMemo(() => {
    if (!data?.result) return [];
    if (!search.trim()) return data.result;

    const searchLower = search.toLowerCase();
    return data.result.filter(
      (template) =>
        template.template_name.toLowerCase().includes(searchLower) ||
        TIME_SLOT_LABELS[template.time_slot]
          .toLowerCase()
          .includes(searchLower) ||
        DAY_TYPE_LABELS[template.day_type].toLowerCase().includes(searchLower)
    );
  }, [data, search]);

  const handleSelect = (template: table_pricing_template) => {
    const isCurrentlySelected = value === template.template_id;
    if (isCurrentlySelected && allowClear) {
      onChange?.(null);
    } else {
      onChange?.(template);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between min-h-10 h-auto border-t-0 border-x-0 bg-transparent rounded-none border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200 ${
              error ? "border-destructive" : ""
            }`}
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <Receipt className="h-4 w-4 shrink-0" />
              {selectedTemplate ? (
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <span className="truncate font-medium">
                    {selectedTemplate.template_name}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {TIME_SLOT_LABELS[selectedTemplate.time_slot]}
                  </Badge>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {DAY_TYPE_LABELS[selectedTemplate.day_type]}
                  </Badge>
                  {allowClear && (
                    <div
                      className="ml-auto inline-flex items-center justify-center h-5 w-5 hover:bg-muted-foreground/20 rounded-sm cursor-pointer"
                      onClick={handleClear}
                    >
                      <X className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search pricing template..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No pricing templates found."}
              </CommandEmpty>
              {filteredTemplates.map((template) => {
                const isSelected = value === template.template_id;
                return (
                  <CommandItem
                    key={template.template_id}
                    value={template.template_id}
                    onSelect={() => handleSelect(template)}
                    className="flex items-center gap-2 p-3 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {template.template_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {TIME_SLOT_LABELS[template.time_slot]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {DAY_TYPE_LABELS[template.day_type]}
                        </Badge>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
