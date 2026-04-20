import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Settings } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useAuthentication } from "../../../../contexts/authentication-context";
import { Setting, useUpdateSetting } from "@/app/hooks/use-setting";
import { inputSettingType } from "@/app/api/setting/setting-update";

import SkeletonTableList from "@/components/skeleton-table-list";
import { SettingCategorySidebar } from "./setting-category-sidebar";
import { SettingHeader } from "./setting-header";
import { SettingItem } from "./setting-item";
import { MobileSettingHeader } from "./mobile-setting-header";

import {
  SettingCategoryUtils,
  SettingCategory,
  SettingPermissionUtils,
} from "./setting-utils";
import { cn } from "@/lib/utils";
import {
  useCreateCategory,
  useDeleteCategory,
} from "@/app/hooks/use-query-category";

export function SettingList() {
  const { setting, currentWarehouse, user } = useAuthentication();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingValue, setEditingValue] = useState<string>("");
  const { trigger, isMutating } = useUpdateSetting();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevCategory = useRef(selectedCategory);

  // for cinema feature
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  // Generate categories using utility
  const categories = useMemo((): SettingCategory[] => {
    if (!setting?.data?.result) return [];
    return SettingCategoryUtils.generateCategories(
      setting.data.result as Setting[],
      user?.isDev || user?.warehouse?.isMain,
    );
  }, [setting?.data?.result, user]);

  // Filter settings for selected category
  const filteredSettings = useMemo(() => {
    if (!setting?.data?.result) return [];
    return SettingCategoryUtils.getSettingsForCategory(
      setting.data.result as Setting[],
      categories,
      selectedCategory,
    );
  }, [setting?.data?.result, selectedCategory, categories]);

  useEffect(() => {
    if (selectedCategory !== "" && prevCategory.current !== selectedCategory) {
      const first = filteredSettings[0];
      if (first) {
        setEditingValue(first.value || "");
      }
    }
    prevCategory.current = selectedCategory;
  }, [selectedCategory, filteredSettings]);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && selectedCategory === "") {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Update editingValue when the current setting's value changes (after save)
  useEffect(() => {
    const currentSetting = filteredSettings[0];
    if (currentSetting && selectedCategory !== "") {
      setEditingValue(currentSetting.value || "");
    }
  }, [filteredSettings, selectedCategory]);

  // Handle save setting
  const handleSaveSetting = useCallback(
    async (item: Setting) => {
      const input: inputSettingType = {
        id: item.id as number,
        option: item.option || "",
        value: editingValue,
      };

      try {
        await trigger(input);
        toast.success("Setting updated successfully");
        await setting?.mutate();
        if (item.option === "TYPE_POS") {
          const value = JSON.parse(editingValue);
          if (value.system_type === "CINEMA") {
            await createCategory.trigger({
              title: "movies",
              imageUrl: "",
              parentId: "",
              printerId: "",
            });
          } else {
            await deleteCategory.trigger({
              id: "movies-category-id", // replace with actual category id
            });
          }
        }
      } catch {
        toast.error("Failed to update setting");
      }
    },
    [editingValue, trigger, setting, createCategory, deleteCategory],
  );

  if (setting?.isLoading) {
    return <SkeletonTableList />;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-white text-gray-900">
        {/* Mobile Header */}
        <MobileSettingHeader
          categories={categories}
          selectedCategory={selectedCategory}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: hidden on mobile, visible on md+ */}
          <div
            className={
              sidebarOpen
                ? "fixed inset-0 z-40 flex md:hidden"
                : "hidden md:block"
            }
          >
            {/* Overlay for mobile */}
            <div
              className={
                sidebarOpen
                  ? "fixed inset-0 bg-black bg-opacity-30 z-30"
                  : "hidden"
              }
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar Container with Safe Area */}
            <div
              className={
                "relative z-40 md:static md:z-auto " +
                (sidebarOpen ? "block" : "hidden md:block") +
                " w-3/4 max-w-xs md:w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col"
              }
            >
              {/* Sidebar Content */}
              <div
                className={cn("flex-1 overflow-hidden", sidebarOpen && "mt-20")}
              >
                <SettingCategorySidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(id) => {
                    setSelectedCategory(id);
                    setSidebarOpen(false);
                  }}
                />
              </div>

              {/* Mobile Safe Area Bottom Padding */}
              <div className="md:hidden safe-area-bottom bg-gray-50" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header: hidden on mobile, visible on md+ */}
            <div className="hidden md:block">
              <SettingHeader
                label={
                  categories.find((c) => c.id === selectedCategory)?.label ||
                  "Settings"
                }
                description={
                  selectedCategory
                    ? SettingCategoryUtils.getCategoryDescription(
                        (setting?.data?.result as Setting[]) || [],
                        categories,
                        selectedCategory,
                      )
                    : "Configure your application settings"
                }
              />
            </div>

            {/* Settings Content */}
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="max-w-4xl space-y-6">
                {filteredSettings.length === 0 ? (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900">
                      No settings found
                    </h3>
                    <p className="text-sm text-gray-500">
                      {"No settings available in this category"}
                    </p>
                  </div>
                ) : (
                  filteredSettings.map((item) => {
                    const canEdit = SettingPermissionUtils.canEdit(
                      item,
                      currentWarehouse,
                    );

                    return (
                      <SettingItem
                        key={item.id ?? `setting-${Math.random()}`}
                        item={item}
                        editing={canEdit}
                        editingValue={editingValue}
                        onSave={() => handleSaveSetting(item)}
                        isMutating={
                          isMutating ||
                          createCategory.isMutating ||
                          deleteCategory.isMutating
                        }
                        setEditingValue={setEditingValue}
                        showEditButton={false}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
