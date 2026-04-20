import { Setting } from "@/app/hooks/use-setting";
import { getSettingConfig } from "./setting-core";

// ==================== Setting Category Utils ====================

export interface SettingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  option: string | null;
}

/**
 * Utility functions for setting categories
 */
export class SettingCategoryUtils {
  /**
   * Generate categories from settings data
   */
  static generateCategories(
    settings: Setting[],
    isDevOrMain?: boolean,
  ): SettingCategory[] {
    const restaurant = ["PRINT_SERVER", "TABLE_SHAPE", "TABLE_SELECTION"];
    const cinema = ["PRINT_SOCKET"];
    const devOrMain = ["CURRENCY", "EXCHANGE_RATE"];
    const type_post =
      JSON.parse(settings.find((f) => f.option === "TYPE_POS")?.value || "{}")
        .system_type || "";

    let items = settings;

    if (type_post !== "RESTAURANT") {
      items = settings.filter((f) => !restaurant.includes(f.option || ""));
    }

    if (type_post !== "CINEMA") {
      items = items.filter((f) => !cinema.includes(f.option || ""));
    }

    const uniqueOptions = Array.from(
      new Set(items.map((item) => item.option).filter(Boolean)),
    );

    const uniqueOptionsAfterfilterDevOrMain = !isDevOrMain
      ? uniqueOptions.filter((f) => !devOrMain.includes(f || ""))
      : uniqueOptions;

    return uniqueOptionsAfterfilterDevOrMain.map((option) => {
      const config = getSettingConfig(option!);
      return {
        id: option!.toLowerCase().replace(/_/g, "-"),
        label: config.label,
        icon: config.icon,
        option: option,
      };
    });
  }

  /**
   * Get settings for a specific category
   */
  static getSettingsForCategory(
    settings: Setting[],
    categories: SettingCategory[],
    categoryId: string,
  ): Setting[] {
    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    if (!selectedCategory?.option) return [];

    return settings.filter(
      (setting) => setting.option === selectedCategory.option,
    );
  }

  /**
   * Format setting name for display
   */
  static formatSettingName(option: string): string {
    const config = getSettingConfig(option);
    return `${config.label}: `;
  }

  /**
   * Get setting description
   */
  static getSettingDescription(option: string, value?: string): string {
    const config = getSettingConfig(option, value);
    return config.description;
  }

  /**
   * Get category description based on the first setting in that category
   */
  static getCategoryDescription(
    settings: Setting[],
    categories: SettingCategory[],
    categoryId: string,
  ): string {
    const categorySettings = this.getSettingsForCategory(
      settings,
      categories,
      categoryId,
    );

    if (categorySettings.length === 0) return "";

    // Get description from the first setting in the category
    const firstSetting = categorySettings[0];
    return this.getSettingDescription(firstSetting.option || "");
  }
}

// ==================== Setting Permission Utils ====================

interface Warehouse {
  isMain?: boolean;
}

/**
 * Utility class for handling setting permissions
 */
export class SettingPermissionUtils {
  /**
   * Check if editing is allowed for a setting
   * Returns true if the setting can be edited by the current user
   */
  static canEdit(
    setting: Setting,
    currentWarehouse?: Warehouse | null,
  ): boolean {
    // Allow editing if it's not a warehouse-specific setting
    if (!!setting.warehouse) return true;

    // Allow editing warehouse settings only for main warehouse
    return currentWarehouse?.isMain ?? false;
  }

  /**
   * Check if saving is allowed for a setting
   * For now, this is the same as canEdit, but could be different in the future
   */
  static canSave(
    setting: Setting,
    currentWarehouse?: Warehouse | null,
  ): boolean {
    return this.canEdit(setting, currentWarehouse);
  }
}
