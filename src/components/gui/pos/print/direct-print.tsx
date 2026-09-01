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
  loadPrintingCss,
  printLoadedIframe,
} from "@/lib/print-frame";

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
  const [css, setCss] = useState<string | null>(null);
  const printQueueRef = useRef<string[]>([]);
  const completeRef = useRef(onPrintComplete);
  completeRef.current = onPrintComplete;
  const advanceLockRef = useRef(false);
  const { data, error, isLoading, isValidating } = useQueryOrder(orderId);

  // Load the print stylesheet once so it can be inlined (no async <link> race).
  useEffect(() => {
    let alive = true;
    loadPrintingCss().then((text) => {
      if (alive) setCss(text);
    });
    return () => {
      alive = false;
    };
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
    if (!ref.current) return;
    if (css === null) return; // wait until CSS is ready to inline
    if (isLoading || isValidating) return;

    // The order failed to load — don't hang forever on "Preparing print...".
    if (error || !data?.result) {

      console.warn("[DirectPrint] order not available, skipping print", {
        orderId,
        error,
      });
      completeRef.current();
      return;
    }

    const receiptElements =
      ref.current.querySelectorAll<HTMLElement>("[data-receipt]");
    const jobs: string[] = [];
    receiptElements.forEach((el) => {
      jobs.push(buildPrintDocument(el.outerHTML, css));
    });

    if (jobs.length === 0) {

      console.warn("[DirectPrint] no receipt content rendered", { orderId });
      completeRef.current();
      return;
    }

    printQueueRef.current = jobs;
    setDoc(jobs[0]);

  }, [data, error, autoprint, css, isLoading, isValidating, orderId]);

  // Fire the browser print dialog from the parent once the iframe has loaded.
  // Driving it here (instead of an inline <script> inside srcDoc) keeps it working
  // under a strict Content-Security-Policy and lets us wait for images/fonts.
  const handleFrameLoad = useCallback(() => {
    if (!doc) return; // ignore the initial empty srcDoc load
    const frame = printFrameRef.current;
    if (!frame) {
      advanceQueue();
      return;
    }
    void printLoadedIframe(frame, advanceQueue);
  }, [doc, advanceQueue]);

  if (autoprint && (isLoading || isValidating || css === null)) {
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
    <>
      {/* Off-screen source used to serialise the receipt markup. */}
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
      {/* Kept rendered (1x1) and outside any visibility:hidden wrapper so Chrome
          allows window.print() from it. */}
      <iframe
        ref={printFrameRef}
        onLoad={handleFrameLoad}
        style={{
          position: "fixed",
          width: "1px",
          height: "1px",
          border: "0",
          right: 0,
          bottom: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
        srcDoc={doc}
        title="Print Frame"
      />
    </>
  );
}
