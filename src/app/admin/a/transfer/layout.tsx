"use client";

import { LayoutPermission } from "@/components/gui/layout-permission";

export default function TransferLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutPermission permission={["IMS", "ROOT", "POS"]}>
      <div className="w-full">{children}</div>
    </LayoutPermission>
  );
}
