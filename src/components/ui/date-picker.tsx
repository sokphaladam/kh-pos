"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { MaterialDatePicker } from "./material-date-picker";
import { MaterialInput } from "./material-input";

interface DatePickerProps {
  initialValue?: Date;
  className?: string;
  label?: string;
  disabled?: boolean;
  clearable?: boolean;
  format?: string;
  error?: string;
  onChange?: (date?: Date) => void;
  onDayBlur?: () => void;
  variant?: "default" | "standard";
}

export function DatePicker({
  initialValue,
  onChange,
  className,
  label,
  disabled,
  error,
  onDayBlur,
  format: dateFormat = "dd MMM, yyyy", // editable format
  variant = "default",
}: DatePickerProps) {
  const [hasValue, setHasValue] = useState(false);

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (initialValue) {
      setInputValue(format(initialValue, dateFormat));
    }
  }, [initialValue, dateFormat]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const formatedDate = Formatter.autoFormatDateInput(val, "dd/MM/yyyy");
      setInputValue(formatedDate);
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    if (!inputValue) return;
    const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
    if (isValid(parsedDate)) {
      onChange?.(parsedDate);
      setHasValue(true);
      setInputValue(format(parsedDate, dateFormat));
    } else {
      if (!hasValue) {
        setInputValue(initialValue ? format(initialValue, dateFormat) : "");
      }
    }
  }, [initialValue, dateFormat, hasValue, inputValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      onDayBlur?.();
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    },
    [onDayBlur]
  );

  return (
    <div className={cn("items-start flex flex-col gap-2", className)}>
      {variant === "standard" && label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative flex items-center gap-2">
            {variant === "default" ? (
              <MaterialInput
                placeholder="DD/MM/YYYY"
                label={label}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                error={error}
              />
            ) : (
              <Input
                placeholder={"DD/MM/YYYY"}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                  "pr-10",
                  error && "border-red-500 focus:ring-red-500 ",
                  disabled && "opacity-50"
                )}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0 h-6 w-6"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <MaterialDatePicker
            value={initialValue}
            onChange={(value) => {
              setHasValue(true);
              setInputValue(format(value, dateFormat));
              onChange?.(value);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
