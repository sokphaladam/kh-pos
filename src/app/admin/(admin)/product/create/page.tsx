"use client";
import { LayoutProductForm } from "@/components/gui/product/layout-product-form";
import { useAuthentication } from "../../../../../../contexts/authentication-context";

export default function ProductPage() {
  const { currentWarehouse } = useAuthentication();

  if (!currentWarehouse?.isMain) {
    return <></>;
  }

  return (
    <div className="w-full">
      <LayoutProductForm />
    </div>
  );
}
