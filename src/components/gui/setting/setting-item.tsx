import React from "react";
import { Button } from "@/components/ui/button";
import { SettingValueEditor } from "./setting-value-editor";
import { Setting } from "@/app/hooks/use-setting";

interface SettingItemProps {
  item: Setting;
  editing: boolean;
  editingValue: string;
  onSave: () => void;
  isMutating: boolean;
  setEditingValue: (v: string) => void;
  showEditButton?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  item,
  editing,
  editingValue,
  onSave,
  isMutating,
  setEditingValue,
}) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between group">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 p-1">
            <SettingValueEditor
              item={item}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              disabled={!editing}
            />
          </div>
        </div>
        {editing && (
          <div className="flex items-center gap-2 mt-2">
            <Button onClick={onSave} disabled={isMutating} className="h-7 px-3">
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
    <div className="border-b border-gray-200" />
  </div>
);
