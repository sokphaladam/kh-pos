"use client";
import { LayoutPos } from "@/components/gui/pos/layout-pos";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminPOS() {
  return (
    <TooltipProvider>
      <div className="w-full h-screen">
        <LayoutPos />
      </div>
    </TooltipProvider>
  );
}
