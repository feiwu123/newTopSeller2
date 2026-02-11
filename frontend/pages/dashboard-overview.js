import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, loadGoodsCounts, loadOverviewGoods, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupOverview() {
  const platformSel = document.getElementById("overview-platform");
  const refresh = document.getElementById("overview-refresh");
  if (!platformSel || !refresh) return;

  const doLoad = async () => {
    await loadGoodsCounts();
    await loadOverviewGoods(platformSel.value);
  };

  refresh.addEventListener("click", doLoad);
  platformSel.addEventListener("change", () => loadOverviewGoods(platformSel.value));
  doLoad();
}
