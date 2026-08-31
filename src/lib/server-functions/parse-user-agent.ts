/**
 * Lightweight server-side user-agent parser. Turns a raw UA string into a
 * human readable device name such as "Chrome on Windows" that we can store in
 * `user_activity_logs.device` to track which device a user acted from.
 */
export function parseUserAgent(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";

  const ua = userAgent;

  // OS / platform
  let os = "Unknown OS";
  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/cros/i.test(ua)) os = "ChromeOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser (order matters: Edge/Opera/Chrome all contain "Chrome")
  let browser = "Unknown browser";
  if (/edg[ea]?\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/firefox\/|fxios/i.test(ua)) browser = "Firefox";
  else if (/chrome\/|crios/i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua)) browser = "Safari";
  else if (/postman/i.test(ua)) browser = "Postman";
  else if (/curl\//i.test(ua)) browser = "curl";

  return `${browser} on ${os}`;
}

/**
 * Decodes the URI-encoded `X-Device-Label` header set by the client.
 * Returns null for empty / malformed values.
 */
export function decodeDeviceLabel(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded ? decoded.slice(0, 100) : null;
  } catch {
    return raw.trim().slice(0, 100) || null;
  }
}

/**
 * Resolves the value stored in `user_activity_logs.device`: the user-defined
 * device label when present, otherwise the parsed user-agent.
 */
export function resolveDeviceName(
  deviceLabel?: string | null,
  userAgent?: string | null,
): string {
  return deviceLabel || parseUserAgent(userAgent);
}

/**
 * Best-effort client IP extraction from proxy headers.
 */
export function getClientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headerList.get("x-real-ip") ||
    headerList.get("cf-connecting-ip") ||
    null
  );
}
