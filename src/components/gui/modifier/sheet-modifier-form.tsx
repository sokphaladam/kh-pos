import { inputModifierType } from "@/app/api/modifier/create-modifier";
import {
  useMutationCreateModifier,
  useMutationEditModifier,
} from "@/app/hooks/use-query-modifier";
import { createSheet } from "@/components/create-sheet";
import LabelInput from "@/components/label-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialInput } from "@/components/ui/material-input";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { produce } from "immer";
import { LoaderIcon, Plus, Trash2, Hash } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

const defaultValue = {
  title: "",
  description: "",
  items: [],
};

export const modifierForm = createSheet<{ data?: inputModifierType }, unknown>(
  ({ close, data }) => {
    const [value, setValue] = useState<inputModifierType>(
      data ? data : defaultValue
    );
    const { formatForDisplay, getSymbol, shouldUseDecimals } =
      useCurrencyFormat();
    const { trigger: triggerCrate, isMutating: isCreating } =
      useMutationCreateModifier();
    const { trigger: triggerUpdate, isMutating: isEditing } =
      useMutationEditModifier();

    const handleAddItem = useCallback(() => {
      setValue(
        produce((draft) => {
          draft.items.push({ name: "", price: 0 });
        })
      );
    }, []);

    const handleRemoveItem = useCallback((index: number) => {
      setValue(
        produce((draft) => {
          draft.items.splice(index, 1);
        })
      );
    }, []);

    const onSubmit = useCallback(() => {
      if (!data) {
        triggerCrate(value)
          .then(() => {
            toast.success("Modifier created successfully");
            close(true);
          })
          .catch((e) => {
            toast.error(e.message ?? "Failed to create modifier");
          });
      } else {
        triggerUpdate(value)
          .then(() => {
            toast.success("Modifier updated successfully");
            close(true);
          })
          .catch((e) => {
            toast.error(e.message ?? "Failed to update modifier");
          });
      }
    }, [triggerCrate, value, close, data, triggerUpdate]);

    const loading = useMemo(() => {
      return isCreating || isEditing;
    }, [isCreating, isEditing]);

    const totalItems = useMemo(() => value.items.length, [value.items]);

    const totalAdditionalPrice = useMemo(() => {
      return value.items.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [value.items]);

    const isFormValid = useMemo(() => {
      return (
        value.title.trim() !== "" &&
        value.items.length > 0 &&
        value.items.every((item) => item.name.trim() !== "")
      );
    }, [value.title, value.items]);

    return (
      <div className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2">
            {data ? "Edit Modifier" : "Create Modifier"}
            <div className="flex gap-2">
              {totalItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalItems} {totalItems === 1 ? "option" : "options"}
                </Badge>
              )}
              {totalAdditionalPrice > 0 && (
                <Badge variant="outline" className="text-xs font-mono">
                  +{formatForDisplay(totalAdditionalPrice)} max
                </Badge>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 pb-4">
          {/* Basic Information */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-foreground">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MaterialInput
                label="Title *"
                required
                value={value.title}
                onChange={(e) => {
                  setValue(
                    produce((draft) => {
                      draft.title = e.target.value;
                    })
                  );
                }}
                placeholder="Enter modifier title..."
                className="font-medium"
              />

              <LabelInput
                multiple
                label="Description"
                placeholder="Describe the modifier options and any special instructions..."
                value={value.description}
                onChange={(e) => {
                  setValue(
                    produce((draft) => {
                      draft.description = e.target.value;
                    })
                  );
                }}
                className="h-[80px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Modifier Items */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">
                  Modifier Options
                </CardTitle>
                <Button
                  onClick={handleAddItem}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Option
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {value.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No options added yet</p>
                  <p className="text-xs mt-1">
                    Click &quot;Add Option&quot; to create modifier choices
                  </p>
                  <p className="text-xs mt-2 font-mono text-muted-foreground/80">
                    Prices in {getSymbol()} (
                    {shouldUseDecimals() ? "with" : "without"} decimals)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {value.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex-1 grid grid-cols-2 gap-3 pb-6">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Option Name
                          </label>
                          <MaterialInput
                            value={item.name}
                            onChange={(e) => {
                              setValue(
                                produce((draft) => {
                                  draft.items[index].name = e.target.value;
                                })
                              );
                            }}
                            placeholder="e.g., Extra Cheese, Large Size..."
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span className="text-xs font-mono bg-muted/50 px-1 rounded">
                              {getSymbol()}
                            </span>
                            Additional Price
                          </label>
                          <div className="relative">
                            <MaterialInput
                              value={item.price}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                const numValue =
                                  inputValue === "" ? 0 : Number(inputValue);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  setValue(
                                    produce((draft) => {
                                      draft.items[index].price = numValue;
                                    })
                                  );
                                }
                              }}
                              type="number"
                              step={shouldUseDecimals() ? "0.01" : "1"}
                              min="0"
                              placeholder={shouldUseDecimals() ? "0.00" : "0"}
                              className="text-sm"
                            />
                            {item.price > 0 && (
                              <div className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground">
                                <span className="font-mono bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                                  {formatForDisplay(item.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {value.items.length > 1 && (
                        <Button
                          onClick={() => handleRemoveItem(index)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Validation Messages */}
          {!isFormValid && value.title.trim() !== "" && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4">
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Complete the form:</p>
                  <ul className="text-xs space-y-0.5 ml-4">
                    {value.items.length === 0 && (
                      <li>• Add at least one modifier option</li>
                    )}
                    {value.items.some((item) => item.name.trim() === "") && (
                      <li>• All option names are required</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-4" />

        <SheetFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {data ? "Update existing modifier" : "Create new modifier"}
              {totalAdditionalPrice > 0 && (
                <span className="ml-2 font-mono bg-muted/30 px-1.5 py-0.5 rounded">
                  Total: +{formatForDisplay(totalAdditionalPrice)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => close(false)}
                variant="outline"
                size="sm"
                disabled={loading}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                disabled={loading || !isFormValid}
                onClick={onSubmit}
                size="sm"
                className="px-6 font-medium"
              >
                {loading && (
                  <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                )}
                {data ? "Update" : "Create"} Modifier
              </Button>
            </div>
          </div>
        </SheetFooter>
      </div>
    );
  },
  { defaultValue: null }
);
