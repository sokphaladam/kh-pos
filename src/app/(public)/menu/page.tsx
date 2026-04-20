import { ProductMenuPageRender } from "@/components/gui/product/menu/product-menu-page";
import { Suspense } from "react";
import { Toaster } from "sonner";

export default function ProductMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <ProductMenuPageRender />
      <Toaster richColors />
    </Suspense>
  );
}
