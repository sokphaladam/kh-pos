import React from "react";
import { Menu } from "lucide-react";
import { SettingCategory } from "./setting-utils";

interface MobileSettingHeaderProps {
  categories: SettingCategory[];
  selectedCategory: string;
  onToggleSidebar: () => void;
}

export const MobileSettingHeader: React.FC<MobileSettingHeaderProps> = ({
  categories,
  selectedCategory,
  onToggleSidebar,
}) => {
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="md:hidden bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        <button
          className="flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          onClick={onToggleSidebar}
          aria-label="Open categories"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center px-4">
          <div className="flex items-center justify-center gap-2">
            {currentCategory?.icon}
            <span className="font-semibold text-lg text-gray-900 truncate">
              {currentCategory?.label || "Settings"}
            </span>
          </div>
        </div>

        {/* Placeholder for balance */}
        <div className="w-10" />
      </div>
    </div>
  );
};
