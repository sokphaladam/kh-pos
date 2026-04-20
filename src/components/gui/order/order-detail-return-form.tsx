import { OrderReturnInput } from "@/classes/order-return";
import LabelInput from "@/components/label-input";
import { MaterialInput } from "@/components/ui/material-input";

interface Props {
  value: OrderReturnInput;
  setValue: (value: OrderReturnInput) => void;
}

export function OrderDetailReturnForm(props: Props) {
  return (
    <div className="flex flex-col gap-5 text-xs mt-4">
      <div className="flex flex-row gap-4 items-center">
        <div>
          <MaterialInput
            label="Quantity"
            type="number"
            value={Number(props.value.quantity || 0).toString()}
            onChange={(e) => {
              props.setValue({
                ...props.value,
                quantity: Number(e.target.value ?? 0),
              });
            }}
          />
        </div>
        <div>
          <MaterialInput
            label="Refund Amount"
            readOnly
            value={props.value.refundAmount}
          />
        </div>
      </div>
      <div>
        <LabelInput
          multiple
          label="Reason (Optional)"
          placeholder="Any reason details about your return..."
          value={props.value.reason}
          onChange={(e) => {
            props.setValue({
              ...props.value,
              reason: e.target.value,
            });
          }}
          className="h-[30px] text-xs"
        />
      </div>
    </div>
  );
}
