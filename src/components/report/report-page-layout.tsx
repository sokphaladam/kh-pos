import React from "react";

interface ReportPageLayoutProps {
  children: React.ReactNode;
}

export function ReportPageLayout({ children }: ReportPageLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">{children}</div>
  );
}
