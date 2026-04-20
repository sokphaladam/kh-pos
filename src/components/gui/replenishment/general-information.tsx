import { Replenishment, ReplenishmentDetail } from "@/classes/replenishment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface Props {
  info: Replenishment | null;
  details: ReplenishmentDetail[];
}

export function GeneralInformationReplenishment(props: Props) {
  const { info, details } = props;
  const [show, setShow] = useState(false);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row justify-between items-center">
            <div>General Information</div>
            <div>
              <Button
                size={"sm"}
                variant={"outline"}
                onClick={() => setShow(!show)}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "grid grid-cols-3 gap-4 relative overflow-hidden",
          show ? "h-auto" : "hidden h-0"
        )}
      >
        <div className="flex flex-col items-start">
          <Label>Status</Label>
          <Badge
            variant="outline"
            className={cn(
              "uppercase mt-1",
              info?.status === "completed" ? "border-green-500" : ""
            )}
          >
            {info?.status}
          </Badge>
        </div>
        <div>
          <Label>Created By</Label>
          <div className="text-sm mt-1">
            {info?.createdBy?.fullname ?? "N/A"}
          </div>
        </div>
        <div>
          <Label>Created At</Label>
          <div className="text-sm mt-1">{Formatter.date(info?.createdAt)}</div>
        </div>
        <div>
          <Label>From Warehouse</Label>
          <div className="text-sm mt-1">
            {info?.fromWarehouseId?.name ?? "N/A"}
          </div>
        </div>
        <div>
          <Label>To Warehouse</Label>
          <div className="text-sm mt-1">
            {info?.toWarehouseId?.name ?? "N/A"}
          </div>
        </div>
        <div>
          <Label>Total Items</Label>
          <div className="text-sm font-medium mt-1">{details.length ?? 0}</div>
        </div>
        <div>
          <Label>Total Cost</Label>
          <div className="text-sm mt-1 font-medium">${info?.totalCost}</div>
        </div>
        <div>
          <Label>Total Sent Qty</Label>
          <div className="text-sm font-medium mt-1">
            {info?.totalSentQty ?? 0}
          </div>
        </div>
        <div>
          <Label>Total Received Qty</Label>
          <div className="text-sm font-medium mt-1">
            {info?.totalReceivedQty ?? 0}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
