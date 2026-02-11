import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let _activeConfirmPopover = null;

function showConfirmPopover(anchorEl, { title, message, confirmText, cancelText, tone } = {}) {
  const t = String(title || "确认操作");
  const m = String(message || "");
  const okText = String(confirmText || "确认");
  const cancel = String(cancelText || "取消");
  const kind = tone === "danger" ? "danger" : tone === "primary" ? "primary" : "neutral";

  if (!anchorEl?.getBoundingClientRect) return Promise.resolve(false);
  if (_activeConfirmPopover?.close) _activeConfirmPopover.close();

  return new Promise((resolve) => {
    const pop = document.createElement("div");
    pop.className = "fixed z-50 w-[320px] max-w-[calc(100vw-24px)]";

    const btnClass =
      kind === "danger"
        ? "bg-rose-600 hover:bg-rose-700 text-white"
        : kind === "primary"
          ? "bg-accent hover:bg-accent/90 text-white"
          : "bg-slate-900 hover:bg-slate-800 text-white";

    pop.innerHTML = `
      <div class="relative rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div data-arrow="1" class="absolute w-3 h-3 bg-white border border-slate-200 rotate-45"></div>
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div class="text-sm font-black text-slate-900 flex items-center gap-2">
            <i class="fas ${kind === "danger" ? "fa-triangle-exclamation text-rose-600" : "fa-circle-question text-slate-500"}"></i>
            <span class="truncate">${escapeHtml(t)}</span>
          </div>
          <button type="button" data-act="close" class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="p-4">
          <div class="text-sm text-slate-700 whitespace-pre-wrap">${escapeHtml(m)}</div>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button type="button" data-act="cancel" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
              ${escapeHtml(cancel)}
            </button>
            <button type="button" data-act="ok" class="px-4 py-2 rounded-xl text-xs font-semibold ${btnClass}">
              ${escapeHtml(okText)}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(pop);

    const arrow = pop.querySelector("[data-arrow='1']");

    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth || 0;
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;

      const popRect = pop.getBoundingClientRect();
      const gap = 10;

      // Prefer below-right aligned to anchor.
      const preferBelow = rect.bottom + gap + popRect.height <= vh;
      const top = preferBelow ? rect.bottom + gap : Math.max(8, rect.top - gap - popRect.height);
      let left = rect.left;
      left = Math.min(Math.max(8, left), Math.max(8, vw - popRect.width - 8));

      pop.style.top = `${Math.round(top)}px`;
      pop.style.left = `${Math.round(left)}px`;

      if (arrow) {
        const arrowSize = 12;
        const centerX = Math.min(Math.max(rect.left + rect.width / 2 - left, 16), popRect.width - 16);
        arrow.style.left = `${Math.round(centerX - arrowSize / 2)}px`;
        if (preferBelow) {
          arrow.style.top = "-6px";
          arrow.style.bottom = "";
          arrow.style.borderLeftColor = "transparent";
          arrow.style.borderTopColor = "transparent";
        } else {
          arrow.style.bottom = "-6px";
          arrow.style.top = "";
          arrow.style.borderRightColor = "transparent";
          arrow.style.borderBottomColor = "transparent";
        }
      }
    };

    const cleanup = () => {
      try {
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("mousedown", onMouseDown, true);
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
      } catch {
        // ignore
      }
      pop.remove();
      if (_activeConfirmPopover?.el === pop) _activeConfirmPopover = null;
    };

    const close = (result) => {
      cleanup();
      resolve(Boolean(result));
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") close(false);
    };

    const onMouseDown = (e) => {
      if (!e.target) return;
      if (pop.contains(e.target) || anchorEl.contains(e.target)) return;
      close(false);
    };

    _activeConfirmPopover = { el: pop, close: () => close(false) };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    pop.querySelector("[data-act='close']")?.addEventListener("click", () => close(false));
    pop.querySelector("[data-act='cancel']")?.addEventListener("click", () => close(false));
    pop.querySelector("[data-act='ok']")?.addEventListener("click", () => close(true));

    place();
  });
}

function showOnlyView(viewId) {
  const ids = [
    "view-overview",
    "view-orders",
    "view-alibaba",
    "view-upload-shein",
    "view-upload-tiktok",
    "view-upload-temu",
    "view-shop-info",
    "view-logistics",
    "view-wholesales-sender",
    "view-wholesales-goods",
    "view-wholesales-orders",
    "view-wholesales-refunds",
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const show = id === viewId;
    // Use the HTML `hidden` attribute so Tailwind `space-y-*` doesn't leave gaps.
    el.hidden = !show;
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }
}

function setActiveNav(route) {
  document.querySelectorAll("[data-route]").forEach((el) => {
    if (el.dataset.route === route) el.classList.add("active");
    else el.classList.remove("active");
  });
}

function isAlibabaUser() {
  const auth = getAuth();
  return String(auth?.user ?? "").trim().toLowerCase() === "alibaba";
}

function routeFromHash() {
  const raw = (window.location.hash || "#overview").replace("#", "");
  const h = raw.split("?")[0];
  if (h === "alibaba") return "alibaba";
  if (h === "upload-shein") return "upload-shein";
  if (h === "upload-tiktok") return "upload-tiktok";
  if (h === "upload-temu") return "upload-temu";
  if (h === "orders") return "orders";
  if (h === "shop-info") return "shop-info";
  if (h === "logistics") return "logistics";
  if (h === "wholesales-sender") return "wholesales-sender";
  if (h === "wholesales-goods") return "wholesales-goods";
  if (h === "wholesales-orders") return "wholesales-orders";
  if (h === "wholesales-refunds") return "wholesales-refunds";
  return "overview";
}

function ensureJsonString(text) {
  const v = String(text ?? "").trim();
  if (!v) return "";
  if (v.startsWith("{") || v.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(v));
    } catch {
      return v;
    }
  }
  return v;
}

function parseJsonObject(text) {
  const v = String(text ?? "").trim();
  if (!v) return {};
  const obj = JSON.parse(v);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("extra json must be object");
  return obj;
}

function safeExternalUrl(value) {
  const u = String(value ?? "").trim();
  if (!u) return "";
  const lower = u.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return "";
  return u;
}

function openExternalUrl(url) {
  const u = safeExternalUrl(url);
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

let _imageViewerSetupDone = false;

function normalizeImgUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  return safeExternalUrl(raw);
}

function resolveTopmAssetUrl(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  // Many list APIs return relative paths for thumbs; those assets live on topm.tech.
  if (v.startsWith("/")) return `https://topm.tech${v}`;
  return `https://topm.tech/${v.replace(/^\.?\//, "")}`;
}

function ensureImageViewer() {
  const viewer = document.getElementById("image-viewer");
  const img = document.getElementById("image-viewer-img");
  const openBtn = document.getElementById("image-viewer-open");
  const closeBtn = document.getElementById("image-viewer-close");
  const backdrop = document.getElementById("image-viewer-backdrop");
  if (!viewer || !img || !openBtn || !closeBtn || !backdrop) {
    return {
      open: (url) => openExternalUrl(url),
      close: () => {},
    };
  }

  const close = () => {
    viewer.classList.add("hidden");
    viewer.classList.remove("flex");
    img.src = "";
    openBtn.dataset.openUrl = "";
    viewer.style.zIndex = "";
  };

  const open = (url) => {
    const u = normalizeImgUrl(url);
    if (!u) return;
    const skuModal = document.getElementById("temu-sku-modal");
    if (skuModal && !skuModal.classList.contains("hidden")) {
      viewer.style.zIndex = "90";
    } else {
      viewer.style.zIndex = "";
    }
    img.src = u;
    openBtn.dataset.openUrl = u;
    viewer.classList.remove("hidden");
    viewer.classList.add("flex");
  };

  if (!_imageViewerSetupDone) {
    _imageViewerSetupDone = true;
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!viewer.classList.contains("hidden")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    });
  }

  return { open, close };
}

