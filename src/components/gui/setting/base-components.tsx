import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ==================== Setting Field Wrapper ====================

interface SettingFieldWrapperProps {
  children: React.ReactNode;
  description?: string;
  className?: string;
}

/**
 * Reusable wrapper component for setting fields
 * Provides consistent spacing and description layout
 */
export const SettingFieldWrapper: React.FC<SettingFieldWrapperProps> = ({
  children,
  description,
  className = "",
}) => (
  <div className={`space-y-3 ${className}`}>
    {children}
    {description && <p className="text-xs text-gray-500">{description}</p>}
  </div>
);

// ==================== Numeric Setting Input ====================

interface NumericSettingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  unit?: string;
  className?: string;
}

/**
 * Reusable numeric input component for settings
 * Handles numeric input with optional units display
 */
export const NumericSettingInput: React.FC<NumericSettingInputProps> = ({
  value,
  onChange,
  placeholder = "Enter number",
  disabled = false,
  unit,
  className = "",
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => !disabled && onChange(e.target.value)}
      type="number"
      className="font-mono text-sm"
      disabled={disabled}
    />
    {unit && (
      <Badge variant="outline" className="text-xs">
        {unit}
      </Badge>
    )}
  </div>
);

// ==================== Text Setting Input ====================

interface TextSettingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "text" | "password" | "email" | "url";
}

/**
 * Reusable text input component for settings
 * Handles text input with consistent styling
 */
export const TextSettingInput: React.FC<TextSettingInputProps> = ({
  value,
  onChange,
  placeholder = "Enter value",
  disabled = false,
  className = "",
  type = "text",
}) => (
  <Input
    placeholder={placeholder}
    value={value}
    onChange={(e) => !disabled && onChange(e.target.value)}
    className={`font-mono text-sm ${className}`}
    disabled={disabled}
    type={type}
  />
);
