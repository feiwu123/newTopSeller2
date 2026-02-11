import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupShopInfo() {
  const refreshBtn = document.getElementById("shop-info-refresh");
  const keywordsWrap = document.getElementById("shop-keywords");
  const keywordAddBtn = document.getElementById("shop-keyword-add");
  const saveBtn = document.getElementById("shop-keyword-save");
  const tip = document.getElementById("shop-info-tip");
  const rawPre = document.getElementById("shop-info-raw");

  const logoPreview = document.getElementById("shop-logo-preview");
  const logoFile = document.getElementById("shop-logo-file");
  const logoUploadBtn = document.getElementById("shop-logo-upload");
  const logoRawPre = document.getElementById("shop-logo-raw");
  const logoLoading = document.getElementById("shop-logo-loading");
  const keywordsLoading = document.getElementById("shop-keywords-loading");

  const imageViewer = document.getElementById("image-viewer");
  const imageViewerImg = document.getElementById("image-viewer-img");
  const imageViewerOpen = document.getElementById("image-viewer-open");
  const imageViewerClose = document.getElementById("image-viewer-close");
  const imageViewerBackdrop = document.getElementById("image-viewer-backdrop");

  if (!refreshBtn || !keywordsWrap || !saveBtn || !logoUploadBtn || !logoFile) return;

  let currentLogoUrl = "";
  let keywordItems = [""];
  let loading = false;

  const setLoading = (v) => {
    loading = Boolean(v);
    refreshBtn.disabled = loading;
    saveBtn.disabled = loading;
    if (keywordAddBtn) keywordAddBtn.disabled = loading;
    if (logoUploadBtn) logoUploadBtn.disabled = loading;
    if (logoFile) logoFile.disabled = loading;
    if (logoLoading) logoLoading.classList.toggle("hidden", !loading);
    if (keywordsLoading) keywordsLoading.classList.toggle("hidden", !loading);
  };

  const openImageViewer = (url) => {
    if (!imageViewer || !imageViewerImg || !url) return;
    imageViewerImg.src = url;
    if (imageViewerOpen) imageViewerOpen.href = url;
    imageViewer.classList.remove("hidden");
  };

  const closeImageViewer = () => {
    if (!imageViewer) return;
    imageViewer.classList.add("hidden");
    if (imageViewerImg) imageViewerImg.src = "";
    if (imageViewerOpen) imageViewerOpen.href = "#";
  };

  const setTip = (text, kind) => {
    if (!tip) return;
    const t = String(text || "");
    if (!t) {
      tip.textContent = "";
      tip.className = "text-[11px] text-slate-400";
      return;
    }
    const k = kind === "error" ? "error" : kind === "ok" ? "ok" : "info";
    tip.textContent = t;
    tip.className =
      k === "error" ? "text-[11px] text-rose-600" : k === "ok" ? "text-[11px] text-emerald-600" : "text-[11px] text-slate-500";
  };

  const renderLogo = (url) => {
    if (!logoPreview) return;
    const u = safeExternalUrl(url);
    logoPreview.dataset.fullUrl = u || "";
    if (!u) {
      logoPreview.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center gap-2">
          <div class="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <i class="fas fa-image"></i>
          </div>
          <div class="text-xs font-semibold text-slate-700">暂无 LOGO</div>
          <div class="text-[11px] text-slate-400">点击“上传”添加店铺 LOGO</div>
        </div>
      `;
      return;
    }
    logoPreview.innerHTML = `
      <button type="button" class="w-full flex items-center justify-center group relative">
        <img
          src="${escapeHtml(u)}"
          alt="shop_logo"
          class="max-h-48 w-auto object-contain"
          onerror="this.style.display='none';"
        />
        <div class="absolute opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2 py-1 rounded-xl bg-slate-900/70 text-white">
          点击查看原图
        </div>
      </button>
    `;
  };

  const parseKeywords = (raw) => {
    return String(raw ?? "")
      .split(";")
      .map((x) => String(x).trim())
      .filter(Boolean);
  };

  const normalizeItems = (items) => {
    const cleaned = (Array.isArray(items) ? items : []).map((x) => String(x ?? "").trim());
    const filtered = cleaned.filter((x) => x.length > 0);
    return filtered.length ? filtered : [""];
  };

  const renderKeywords = () => {
    keywordsWrap.innerHTML = "";
    const list = Array.isArray(keywordItems) ? keywordItems : [""];
    for (let i = 0; i < list.length; i++) {
      const row = document.createElement("div");
      row.className = "flex items-center gap-2";
      row.innerHTML = `
        <input
          data-kw-idx="${i}"
          class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          placeholder="输入关键字"
          value="${escapeHtml(list[i] ?? "")}"
        />
        <button
          type="button"
          data-kw-del="${i}"
          class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          title="删除"
        >
          <i class="fas fa-trash"></i>
        </button>
      `;
      keywordsWrap.appendChild(row);
    }
  };

  const syncKeywordsFromDom = () => {
    const inputs = Array.from(keywordsWrap.querySelectorAll("input[data-kw-idx]"));
    keywordItems = inputs.map((el) => String(el.value ?? ""));
  };

  const addKeywordRow = (value) => {
    syncKeywordsFromDom();
    keywordItems.push(String(value ?? ""));
    renderKeywords();
    const lastInput = keywordsWrap.querySelector(`input[data-kw-idx="${keywordItems.length - 1}"]`);
    lastInput?.focus?.();
  };

  const load = async () => {
    const original = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    setLoading(true);
    setTip("");
    try {
      const res = await postAuthedJson("/api/seller_shop_info/info", {});
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        renderRows([]);
        setSummary(res?.msg || "登录已失效（code=2）");
        return;
      }
      if (String(res?.code) !== "0") {
        setTip(res?.msg || "加载失败", "error");
        return;
      }
      const data = res?.data || {};
      keywordItems = normalizeItems(parseKeywords(data?.shop_keyword ?? ""));
      renderKeywords();
      currentLogoUrl = String(data?.shop_logo ?? "");
      renderLogo(currentLogoUrl);
      setTip("已加载", "ok");
    } catch {
      setTip("网络异常，请稍后重试。", "error");
    } finally {
      refreshBtn.innerHTML = original;
      setLoading(false);
    }
  };

  const saveKeyword = async () => {
    if (loading) return;
    syncKeywordsFromDom();
    const normalized = normalizeItems(keywordItems);
    const parts = normalized.map((x) => String(x ?? "").trim()).filter(Boolean);
    const v = parts.join(";");
    const original = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>保存中...';
    setTip("");
    try {
      const res = await postAuthedJson("/api/seller_shop_info/update", { data_key: "shop_keyword", data_value: v });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setTip(res?.msg || "保存失败", "error");
        return;
      }
      setTip("保存成功", "ok");
    } catch {
      setTip("网络异常，请稍后重试。", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = original;
    }
  };

  const isImageFile = (f) => {
    const t = String(f?.type ?? "").toLowerCase();
    if (t.startsWith("image/")) return true;
    const name = String(f?.name ?? "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : "";
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff", "heic", "heif"].includes(String(ext || ""));
  };

  const uploadLogo = async (file) => {
    if (loading) return;
    if (!file) return;
    if (!isImageFile(file)) {
      setTip("请上传图片文件（jpg/png/webp/gif 等）", "error");
      return;
    }
    const original = logoUploadBtn.innerHTML;
    logoUploadBtn.disabled = true;
    logoUploadBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>上传中...';
    setTip("");
    try {
      const form = new FormData();
      // docs: shop_logo [file]
      form.append("shop_logo", file);
      const res = await postAuthedFormData("/api/seller_shop_info/shop_logo", form);
      setPre(logoRawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setTip(res?.msg || "上传失败", "error");
        return;
      }
      const filePath = String(res?.data?.file_path ?? res?.data?.filePath ?? "");
      if (filePath) {
        currentLogoUrl = filePath;
        renderLogo(currentLogoUrl);
      }
      setTip("上传成功", "ok");
      // refresh shop info for any server-side updated fields
      void load();
    } catch {
      setTip("网络异常，请稍后重试。", "error");
    } finally {
      logoUploadBtn.disabled = false;
      logoUploadBtn.innerHTML = original;
      logoFile.value = "";
    }
  };

  refreshBtn.addEventListener("click", load);
  saveBtn.addEventListener("click", saveKeyword);
  logoUploadBtn.addEventListener("click", () => logoFile.click());
  keywordAddBtn?.addEventListener?.("click", () => addKeywordRow(""));
  logoFile.addEventListener("change", () => {
    const f = logoFile.files?.[0];
    if (!f) return;
    uploadLogo(f);
  });
  keywordsWrap.addEventListener("input", () => syncKeywordsFromDom());
  keywordsWrap.addEventListener("click", (e) => {
    const b = e.target?.closest?.("button[data-kw-del]");
    if (!b) return;
    const idx = Number(b.dataset.kwDel);
    if (!Number.isFinite(idx)) return;
    syncKeywordsFromDom();
    keywordItems.splice(idx, 1);
    keywordItems = normalizeItems(keywordItems);
    renderKeywords();
  });

  logoPreview?.addEventListener?.("click", () => {
    const u = String(logoPreview.dataset.fullUrl ?? "").trim();
    if (!u) return;
    openImageViewer(u);
  });
  imageViewerClose?.addEventListener?.("click", closeImageViewer);
  imageViewerBackdrop?.addEventListener?.("click", closeImageViewer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImageViewer();
  });

  // initial render
  renderLogo(currentLogoUrl);
  renderKeywords();
  load();
}
