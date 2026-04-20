export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect OS
  let os = "Unknown";
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Mac/i.test(userAgent)) os = "MacOS";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  // Detect browser
  let browser = "Unknown";
  if (/Chrome/i.test(userAgent)) browser = "Chrome";
  else if (/Safari/i.test(userAgent)) browser = "Safari";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Edge/i.test(userAgent)) browser = "Edge";

  // Basic screen info
  const screenSize = `${window.screen.width}x${window.screen.height}`;

  return {
    os,
    browser,
    platform,
    userAgent,
    screenSize,
  };
}
