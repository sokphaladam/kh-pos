import { AdminClientWrapper } from "@/components/layout/admin-client-wrapper";
import "@/app/globals.css";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminClientWrapper>{children}</AdminClientWrapper>;
}
