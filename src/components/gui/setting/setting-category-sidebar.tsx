import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ChevronRight } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface SettingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  option: string | null;
}

interface SettingCategorySidebarProps {
  categories: SettingCategory[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  /**
   * When provided, the back control calls this instead of navigating to
   * /admin/dashboard (used when the settings list is embedded as a layer
   * inside the Settings dialog, so "back" should return to the dialog hub).
   */
  onBack?: () => void;
}

export const SettingCategorySidebar: React.FC<SettingCategorySidebarProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  onBack,
}) => (
  <div className="w-64 bg-gray-50 border-r border-gray-200">
    {onBack ? (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 mb-3"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    ) : (
      <Link href="/admin/dashboard" className="block mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    )}
    <ScrollArea className="flex-1 px-2">
      <div className="space-y-1">
        {categories
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-gray-100 transition-colors text-sm",
                selectedCategory === category.id
                  ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                  : "text-gray-600"
              )}
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  selectedCategory === category.id ? "rotate-90" : ""
                )}
              />
              {category.icon}
              {category.label}
            </button>
          ))}
      </div>
    </ScrollArea>
  </div>
);
