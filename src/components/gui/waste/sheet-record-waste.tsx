import type { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useQuerySlotList } from "@/app/hooks/use-query-slot";
import { useRecordWaste } from "@/app/hooks/use-query-waste";
import { createSheet } from "@/components/create-sheet";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SearchProductPicker from "@/components/search-product-picker";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WASTE_REASONS, WasteReason } from "@/lib/waste-reasons";
import { useAuthentication } from "contexts/authentication-context";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface FormState {
  item: ProductSearchResult | null;
  slotId: string;
  qty: string;
  reason: WasteReason | null;
  note: string;
}

const EMPTY: FormState = {
  item: null,
  slotId: "",
  qty: "",
  reason: null,
  note: "",
};

export const sheetRecordWaste = createSheet<object, boolean>(
  ({ close }) => {
    const t = useTranslations("waste");
    const { currentWarehouse } = useAuthentication();
    const { data: slots } = useQuerySlotList({
      keyword: "",
      warehouseId: currentWarehouse?.id,
      limit: 100,
    });
    const { trigger, isMutating } = useRecordWaste();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [savedCount, setSavedCount] = useState(0);

    const slotList = useMemo(() => slots?.result?.data || [], [slots]);

    // Default to the POS slot, where kitchen stock is sold from.
    useEffect(() => {
      if (form.slotId || slotList.length === 0) return;
      const pos = slotList.find((s) => s.posSlot) || slotList[0];
      setForm((f) => ({ ...f, slotId: pos.id }));
    }, [slotList, form.slotId]);

    const qty = Number(form.qty);
    const valid =
      !!form.item &&
      !!form.slotId &&
      Number.isInteger(qty) &&
      qty > 0 &&
      !!form.reason;

    const save = async (addAnother: boolean) => {
      if (!valid || !form.item || !form.reason) {
        toast.error(t("form.required"));
        return;
      }
      const res = await trigger({
        variantId: form.item.variantId,
        slotId: form.slotId,
        qty,
        reason: form.reason,
        note: form.note.trim() || null,
      });
      if (!res?.success) {
        toast.error(res?.error || "Failed");
        return;
      }
      toast.success(t("form.saved"));
      if (addAnother) {
        // Keep slot and reason: entries are usually logged in batches.
        setForm((f) => ({ ...EMPTY, slotId: f.slotId, reason: f.reason }));
        setSavedCount((n) => n + 1);
      } else {
        close(true);
      }
    };

    const itemImage = form.item?.images?.find(
      (img) => img.productVariantId === form.item?.variantId,
    )?.url;

    return (
      <>
        <SheetHeader>
          <SheetTitle>{t("form.title")}</SheetTitle>
          <SheetDescription>{t("form.description")}</SheetDescription>
        </SheetHeader>

        <div className="my-6 space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("form.item")}</div>
            {form.item ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-card">
                  <ImageWithFallback
                    src={itemImage}
                    alt={form.item.productTitle}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {form.item.productTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {form.item.stock !== undefined && `Stock: ${form.item.stock}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Change item"
                  onClick={() => setForm((f) => ({ ...f, item: null }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <SearchProductPicker
                clearInput
                includeProductNotForSale
                onChange={(item) => item && setForm((f) => ({ ...f, item }))}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {t("form.itemHint")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {t("form.slot")}
              </div>
              <Select
                value={form.slotId}
                onValueChange={(slotId) => setForm((f) => ({ ...f, slotId }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slotList.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <MaterialInput
                label={t("form.qty")}
                type="number"
                min={1}
                step={1}
                className="h-9"
                value={form.qty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qty: e.target.value }))
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("form.qtyHint")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t("form.reason")}</div>
            {(["WASTE", "NON_SALE"] as const).map((type) => (
              <div key={type} className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {type === "WASTE"
                    ? t("form.wasteGroup")
                    : t("form.nonSaleGroup")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {WASTE_REASONS.filter((r) => r.type === type).map((r) => {
                    const active = form.reason === r.code;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setForm((f) => ({ ...f, reason: r.code }))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? type === "WASTE"
                              ? "border-destructive bg-destructive text-destructive-foreground"
                              : "border-info bg-info text-white"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {t(`reasons.${r.code}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">{t("form.note")}</div>
            <Textarea
              rows={3}
              placeholder={t("form.notePlaceholder")}
              value={form.note}
              maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            disabled={!valid || isMutating}
            onClick={() => save(true)}
          >
            {t("form.saveAndNew")}
            {savedCount > 0 && ` (${savedCount})`}
          </Button>
          <Button disabled={!valid || isMutating} onClick={() => save(false)}>
            {t("form.save")}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: false },
);
