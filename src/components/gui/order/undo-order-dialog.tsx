import { useUndoCompletedOrderToDraft } from "@/app/hooks/use-query-order";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoaderIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

export const undoOrderDialog = createDialog<
  { orderId: string; invoiceNo: number },
  unknown
>(({ close, orderId, invoiceNo }) => {
  const { trigger, isMutating } = useUndoCompletedOrderToDraft(orderId);

  const onConfirmUndo = useCallback(() => {
    trigger({})
      .then((res) => {
        if (res.success) {
          toast.success("Order successfully reversed to draft");
          close(
            res.result?.tableNumber
              ? res.result.tableNumber
              : res.result?.orderId
          );
        } else {
          // Extract error message from API response
          const errorMessage = res.error || "Failed to reverse order to draft";
          toast.error(errorMessage);
          close(false);
        }
      })
      .catch((error) => {
        console.error("Error reversing order:", error);

        // Extract error message from different error formats
        let errorMessage = "Failed to reverse order to draft";

        if (error && typeof error === "object") {
          if ("error" in error && typeof error.error === "string") {
            errorMessage = error.error;
          } else if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          } else if (
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response
          ) {
            const responseData = error.response.data as {
              error?: string;
              message?: string;
            };
            if (responseData.error) {
              errorMessage = responseData.error;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        toast.error(errorMessage);
        close(false);
      });
  }, [trigger, close]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reverse Order to Draft</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to reverse order <strong>#{invoiceNo}</strong>{" "}
          back to draft status?
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> This action will:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
            <li>Change order status from COMPLETED to DRAFT</li>
            <li>Remove all payments associated with this order</li>
            <li>Return inventory back to stock</li>
            <li>Remove fulfillment records</li>
          </ul>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          onClick={() => close(false)}
          disabled={isMutating}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirmUndo}
          disabled={isMutating}
        >
          {isMutating && <LoaderIcon className="w-4 h-4 animate-spin mr-2" />}
          Reverse to Draft
        </Button>
      </DialogFooter>
    </>
  );
});
