"use client";

import { createSheet } from "@/components/create-sheet";
import LabelInput from "@/components/label-input";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { produce } from "immer";
import { useCallback, useState } from "react";
import { v4 } from "uuid";
import { useAuthentication } from "../../../../contexts/authentication-context";

import { DiscountInput } from "@/lib/types";
import {
  useCreateDiscount,
  useUpdateDiscount,
} from "@/app/hooks/use-query-discount";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const sheetDiscount = createSheet<
  { edit?: DiscountInput },
  DiscountInput | null
>(
  ({ close, edit }) => {
    const { user } = useAuthentication();
    const EMPTY_VALUE: DiscountInput = {
      title: "",
      discountType: "AMOUNT",
      value: 0,
      description: "",
      id: v4(),
      warehouseId: user?.currentWarehouseId || "",
    };
    const [discountInput, setDiscountInput] = useState<DiscountInput>(
      edit ? edit : EMPTY_VALUE
    );
    const { trigger: create, isMutating: isMutatingCreate } =
      useCreateDiscount();
    const { trigger: update, isMutating: isMutatingUpdate } =
      useUpdateDiscount();

    const onSave = useCallback(() => {
      (edit ? update : create)(discountInput)
        .then((res) => {
          if (res.success) {
            toast.success(`Discount has been ${edit ? "changed" : "created"}`);
            close(discountInput);
          } else {
            toast.success(`Failed to ${edit ? "changed" : "created"} discount`);
          }
        })
        .catch(() => {
          toast.success(`Failed to ${edit ? "changed" : "created"} discount`);
        });
    }, [edit, update, create, discountInput, close]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>Create New Campaign</SheetTitle>
          <SheetDescription>
            Create a new discount campaign for your store.
          </SheetDescription>
        </SheetHeader>
        <div className="my-4">
          <div>
            <MaterialInput
              label="Campaign Name"
              placeholder="Enter campaign name"
              required
              value={discountInput?.title || ""}
              onChange={(e) => {
                setDiscountInput(
                  produce((draft) => {
                    draft.title = e.target.value;
                  })
                );
              }}
            />
          </div>
          <div className="my-6 flex flex-row gap-4 items-start">
            <div className="w-1/2">
              <Select
                value={discountInput?.discountType}
                onValueChange={(v) => {
                  setDiscountInput(
                    produce((draft) => {
                      draft.discountType = v as "AMOUNT" | "PERCENTAGE";
                    })
                  );
                }}
              >
                <SelectTrigger className="border border-x-0 border-t-0 px-0 py-2 rounded-none shadow-none ring-0 focus:ring-0 focus:outline-none">
                  <SelectValue placeholder="Select Discount Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"PERCENTAGE"}>Percentage (%)</SelectItem>
                  <SelectItem value={"AMOUNT"}>Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <MaterialInput
                label="Discount Value"
                type="number"
                value={discountInput?.value}
                step={0.1}
                min={1}
                onChange={(e) => {
                  setDiscountInput(
                    produce((draft) => {
                      draft.value = Number(e.target.value);
                    })
                  );
                }}
              />
              <small className="text-slate-500">
                Enter{" "}
                {discountInput.discountType === "AMOUNT"
                  ? "dollar amount"
                  : "percentage value"}{" "}
                (e.g., 25 for{" "}
                {discountInput.discountType === "AMOUNT" ? "$25" : "25%"} off)
              </small>
            </div>
          </div>
          <div className="my-4">
            <LabelInput
              multiple
              label="Description"
              placeholder="Describe about discount..."
              className="h-[100px]"
              value={discountInput?.description}
              onChange={(e) => {
                setDiscountInput(
                  produce((draft) => {
                    draft.description = e.target.value;
                  })
                );
              }}
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={onSave}
            disabled={isMutatingCreate || isMutatingUpdate}
          >
            Save
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);
