"use client";

import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthentication } from "contexts/authentication-context";
import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import QRCode from "react-qr-code";

export const invoiceQRCode = createDialog<{
  orderId: string;
  invoiceNo?: string | number;
  tableName?: string | null;
}>(
  ({ orderId, invoiceNo, tableName }) => {
    const { currentWarehouse } = useAuthentication();
    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${location.protocol}//${location.host}`
    ).replace(/\/$/, "");
    const link = `${baseUrl}/invoice?warehouse=${currentWarehouse?.id}&order=${orderId}`;

    const handleOpenLink = useCallback(() => {
      window.open(link, "_blank", "noopener,noreferrer");
    }, [link]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>
            Invoice QR Code{invoiceNo ? ` (#${invoiceNo})` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="bg-white p-4 rounded-lg border border-border/30 shadow-sm">
            <QRCode
              value={link}
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "200px" }}
              viewBox={`0 0 256 256`}
            />
          </div>
          {tableName ? (
            <div className="text-lg font-semibold">Table {tableName}</div>
          ) : null}
          <Button
            onClick={handleOpenLink}
            variant="outline"
            size="sm"
            className="w-full md:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Link
          </Button>
        </div>
      </>
    );
  },
  { defaultValue: undefined }
);
