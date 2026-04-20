"use client";

import { useRef, useEffect, useState } from "react";

interface DirectPrintProps {
  onPrintComplete: () => void;
  autoprint?: boolean;
}

export function DirectPrint({
  onPrintComplete,
  autoprint = true,
  children,
}: React.PropsWithChildren<DirectPrintProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState("");

  useEffect(() => {
    if (ref.current && printFrameRef.current && !!autoprint) {
      setDoc(
        `<div>` +
          ref.current.innerHTML +
          "</div><script>window.print(); window.onafterprint = function() {parent.postMessage('print-complete', '*');};/*" +
          Math.random().toString() +
          "*/</script>"
      );
    }
  }, [autoprint]);

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

  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        visibility: "hidden",
      }}
    >
      <div ref={ref}>{children}</div>
      <iframe
        ref={printFrameRef}
        style={{ position: "absolute", width: "0", height: "0", border: "0" }}
        srcDoc={doc}
        title="Print Frame"
      />
    </div>
  );
}
