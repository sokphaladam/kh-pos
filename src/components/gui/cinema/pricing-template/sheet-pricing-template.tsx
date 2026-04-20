"use client";
import { inputPricingTemplateType } from "@/app/api/cinema/pricing-template/template-create";
import {
  useCreatePricingTemplate,
  useUpdatePricingTemplate,
} from "@/app/hooks/use-query-pricing-template";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponseType } from "@/lib/types";
import { defaultExtraSeatPrices } from "@/lib/cinema-default-values";
import { produce } from "immer";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Plus, X, DollarSign, Armchair } from "lucide-react";

const EMPTY_VALUE: inputPricingTemplateType = {
  id: undefined,
  template_name: "",
  time_slot: "all_day",
  day_type: "all_days",
  extra_seat_prices: defaultExtraSeatPrices,
};

const TIME_SLOT_OPTIONS = [
  { value: "matinee", label: "Matinee" },
  { value: "evening", label: "Evening" },
  { value: "late_night", label: "Late Night" },
  { value: "all_day", label: "All Day" },
] as const;

const DAY_TYPE_OPTIONS = [
  { value: "weekday", label: "Weekday" },
  { value: "weekend", label: "Weekend" },
  { value: "holiday", label: "Holiday" },
  { value: "all_days", label: "All Days" },
] as const;

export const sheetPricingTemplate = createSheet<
  { edit?: inputPricingTemplateType },
  unknown
>(
  ({ edit, close }) => {
    const [input, setInput] = useState(() => {
      if (edit) {
        // When editing, use the existing values or default if null
        return {
          ...edit,
          extra_seat_prices: edit.extra_seat_prices || {
            ...defaultExtraSeatPrices,
          },
        };
      }
      // When creating new, use default seat prices
      return {
        ...EMPTY_VALUE,
        extra_seat_prices: { ...defaultExtraSeatPrices },
      };
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const create = useCreatePricingTemplate();
    const update = useUpdatePricingTemplate();

    const validate = useCallback(() => {
      const newErrors: Record<string, string> = {};

      if (!input.template_name || input.template_name.trim() === "") {
        newErrors.template_name = "Template name is required";
      }

      if (!input.time_slot) {
        newErrors.time_slot = "Time slot is required";
      }

      if (!input.day_type) {
        newErrors.day_type = "Day type is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [input]);

    const onSave = useCallback(async () => {
      if (!validate()) {
        toast.error("Please fill in all required fields");
        return;
      }

      let res: ResponseType<unknown> = { success: false };
      if (edit) {
        res = await update.trigger(input);
      } else {
        res = await create.trigger(input);
      }

      if (res && res.success) {
        toast.success(
          edit
            ? "Pricing template has been updated"
            : "Pricing template has been created"
        );
        close(res.result);
      } else {
        toast.error(
          res.error ||
            `Failed to ${edit ? "update" : "create"} pricing template`
        );
      }
    }, [edit, update, input, close, create, validate]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>{edit ? "Edit" : "Create"} Pricing Template</SheetTitle>
        </SheetHeader>
        <div className="w-full my-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template_name"
              placeholder="e.g., Morning Showtimes, Weekend Special"
              value={input.template_name}
              onChange={(e) => {
                setInput(
                  produce(input, (draft) => {
                    draft.template_name = e.target.value;
                  })
                );
                if (errors.template_name) {
                  setErrors(
                    produce(errors, (draft) => {
                      delete draft.template_name;
                    })
                  );
                }
              }}
              className={errors.template_name ? "border-destructive" : ""}
            />
            {errors.template_name && (
              <p className="text-sm text-destructive">{errors.template_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_slot">
              Time Slot <span className="text-destructive">*</span>
            </Label>
            <Select
              value={input.time_slot}
              onValueChange={(value) => {
                setInput(
                  produce(input, (draft) => {
                    draft.time_slot = value as typeof input.time_slot;
                  })
                );
                if (errors.time_slot) {
                  setErrors(
                    produce(errors, (draft) => {
                      delete draft.time_slot;
                    })
                  );
                }
              }}
            >
              <SelectTrigger
                id="time_slot"
                className={errors.time_slot ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time_slot && (
              <p className="text-sm text-destructive">{errors.time_slot}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="day_type">
              Day Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={input.day_type}
              onValueChange={(value) => {
                setInput(
                  produce(input, (draft) => {
                    draft.day_type = value as typeof input.day_type;
                  })
                );
                if (errors.day_type) {
                  setErrors(
                    produce(errors, (draft) => {
                      delete draft.day_type;
                    })
                  );
                }
              }}
            >
              <SelectTrigger
                id="day_type"
                className={errors.day_type ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select day type" />
              </SelectTrigger>
              <SelectContent>
                {DAY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.day_type && (
              <p className="text-sm text-destructive">{errors.day_type}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded">
                  <Armchair className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-sm font-semibold">
                  Extra Seat Prices
                </Label>
              </div>
              <Badge variant="outline" className="text-xs">
                {input.extra_seat_prices
                  ? Object.keys(input.extra_seat_prices).length
                  : 0}{" "}
                {Object.keys(input.extra_seat_prices || {}).length === 1
                  ? "type"
                  : "types"}
              </Badge>
            </div>

            {/* Existing Seat Prices */}
            {input.extra_seat_prices &&
              Object.keys(input.extra_seat_prices).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(input.extra_seat_prices).map(
                    ([key, value], index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border group transition-colors hover:border-primary/50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="grid grid-cols-2 gap-3 flex-1">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Seat Type
                              </div>
                              <Input
                                placeholder="e.g., vip, couple"
                                value={key}
                                onChange={(e) => {
                                  const newKey = e.target.value;
                                  setInput(
                                    produce(input, (draft) => {
                                      if (draft.extra_seat_prices) {
                                        const oldValue =
                                          draft.extra_seat_prices[key];
                                        delete draft.extra_seat_prices[key];
                                        draft.extra_seat_prices[newKey] =
                                          oldValue;
                                      }
                                    })
                                  );
                                }}
                                className="text-sm font-medium h-9"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Price
                              </div>
                              <div className="relative">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={value.toString()}
                                  onChange={(e) => {
                                    setInput(
                                      produce(input, (draft) => {
                                        if (draft.extra_seat_prices) {
                                          draft.extra_seat_prices[key] =
                                            parseFloat(e.target.value) || 0;
                                        }
                                      })
                                    );
                                  }}
                                  className="text-sm font-semibold pl-8 h-9"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setInput(
                                  produce(input, (draft) => {
                                    if (draft.extra_seat_prices) {
                                      delete draft.extra_seat_prices[key];
                                    }
                                  })
                                );
                              }}
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Add New Seat Type */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <Plus className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </div>
                    <label className="text-sm font-medium">
                      Add New Seat Type
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setInput(
                          produce(input, (draft) => {
                            if (!draft.extra_seat_prices) {
                              draft.extra_seat_prices = {};
                            }
                            draft.extra_seat_prices[`New Seat`] = 0;
                          })
                        );
                      }}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Seat Type
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Click to add a new seat type with custom pricing
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={onSave}
            disabled={create.isMutating || update.isMutating}
          >
            {create.isMutating || update.isMutating ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);
