/**
 * Offscreen keep-alive script.
 * Pings the service worker every 20s to prevent MV3 idle termination
 * while a popup approval window is open.
 */
const ping = () => {
  chrome.runtime.sendMessage({ action: "KEEP_ALIVE_PING" }).catch(() => {
    // Service worker may not be ready yet — ignore
  });
};
// Send first ping immediately so the SW doesn't idle before the interval fires
ping();
setInterval(ping, 20_000);
