"use client";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="flex justify-center">
      <LoaderIcon className={cn("h-6 w-6 animate-spin", className)} />
    </div>
  );
}
