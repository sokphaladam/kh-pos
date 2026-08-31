"use client";

import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDeviceInfo } from "@/lib/device-info";
import { getDeviceId, getDeviceLabel, setDeviceLabel } from "@/lib/device-identity";
import { MonitorSmartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const deviceNameDialog = createDialog<unknown, string | undefined>(
  ({ close }) => {
    const [label, setLabel] = useState(() => getDeviceLabel());

    const deviceId = useMemo(() => getDeviceId(), []);
    const detected = useMemo(() => {
      if (typeof navigator === "undefined") return "Unknown device";
      const info = getDeviceInfo();
      return `${info.browser} on ${info.os}`;
    }, []);

    const handleSave = () => {
      setDeviceLabel(label);
      toast.success(
        label.trim()
          ? `This device is now "${label.trim()}"`
          : "Device name cleared",
      );
      close(label.trim());
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5" />
            Name this device
          </DialogTitle>
          <DialogDescription>
            Give this computer/tablet a name so user activity logs show where an
            action was performed (e.g. &quot;Front counter PC&quot;, &quot;Kitchen
            tablet&quot;). The name is stored only in this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="device-label">Device name</Label>
            <Input
              id="device-label"
              placeholder="e.g. Front counter PC"
              value={label}
              maxLength={100}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Detected</span>
              <span className="font-medium text-right">{detected}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Device ID</span>
              <span className="font-mono text-xs text-right break-all">
                {deviceId}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(undefined)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: undefined },
);
