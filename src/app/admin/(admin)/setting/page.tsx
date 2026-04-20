"use client";
import { LayoutPermission } from "@/components/gui/layout-permission";
import { SettingList } from "@/components/gui/setting/setting-list";
import { TopToolbar } from "@/components/top-toolbar";

export default function SettingPage() {
  return (
    <LayoutPermission permission={["ROOT"]}>
      <div className="w-full">
        <TopToolbar data={null} text="Setting" />
        <SettingList />
      </div>
    </LayoutPermission>
  );
}
