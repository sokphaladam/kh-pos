"use client";

import { Printing } from "@/classes/cinema/printing";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "contexts/authentication-context";
import { QrCode } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

export interface PrintProductLotProps {
  lotNumber: string;
  expirationDate: string;
  sku: string;
  lotId: string;
  price: string;
  manufacturingDate: string;
}

interface Props {
  data: PrintProductLotProps[];
  type: "BUTTON" | "MENU";
  ref?: React.Ref<HTMLButtonElement>;
}

export function PrintProductLot(props: Props) {
  const { setting } = useAuthentication();
  const contents = useMemo(() => props.data, [props.data]);

  const printerInfo = useMemo(() => {
    const value =
      setting?.data?.result?.find((f) => f.option === "INVENTORY")?.value ||
      "{}";
    const parse = JSON.parse(value) || {};
    return {
      printer_name: parse.print_name,
      type: "product_lot",
      size: "big",
    };
  }, [setting]);

  useEffect(() => {
    return () => Printing.connection?.close();
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      const printer = new Printing();
      printer.send(
        JSON.stringify({
          content: contents,
          printer_info: printerInfo,
        }),
      );
    }
  }, [contents, printerInfo]);

  return (
    <Button
      className={props.type === "MENU" ? "hidden" : undefined}
      variant={"outline"}
      onClick={handlePrint}
      size={"sm"}
      ref={props.ref}
    >
      <QrCode className="h-4 w-4" />
      Print QR
    </Button>
  );
}
