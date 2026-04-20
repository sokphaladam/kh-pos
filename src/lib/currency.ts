/**
 * Currency formatting utility for the POS system
 * Supports multiple currencies with proper formatting and localization
 */

export interface CurrencyConfig {
  symbol: string;
  code: string;
  locale: string;
  position: "before" | "after";
  decimals: number;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    symbol: "$",
    code: "USD",
    locale: "en-US",
    position: "before",
    decimals: 2,
  },
  KHR: {
    symbol: "៛",
    code: "KHR",
    locale: "km-KH",
    position: "after",
    decimals: 0,
  },
  EUR: {
    symbol: "€",
    code: "EUR",
    locale: "en-EU",
    position: "after",
    decimals: 2,
  },
  GBP: {
    symbol: "£",
    code: "GBP",
    locale: "en-GB",
    position: "before",
    decimals: 2,
  },
};

/**
 * Formats a number as currency based on the currency configuration
 * @param amount - The amount to format
 * @param currencyCode - The currency code (USD, KHR, etc.)
 * @param options - Optional formatting options
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = "USD",
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0";

  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD;

  const formatOptions: Intl.NumberFormatOptions = {
    style: "decimal",
    minimumFractionDigits: minimumFractionDigits ?? config.decimals,
    maximumFractionDigits: maximumFractionDigits ?? config.decimals,
  };

  const formattedNumber = new Intl.NumberFormat(
    config.locale,
    formatOptions
  ).format(numAmount);

  let result = formattedNumber;

  if (showSymbol) {
    result =
      config.position === "before"
        ? `${config.symbol}${formattedNumber}`
        : `${formattedNumber}${config.symbol}`;
  }

  if (showCode) {
    result = `${result} ${config.code}`;
  }

  return result;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || "$";
}

/**
 * Get currency configuration for a given currency code
 */
export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD;
}

/**
 * Custom hook for currency formatting
 */
export function useCurrencyFormatter(currencyCode: string) {
  const config = getCurrencyConfig(currencyCode);

  return {
    format: (
      amount: number | string,
      options?: Parameters<typeof formatCurrency>[2]
    ) => formatCurrency(amount, currencyCode, options),
    symbol: config.symbol,
    code: config.code,
    config,
  };
}
