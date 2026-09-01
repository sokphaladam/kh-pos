"use client";
import { useQueryOrder } from "@/app/hooks/use-query-order";
import { useCallback, useEffect, useRef, useState } from "react";
import { DefaultPrint } from "./default-print";
import { TemplateChhounHour } from "./template-chhoun-hour";
import { TemplateIPrint } from "./template-i-print";
import { Printer } from "lucide-react";
import { TemplateFunbeerking } from "./template-funbeerking";
import {
  buildPrintDocument,
  printLoadedIframe,
  warmPrintingCss,
} from "@/lib/print-frame";

interface DirectPrintProps {
  orderId: string;
  onPrintComplete: () => void;
  autoprint?: boolean;
  type: "default" | "template-i" | "template-ch" | "template-funbeerking";
  receiptCountPerCheckout?: number;
}

const KNOWN_TEMPLATES = [
  "default",
  "template-i",
  "template-ch",
  "template-funbeerking",
] as const;

export function DirectPrint({
  orderId,
  onPrintComplete,
  autoprint = true,
  type: typeInput = "default",
  receiptCountPerCheckout = 1,
}: DirectPrintProps) {
  // Fall back to the default template if the configured value is unknown,
  // otherwise no branch renders and the receipt prints blank.
  const type = KNOWN_TEMPLATES.includes(
    typeInput as (typeof KNOWN_TEMPLATES)[number],
  )
    ? typeInput
    : "default";
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState("");
  const printQueueRef = useRef<string[]>([]);
  const startedRef = useRef(false);
  const completeRef = useRef(onPrintComplete);
  completeRef.current = onPrintComplete;
  const advanceLockRef = useRef(false);
  const { data, error, isLoading, isValidating } = useQueryOrder(orderId);

  useEffect(() => {
    warmPrintingCss();
  }, []);

  // Move to the next receipt in the queue, or finish.
  const advanceQueue = useCallback(() => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    // small delay so Chrome fully tears the print dialog down before the next job
    setTimeout(() => {
      advanceLockRef.current = false;
      const queue = printQueueRef.current;
      if (queue.length > 1) {
        printQueueRef.current = queue.slice(1);
        setDoc(printQueueRef.current[0]);
      } else {
        printQueueRef.current = [];
        setDoc("");
        completeRef.current();
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (!autoprint) return;
    if (startedRef.current) return; // build the print queue only once
    if (isLoading || isValidating) return;

    // The order failed to load — don't hang forever on "Preparing print...".
    if (error || !data?.result) {
      startedRef.current = true;
      console.warn("[DirectPrint] order not available, skipping print", {
        orderId,
        error,
      });
      completeRef.current();
      return;
    }

    if (!ref.current) return;
    const receiptElements =
      ref.current.querySelectorAll<HTMLElement>("[data-receipt]");
    const jobs: string[] = [];
    receiptElements.forEach((el) => {
      if (el.innerHTML.trim()) jobs.push(buildPrintDocument(el.outerHTML));
    });

    if (jobs.length === 0) {
      startedRef.current = true;
      console.warn("[DirectPrint] no receipt content rendered", {
        orderId,
        type,
      });
      completeRef.current();
      return;
    }

    startedRef.current = true;
    printQueueRef.current = jobs;
    setDoc(jobs[0]);
  }, [data, error, autoprint, isLoading, isValidating, orderId, type]);

  // Fire the browser print dialog from the parent once the iframe has loaded.
  // Driving it here (instead of an inline <script> inside srcDoc) keeps it working
  // under a strict Content-Security-Policy and lets us wait for styles/images/fonts.
  const handleFrameLoad = useCallback(() => {
    if (!doc) return; // ignore the initial empty srcDoc load
    const frame = printFrameRef.current;
    if (!frame) {
      advanceQueue();
      return;
    }
    void printLoadedIframe(frame, advanceQueue);
  }, [doc, advanceQueue]);

  const order = data?.result;
  const showSpinner =
    autoprint && (isLoading || isValidating) && !doc && !startedRef.current;

  return (
    <>
      {showSpinner && (
        <div className="fixed top-0 bottom-0 left-0 right-0 bg-gray-500/80 text-white flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center animate-bounce">
            <Printer className="h-8 w-8 mb-4" />
            <span className="text-lg">Preparing print...</span>
          </div>
        </div>
      )}

      {/* Off-screen source used to serialise the receipt markup. Always mounted so
          the ref is populated as soon as the order data arrives. */}
      <div
        ref={ref}
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden
      >
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

      {/* Real size (so % / mm widths in the receipt lay out correctly) but moved
          fully off-screen. A 1x1 iframe makes Chrome print a 1px-wide page. */}
      <iframe
        ref={printFrameRef}
        onLoad={handleFrameLoad}
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "820px",
          height: "1160px",
          border: "0",
          pointerEvents: "none",
        }}
        srcDoc={doc}
        title="Print Frame"
      />
    </>
  );
}
