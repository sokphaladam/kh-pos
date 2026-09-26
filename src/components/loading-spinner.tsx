"use client";

import { LatticeLoader } from "@/components/ui/lattice-loader";

export default function LoadingSpinner({
  className,
  label = "",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className="flex justify-center">
      <LatticeLoader label={label} className={className} />
    </div>
  );
}