function extractFirstUrl(text) {
  const v = String(text ?? "");
  const m = v.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0] : "";
}

function setTableLoading(tbodyId, colSpan, opts) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const showSpinner = opts?.showSpinner !== false;
  const icon = showSpinner ? '<i class="fas fa-circle-notch fa-spin mr-2"></i>' : "";
  tbody.innerHTML = `
    <tr class="table-row-hover transition">
      <td class="px-6 py-6 text-center text-xs text-slate-400" colspan="${Number(colSpan) || 1}">
        ${icon}加载中...
      </td>
    </tr>
  `;
}

function renderGoodsTable(list) {
  const tbody = document.getElementById("goods-tbody");
  if (!tbody) return;
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML =
      '<tr class="table-row-hover transition"><td class="px-6 py-6 text-center text-xs text-slate-400" colspan="5">暂无数据</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map((g, idx) => {
      const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
      const id = g.goods_id ?? "-";
      const name = g.goods_name ?? "-";
      const sn = g.goods_sn ?? "-";
      const thumb = g.goods_thumb ?? "";
      const url = safeExternalUrl(g.url);
      const time = g.formated_add_time ?? g.add_time ?? "-";
      const onSale = String(g.is_on_sale ?? "");
      const review = String(g.review_status ?? "");
      const status = onSale === "1" ? "在售" : "未上架";
      const reviewText = review ? ` / 审核:${review}` : "";
      const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";
      const nameHtml = url
        ? `<button type="button" ${openAttr} class="text-left text-xs font-medium text-slate-800 hover:text-accent whitespace-normal break-words">${escapeHtml(
            name,
          )}</button>`
        : `<div class="text-xs font-medium text-slate-800 whitespace-normal break-words">${escapeHtml(name)}</div>`;
      const thumbHtml = url
        ? `<button type="button" ${openAttr} class="block">
             <div class="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
                thumb,
              )}');"></div>
           </button>`
        : `<div class="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
            thumb,
          )}');"></div>`;

      const actionsHtml = url
        ? `<button type="button" ${openAttr} class="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-semibold text-xs">
             <i class="fas fa-arrow-up-right-from-square text-[11px]"></i>打开
           </button>`
        : `<span class="text-xs text-slate-400">-</span>`;

      return `
        <tr class="table-row-hover ${border} transition">
          <td class="px-6 py-4 font-medium text-slate-900">${escapeHtml(id)}</td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              ${thumbHtml}
              <div>
                ${nameHtml}
                <div class="text-[10px] text-slate-400">${escapeHtml(sn)}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              ${escapeHtml(status + reviewText)}
            </span>
          </td>
          <td class="px-6 py-4 text-xs text-slate-500">${escapeHtml(time)}</td>
          <td class="px-6 py-4 text-right">${actionsHtml}</td>
        </tr>
      `;
    })
    .join("");
}

function renderGoodsTableInto(tbodyId, list) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML =
      '<tr class="table-row-hover transition"><td class="px-6 py-6 text-center text-xs text-slate-400" colspan="5">暂无数据</td></tr>';
    return;
  }
  tbody.innerHTML = list
    .map((g, idx) => {
      const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
      const id = g.goods_id ?? "-";
      const name = g.goods_name ?? "-";
      const sn = g.goods_sn ?? "-";
      const thumb = g.goods_thumb ?? "";
      const url = safeExternalUrl(g.url);
      const time = g.formated_add_time ?? g.add_time ?? "-";
      const onSale = String(g.is_on_sale ?? "");
      const review = String(g.review_status ?? "");
      const status = onSale === "1" ? "在售" : "未上架";
      const reviewText = review ? ` / 审核:${review}` : "";
      const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";
      const nameHtml = url
        ? `<button type="button" ${openAttr} class="text-left text-xs font-medium text-slate-800 hover:text-accent line-clamp-1 max-w-[260px]">${escapeHtml(
            name,
          )}</button>`
        : `<div class="text-xs font-medium text-slate-800 line-clamp-1 max-w-[260px]">${escapeHtml(name)}</div>`;
      const thumbHtml = url
        ? `<button type="button" ${openAttr} class="block">
             <div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
               thumb,
             )}');"></div>
           </button>`
        : `<div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
            thumb,
          )}');"></div>`;

      const actionsHtml = url
        ? `<button type="button" ${openAttr} class="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-semibold text-xs">
             <i class="fas fa-arrow-up-right-from-square text-[11px]"></i>打开
           </button>`
        : `<span class="text-xs text-slate-400">-</span>`;

      return `
        <tr class="table-row-hover ${border} transition">
          <td class="px-6 py-4 font-medium text-slate-900">${escapeHtml(id)}</td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              ${thumbHtml}
              <div>
                ${nameHtml}
                <div class="text-[10px] text-slate-400">${escapeHtml(sn)}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              ${escapeHtml(status + reviewText)}
            </span>
          </td>
          <td class="px-6 py-4 text-xs text-slate-500">${escapeHtml(time)}</td>
          <td class="px-6 py-4 text-right">${actionsHtml}</td>
        </tr>
      `;
    })
    .join("");
}

function mapReviewStatusText(code) {
  const v = String(code ?? "").trim();
  switch (v) {
    case "1":
      return "未审核";
    case "2":
      return "审核未通过";
    case "3":
      return "审核通过";
    case "5":
      return "未审核";
    default:
      return v || "-";
  }
}

