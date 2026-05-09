"use client";
import { useQueryOrder } from "@/app/hooks/use-query-order";
import { useEffect, useRef, useState } from "react";
import { DefaultPrint } from "./default-print";
import { TemplateChhounHour } from "./template-chhoun-hour";
import { TemplateIPrint } from "./template-i-print";
import { Printer } from "lucide-react";
import { TemplateFunbeerking } from "./template-funbeerking";

interface DirectPrintProps {
  orderId: string;
  onPrintComplete: () => void;
  autoprint?: boolean;
  type: "default" | "template-i" | "template-ch" | "template-funbeerking";
  receiptCountPerCheckout?: number;
}

export function DirectPrint({
  orderId,
  onPrintComplete,
  autoprint = true,
  type = "default",
  receiptCountPerCheckout = 1,
}: DirectPrintProps) {
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState("");
  const { data, isLoading, isValidating } = useQueryOrder(orderId);

  useEffect(() => {
    if (ref.current && printFrameRef.current && data && !!autoprint) {
      setDoc(
        `<!DOCTYPE html><html><head><link rel="stylesheet" href="/printing.css"/><style>@page { margin: 0; } @media print { div[data-receipt] { page-break-after: always; break-after: page; } div[data-receipt]:last-child { page-break-after: avoid; break-after: avoid; } }</style></head><body>` +
          ref.current.innerHTML +
          "</body><script>window.onload = function() { window.print(); window.onafterprint = function() {parent.postMessage('print-complete', '*');}; };/*" +
          Math.random().toString() +
          "*/</script></html>",
      );
    }
  }, [data, autoprint]);

  useEffect(() => {
    function handlePrintComplete(event: MessageEvent) {
      if (event.data === "print-complete") {
        onPrintComplete();
      }
    }
    window.addEventListener("message", handlePrintComplete);
    return () => {
      window.removeEventListener("message", handlePrintComplete);
    };
  }, [onPrintComplete]);

  if (isLoading || isValidating) {
    return (
      <div className="fixed top-0 bottom-0 left-0 right-0 bg-gray-500/80 text-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center animate-bounce">
          <Printer className="h-8 w-8 mb-4" />
          <span className="text-lg">Preparing print...</span>
        </div>
      </div>
    );
  }

  const order = data?.result;

  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        visibility: "hidden",
      }}
    >
      <div ref={ref}>
        {[...new Array(receiptCountPerCheckout)].map((_, index, arr) => {
          return (
            <div
              key={index}
              data-receipt
              style={
                index < arr.length - 1
                  ? { pageBreakAfter: "always", breakAfter: "page" }
                  : {}
              }
              className="pagebreak"
            >
              {type === "default" && <DefaultPrint order={order} />}
              {type === "template-i" && <TemplateIPrint order={order} />}
              {type === "template-ch" && <TemplateChhounHour order={order} />}
              {type === "template-funbeerking" && (
                <TemplateFunbeerking order={order} />
              )}
            </div>
          );
        })}
      </div>
      <iframe
        ref={printFrameRef}
        style={{
          position: "absolute",
          width: "0",
          height: "0",
          border: "0",
          top: -9999,
        }}
        srcDoc={doc}
        title="Print Frame"
      />
    </div>
  );
}
