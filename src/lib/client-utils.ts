/**
 * Utility functions for client-side operations to prevent RSC payload errors
 */

/**
 * Safe check for browser environment
 */
export const isBrowser = () => typeof window !== "undefined";

/**
 * Safe navigation function to prevent RSC payload issues
 */
export const safeNavigate = (path: string) => {
  if (isBrowser()) {
    window.location.pathname = path;
  }
};

/**
 * Safe window reload to prevent RSC payload issues
 */
export const safeReload = () => {
  if (isBrowser()) {
    window.location.reload();
  }
};

/**
 * Serialize data safely for RSC
 */
export const safeSerialize = <T>(data: T): T => {
  if (!data) return data;

  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to serialize data:", error);
    return data;
  }
};