function mapReviewBadge(code) {
  const v = String(code ?? "").trim();
  switch (v) {
    case "1":
      return { name: "未审核", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "2":
      return { name: "审核未通过", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "3":
      return { name: "审核通过", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "5":
      return { name: "未审核", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { name: mapReviewStatusText(v), cls: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}

function renderTemuGoodsTableInto(tbodyId, list) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML =
      '<tr class="table-row-hover transition"><td class="px-6 py-6 text-center text-xs text-slate-400" colspan="8">暂无数据</td></tr>';
    return;
  }

  const fmtNum = (v, digits) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  tbody.innerHTML = list
    .map((g, idx) => {
      const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
      const id = g.goods_id ?? "-";
      const name = g.goods_name ?? "-";
      const sn = g.goods_sn ?? "-";
      const thumb = g.goods_thumb ?? "";
      const url = safeExternalUrl(g.url);
      const time = g.formated_add_time ?? g.add_time ?? "-";
      const onSale = String(g.is_on_sale ?? "");
      const review = String(g.review_status ?? "");

      const priceRaw =
        g.formated_shop_price ??
        g.shop_price ??
        g.formated_price ??
        g.price ??
        g.goods_price ??
        g.sale_price ??
        g.sku_price ??
        "-";
      const priceText = (() => {
        const s = String(priceRaw ?? "").trim();
        if (!s) return "-";
        const n = Number(s.replaceAll(",", ""));
        if (Number.isFinite(n)) return fmtNum(n, 2);
        return s;
      })();

      const saleBadge =
        onSale === "1"
          ? statusBadge("在售", "bg-emerald-50 text-emerald-700 border-emerald-200")
          : statusBadge("非在售", "bg-rose-50 text-rose-700 border-rose-200");
      const reviewBadge = (() => {
        const r = mapReviewBadge(review);
        return statusBadge(r.name, r.cls);
      })();

      const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";
      const nameHtml = url
        ? `<button type="button" ${openAttr} class="text-left text-xs font-medium text-slate-800 hover:text-accent line-clamp-1 max-w-[260px]">${escapeHtml(
            name,
          )}</button>`
        : `<div class="text-xs font-medium text-slate-800 line-clamp-1 max-w-[260px]">${escapeHtml(name)}</div>`;
      const thumbHtml = url
        ? `<button type="button" ${openAttr} class="block">
             <div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
               thumb,
             )}');"></div>
           </button>`
        : `<div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
            thumb,
          )}');"></div>`;

      const actions = `         <div class="flex items-center justify-end gap-2">           <button type="button"             class="temu-edit inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700"             data-temu-edit-id="${escapeHtml(id)}"           >             <i class="fas fa-pen-to-square text-slate-500"></i>             <span>编辑</span>           </button>           <button type="button"             class="temu-toggle-sale inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700"             data-goods-id="${escapeHtml(id)}"             data-current-val="${escapeHtml(onSale)}"             data-next-val="${escapeHtml(onSale === "1" ? "0" : "1")}"           >             <i class="fas ${onSale === "1" ? "fa-toggle-on text-emerald-600" : "fa-toggle-off text-slate-400"} text-lg"></i>             <span>${onSale === "1" ? "点击下架" : "点击上架"}</span>           </button>         </div>`;

      return `
        <tr class="table-row-hover ${border} transition" data-goods-id="${escapeHtml(id)}">
          <td class="px-6 py-4 font-medium text-slate-900">${escapeHtml(id)}</td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              ${thumbHtml}
              <div class="min-w-0">
                ${nameHtml}
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="inline-flex items-center text-xs font-semibold text-slate-800">
              <span>${escapeHtml(String(sn || "-"))}</span>
              ${sn ? renderCopyBtn(sn, "复制 SKU") : ""}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap"><div data-sale-badge="1">${saleBadge}</div></td>
          <td class="px-6 py-4 whitespace-nowrap">${reviewBadge}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <span class="font-semibold text-slate-900">${escapeHtml(priceText || "-")}</span>
          </td>
          <td class="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">${escapeHtml(time)}</td>
          <td class="px-6 py-4 text-right">${actions}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadGoodsCounts() {
  const sheinEl = document.getElementById("metric-goods-shein");
  const tiktokEl = document.getElementById("metric-goods-tiktok");
  const temuEl = document.getElementById("metric-goods-temu");

  const loadingHtml = '<i class="fas fa-circle-notch fa-spin"></i>';
  if (sheinEl) sheinEl.innerHTML = loadingHtml;
  if (tiktokEl) tiktokEl.innerHTML = loadingHtml;
  if (temuEl) temuEl.innerHTML = loadingHtml;

  const [shein, tiktok, temu] = await Promise.all([
    postAuthedJson("/api/goods/lists", { page: 1, size: 1, is_tiktok: 0 }),
    postAuthedJson("/api/goods/lists", { page: 1, size: 1, is_tiktok: 1 }),
    postAuthedJson("/api/goods/lists", { page: 1, size: 1, is_tiktok: 2 }),
  ]);

  const getNum = (r) => String(r?.data?.num ?? "-");
  if (sheinEl) sheinEl.textContent = getNum(shein);
  if (tiktokEl) tiktokEl.textContent = getNum(tiktok);
  if (temuEl) temuEl.textContent = getNum(temu);
}

async function loadOverviewGoods(platform) {
  const summary = document.getElementById("goods-summary");
  setTableLoading("goods-tbody", 5);
  if (summary) summary.textContent = "加载中...";
  const res = await postAuthedJson("/api/goods/lists", { page: 1, size: 10, is_tiktok: Number(platform) });
  if (String(res?.code) === "2") {
    clearAuth();
    window.location.href = "./login.html";
    return;
  }

  if (String(res?.code) !== "0") {
    renderGoodsTable([]);
    if (summary) summary.textContent = "加载失败";
    return;
  }

  const list = Array.isArray(res?.data?.list) ? res.data.list : [];
  const total = String(res?.data?.num ?? list.length);
  renderGoodsTable(list);
  if (summary) summary.textContent = `显示 1-${list.length} 共${total} 条记录`;
}

async function buildCategorySelector(rootId, platform, outId, opts = {}) {
  const root = document.getElementById(rootId);
  const out = document.getElementById(outId);
  if (!root || !out) return;

  root.innerHTML = "";
  out.textContent = "-";
  const outText = document.getElementById(`${outId}-text`);
  if (outText) outText.textContent = "-";
  const levels = [];
  let pendingSeq = 0;
  const selectedPath = [];
  const selectedIds = [];
  const storageKey = `topm:cat-selection:${platform}`;
  const restoreEnabled = opts?.restore !== false;
  const persistEnabled = opts?.persist !== false;
  const initialState = opts?.initialState && typeof opts.initialState === "object" ? opts.initialState : null;
  const prefillLevels = Array.isArray(opts?.levels) ? opts.levels : null;
  let pathClickBound = false;
  if (!persistEnabled) {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  const pathEl = document.createElement("div");
  pathEl.dataset.catPath = "1";
  pathEl.className = "text-xs text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl";
  root.appendChild(pathEl);

  const mockCats =
    (typeof window !== "undefined" && window.TOPM_MOCK_CATEGORIES && window.TOPM_MOCK_CATEGORIES[platform]) ||
    [
      [
        { cat_id: "100", cat_name: "Mock 一级A", is_leaf: "0" },
        { cat_id: "101", cat_name: "Mock 一级B", is_leaf: "0" },
      ],
      [
        { cat_id: "1001", cat_name: "Mock 二级 A-1", is_leaf: "0", parent: "100" },
        { cat_id: "1002", cat_name: "Mock 二级 A-2", is_leaf: "1", parent: "100" },
        { cat_id: "1011", cat_name: "Mock 二级 B-1", is_leaf: "1", parent: "101" },
      ],
      [
        { cat_id: "10011", cat_name: "Mock 三级 A-1-1", is_leaf: "1", parent: "1001" },
        { cat_id: "10012", cat_name: "Mock 三级 A-1-2", is_leaf: "1", parent: "1001" },
      ],
    ];

  const loadSavedState = () => {
    if (initialState) {
      const ids = Array.isArray(initialState?.ids)
        ? initialState.ids.map((x) => String(x).trim()).filter(Boolean)
        : [];
      const leafId = String(initialState?.leafId ?? "").trim();
      const pathText = String(initialState?.pathText ?? "").trim();
      const pathParts = Array.isArray(initialState?.pathParts)
        ? initialState.pathParts.map((x) => String(x ?? "").trim()).filter(Boolean)
        : [];
      const typeId = String(initialState?.typeId ?? "").trim();
      if (!ids.length && !leafId && !pathText && !pathParts.length && !typeId) return null;
      return { ids, leafId, pathText, pathParts, typeId };
    }
    if (!restoreEnabled) return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed?.ids) ? parsed.ids.map((x) => String(x).trim()).filter(Boolean) : [];
      const leafId = String(parsed?.leafId ?? "").trim();
      const pathText = String(parsed?.pathText ?? "").trim();
      const pathParts = Array.isArray(parsed?.pathParts) ? parsed.pathParts.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
      const typeId = String(parsed?.typeId ?? "").trim();
      if (!ids.length && !leafId && !pathText && !pathParts.length && !typeId) return null;
      return { ids: ids.length ? ids : [], leafId, pathText, pathParts, typeId };
    } catch {
      return null;
    }
  };

  const saveSelection = (extra) => {
    // Always keep live state on the output element for drafts (even if not persisted).
    try {
      out.dataset.catIds = JSON.stringify(selectedIds.map((x) => String(x).trim()).filter(Boolean));
      if (extra?.pathParts) out.dataset.catPathParts = JSON.stringify(extra.pathParts);
      if (extra?.pathText != null) out.dataset.catPathText = String(extra.pathText ?? "");
      if (extra?.leafId != null) out.dataset.catLeafId = String(extra.leafId ?? "");
      if (extra?.typeId != null) out.dataset.catTypeId = String(extra.typeId ?? "");
    } catch {
      // ignore
    }
    if (!persistEnabled) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const ids = selectedIds.map((x) => String(x).trim()).filter(Boolean);
      const leafId = String(extra?.leafId ?? "").trim();
      const pathText = String(extra?.pathText ?? "").trim();
      const pathParts = Array.isArray(extra?.pathParts) ? extra.pathParts : [];
      const typeId = String(extra?.typeId ?? "").trim();

      if (!ids.length && !leafId && !pathText && !pathParts.length && !typeId) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          ids,
          leafId: leafId || undefined,
          pathText: pathText || undefined,
          pathParts: (pathParts && pathParts.length ? pathParts : undefined) || undefined,
          typeId: typeId || undefined,
        })
      );
    } catch {
      // ignore
    }
  };

  const setPath = (list) => {
    selectedPath.length = 0;
    for (const x of list) selectedPath.push(x);
    pathEl.innerHTML = "";
    if (!selectedPath.length) {
      pathEl.innerHTML = '<span class="text-slate-400">-</span>';
      return;
    }
    selectedPath.forEach((name, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.pathLevel = String(idx);
      btn.className =
        "inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 px-2 py-1 rounded-xl bg-white border border-slate-200 hover:border-accent/40 hover:text-accent transition";
      btn.innerHTML = `<span class="text-[10px] text-slate-400 font-black">Lv${idx + 1}</span><i class="fas fa-folder-tree text-slate-400"></i><span class="truncate max-w-[140px]">${escapeHtml(
        String(name ?? "-")
      )}</span>`;
      pathEl.appendChild(btn);
      if (idx < selectedPath.length - 1) {
        const sep = document.createElement("span");
        sep.className = "text-slate-300 px-1";
        sep.innerHTML = "&gt;";
        pathEl.appendChild(sep);
      }
    });
  };
  setPath([]);

  // Optimistic restore for refresh: show last selected leaf immediately (even before category tree loads).
  const saved = loadSavedState();
  if (saved?.leafId) out.textContent = saved.leafId;
  if (outText) outText.textContent = saved?.pathText || "-";
  if (saved?.typeId) out.dataset.catTypeId = String(saved.typeId ?? "");
  if (saved?.pathParts?.length) setPath(saved.pathParts);

  async function fetchLevel(parentCatId) {
    if (prefillLevels) {
      const idx = levels.length;
      const nextLevel = prefillLevels[idx];
      if (Array.isArray(nextLevel) && nextLevel.length) return nextLevel;
    }
    const res = await postAuthedJson(`/api/${platform}/get_select_category_pro`, { cat_id: parentCatId });
    if (String(res?.code) === "2") {
      clearAuth();
      window.location.href = "./login.html";
      return null;
    }
    if (String(res?.code) === "0" && Array.isArray(res?.data?.list)) return res.data.list;

    // Fallback to mock data for offline/local preview.
    const levelIdx = levels.length;
    const fallback = mockCats[levelIdx] || [];
    const filtered = fallback.filter((c) => {
      if (!c.parent) return parentCatId === 0 || parentCatId === "0";
      return String(c.parent) === String(parentCatId);
    });
    return filtered.length ? filtered : null;
  }

  function createLevel(options, level) {
    const wrap = document.createElement("div");
    wrap.dataset.level = String(level);
    wrap.dataset.catLevel = String(level);
    wrap.className = "bg-white border border-slate-100 rounded-2xl p-3";
    wrap.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="text-[11px] font-bold text-slate-500">第${level + 1}级类目</div>
        <div class="flex items-center gap-2">
          <div class="text-[11px] text-slate-400">${options.length} 项</div>
          <button type="button" data-cat-edit="1" class="hidden px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-slate-50">
            修改
          </button>
        </div>
      </div>
      <div data-cat-selected="1" class="hidden mb-2 text-xs text-slate-700 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl flex items-center justify-between gap-2">
        <div class="min-w-0 truncate"><span class="text-slate-400">已选：</span><span data-cat-selected-text="1" class="font-semibold text-slate-800"></span></div>
        <i class="fas fa-circle-check text-emerald-600"></i>
      </div>
      <div class="flex flex-wrap gap-2" data-cat-grid="1"></div>
    `;
    const grid = wrap.querySelector("[data-cat-grid='1']");
    for (const o of options) {
      const id = String(o?.cat_id ?? "").trim();
      if (!id) continue;
      const name = String(o?.cat_name ?? id);
      const leaf = String(o?.is_leaf ?? "") === "1";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.catId = id;
      btn.dataset.isLeaf = leaf ? "1" : "0";
      btn.className =
        "inline-flex max-w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition items-center gap-2";
      btn.innerHTML = `
        <span class="text-xs font-semibold text-slate-800 truncate max-w-[520px]">${escapeHtml(name)}</span>
        ${
          leaf
            ? '<span class="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">末级</span>'
            : ""
        }
      `;
      grid.appendChild(btn);
    }
    return wrap;
  }

  function setLevelCollapsed(levelEl, collapsed, selectedText) {
    if (!levelEl) return;
    const grid = levelEl.querySelector("[data-cat-grid='1']");
    const selected = levelEl.querySelector("[data-cat-selected='1']");
    const editBtn = levelEl.querySelector("[data-cat-edit='1']");
    const textEl = levelEl.querySelector("[data-cat-selected-text='1']");
    const isCollapsed = Boolean(collapsed);

    if (textEl && selectedText != null) textEl.textContent = String(selectedText ?? "");
    if (grid) {
      grid.hidden = isCollapsed;
      grid.classList.toggle("hidden", isCollapsed);
    }
    if (selected) {
      selected.hidden = !isCollapsed;
      selected.classList.toggle("hidden", !isCollapsed);
    }
    if (editBtn) {
      editBtn.hidden = !isCollapsed;
      editBtn.classList.toggle("hidden", !isCollapsed);
    }
  }

  function removeLoading() {
    root.querySelectorAll("[data-cat-loading='1']").forEach((el) => el.remove());
  }

  function showLoading(message) {
    removeLoading();
    const div = document.createElement("div");
    div.dataset.catLoading = "1";
    div.className = "text-xs text-slate-400 flex items-center gap-2 mt-2";
    div.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i><span>${escapeHtml(message || "加载中...")}</span>`;
    root.appendChild(div);
  }

  function showLoadError(message) {
    removeLoading();
    const div = document.createElement("div");
    div.dataset.catLoading = "1";
    div.className = "text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl mt-2";
    div.textContent = message || "加载失败";
    root.appendChild(div);
    setTimeout(() => {
      try {
        div.remove();
      } catch {
        // ignore
      }
    }, 2000);
  }

  async function init() {
    showLoading("加载类目...");
    const options = await fetchLevel(0);
    removeLoading();
    if (!options) {
      root.innerHTML =
        '<div class="text-xs text-rose-500">类目加载失败（请检查token或上游服务）</div>';
      return;
    }
    const levelEl = createLevel(options, 0);
    levels.push({ el: levelEl, options });
    root.appendChild(levelEl);
    attachClick(levelEl, 0);
  }

  function setButtonsDisabled(levelEl, disabled) {
    if (!levelEl) return;
    levelEl.querySelectorAll("button[data-cat-id]").forEach((b) => {
      b.disabled = disabled;
      if (disabled) b.classList.add("opacity-60", "cursor-not-allowed");
      else b.classList.remove("opacity-60", "cursor-not-allowed");
    });
  }

  function setActiveButton(levelEl, catId) {
    if (!levelEl) return;
    levelEl.querySelectorAll("button[data-cat-id]").forEach((b) => {
      const active = String(b.dataset.catId ?? "") === String(catId);
      if (active) {
        b.classList.add(
          "ring-2",
          "ring-accent/30",
          "border-accent",
          "bg-accent/10",
          "text-accent",
          "shadow-[0_0_0_2px_rgba(59,130,246,0.12)]",
          "font-bold"
        );
        b.classList.remove("border-slate-200", "bg-white", "text-slate-800");
      } else {
        b.classList.remove(
          "ring-2",
          "ring-accent/30",
          "border-accent",
          "bg-accent/10",
          "text-accent",
          "shadow-[0_0_0_2px_rgba(59,130,246,0.12)]",
          "font-bold"
        );
        b.classList.add("border-slate-200", "bg-white", "text-slate-800");
      }
    });
  }

  function showOnlyLevel(targetLevel) {
    const target = typeof targetLevel === "number" && targetLevel >= 0 ? targetLevel : null;
    levels.forEach((lvl, idx) => {
      const el = lvl?.el;
      if (!el) return;
      const show = target === idx;
      el.hidden = !show;
      el.classList.toggle("hidden", !show);
      if (show) {
        setLevelCollapsed(el, false, selectedPath[idx] ?? "");
        setActiveButton(el, selectedIds[idx]);
      }
    });
  }

  function attachClick(levelEl, level) {
    const onSelect = async (catId) => {
      const seq = (pendingSeq += 1);
      const value = String(catId ?? "").trim();
      out.textContent = "-";
      if (outText) outText.textContent = "-";
      removeLoading();
      saveSelection({});

      while (levels.length > level + 1) {
        const s = levels.pop();
        s.el.remove();
      }

      if (!value) return;
      setActiveButton(levelEl, value);
      const current = levels[level].options.find((o) => String(o.cat_id) === String(value));
      if (!current) return;
      const typeId = String(
        current?.product_type_id ??
          current?.productTypeId ??
          current?.type_id ??
          current?.typeId ??
          ""
      ).trim();

      const nextPath = selectedPath.slice(0, level);
      nextPath.push(String(current?.cat_name ?? current?.cat_id ?? value));
      setPath(nextPath);

      selectedIds.length = level;
      selectedIds.push(String(current?.cat_id ?? value));
      saveSelection({ pathParts: nextPath, pathText: nextPath.join(" > "), typeId });

      if (String(current.is_leaf) === "1") {
        out.textContent = String(current.cat_id);
        if (outText) outText.textContent = nextPath.join(" > ");
        saveSelection({ leafId: String(current.cat_id), pathParts: nextPath, pathText: nextPath.join(" > "), typeId });
        // Leaf chosen: hide option lists until user clicks a breadcrumb segment.
        setLevelCollapsed(levelEl, true, String(current?.cat_name ?? current?.cat_id ?? value));
        setActiveButton(levelEl, current.cat_id);
        showOnlyLevel(null);
        return;
      }

      // Collapse this level after a selection is made (non-leaf).
      setLevelCollapsed(levelEl, true, String(current?.cat_name ?? current?.cat_id ?? value));

      showLoading("加载下级类目...");
      setButtonsDisabled(levelEl, true);
      let nextOptions;
      try {
        nextOptions = await fetchLevel(current.cat_id);
      } finally {
        setButtonsDisabled(levelEl, false);
      }
      if (seq !== pendingSeq) return;
      removeLoading();
      if (Array.isArray(nextOptions) && nextOptions.length === 0) {
        out.textContent = String(current.cat_id);
        if (outText) outText.textContent = nextPath.join(" > ");
        saveSelection({ leafId: String(current.cat_id), pathParts: nextPath, pathText: nextPath.join(" > "), typeId });
        setLevelCollapsed(levelEl, true, String(current?.cat_name ?? current?.cat_id ?? value));
        setActiveButton(levelEl, current.cat_id);
        showOnlyLevel(null);
        return;
      }
      if (!nextOptions) {
        showLoadError("下级类目加载失败，请重试");
        return;
      }
      const nextLevel = createLevel(nextOptions, level + 1);
      levels.push({ el: nextLevel, options: nextOptions });
      root.appendChild(nextLevel);
      attachClick(nextLevel, level + 1);
      showOnlyLevel(level + 1);
    };

    // Expose helper for restore.
    levelEl._topmSelect = onSelect;

    const editBtn = levelEl.querySelector("[data-cat-edit='1']");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Expand this level for re-selection; downstream levels stay as-is until user actually selects a new option.
        setLevelCollapsed(levelEl, false);
      });
    }

    levelEl.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.("button[data-cat-id]");
      if (!btn) return;
      await onSelect(String(btn.dataset.catId ?? "").trim());
    });

    // Breadcrumb navigation: clicking path segment reopens that level for editing.
    if (!pathClickBound) {
      pathClickBound = true;
      pathEl.addEventListener("click", (e) => {
        const pbtn = e.target?.closest?.("button[data-path-level]");
        if (!pbtn) return;
        const targetLevel = Number(pbtn.dataset.pathLevel ?? -1);
        if (!Number.isFinite(targetLevel) || targetLevel < 0 || targetLevel >= levels.length) return;
        // Show all levels up to target, hide deeper ones; expand target grid.
        showOnlyLevel(targetLevel);
        setPath(selectedPath.slice(0, targetLevel + 1));
        const state = levels[targetLevel];
        if (state?.el) {
          setLevelCollapsed(state.el, false, selectedPath[targetLevel] ?? "");
          setActiveButton(state.el, selectedIds[targetLevel]);
        }
      });
    }
  }

  await init();
  showOnlyLevel(0);

  // Restore selection on refresh (best-effort).
  const savedAfterInit = saved || loadSavedState();
  const savedIds = savedAfterInit?.ids || [];
  if (savedIds && savedIds.length) {
    for (let i = 0; i < savedIds.length; i += 1) {
      const id = String(savedIds[i] ?? "").trim();
      const state = levels[i];
      if (!id || !state) break;
      const exists = state.options.find((o) => String(o?.cat_id ?? "") === id);
      if (!exists) break;
      const fn = state.el?._topmSelect;
      if (typeof fn !== "function") break;
      // eslint-disable-next-line no-await-in-loop
      await fn(id);
      if (String(exists?.is_leaf ?? "") === "1") break;
    }
  }
}

function setupRoutes() {
  const title = document.getElementById("page-title");
  const map = {
    overview: { view: "view-overview", title: "总览" },
    orders: { view: "view-orders", title: "订单列表" },
    alibaba: { view: "view-alibaba", title: "Alibaba 工具" },
    "upload-shein": { view: "view-upload-shein", title: "商品上传 · Shein" },
    "upload-tiktok": { view: "view-upload-tiktok", title: "商品上传 · TikTok" },
    "upload-temu": { view: "view-upload-temu", title: "商品上传 · TEMU" },
    "shop-info": { view: "view-shop-info", title: "店铺信息" },
    logistics: { view: "view-logistics", title: "物流支持" },
    "wholesales-sender": { view: "view-wholesales-sender", title: "批采发货人" },
    "wholesales-goods": { view: "view-wholesales-goods", title: "批采商品" },
    "wholesales-orders": { view: "view-wholesales-orders", title: "批采订单" },
    "wholesales-refunds": { view: "view-wholesales-refunds", title: "批采退款订单" },
  };

  // Restore last route if user refreshes without hash.
  try {
    const saved = localStorage.getItem("topm:lastRoute") || "";
    if ((!window.location.hash || window.location.hash === "#") && saved) {
      window.location.hash = saved;
    }
  } catch {
    // ignore
  }

  function apply() {
    let r = routeFromHash();
    if (r === "alibaba" && !isAlibabaUser()) r = "overview";
    const info = map[r] || map.overview;
    setActiveNav(r);
    showOnlyView(info.view);
    if (title) title.textContent = info.title;
    try {
      localStorage.setItem("topm:lastRoute", `#${r}`);
    } catch {
      // ignore
    }
  }

  window.addEventListener("hashchange", apply);
  apply();
}

function setPre(el, payload) {
  if (!el) return;
  el.textContent = payload ? JSON.stringify(payload, null, 2) : "";
}







function wsStatusBadge(kind, value) {
  const v = String(value ?? "");
  if (kind === "order_status") {
    const map = { "0": "未确认", "1": "已确认", "2": "已取消", "3": "无效", "4": "退货" };
    const text = map[v] || v || "-";
    const cls = v === "1" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700";
    return statusBadge(text, cls);
  }
  if (kind === "shipping_status") {
    const map = { "0": "未发货", "1": "已发货", "2": "已收货", "3": "备货中" };
    const text = map[v] || v || "-";
    const cls = v === "1" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700";
    return statusBadge(text, cls);
  }
  if (kind === "pay_status") {
    const map = { "0": "未付款", "1": "付款中", "2": "已付款", "4": "退款" };
    const text = map[v] || v || "-";
    const cls = v === "2" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700";
    return statusBadge(text, cls);
  }
  return statusBadge(v || "-", "border-slate-200 bg-slate-50 text-slate-700");
}


function setOrdersError(message) {
  const el = document.getElementById("orders-error");
  if (!el) return;
  const wrap = document.getElementById("orders-error-wrap");
  if (!message) {
    el.classList.add("hidden");
    el.textContent = "";
    if (wrap) wrap.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.textContent = message;
  if (wrap) wrap.classList.remove("hidden");
}

function statusBadge(text, colorClass) {
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}">${escapeHtml(
    text,
  )}</span>`;
}

function renderCopyBtn(value, title) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  const t = String(title || "复制").trim() || "复制";
  return `<button type="button" data-copy-text="${escapeHtml(v)}" class="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50" title="${escapeHtml(
    t,
  )}">
    <i class="fas fa-copy text-[12px]"></i>
  </button>`;
}

function onSaleToggleIcon(isOn) {
  const on = Boolean(isOn);
  return on
    ? '<span class="inline-flex items-center gap-2 text-emerald-700"><i class="fas fa-toggle-on text-2xl"></i><span class="text-xs font-black">上架</span></span>'
    : '<span class="inline-flex items-center gap-2 text-slate-400"><i class="fas fa-toggle-off text-2xl"></i><span class="text-xs font-black">下架</span></span>';
}

function isImageFile(file) {
  const t = String(file?.type ?? "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const name = String(file?.name ?? "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff", "heic", "heif"].includes(String(ext || ""));
}

function getOrderGoodsUrl(order, goods) {
  const g = goods || {};
  return safeExternalUrl(g.url);
}

async function copyToClipboard(text) {
  const v = String(text ?? "");
  if (!v) return false;
  try {
    await navigator.clipboard.writeText(v);
    return true;
  } catch {
    // fallback
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = v;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

function formatUnixTimeMaybe(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "";
  const d = new Date(n * 1000);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;
}

function mapOrderStatus(code) {
  const v = String(code ?? "").trim();
  switch (v) {
    case "0":
      return { name: "未确认", cls: "bg-slate-50 text-slate-700 border-slate-200" };
    case "1":
      return { name: "已确认", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "2":
      return { name: "已取消", cls: "bg-slate-50 text-slate-500 border-slate-200" };
    case "3":
      return { name: "无效", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "4":
      return { name: "退货", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { name: v || "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}

function mapShippingStatus(code) {
  const v = String(code ?? "").trim();
  switch (v) {
    case "0":
      return { name: "未发货", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "1":
      return { name: "已发货", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    case "2":
      return { name: "已收货", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "3":
      return { name: "备货中", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { name: v || "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}

function mapPayStatus(code) {
  const v = String(code ?? "").trim();
  switch (v) {
    case "0":
      return { name: "未付款", cls: "bg-orange-50 text-orange-700 border-orange-200" };
    case "1":
      return { name: "付款中", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    case "2":
      return { name: "已付款", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "4":
      return { name: "退款", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { name: v || "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}

function mapThirdOrderStatus(code) {
  const v = String(code ?? "").trim();
  const upper = v.toUpperCase();
  if (!v) return { name: "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  switch (v) {
    case "9999":
      return { name: "未合并", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "0":
      return { name: "未同步", cls: "bg-slate-50 text-slate-600 border-slate-200" };
    case "1":
      return { name: "待处理", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    case "2":
    case "3":
      return { name: "待发货", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "4":
      return { name: "已发货", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    case "41":
      return { name: "部分发货", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "5":
      return { name: "已签收", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "51":
      return { name: "部分签收", cls: "bg-teal-50 text-teal-700 border-teal-200" };
    case "6":
      return { name: "用户已退货", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "7":
      return { name: "待Shein揽收", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "8":
      return { name: "已报关", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "9":
      return { name: "已拒收", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      break;
  }

  if (upper === "CANCELLED") return { name: "已取消", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  if (upper === "COMPLETED") return { name: "已完成", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (upper === "DELIVERED") return { name: "已签收", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (upper === "IN_TRANSIT") return { name: "运输中", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (upper === "AWAITING_COLLECTION") return { name: "等待承运人托运", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (upper === "PARTIALLY_SHIPPING") return { name: "部分配送", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  if (upper === "AWAITING_SHIPMENT") return { name: "等待装运", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (upper === "ON_HOLD") return { name: "订单待履约", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (upper === "UNPAID" || upper === "UNPAY") return { name: "未支付", cls: "bg-orange-50 text-orange-700 border-orange-200" };

  return { name: v, cls: "bg-slate-50 text-slate-700 border-slate-200" };
}

function mapAlibabaOrderStatus(code) {
  const raw = String(code ?? "").trim();
  const v = raw.toLowerCase();
  if (!v) return { name: "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };

  if (v === "unpay" || v === "unpaid") {
    return { name: "未支付", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  }
  if (v === "paying" || v === "inpay" || v === "pay_in_progress") {
    return { name: "付款中", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (v === "paid" || v === "payed" || v === "pay") {
    return { name: "已支付", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  return { name: raw, cls: "bg-slate-50 text-slate-700 border-slate-200" };
}

function renderOrdersTable(list, opts) {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return;

  const showAliColumn = Boolean(opts?.showAliColumn);
  const selectedOrderSns = opts?.selectedOrderSns instanceof Set ? opts.selectedOrderSns : null;
  const colSpan = (showAliColumn ? 10 : 9) + 1;

  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML =
      `<tr class="table-row-hover transition"><td class="px-6 py-6 text-center text-xs text-slate-400" colspan="${colSpan}">暂无数据</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((o, idx) => {
      const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
      const orderId = o.order_id ?? "";
      const orderSn = o.order_sn ?? "-";
      const orderSnText = String(orderSn ?? "").trim();
      const selectable = Boolean(orderSnText) && orderSnText !== "-";
      const checked = selectable && selectedOrderSns ? selectedOrderSns.has(orderSnText) : false;
      const time = o.short_order_time ?? o.add_time ?? "-";

      const os = mapOrderStatus(o.order_status);
      const ss = mapShippingStatus(o.shipping_status);
      const ps = mapPayStatus(o.pay_status);
      const tos = mapThirdOrderStatus(o.third_order_status);

      const status =
        statusBadge(os.name, os.cls) +
        " " +
        statusBadge(ss.name, ss.cls) +
        " " +
        statusBadge(ps.name, ps.cls) +
        " " +
        statusBadge(tos.name, tos.cls);

      const goodsAmount = o.formated_goods_amount ?? o.goods_amount ?? "-";
      const payAmount = o.formated_surplus ?? o.surplus ?? "-";
      const goodsAmountText = String(goodsAmount ?? "-");
      const payAmountText = String(payAmount ?? "-");

      const invoiceNo = o.invoice_no ?? "-";
      const aliOrderSn = o.ali_order_sn ?? o.alibaba_order_sn ?? o.alibaba_order_no ?? "-";
      const aliStatus = String(o.alibaba_order_status ?? o.alibaba_status ?? "").trim().toLowerCase();
      const payUrl = safeExternalUrl(o.pay_url ?? o.alibaba_order_pay_url ?? o.alibaba_pay_url ?? "");
      const aliSnText = String(aliOrderSn ?? "").trim();
      const aliPayStatus = mapAlibabaOrderStatus(aliStatus);

      const goodsList = Array.isArray(o.goods_list) ? o.goods_list : [];
      const goodsHtml =
        goodsList.length === 0
          ? '<div class="text-xs text-slate-400">无商品</div>'
          : `<div class="flex flex-col gap-2">
              ${goodsList
                .slice(0, 50)
                .map((g) => {
                  const img = g.goods_image ?? "";
                  const name = g.goods_name ?? "-";
                  const qty = g.goods_number ?? "-";
                  const sku = g.goods_sn ?? "-";
                  const href = getOrderGoodsUrl(o, g);
                  const skuCopyBtn = sku
                    ? `<button type="button" class="sku-copy ml-1 text-slate-400 hover:text-accent" data-sku="${escapeHtml(
                        sku,
                      )}" title="复制 SKU"><i class="far fa-copy"></i></button>`
                    : "";
                  const openAttr = href ? `data-open-url="${escapeHtml(href)}" title="打开链接"` : "";
                   const nameHtml = href
                     ? `<button type="button" ${openAttr} class="text-left block text-xs font-semibold text-slate-800 hover:text-accent whitespace-normal break-words leading-snug">${escapeHtml(
                         name,
                       )}</button>`
                     : `<div class="text-xs font-semibold text-slate-400 whitespace-normal break-words leading-snug" title="缺少 url">${escapeHtml(
                         name,
                       )}</div>`;
                  const imgHtml = href
                    ? `<button type="button" ${openAttr} class="block">
                        <div class="w-11 h-11 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
                          img,
                        )}');"></div>
                      </button>`
                    : `<div class="w-11 h-11 rounded-lg bg-slate-50 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
                        img,
                      )}');"></div>`;
                  return `
                    <div class="flex items-center gap-3">
                      ${imgHtml}
                      <div class="min-w-0">
                        ${nameHtml}
                        <div class="text-[11px] text-slate-500 mt-0.5">
                          SKU: <span class="font-mono">${escapeHtml(sku)}</span>${skuCopyBtn} · 数量:
                          <span class="font-semibold">${escapeHtml(qty)}</span>
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>`;

      const mergeTimeRaw = o.merge_time ?? "";
      const mergeTimeText = formatUnixTimeMaybe(mergeTimeRaw);
      const merged = Boolean(mergeTimeText);
      const mergeBadge = merged
        ? statusBadge("已合并", "bg-emerald-50 text-emerald-700 border-emerald-200")
        : statusBadge("未合并", "bg-rose-50 text-rose-700 border-rose-200");
      const mergeTitle = merged ? `合并时间：${mergeTimeText}` : "未合并";

      const createdTime = String(time ?? "-");

      const shouldShowAliPayLink =
        (aliStatus === "unpay" || aliStatus === "unpaid") && aliSnText && aliSnText !== "-";

      const aliCellHtml = (() => {
        if (!showAliColumn) return "";
        const sn = aliSnText;
        if (!sn || sn === "-") {
          return statusBadge("未推送成功", "bg-rose-50 text-rose-700 border-rose-200");
        }
        const link = shouldShowAliPayLink
          ? ` <a
                class="ali-pay-link text-xs text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
                href="${escapeHtml(payUrl || "#")}"
                data-order-id="${escapeHtml(orderId)}"
                data-order-sn="${escapeHtml(orderSn)}"
                data-ali-order-sn="${escapeHtml(aliSnText)}"
              >unpay</a>`
          : "";

        const statusLine = aliStatus
          ? `<div class="flex items-center gap-2 flex-wrap mt-1">${statusBadge(aliPayStatus.name, aliPayStatus.cls)}${link}</div>`
          : link
            ? `<div class="mt-1">${link}</div>`
            : "";

        return `
          <div class="flex flex-col">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono">${escapeHtml(sn)}</span>
            </div>
            ${statusLine}
          </div>
        `;
      })();

      const canAliInfoBtn = showAliColumn && aliSnText && aliSnText !== "-";
      const actionsHtml = `
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 min-w-[240px]">
          <button
            type="button"
            class="order-info-btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            data-order-id="${escapeHtml(orderId)}"
            data-order-sn="${escapeHtml(orderSn)}"
          >
            <i class="fas fa-circle-info text-[12px] text-slate-500"></i>
            订单详情
          </button>
          <button
            type="button"
            class="invoice-view-btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            data-order-id="${escapeHtml(orderId)}"
            data-order-sn="${escapeHtml(orderSn)}"
          >
            <i class="fas fa-receipt text-[12px] text-slate-500"></i>
            获取面单
          </button>
          ${
            canAliInfoBtn
              ? `<button
                  type="button"
                  class="ali-order-info-btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  data-order-id="${escapeHtml(orderId)}"
                  data-order-sn="${escapeHtml(orderSn)}"
                  data-ali-order-sn="${escapeHtml(aliSnText)}"
                >
                  <i class="fab fa-alipay text-[12px] text-slate-500"></i>
                  阿里订单详情
                </button>`
              : ""
          }
        </div>
      `;

      return `
        <tr class="table-row-hover ${border} transition">
          <td class="px-3 py-3 align-top">
            <input
              type="checkbox"
              class="order-select h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent ${selectable ? "" : "opacity-50"}"
              data-order-sn="${escapeHtml(orderSnText)}"
              ${selectable ? "" : "disabled"}
              ${checked ? "checked" : ""}
              aria-label="选择订单"
            />
          </td>
          <td class="px-4 py-3 font-medium text-slate-900 align-top break-words">${escapeHtml(orderSn)}</td>
          <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap align-top">${escapeHtml(createdTime)}</td>
          <td class="px-4 py-3 whitespace-nowrap align-top" title="${escapeHtml(mergeTitle)}">${mergeBadge}</td>
          <td class="px-4 py-3 align-top">${goodsHtml}</td>
          <td class="px-4 py-3 align-top">
            <div class="flex flex-wrap gap-1.5">${status}</div>
          </td>
          <td class="px-4 py-3 whitespace-nowrap align-top">
            <span class="text-sm font-extrabold text-slate-900">${escapeHtml(goodsAmountText)}</span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap align-top">
            <span class="text-sm font-extrabold text-slate-900">${escapeHtml(payAmountText)}</span>
          </td>
          <td class="px-4 py-3 text-xs text-slate-500 align-top break-all">${escapeHtml(invoiceNo)}</td>
          <td class="px-4 py-3 text-xs text-slate-500 align-top break-all ${showAliColumn ? "" : "hidden"}">${aliCellHtml}</td>
          <td class="px-4 py-3 text-xs text-slate-500 align-top">${actionsHtml}</td>
        </tr>
      `;
    })
    .join("");
}




export { buildCategorySelector, ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, loadGoodsCounts, loadOverviewGoods, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge };

