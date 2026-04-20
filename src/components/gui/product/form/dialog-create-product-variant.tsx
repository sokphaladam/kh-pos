import {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@/app/api/product/[id]/option/types";
import { useGenericGenerateVariant } from "@/app/hooks/use-query-variant";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { createDialog } from "@/components/create-dialog";
import LabelInput from "@/components/label-input";
import TagsInput from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Formatter } from "@/lib/formatter";
import { produce } from "immer";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { v4 } from "uuid";

export const createDialogProductVariant = createDialog<
  { edit: ProductOption[]; id: string },
  {
    option: ProductOption[];
    generate: ProductVariant[];
    optionValue: ProductOptionValue[];
  } | null
>(
  ({ close, edit, id }) => {
    const params = useParams<{ productId: string }>();
    const { trigger } = useGenericGenerateVariant(id);
    const [input, setInput] = useState<ProductOption[]>(edit);
    const [draft, setDraft] = useState<Record<string, string>>({});

    const onNew = useCallback(() => {
      setInput(
        produce((draft) => {
          draft.push({
            id: v4(),
            name: "",
            values: [],
          });
        })
      );
    }, []);

    const onRemove = useCallback((idx: number) => {
      setInput(
        produce((draft) => {
          draft.splice(idx, 1);
        })
      );
    }, []);

    const onClickSave = useCallback(() => {
      const option: ProductOption[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const optionValue: any[] = [];
      for (const x of input) {
        const values: ProductOptionValue[] = [...x.values];
        if (!!draft[x.name]) {
          values.push({
            id: v4(),
            value: draft[x.name],
            createdAt: Formatter.getNowDateTime(),
          });
        }
        option.push({
          id: x.id ? x.id : v4(),
          name: x.name,
          values,
        });
        optionValue.push(values);
      }
      if (option.filter((f) => f.values.length !== 0).length > 0) {
        trigger(option.filter((f) => f.values.length !== 0))
          .then((res) => {
            if (
              res &&
              typeof res === "object" &&
              "success" in res &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (res as any).success
            ) {
              close({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                generate: (res as any).result,
                option,
                optionValue: optionValue.flat(),
              });
            } else {
              toast.error("Failed to generate options");
            }
          })
          .catch(() => {
            toast.error("Failed to generate options");
          });
      }
    }, [close, input, trigger, draft]);

    return (
      <>
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-semibold">
            Configure Product Options
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Create options like Size, Color, Material, etc. to generate product
            variants automatically.
          </p>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {/* Options List */}
          <div className="space-y-3">
            {input.map((option, idx) => {
              const hasNameError = option.name === "";
              const hasDuplicateName =
                input.filter((f) => f.name === option.name).length > 1;
              const hasValueError = option.values.length === 0;

              return (
                <div
                  key={idx}
                  className={`p-3 border rounded space-y-2 ${
                    hasNameError || hasDuplicateName || hasValueError
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : "bg-gray-50/30 dark:bg-gray-900/30"
                  }`}
                >
                  {/* Option Header with Actions */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Option #{idx + 1}
                    </h4>
                    <BasicMenuAction
                      value={option}
                      onAdd={
                        idx === input.length - 1 &&
                        !params.productId &&
                        input.length < 3
                          ? onNew
                          : undefined
                      }
                      onDelete={
                        input.length > 1 && !params.productId
                          ? () => onRemove(idx)
                          : undefined
                      }
                    />
                  </div>

                  {/* Option Name */}
                  <div>
                    <LabelInput
                      type="text"
                      value={option.name}
                      label=""
                      onChange={(e) => {
                        setInput(
                          produce((draft) => {
                            draft[idx].name = e.target.value;
                          })
                        );
                      }}
                      className={`h-8 text-sm ${
                        hasNameError || hasDuplicateName
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                      placeholder="e.g., Size, Color, Material"
                    />
                    {hasNameError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <span>⚠️</span> Option name is required
                      </p>
                    )}
                    {hasDuplicateName && !hasNameError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <span>⚠️</span> Option name &quot;{option.name}&quot;
                        already exists
                      </p>
                    )}
                  </div>

                  {/* Option Values */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Values
                    </label>
                    <TagsInput
                      lock={
                        option.values
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          .filter((x: any) => !!x.edit)
                          .map((x) => x.value) || []
                      }
                      tags={option.values.map((x) => x.value)}
                      setTags={(tags) => {
                        setInput(
                          produce((draft) => {
                            const values = [];
                            for (const t of tags) {
                              const index = input[idx].values.findIndex(
                                (f) => f.value === t
                              );
                              if (index >= 0) {
                                values.push({
                                  ...input[idx].values[index],
                                });
                              } else {
                                values.push({
                                  id: v4(),
                                  value: t,
                                  createdAt: Formatter.getNowDateTime(),
                                  edit: false,
                                });
                              }
                            }
                            draft[idx].values = values;
                          })
                        );
                        setDraft(
                          produce((d) => {
                            d[option.name] = "";
                          })
                        );
                      }}
                      onDraftValue={(e) => {
                        setDraft(
                          produce((d) => {
                            d[option.name] = e;
                          })
                        );
                      }}
                    />
                    {hasValueError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <span>⚠️</span> Add at least one value
                      </p>
                    )}
                    {!hasValueError && option.values.length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <span>✅</span> {option.values.length} value
                        {option.values.length !== 1 ? "s" : ""} added
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Option Button */}
            {!params.productId && input.length < 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNew}
                  className="border-dashed h-8"
                >
                  <span className="mr-1">+</span>
                  Add Another Option
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3">
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 sm:gap-0">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              {input.length < 3 &&
                !params.productId &&
                "You can add up to 3 options"}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => close(null)}
                className="flex-1 sm:flex-none h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onClickSave}
                disabled={
                  !input.some(
                    (option) => option.name && option.values.length > 0
                  )
                }
                className="flex-1 sm:flex-none h-8"
              >
                <span className="hidden sm:inline">Generate Variants</span>
                <span className="sm:hidden">Generate</span>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null, className: "max-w-2xl" }
);
