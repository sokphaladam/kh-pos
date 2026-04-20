import { useAuthentication } from "contexts/authentication-context";
import {
  formatCurrency as libFormatCurrency,
  getCurrencySymbol,
} from "@/lib/currency";
import { useMemo } from "react";
import { useQueryPublicSetting } from "@/app/hooks/use-setting";

/**
 * Custom hook for currency formatting that integrates with authentication context
 * Provides consistent currency formatting throughout the application
 * Falls back to public settings if user is null or unavailable
 */
export function useCurrencyFormat() {
  const setting = useQueryPublicSetting();
  const {
    currencyCode,
    formatCurrency: contextFormatCurrency,
    currencySymbol,
    user,
  } = useAuthentication();

  const currencyUtils = useMemo(() => {
    // Get currency code from user context first, then fallback to public settings
    let currentCurrencyCode = currencyCode;

    // If user is null or currency code not available from user context,
    // fallback to public settings
    if (!user || !currentCurrencyCode) {
      const settingsCurrencyCode = setting.data?.result?.find(
        (s) => s.option === "CURRENCY"
      )?.value;
      currentCurrencyCode = settingsCurrencyCode || "USD";
    }

    // Ensure we always have a fallback currency code
    if (!currentCurrencyCode) {
      currentCurrencyCode = "USD";
    }

    const currentCurrencySymbol =
      currencySymbol || getCurrencySymbol(currentCurrencyCode);

    return {
      currencyCode: currentCurrencyCode,
      currencySymbol: currentCurrencySymbol,

      /**
       * Format currency amount with current settings
       */
      format: (
        amount: number | string,
        options?: {
          showSymbol?: boolean;
          showCode?: boolean;
          minimumFractionDigits?: number;
          maximumFractionDigits?: number;
        }
      ) => {
        // Use context formatter if available, otherwise use library function
        if (contextFormatCurrency) {
          return contextFormatCurrency(amount, options);
        }
        return libFormatCurrency(amount, currentCurrencyCode, options);
      },

      /**
       * Format currency with symbol only (most common use case)
       */
      formatWithSymbol: (amount: number | string) => {
        if (contextFormatCurrency) {
          return contextFormatCurrency(amount, { showSymbol: true });
        }
        return libFormatCurrency(amount, currentCurrencyCode, {
          showSymbol: true,
        });
      },

      /**
       * Format currency for display purposes (no decimals for KHR)
       */
      formatForDisplay: (amount: number | string) => {
        const decimals = currentCurrencyCode === "KHR" ? 0 : 2;
        if (contextFormatCurrency) {
          return contextFormatCurrency(amount, {
            showSymbol: true,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
        return libFormatCurrency(amount, currentCurrencyCode, {
          showSymbol: true,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },

      /**
       * Format currency for charts and tooltips
       */
      formatForChart: (amount: number | string) => {
        if (contextFormatCurrency) {
          return contextFormatCurrency(amount, { showSymbol: true });
        }
        return `${currentCurrencySymbol}${Number(amount).toLocaleString()}`;
      },

      /**
       * Get just the symbol for inline usage
       */
      getSymbol: () => currentCurrencySymbol,

      /**
       * Check if current currency should use decimals
       */
      shouldUseDecimals: () => currentCurrencyCode !== "KHR",
    };
  }, [currencyCode, currencySymbol, contextFormatCurrency, user, setting.data]);

  return currencyUtils;
}
