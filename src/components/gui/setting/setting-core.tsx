import { Setting } from "@/app/hooks/use-setting";
import {
  Accessibility,
  Blocks,
  BookUser,
  Calendar,
  Clock,
  CreditCard,
  Crown,
  Currency,
  FileText,
  House,
  IdCard,
  Printer,
  QrCode,
  ReceiptText,
  Settings,
  Table,
  Tag,
  Warehouse,
} from "lucide-react";
import React, { ReactNode, useCallback } from "react";
import AccessibilityLayout from "./accessiblity";
import {
  NumericSettingInput,
  SettingFieldWrapper,
  TextSettingInput,
} from "./base-components";
import { CurrencyInput } from "./currency-input";
import { InvoiceInput } from "./invoice-input";
import { JsonArrayInput } from "./json-array-input";
import { JsonInput } from "./json-input";
import { PrintLabel } from "./print-label";
import { PrintServerInput } from "./print-server-input";
import { ProductMenuRuleInput } from "./product-menu-rule-input";
import { QrCodeInput } from "./qr-code-input";
import { TypePos } from "./type-pos";
import { PrintSocketInput } from "./print-socket-input";
import { AccountingSetting } from "./accounting";
import { BrandIntegrateSetting } from "./brand-integrate";
import { InventorySetting } from "./inventory";
import { BrandSetting } from "./brand";

// ==================== Setting Configuration Registry ====================

export interface SettingConfig {
  icon: ReactNode;
  label: string;
  description: string;
  type:
    | "text"
    | "number"
    | "json"
    | "json-array"
    | "qr-code"
    | "invoice"
    | "print-server"
    | "type-pos"
    | "label-print"
    | "accessibility"
    | "product-menu"
    | "currency"
    | "print-socket"
    | "accounting"
    | "brand_integration"
    | "inventory"
    | "brand";
  unit?: string;
  placeholder?: string;
}

/**
 * Centralized setting configuration registry
 * Makes it easy to add new settings and maintain consistency
 */
export const SETTING_CONFIGS: Record<string, SettingConfig> = {
  EXCHANGE_RATE: {
    icon: <CreditCard className="h-4 w-4" />,
    label: "Exchange Rate",
    description: "Current exchange rate from USD to KHR for price calculations",
    type: "number",
    unit: "KHR",
    placeholder: "Enter exchange rate",
  },
  QR_CODE: {
    icon: <QrCode className="h-4 w-4" />,
    label: "QR Code",
    description: "QR code image displayed on receipts and invoices",
    type: "qr-code",
  },
  TABLE_SELECTION: {
    icon: <Table className="h-4 w-4" />,
    label: "Table Selection",
    description: "Available table options for order assignments",
    type: "json-array",
  },
  TABLE_SHAPE: {
    icon: <Table className="h-4 w-4" />,
    label: "Table Shape",
    description: "Available table shapes for seating arrangements",
    type: "json-array",
  },
  INVOICE_RECEIPT: {
    icon: <FileText className="h-4 w-4" />,
    label: "Invoice Receipt",
    description: "Template configuration for invoice and receipt printing",
    type: "invoice",
  },
  EXPIRY_SETTING: {
    icon: <Clock className="h-4 w-4" />,
    label: "Expiry Setting",
    description:
      "Product expiry notification thresholds (urgent, critical, warning days)",
    type: "json",
  },
  EDITABLE_ORDER_DAY: {
    icon: <Calendar className="h-4 w-4" />,
    label: "Editable Order Day",
    description: "Number of days after which orders become non-editable",
    type: "number",
    unit: "days",
    placeholder: "Enter number of days",
  },
  PRINT_SERVER: {
    icon: <Printer className="h-4 w-4" />,
    label: "Print Server",
    description: "Configuration settings for the printer server",
    type: "print-server",
  },
  LABEL_PRINT: {
    icon: <ReceiptText className="h-4 w-4" />,
    label: "Label Print",
    description: "Settings for label printing format and options",
    type: "label-print",
  },
  TYPE_POS: {
    icon: <House className="h-4 w-4" />,
    label: "Type POS",
    description: "Type of Point of Sale system (e.g., MART, RESTAURANT)",
    type: "type-pos",
  },
  ACCESSIBILITY: {
    icon: <Accessibility className="h-4 w-4" />,
    label: "Accessibility",
    description: "Accessibility settings for the application",
    type: "accessibility",
  },
  PRODUCT_MENU: {
    icon: <Crown className="h-4 w-4" />,
    label: "Product Menu Rules",
    description: "Rules for displaying products in the menu",
    type: "product-menu",
  },
  CURRENCY: {
    icon: <Currency className="h-4 w-4" />,
    label: "Currency",
    description: "Default currency for the application",
    type: "currency",
  },
  PRINT_SOCKET: {
    icon: <Printer className="h-4 w-4" />,
    label: "Print Socket",
    description: "Socket settings for cinema reservation printing",
    type: "print-socket",
  },
  RTB: {
    icon: <IdCard className="h-4 w-4" />,
    label: "អ ត​ ប",
    description: "",
    type: "text",
  },
  ACCOUNTING: {
    icon: <BookUser className="h-4 w-4" />,
    label: "Accounting",
    description: "Accounting related settings",
    type: "accounting",
  },
  BRAND_INTEGRATION: {
    icon: <Blocks className="h-4 w-4" />,
    label: "Brand Integration",
    description: "Settings for integrating with external brand systems",
    type: "brand_integration",
  },
  INVENTORY: {
    icon: <Warehouse className="h-4 w-4" />,
    label: "Inventory",
    description: "Settings related to inventory management",
    type: "inventory",
  },
  BRAND: {
    icon: <Tag className="h-4 w-4" />,
    label: "Brand",
    description: "Brand information such as title, description, and icon",
    type: "brand",
  },
};

