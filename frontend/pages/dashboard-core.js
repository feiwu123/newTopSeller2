import { getAuth, clearAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js?v=2026-01-21-6";
import { setupTemu } from "./dashboard-temu.js?v=2026-01-21-6";
import { setupAlibabaTools } from "./dashboard-alibaba.js";
import { setupOverview } from "./dashboard-overview.js";
import { setupShopInfo } from "./dashboard-shop-info.js";
import { setupMerchantsLogistics } from "./dashboard-logistics.js";
import { setupOrdersList } from "./dashboard-orders.js";
import { setupTikTok } from "./dashboard-tiktok.js?v=2026-01-21-6";
import { setupShein } from "./dashboard-shein.js";
import { setupWholesalesGoods, setupWholesalesSender, setupWholesalesOrders, setupWholesalesRefunds } from "./dashboard-wholesales.js";
export function initDashboardPage() {
  const auth = getAuth();
  if (!auth?.token) {
    window.location.href = "./login.html";
    return;
  }

  const showCopyBubble = (x, y, ok, text) => {
    try {
      const el = document.createElement("div");
      el.style.position = "fixed";
      el.style.left = `${Math.max(8, Math.min(window.innerWidth - 8, Number(x) || 0))}px`;
      el.style.top = `${Math.max(8, Math.min(window.innerHeight - 8, Number(y) || 0))}px`;
      el.style.transform = "translate(-10%, -120%)";
      el.style.zIndex = "9999";
      el.className =
        "px-3 py-2 rounded-2xl shadow-soft border text-xs font-semibold backdrop-blur bg-white/95 " +
        (ok ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700");
      el.innerHTML = `${ok ? '<i class="fas fa-check mr-1"></i>已复制' : '<i class="fas fa-circle-xmark mr-1"></i>复制失败'}${
        text ? `：${escapeHtml(String(text).slice(0, 60))}` : ""
      }`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch {
      // ignore
    }
  };

  document.addEventListener("click", (e) => {
    // Prefer image viewer even if image is wrapped by a link.
    const imgBtn = e.target?.closest?.("[data-view-image]");
    if (imgBtn) {
      const url = imgBtn.dataset.viewImage;
      if (url) {
        ensureImageViewer().open(url);
        return;
      }
    }

    const copyBtn = e.target?.closest?.("[data-copy-text]");
    if (copyBtn) {
      const v = String(copyBtn.dataset.copyText || "").trim();
      if (!v) return;
      (async () => {
        const ok = await copyToClipboard(v);
        showCopyBubble(e.clientX, e.clientY, ok, v);
      })();
      return;
    }

    const t = e.target?.closest?.("[data-open-url]");
    if (t) {
      const url = t.dataset.openUrl;
      if (!url) return;
      openExternalUrl(url);
    }
  });

  const profileName = document.getElementById("profile-name");
  const profileId = document.getElementById("profile-id");
  if (profileName) profileName.textContent = auth.user || "-";
  if (profileId) profileId.textContent = `ID: ${auth.user || "-"}`;

  const isAlibaba = String(auth.user ?? "").trim().toLowerCase() === "alibaba";
  document.querySelectorAll("[data-alibaba-only='1']").forEach((el) => {
    el.hidden = !isAlibaba;
    el.classList.toggle("hidden", !isAlibaba);
  });

  const overviewUser = document.getElementById("overview-user");
  const overviewExpire = document.getElementById("overview-expire");
  if (overviewUser) overviewUser.textContent = auth.user || "-";
  if (overviewExpire) overviewExpire.textContent = auth.expire || "-";

  const logoutBtn = document.getElementById("dash-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      window.location.href = "./login.html";
    });
  }

  setupRoutes();
  setupAlibabaTools();
  setupOverview();
  setupOrdersList(auth.user);
  setupShein();
  setupTikTok();
  setupTemu();
  setupShopInfo();
  setupMerchantsLogistics();
  setupWholesalesGoods();
  setupWholesalesSender();
  setupWholesalesOrders();
  setupWholesalesRefunds();
}
