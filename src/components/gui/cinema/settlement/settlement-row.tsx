"use client";

import { ProducerSettlement } from "@/classes/cinema/settlement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { FileText, Upload } from "lucide-react";
import { useCallback } from "react";
import { proofSettlementDialog } from "./proof-settlement-dialog";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { settlementDetailSheet } from "./settlement-detail-sheet";

interface SettlementRowProps {
  settlement: ProducerSettlement;
  index: number;
  onSuccessAction: () => void;
}

export function SettlementRow({
  settlement,
  onSuccessAction,
}: SettlementRowProps) {
  const { formatForDisplay } = useCurrencyFormat();

  const handleRowClick = useCallback(() => {
    settlementDetailSheet.show({ settlementId: settlement.id });
  }, [settlement.id]);

  const handleUploadProof = useCallback(async () => {
    const result = await proofSettlementDialog.show({
      settlementId: settlement.id,
    });
    if (result) {
      onSuccessAction();
    }
  }, [settlement.id, onSuccessAction]);

  const isSettled = !!settlement.settledAt;
  const image = settlement.productVariant?.basicProduct?.images?.at(0)?.url;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {/* Movie Title */}
      <TableCell className="font-medium text-xs max-w-[200px]">
        <div className="flex flex-row items-center gap-2">
          <ImageWithFallback
            alt="Product image"
            className="w-12 h-12 border border-gray-200 rounded-lg object-contain"
            height={48}
            src={image ?? ""}
            width={48}
          />
          <div
            className="truncate"
            title={settlement.productVariant?.basicProduct?.title ?? "N/A"}
          >
            {settlement.productVariant?.basicProduct?.title ?? "N/A"}
          </div>
        </div>
      </TableCell>

      {/* Share Amount */}
      <TableCell className="text-right text-xs font-semibold">
        {formatForDisplay(settlement.shareAmount)}
      </TableCell>

      {/* Date */}
      <TableCell className="text-nowrap text-xs">
        {settlement.createdAt ? Formatter.date(settlement.createdAt) : "N/A"}
      </TableCell>

      {/* Created By */}
      <TableCell className="text-xs max-w-[120px]">
        <div
          className="truncate"
          title={settlement.createdBy?.fullname ?? "N/A"}
        >
          {settlement.createdBy?.fullname ?? "N/A"}
        </div>
      </TableCell>

      {/* Settled At */}
      <TableCell className="text-nowrap text-xs">
        {settlement.settledAt ? (
          <Badge variant="default" className="text-xs">
            {Formatter.date(settlement.settledAt)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Unsettled
          </Badge>
        )}
      </TableCell>

      {/* Settled By */}
      <TableCell className="text-xs max-w-[120px]">
        <div
          className="truncate"
          title={settlement.settledBy?.fullname ?? "N/A"}
        >
          {settlement.settledBy?.fullname ?? "N/A"}
        </div>
      </TableCell>

      {/* Proof */}
      <TableCell className="text-xs" onClick={(e) => e.stopPropagation()}>
        {settlement.proofLink ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
            onClick={() => window.open(settlement.proofLink!, "_blank")}
          >
            <FileText className="h-4 w-4" />
            View
          </Button>
        ) : isSettled ? (
          <span className="text-muted-foreground">No proof</span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={handleUploadProof}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
