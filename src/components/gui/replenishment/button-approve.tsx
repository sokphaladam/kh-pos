import {
  useMutationApproveReplenishment,
  useMutationVerifyReplenishmentPickingList,
} from "@/app/hooks/use-query-replenishment";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { useAuthentication } from "contexts/authentication-context";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2Icon, ScanLineIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LotVerifyRow {
  lotNumber: string;
  label: string;
  verified: boolean;
  lotId: string;
}

export function ReplenishmentButtonApprove({
  id,
  onCompleted,
  restrictLot = false,
  pickingList = [],
}: {
  id: string;
  onCompleted: () => void;
  restrictLot?: boolean;
  pickingList?: FindProductInSlotResult[];
}) {
  const { user } = useAuthentication();
  const { trigger: approve, isMutating: isApproving } =
    useMutationApproveReplenishment(id);
  const { trigger: verify, isMutating: isVerifying } =
    useMutationVerifyReplenishmentPickingList(id);
  const [open, setOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  // Build unique lot rows from picking list
  const lotRows = useMemo<LotVerifyRow[]>(() => {
    const seen = new Set<string>();
    const rows: LotVerifyRow[] = [];
    for (const item of pickingList) {
      const lotNumber = item.lot?.lotNumber;
      if (!lotNumber || seen.has(lotNumber)) continue;
      seen.add(lotNumber);
      rows.push({
        lotNumber,
        label: `${item.variant?.basicProduct?.title}(${item.variant?.name ?? ""}) \nSLOT: ${item.slot?.name ?? ""} \nLOT: ${lotNumber} \nQTY: ${item.qty}`,
        verified: false,
        lotId: item.lot?.id ?? "",
      });
    }
    return rows;
  }, [pickingList]);

  const [verifiedLots, setVerifiedLots] = useState<Set<string>>(
    pickingList.length > 0
      ? new Set<string>(
          pickingList
            .filter((f) => f.status === "verified")
            .map((item) => item.lot?.id ?? ""),
        )
      : new Set<string>(),
  );

  const allVerified = useMemo(
    () => lotRows.length > 0 && lotRows.every((r) => verifiedLots.has(r.lotId)),
    [lotRows, verifiedLots],
  );

  const handleScan = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const match = lotRows.find((r) => r.lotId === trimmed);
      if (match) {
        if (verifiedLots.has(trimmed)) {
          toast.info(`LOT "${trimmed}" already verified.`);
        } else {
          verify({ lotId: trimmed })
            .then((res) => {
              if (res.success) {
                setVerifiedLots((prev) => new Set([...prev, trimmed]));
                toast.success(`LOT "${trimmed}" verified.`);
              } else {
                toast.error(
                  `Failed to verify LOT "${trimmed}". ${res.error ?? ""}`,
                );
              }
            })
            .catch(() => {
              toast.error(`Failed to verify LOT "${trimmed}".`);
            });
        }
      } else {
        toast.error(`LOT "${trimmed}" not found in picking list.`);
      }
      setScanInput("");
    },
    [lotRows, verifiedLots, verify],
  );

  const handleOpenChange = useCallback((val: boolean) => {
    setOpen(val);
    if (val) {
      setVerifiedLots(new Set());
      setScanInput("");
      // Auto-focus scan input after animation
      setTimeout(() => scanRef.current?.focus(), 150);
    }
  }, []);

  const doApprove = useCallback(() => {
    approve({}).then((result) => {
      if (result.success) {
        setOpen(false);
        onCompleted();
        toast.success("Replenishment has been approved!");
      }
      if (result.error) {
        toast.error(result.error);
      }
    });
  }, [approve, onCompleted]);

  const onApprove = useCallback(() => {
    if (restrictLot && lotRows.length > 0) {
      setOpen(true);
    } else {
      doApprove();
    }
  }, [restrictLot, lotRows.length, doApprove]);

  if (!user?.warehouse?.isMain) {
    return <></>;
  }

  return (
    <>
      <Button
        onClick={onApprove}
        type="button"
        variant={"outline"}
        className="bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white"
      >
        {isApproving && <LoadingSpinner />}
        Approve
      </Button>

      {/* Lot verification dialog — only shown when restrictLot is true */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLineIcon className="h-5 w-5 text-emerald-500" />
              Lot Verification Required
            </DialogTitle>
            <DialogDescription>
              Scan each lot barcode to verify before approving. All lots must be
              scanned.
            </DialogDescription>
          </DialogHeader>

          {/* Scan input */}
          <div className="flex items-center gap-2">
            <Input
              ref={scanRef}
              placeholder="Scan or type lot number…"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan(scanInput);
                }
              }}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleScan(scanInput)}
              disabled={isVerifying || !scanInput.trim()}
            >
              Verify
            </Button>
          </div>

          {/* Lot list */}
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
                  <span className="text-muted-foreground font-mono text-xs">
                    {row.label.split("\n").map((line, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "block",
                          idx === 0 ? "font-semibold" : "",
                        )}
                      >
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                  {verified ? (
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-500 shrink-0" />
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={!allVerified || isApproving || isVerifying}
              onClick={doApprove}
            >
              {isApproving && <LoadingSpinner />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
