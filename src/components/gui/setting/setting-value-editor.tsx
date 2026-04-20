import React from "react";
import { Setting } from "@/app/hooks/use-setting";
import { SettingEditorFactory } from "./setting-core";

interface SettingValueEditorProps {
  item: Setting;
  editingValue: string;
  setEditingValue: (v: string) => void;
  disabled?: boolean;
}

/**
 * Main setting value editor component
 * Now uses the factory pattern for better maintainability
 */
export const SettingValueEditor: React.FC<SettingValueEditorProps> = ({
  item,
  editingValue,
  setEditingValue,
  disabled = false,
}) => {
  return (
    <SettingEditorFactory
      item={item}
      value={editingValue}
      onChange={setEditingValue}
      disabled={disabled}
    />
  );
};
