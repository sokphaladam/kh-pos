import { LayoutPermission } from "@/components/gui/layout-permission";

export default function NonRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutPermission permission={["BOM", "IMS", "POS", "ROOT"]}>
      {children}
    </LayoutPermission>
  );
}