/**
 * Detect the type of a value based on its content
 */
const detectValueType = (value: string): SettingConfig["type"] => {
  if (!value || value.trim() === "") {
    return "text"; // Default for empty values
  }

  // Check if it's a number
  if (/^\d+\.?\d*$/.test(value.trim())) {
    return "number";
  }

  // Check if it's JSON array
  if (value.trim().startsWith("[") && value.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return "json-array";
      }
    } catch {
      // If parsing fails, treat as text
    }
  }

  // Check if it's JSON object
  if (value.trim().startsWith("{") && value.trim().endsWith("}")) {
    try {
      JSON.parse(value);
      return "json";
    } catch {
      // If parsing fails, treat as text
    }
  }
  // Default to text for everything else
  return "text";
};

/**
 * Get setting configuration with fallback that detects type from value
 */
export const getSettingConfig = (
  option: string,
  value?: string,
): SettingConfig => {
  // If we have a predefined config, use it
  if (SETTING_CONFIGS[option]) {
    return SETTING_CONFIGS[option];
  }

  // If no predefined config, detect type from value (only if value is provided)
  const detectedType = value ? detectValueType(value) : "text";

  return {
    icon: <Settings className="h-4 w-4" />,
    label: option
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "),
    description: "Application configuration setting",
    type: detectedType,
  };
};

// ==================== Setting Editor Factory ====================

interface SettingEditorFactoryProps {
  item: Setting;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Factory component that creates the appropriate editor based on setting type
 * This centralizes the logic and makes it easier to add new setting types
 */
export const SettingEditorFactory: React.FC<SettingEditorFactoryProps> = ({
  item,
  value,
  onChange,
  disabled = false,
}) => {
  const config = getSettingConfig(item.option || "", value);

  const renderEditor = useCallback(() => {
    const handleChange = (newValue: string) => {
      if (!disabled) {
        onChange(newValue);
      }
    };

    switch (config.type) {
      case "number":
        return (
          <NumericSettingInput
            value={value}
            onChange={handleChange}
            placeholder={config.placeholder}
            disabled={disabled}
            unit={config.unit}
          />
        );

      case "qr-code":
        return (
          <QrCodeInput
            qrCodePreview={value}
            setQrCodePreview={(newValue) => handleChange(newValue || "")}
            disabled={disabled}
          />
        );

      case "invoice":
        return (
          <InvoiceInput
            value={value}
            onChangeValue={(newValue) => handleChange(newValue || "")}
          />
        );

      case "json-array":
        return <JsonArrayInput value={value} onChange={handleChange} />;

      case "json":
        return <JsonInput value={value} onChange={handleChange} />;

      case "print-server":
        return <PrintServerInput value={value} onChange={handleChange} />;
      case "label-print":
        return <PrintLabel value={value} onChange={handleChange} />;
      case "type-pos":
        return <TypePos value={value} onChange={handleChange} />;
      case "accessibility":
        return <AccessibilityLayout />;
      case "product-menu":
        return (
          <ProductMenuRuleInput value={value} onChangeValue={handleChange} />
        );
      case "currency":
        return <CurrencyInput value={value} onChange={handleChange} />;
      case "print-socket":
        return <PrintSocketInput value={value} onChange={handleChange} />;
      case "accounting":
        return <AccountingSetting value={value} onChange={handleChange} />;
      case "brand_integration":
        return <BrandIntegrateSetting value={value} onChange={handleChange} />;
      case "inventory":
        return <InventorySetting value={value} onChange={handleChange} />;
      case "brand":
        return <BrandSetting value={value} onChange={handleChange} />;
      default:
        return (
          <TextSettingInput
            value={value}
            onChange={handleChange}
            placeholder={config.placeholder}
            disabled={disabled}
          />
        );
    }
  }, [config.type, value, onChange, disabled, config.placeholder, config.unit]);

  return (
    <SettingFieldWrapper description={config.description}>
      {renderEditor()}
    </SettingFieldWrapper>
  );
};
