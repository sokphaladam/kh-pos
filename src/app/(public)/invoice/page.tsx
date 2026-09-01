import { PublicInvoice } from "@/components/gui/invoice/public-invoice";
import { Suspense } from "react";

export default function PublicInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-500">
          Loading invoice…
        </div>
      }
    >
      <PublicInvoice />
    </Suspense>
  );
}
