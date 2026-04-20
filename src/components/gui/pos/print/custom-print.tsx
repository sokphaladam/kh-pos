/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQueryOrder } from "@/app/hooks/use-query-order";
import { useCallback, useRef } from "react";
import { DefaultPrint } from "./default-print";
import { Button } from "@/components/ui/button";
import { useMutationPrinter } from "@/app/hooks/use-query-printer";

export function CustomPrint({
  orderId,
  order: orderProp,
}: {
  orderId?: string;
  order: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useQueryOrder(orderId || "");
  const { trigger } = useMutationPrinter();

  const handlePrint = useCallback(() => {
    const content = ref.current?.innerHTML;
    if (content) {
      trigger({ html: content });
    }
  }, [trigger]);

  const order = orderId ? data?.result : orderProp;

  return (
    <>
      <Button
        onClick={handlePrint}
        size={"sm"}
        className="bg-white shadow-none hover:bg-white"
      >
        Print (beta)
      </Button>
      <div ref={ref} style={{
          position: "absolute",
          width: "0",
          height: "0",
          border: "0",
          top: -9999,
        }}>
        <DefaultPrint order={order} />
      </div>
    </>
  );
}
