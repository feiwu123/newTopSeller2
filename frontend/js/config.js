// Default backend: prefer same-origin and auto-detect public base path (e.g. /sellernew).
// Override in browser console: window.API_BASE = "http://..."; then refresh.
function hasUsableOrigin() {
  return (
    typeof window !== "undefined" &&
    window.location &&
    window.location.origin &&
    window.location.origin !== "null"
  );
}

function detectPublicBasePath() {
  if (!hasUsableOrigin()) return "";

  const pathname = String(window.location.pathname || "");
  if (!pathname || pathname === "/") return "";

  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const lastSlash = trimmed.lastIndexOf("/");
  const lastSeg = trimmed.slice(lastSlash + 1);
  const looksLikeFile = /\.[A-Za-z0-9]+$/.test(lastSeg);
  const dir = looksLikeFile ? trimmed.slice(0, Math.max(lastSlash, 0)) : trimmed;

  if (!dir || dir === "/") return "";
  return dir.startsWith("/") ? dir : `/${dir}`;
}

const fallbackOrigin = hasUsableOrigin() ? window.location.origin : "http://127.0.0.1:5051";
const fallbackApiBase = `${fallbackOrigin}${detectPublicBasePath()}`;

export const API_BASE =
  typeof window !== "undefined" && window.API_BASE != null ? window.API_BASE : fallbackApiBase;
