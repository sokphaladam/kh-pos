/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompositeStockSlotInput,
  CompositionDraft,
} from "@/classes/composite-variant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, LoaderCircle, ScanBarcode } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface PropsInput {
  composedVariant: any;
  componentVariants: {
    id: string;
    variant: CompositionDraft;
    stockSlots: CompositeStockSlotInput[];
  }[];
}

interface ScanProductionDialogProps {
  doSave: () => void;
  value: PropsInput;
  isLoading?: boolean;
  scanOpen: boolean;
  setScanOpen: (open: boolean) => void;
}

export function ProductionScanDialog({
  doSave,
  value,
  isLoading,
  scanOpen,
  setScanOpen,
}: ScanProductionDialogProps) {
  const [verifiedLots, setVerifiedLots] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState("");

  const onSave = useCallback(() => {
    doSave();
  }, [doSave]);

  const lotRows = useMemo(() => {
    const seen = new Set<string>();
    const rows: { lotNumber: string; lotId: string; label: string }[] = [];
    for (const item of value.componentVariants) {
      for (const slot of item.variant.stockSlots) {
        const lotNumber = slot.lot?.lotNumber;
        const lotId = slot.lot?.id;
        if (!lotNumber || !lotId || seen.has(lotNumber)) continue;
        seen.add(lotNumber);
        rows.push({
          lotNumber,
          lotId,
          label: [
            item.variant.basicProduct?.title ?? item.variant.name ?? item.id,
            `SLOT: ${slot.slot?.name ?? "—"}`,
            `LOT: ${lotNumber}`,
            `QTY: ${slot.qty}`,
          ].join("\n"),
        });
      }
    }
    return rows;
  }, [value.componentVariants]);

  const handleScanVerify = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const match = lotRows.find((r) => r.lotId === trimmed);
      if (match) {
        if (verifiedLots.has(trimmed)) {
          toast.info(`LOT "${trimmed}" already verified.`);
        } else {
          setVerifiedLots((prev) => new Set([...prev, trimmed]));
          toast.success(`LOT "${trimmed}" verified.`);
        }
      } else {
        toast.error(`LOT "${trimmed}" not found in composition list.`);
      }
      setScanInput("");
    },
    [lotRows, verifiedLots],
  );

  const allLotsVerified = useMemo(
    () => lotRows.length > 0 && lotRows.every((r) => verifiedLots.has(r.lotId)),
    [lotRows, verifiedLots],
  );

  return (
    <Dialog
      open={scanOpen}
      onOpenChange={(v) => {
        setScanOpen(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-emerald-500" />
            Lot Verification Required
          </DialogTitle>
          <DialogDescription>
            Scan or type each lot number to verify before producing. All lots
            must be confirmed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Scan or type lot number…"
            value={scanInput}
            autoComplete="off"
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScanVerify(scanInput);
              }
            }}
            onFocus={(e) => e.target.focus()}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!scanInput.trim()}
            onClick={() => handleScanVerify(scanInput)}
          >
            Verify
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {lotRows.map((row) => {
            const verified = verifiedLots.has(row.lotId);
            return (
              <div
                key={row.lotId}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                  verified
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border",
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {row.label.split("\n").map((line, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block",
                        i === 0 ? "font-semibold text-foreground" : "",
                      )}
                    >
                      {line}
                    </span>
                  ))}
                </span>
                {verified ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Pending
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-right">
          {verifiedLots.size} / {lotRows.length} verified
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setScanOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!allLotsVerified || isLoading}
            onClick={onSave}
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Confirm Produce
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
