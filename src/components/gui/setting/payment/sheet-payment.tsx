import { inputPaymentMethodType } from "@/app/api/payment/method/method-create";
import {
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
} from "@/app/hooks/use-query-payment";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ResponseType } from "@/lib/types";
import { produce } from "immer";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const EMPTY_VALUE = {
  id: undefined,
  method: "",
};

export const sheetPayment = createSheet<
  { edit?: inputPaymentMethodType },
  unknown
>(
  ({ edit, close }) => {
    const [input, setInput] = useState(edit ? edit : EMPTY_VALUE);
    const create = useCreatePaymentMethod();
    const update = useUpdatePaymentMethod();

    const onSave = useCallback(async () => {
      let res: ResponseType<{
        method: string;
        id?: string | undefined;
      }> = { success: false };
      if (edit) {
        res = await update.trigger(input);
      } else {
        res = await create.trigger(input);
      }

      if (res && res.success) {
        toast.success(
          edit
            ? "Payment method has been changed"
            : "Payment method has been created"
        );
        close(res.result);
      } else {
        toast.error(`Fail to ${edit ? "edit" : "create"} payment method`);
      }
    }, [edit, update, input, close, create]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>Payment Method</SheetTitle>
        </SheetHeader>
        <div className="w-full my-4">
          <MaterialInput
            placeholder="Method"
            value={input.method}
            onChange={(e) => {
              setInput(
                produce(input, (draft) => {
                  draft.method = e.target.value;
                })
              );
            }}
          />
        </div>
        <SheetFooter>
          <Button
            onClick={onSave}
            disabled={create.isMutating || update.isMutating}
          >
            Save
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);
