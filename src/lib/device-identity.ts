"use client";

import { v4 } from "uuid";

/**
 * Per-browser device identity used to track which physical device a user
 * acted from in `user_activity_logs`.
 *
 * - `deviceId`  : a stable random id generated once and kept in localStorage.
 * - `deviceLabel`: an optional human friendly name the user sets
 *                  (e.g. "Front counter PC", "Kitchen tablet").
 *
 * Both are sent to the API as request headers (`X-Device-Id`,
 * `X-Device-Label`). The server never trusts these for auth - they are
 * audit metadata only.
 */

const DEVICE_ID_KEY = "kh_pos_device_id";
const DEVICE_LABEL_KEY = "kh_pos_device_label";

function safeGet(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / disabled) - ignore */
  }
}

/** Returns the stable device id, creating and persisting one on first call. */
export function getDeviceId(): string {
  let id = safeGet(DEVICE_ID_KEY);
  if (!id) {
    id = v4();
    safeSet(DEVICE_ID_KEY, id);
  }
  return id;
}

/** The user-defined device label, or "" if not set. */
export function getDeviceLabel(): string {
  return safeGet(DEVICE_LABEL_KEY);
}

export function setDeviceLabel(label: string): void {
  safeSet(DEVICE_LABEL_KEY, label.trim().slice(0, 100));
}

/**
 * Headers to attach to every authenticated API request.
 * The label is URI-encoded so non-ASCII (e.g. Khmer) names stay header-safe.
 */
export function getDeviceHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const headers: Record<string, string> = {};
  const id = getDeviceId();
  const label = getDeviceLabel();

  if (id) headers["X-Device-Id"] = id;
  if (label) headers["X-Device-Label"] = encodeURIComponent(label);

  return headers;
}
