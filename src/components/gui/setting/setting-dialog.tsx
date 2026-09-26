"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Banknote, ChevronRight, Monitor, MonitorCog, UsersRound } from "lucide-react";
import { useAuthentication } from "contexts/authentication-context";

import { createDialog } from "@/components/create-dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutPermission } from "@/components/gui/layout-permission";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

import { SettingList } from "./setting-list";
import { PaymentList } from "./payment/payment-list";
import UsersLayout from "../user/user-layout";
import { DeliveryLayout } from "../delivery/delivery-layout";

const UsersPanel = withLayoutPermission(UsersLayout, "users");
const PaymentPanel = withLayoutPermission(PaymentList, "payment");

type Layer = "hub" | "general" | "users" | "delivery" | "payment";

interface HubTile {
  key: Layer;
  title: string;
  description: string;
  icon: React.ElementType;
  /** Resource key checked against the user's role permissions (read access). */
  resource: string;
}

function DialogLayerPanel({
  title,
  onBack,
  children,
}: React.PropsWithChildren<{ title: string; onBack: () => void }>) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

/**
 * The settings sections the current user's role can access: OWNER always
 * gets everything, other roles need explicit "read" permission on the
 * section's resource. Also used to decide whether the "Settings" entry
 * should even be shown (no accessible section => nothing to show).
 */
export function useSettingHubTiles(): HubTile[] {
  const { setting, currentWarehouse, user } = useAuthentication();

  const typePos = useMemo(() => {
    return (
      JSON.parse(
        setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value ||
          "{}",
      ).system_type || ""
    );
  }, [setting?.data?.result]);

  const isOwner = user?.role?.role === "OWNER";
  const rolePermissions = useMemo(
    () => (user?.role?.permissions || {}) as Record<string, string>,
    [user?.role?.permissions],
  );
  const hasAccess = useCallback(
    (resource: string) => {
      if (isOwner) return true;
      const permissionList = rolePermissions[resource];
      if (!permissionList) return false;
      return permissionList
        .split(",")
        .map((p) => p.trim())
        .includes("read");
    },
    [isOwner, rolePermissions],
  );

  return useMemo((): HubTile[] => {
    const items: HubTile[] = [
      {
        key: "general",
        title: "General",
        description: "Store, invoice, printer and app preferences",
        icon: MonitorCog,
        resource: "setting",
      },
      {
        key: "users",
        title: "Users",
        description: "Manage staff accounts and roles",
        icon: UsersRound,
        resource: "users",
      },
    ];
    if (typePos === "RESTAURANT") {
      items.push({
        key: "delivery",
        title: "Delivery",
        description: "Delivery customers and settings",
        icon: Monitor,
        resource: "delivery",
      });
    }
    if (currentWarehouse?.isMain) {
      items.push({
        key: "payment",
        title: "Payment Method",
        description: "Accepted payment methods",
        icon: Banknote,
        resource: "payment",
      });
    }
    return items.filter((item) => hasAccess(item.resource));
  }, [typePos, currentWarehouse?.isMain, hasAccess]);
}

function SettingDialogBody() {
  const [layer, setLayer] = useState<Layer>("hub");
  const tiles = useSettingHubTiles();

  const goToHub = useCallback(() => setLayer("hub"), []);

  const activeTile = tiles.find((t) => t.key === layer);

  return (
    <LayoutPermission permission={["ROOT"]}>
      <div className="flex h-[85vh] w-full flex-col">
        <DialogTitle className="sr-only">
          {activeTile ? activeTile.title : "Settings"}
        </DialogTitle>

        {layer === "hub" && (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Settings
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Choose a section to configure
            </p>
            {tiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Your role doesn&apos;t have access to any settings section.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tiles.map((tile) => (
                <button
                  key={tile.key}
                  onClick={() => setLayer(tile.key)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-info/30 hover:bg-info/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <tile.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {tile.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {tile.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                </button>
              ))}
            </div>
          </div>
        )}

        {layer === "general" && (
          <div className="min-h-0 flex-1">
            <SettingList onBack={goToHub} />
          </div>
        )}

        {layer === "users" && (
          <DialogLayerPanel title="Users" onBack={goToHub}>
            <UsersPanel />
          </DialogLayerPanel>
        )}

        {layer === "delivery" && (
          <DialogLayerPanel title="Delivery" onBack={goToHub}>
            <DeliveryLayout />
          </DialogLayerPanel>
        )}

        {layer === "payment" && (
          <DialogLayerPanel title="Payment Method" onBack={goToHub}>
            <PaymentPanel />
          </DialogLayerPanel>
        )}
      </div>
    </LayoutPermission>
  );
}

export const settingDialog = createDialog(SettingDialogBody, {
  defaultValue: undefined,
  className: "max-w-6xl max-h-[90vh] p-0 overflow-hidden",
});
