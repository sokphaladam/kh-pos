import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchSlotPicker from "@/components/search-slot-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { SlotDetail } from "@/classes/slot";

interface BulkActionsSectionProps {
  selectedItems: Set<string>;
  globalSlot?: SlotDetail;
  globalExpiry?: Date;
  onGlobalSlotChange: (slot?: SlotDetail) => void;
  onGlobalExpiryChange: (date?: Date) => void;
  onGlobalSlotApply: (slot: SlotDetail) => void;
  onGlobalExpiryApply: (date: Date) => void;
  disabled?: boolean;
}

export function BulkActionsSection({
  selectedItems,
  globalSlot,
  globalExpiry,
  onGlobalSlotChange,
  onGlobalExpiryChange,
  onGlobalSlotApply,
  onGlobalExpiryApply,
  disabled = false,
}: BulkActionsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Bulk Actions
            <Badge variant="secondary" className="ml-2">
              {selectedItems.size} selected
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Global Slot Assignment
            </label>
            <div className="flex gap-2">
              <SearchSlotPicker
                value={globalSlot?.name}
                selectedSlot={globalSlot}
                onChange={onGlobalSlotChange}
              />
              <Button
                size="sm"
                onClick={() => globalSlot && onGlobalSlotApply(globalSlot)}
                disabled={!globalSlot || disabled}
              >
                Apply to All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Global Expiry Date</label>
            <div className="flex gap-2">
              <DatePicker
                initialValue={globalExpiry}
                onChange={onGlobalExpiryChange}
              />
              <Button
                size="sm"
                onClick={() =>
                  globalExpiry && onGlobalExpiryApply(globalExpiry)
                }
                disabled={!globalExpiry || disabled}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
