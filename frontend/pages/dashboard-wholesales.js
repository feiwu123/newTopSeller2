import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupWholesalesGoods() {
  const keyword = document.getElementById("ws-goods-keyword");
  const refreshBtn = document.getElementById("ws-goods-refresh");
  const summary = document.getElementById("ws-goods-summary");
  const prevBtn = document.getElementById("ws-goods-prev");
  const nextBtn = document.getElementById("ws-goods-next");
  const pageEl = document.getElementById("ws-goods-page");
  const tbody = document.getElementById("ws-goods-tbody");
  const rawPre = document.getElementById("ws-goods-raw");

  const createToggle = document.getElementById("ws-goods-create-toggle");
  const createPanel = document.getElementById("ws-goods-create-panel");
  const createImgInput = document.getElementById("ws-create-image");
  const createImgBtn = document.getElementById("ws-create-image-btn");
  const createImgPreview = document.getElementById("ws-create-img-preview");
  const createCategory = document.getElementById("ws-create-category");
  const createSku = document.getElementById("ws-create-sku");
  const createName = document.getElementById("ws-create-name");
  const createStock = document.getElementById("ws-create-stock");
  const createWeight = document.getElementById("ws-create-weight");
  const createPrice = document.getElementById("ws-create-price");
  const createStatus = document.getElementById("ws-create-status");
  const createLength = document.getElementById("ws-create-length");
  const createWidth = document.getElementById("ws-create-width");
  const createHeight = document.getElementById("ws-create-height");
  const createTip = document.getElementById("ws-create-tip");
  const createSubmit = document.getElementById("ws-create-submit");
  const createRaw = document.getElementById("ws-create-raw");

  const createModeSingleBtn = document.getElementById("ws-create-mode-single");
  const createModeBatchBtn = document.getElementById("ws-create-mode-batch");
  const createSingleWrap = document.getElementById("ws-create-single");
  const createBatchWrap = document.getElementById("ws-create-batch");

  const batchDownloadTemplateBtn = document.getElementById("ws-batch-download-template");
  const batchCsvFile = document.getElementById("ws-batch-csv-file");
  const batchUploadCsvBtn = document.getElementById("ws-batch-upload-csv");
  const batchCsvName = document.getElementById("ws-batch-csv-name");
  const batchImagesInput = document.getElementById("ws-batch-images");
  const batchUploadImagesBtn = document.getElementById("ws-batch-upload-images");
  const batchImagesName = document.getElementById("ws-batch-images-name");
  const batchImagePoolBox = document.getElementById("ws-batch-image-pool");
  const batchImagePoolNote = document.getElementById("ws-batch-image-pool-note");
  const batchImagePoolBody = document.getElementById("ws-batch-image-pool-body");
  const batchPreviewBox = document.getElementById("ws-batch-preview");
  const batchPreviewNote = document.getElementById("ws-batch-preview-note");
  const batchPreviewTbody = document.getElementById("ws-batch-preview-tbody");
  const batchStartBtn = document.getElementById("ws-batch-start");
  const batchCancelBtn = document.getElementById("ws-batch-cancel");
  const batchProgress = document.getElementById("ws-batch-progress");
  const batchLog = document.getElementById("ws-batch-log");

  if (!keyword || !refreshBtn || !tbody) return;

  let page = 1;
  let size = 15;
  let total = 0;
  let categoriesLoaded = false;
  let categoriesList = [];
  let createImageFile = null;
  let createMode = localStorage.getItem("ws_wholesales_create_mode") || "single";

  const batchState = {
    csvText: "",
    parsed: [],
    submitting: false,
    cancelled: false,
    imageFiles: [],
    imageMap: new Map(),
    imageByLine: new Map(),
    pendingRowFileLine: null,
    imageUrlById: new Map(),
  };

  const setSummary = (t) => {
    if (!summary) return;
    summary.textContent = t || "-";
  };
  const setPageText = () => {
    if (!pageEl) return;
    const pages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    pageEl.textContent = `第 ${page} / ${pages} 页`;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= pages;
  };

  const renderRows = (list) => {
    tbody.innerHTML = "";
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-[11px] text-slate-400">暂无数据</td></tr>';
      return;
    }
    for (const g of rows) {
      const goodsId = String(g?.goods_id ?? "");
      const name = String(g?.goods_name ?? "");
      const sn = String(g?.goods_sn ?? "");
      const img = safeExternalUrl(g?.goods_thumb ?? "");
      const catId = String(g?.cat_id ?? g?.category ?? g?.cat ?? "").trim();
      const cat = String(g?.cat_name ?? catId ?? "");
      const rawPrice = String(g?.shop_price ?? g?.price ?? "").trim();
      const price = String(g?.formated_shop_price ?? rawPrice ?? "");
      const url = safeExternalUrl(g?.url ?? "");
      const isOn = String(g?.is_on_sale ?? "") === "1";

      const tr = document.createElement("tr");
      tr.className = "border-t border-slate-100";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            ${
              img
                ? `<img src="${escapeHtml(img)}" class="w-12 h-12 rounded-xl border border-slate-200 object-cover bg-slate-50" onerror="this.style.display='none';" />`
                : `<div class="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400">无图</div>`
            }
            <div class="min-w-0">
              <button
                type="button"
                class="ws-inline-edit inline-flex items-center gap-2 text-sm font-black text-slate-900 truncate hover:underline"
                data-ws-edit="1"
                data-id="${escapeHtml(goodsId)}"
                data-field="name"
                data-value="${escapeHtml(name)}"
                title="点击编辑名称"
              >
                <span class="truncate">${escapeHtml(name)}</span><i class="fas fa-pen text-[11px] text-slate-400"></i>
              </button>
              ${
                url
                  ? `<button type="button" class="text-[11px] text-accent hover:underline" data-open-url="${escapeHtml(
                      url
                    )}"><i class="fas fa-arrow-up-right-from-square mr-1"></i>商品链接</button>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <button
            type="button"
            class="ws-inline-edit inline-flex items-center gap-2 text-xs text-slate-700 font-mono hover:underline"
            data-ws-edit="1"
            data-id="${escapeHtml(goodsId)}"
            data-field="sku"
            data-value="${escapeHtml(sn)}"
            title="点击编辑货号"
          >
            <span class="truncate max-w-[160px]">${escapeHtml(sn || "-")}</span>
            <i class="fas fa-pen text-[10px] text-slate-300"></i>
          </button>
        </td>
        <td class="px-4 py-3">
          <button
            type="button"
            class="ws-inline-edit inline-flex items-center gap-2 text-xs text-slate-700 hover:underline"
            data-ws-edit="1"
            data-id="${escapeHtml(goodsId)}"
            data-field="category"
            data-value="${escapeHtml(catId)}"
            title="点击编辑分类"
          >
            <span class="truncate max-w-[180px]">${escapeHtml(cat || catId || "-")}</span>
            <i class="fas fa-pen text-[10px] text-slate-300"></i>
          </button>
        </td>
        <td class="px-4 py-3">
          <button
            type="button"
            class="ws-inline-edit inline-flex items-center gap-2 text-sm font-black text-slate-900 hover:underline"
            data-ws-edit="1"
            data-id="${escapeHtml(goodsId)}"
            data-field="price"
            data-value="${escapeHtml(rawPrice)}"
            title="点击编辑售价"
          >
            <span>${escapeHtml(price || "-")}</span><i class="fas fa-pen text-[11px] text-slate-300"></i>
          </button>
        </td>
        <td class="px-4 py-3">
          <button type="button" class="ws-sale-toggle" data-id="${escapeHtml(goodsId)}" data-on="${isOn ? "1" : "0"}">
            ${onSaleToggleIcon(isOn)}
          </button>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-wrap gap-2">
            <label class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <i class="fas fa-image mr-1 text-slate-500"></i>换图
              <input type="file" accept="image/*" class="hidden ws-img-file" data-id="${escapeHtml(goodsId)}" />
            </label>
            <button type="button" class="ws-delete px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-100" data-id="${escapeHtml(
              goodsId
            )}" data-sku="${escapeHtml(sn)}" data-name="${escapeHtml(name)}">
              <i class="fas fa-trash mr-1"></i>删除
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  };

  const csvTemplateText = () => {
    const header = [
      "category",
      "sku",
      "name",
      "stock",
      "weight",
      "price",
      "status",
      "length",
      "width",
      "height",
    ];
    const lines = [
      header.join(","),
      "1,sku001,Example goods,10,0.5,9.90,1,10,10,10",
      "2,sku002,Another goods,5,0.25,19.90,1,12,8,6",
    ];
    return `\ufeff${lines.join("\r\n")}\r\n`;
  };

  const fileId = (f) => {
    if (!f) return "";
    return `${String(f.name || "")}::${String(f.size || 0)}::${String(f.lastModified || 0)}`;
  };

  const revokeAllBatchImageUrls = () => {
    try {
      for (const url of batchState.imageUrlById.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
    } finally {
      batchState.imageUrlById = new Map();
    }
  };

  const getBatchImageUrl = (f) => {
    if (!f) return "";
    const id = fileId(f);
    if (!id) return "";
    const cached = batchState.imageUrlById.get(id);
    if (cached) return cached;
    const url = URL.createObjectURL(f);
    batchState.imageUrlById.set(id, url);
    return url;
  };

  const downloadTextFile = (filename, text) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const detectCsvDelimiter = (text) => {
    const firstLine = String(text || "").split(/\r\n|\n|\r/)[0] || "";
    const comma = (firstLine.match(/,/g) || []).length;
    const semi = (firstLine.match(/;/g) || []).length;
    return semi > comma ? ";" : ",";
  };

  const parseCsv = (text, delimiter = ",") => {
    const input = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (inQuotes) {
        if (ch === '"') {
          const next = input[i + 1];
          if (next === '"') {
            cell += '"';
            i += 1;
            continue;
          }
          inQuotes = false;
          continue;
        }
        cell += ch;
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
        continue;
      }
      if (ch === delimiter) {
        row.push(cell);
        cell = "";
        continue;
      }
      if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }
      cell += ch;
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    while (rows.length && rows[rows.length - 1].every((c) => !String(c ?? "").trim())) rows.pop();
    return rows;
  };

  const setBatchLogVisible = (visible) => {
    if (!batchLog) return;
    batchLog.classList.toggle("hidden", !visible);
  };

  const appendBatchLog = (line) => {
    if (!batchLog) return;
    setBatchLogVisible(true);
    batchLog.textContent = `${batchLog.textContent || ""}${batchLog.textContent ? "\n" : ""}${String(line || "")}`;
    batchLog.scrollTop = batchLog.scrollHeight;
  };

  const renderBatchPreview = () => {
    if (!batchPreviewBox || !batchPreviewTbody || !batchPreviewNote) return;
    const rows = Array.isArray(batchState.parsed) ? batchState.parsed : [];
    const okCount = rows.filter((r) => r.ok).length;
    batchPreviewNote.textContent = `rows: ${rows.length} · ok: ${okCount} · invalid: ${rows.length - okCount}`;
    batchPreviewTbody.innerHTML = "";
    if (!rows.length) {
      batchPreviewBox.classList.add("hidden");
      if (batchStartBtn) batchStartBtn.disabled = true;
      return;
    }
    batchPreviewBox.classList.remove("hidden");
    const slice = rows.slice(0, 50);
    for (const r of slice) {
      const tr = document.createElement("tr");
      tr.className = "border-t border-slate-100";
      const data = r.data || {};
      const bad = !r.ok;
      const bound = batchState.imageByLine.get(r.line);
      const boundName = bound ? String(bound.name || "") : "";
      const boundUrl = bound ? getBatchImageUrl(bound) : "";
      tr.innerHTML = `
        <td class="px-4 py-3 text-xs font-mono text-slate-500">${escapeHtml(String(r.line))}</td>
        <td class="px-4 py-3 text-xs font-mono text-slate-700">${escapeHtml(String(data.sku || ""))}</td>
        <td class="px-4 py-3 text-xs text-slate-700 truncate max-w-[220px]">${escapeHtml(String(data.name || ""))}</td>
        <td class="px-4 py-3 text-xs font-mono text-slate-700">${escapeHtml(String(data.category || ""))}</td>
        <td class="px-4 py-3">
          <div
            class="ws-batch-drop px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-600 flex items-center justify-between gap-2"
            data-line="${escapeHtml(String(r.line))}"
            title="可将图片从图片池拖拽到这里"
          >
            <div class="min-w-0 flex items-center gap-2">
              ${
                boundUrl
                  ? `<img src="${escapeHtml(boundUrl)}" class="w-8 h-8 rounded-lg border border-slate-200 object-cover bg-white" draggable="false" onerror="this.style.display='none';" />`
                  : `<div class="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400"><i class="fas fa-image"></i></div>`
              }
              <div class="truncate">${boundName ? escapeHtml(boundName) : '<span class="text-slate-400">拖拽/上传图片</span>'}</div>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="ws-batch-row-upload px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-line="${escapeHtml(
                String(r.line)
              )}"><i class="fas fa-upload"></i></button>
              <button type="button" class="ws-batch-row-unbind px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-line="${escapeHtml(
                String(r.line)
              )}"><i class="fas fa-link-slash"></i></button>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-xs ${bad ? "text-rose-600" : "text-emerald-600"}">${escapeHtml(r.msg || (bad ? "invalid" : "ok"))}</td>
      `;
      batchPreviewTbody.appendChild(tr);
    }
    if (batchStartBtn) batchStartBtn.disabled = okCount <= 0 || batchState.submitting;
  };

  const renderImagePool = () => {
    if (!batchImagePoolBox || !batchImagePoolBody || !batchImagePoolNote) return;
    const files = Array.isArray(batchState.imageFiles) ? batchState.imageFiles : [];
    if (!files.length) {
      batchImagePoolBox.classList.add("hidden");
      batchImagePoolBody.innerHTML = "";
      batchImagePoolNote.textContent = "-";
      return;
    }

    batchImagePoolBox.classList.remove("hidden");
    const used = new Set();
    for (const f of batchState.imageByLine.values()) used.add(fileId(f));
    const unusedCount = files.filter((f) => !used.has(fileId(f))).length;
    batchImagePoolNote.textContent = `total: ${files.length} · unused: ${unusedCount}`;

    batchImagePoolBody.innerHTML = "";
    for (const f of files.slice(0, 200)) {
      const id = fileId(f);
      const isUsed = used.has(id);
      const el = document.createElement("div");
      el.className = [
        "px-3 py-2 rounded-xl border text-xs font-semibold cursor-grab select-none flex items-center gap-2",
        isUsed ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ");
      el.draggable = !isUsed;
      el.dataset.fileId = id;
      const thumbUrl = getBatchImageUrl(f);
      const safeName = escapeHtml(f.name || "");
      el.innerHTML = `
        <img
          src="${escapeHtml(thumbUrl)}"
          alt="${safeName}"
          class="w-10 h-10 rounded-lg border border-slate-200 object-cover bg-white ${isUsed ? "opacity-50 grayscale" : ""}"
          draggable="false"
          onerror="this.style.display='none';"
        />
        <div class="min-w-0">
          <div class="truncate max-w-[220px]">${safeName}</div>
          <div class="text-[11px] font-mono ${isUsed ? "text-slate-400" : "text-slate-400"}">${escapeHtml(
            String(f.size || 0)
          )}B</div>
        </div>
      `;
      batchImagePoolBody.appendChild(el);
    }
  };

  const bindImageToLine = (line, f) => {
    const ln = Number(line);
    if (!Number.isFinite(ln) || ln <= 0 || !f) return;
    batchState.imageByLine.set(ln, f);
    parseBatchCsv();
    renderImagePool();
  };

  const unbindImageFromLine = (line) => {
    const ln = Number(line);
    if (!Number.isFinite(ln) || ln <= 0) return;
    batchState.imageByLine.delete(ln);
    parseBatchCsv();
    renderImagePool();
  };

  const parseBatchCsv = () => {
    const text = String(batchState.csvText || "");
    if (!text.trim()) {
      batchState.parsed = [];
      renderBatchPreview();
      if (batchProgress) batchProgress.textContent = "CSV 为空";
      return;
    }
    const delimiter = detectCsvDelimiter(text);
    const rows = parseCsv(text, delimiter);
    if (!rows.length) {
      batchState.parsed = [];
      renderBatchPreview();
      if (batchProgress) batchProgress.textContent = "CSV 为空";
      return;
    }

    const headerRaw = rows[0].map((c) => String(c ?? "").replace("\ufeff", "").trim().toLowerCase());
    const headerIndex = new Map();
    headerRaw.forEach((h, idx) => {
      if (h && !headerIndex.has(h)) headerIndex.set(h, idx);
    });

    const need = ["category", "sku", "name", "stock", "weight", "price", "status", "length", "width", "height"];
    const missingHeader = need.filter((k) => !headerIndex.has(k) && !headerIndex.has(`${k}`));
    if (missingHeader.length) {
      batchState.parsed = [];
      renderBatchPreview();
      if (batchProgress) batchProgress.textContent = `表头不正确，缺少：${missingHeader.join(", ")}`;
      return;
    }

    const parsed = [];
    for (let i = 1; i < rows.length; i += 1) {
      const lineNo = i + 1;
      const row = rows[i] || [];
      const data = {};
      for (const k of need) {
        const idx = headerIndex.get(k);
        data[k] = idx == null ? "" : String(row[idx] ?? "").trim();
      }
      const issues = [];
      for (const k of need) {
        if (!String(data[k] || "").trim()) issues.push(k);
      }
      const hasImage = Boolean(batchState.imageByLine.get(lineNo));
      if (!hasImage) issues.push("image_not_bound");
      parsed.push({
        line: lineNo,
        data,
        ok: issues.length === 0,
        msg: issues.length ? `missing/invalid: ${issues.join(", ")}` : "ok",
        status: "pending",
        res: null,
      });
    }
    batchState.parsed = parsed;
    if (batchProgress) batchProgress.textContent = `delimiter: ${delimiter} · rows: ${Math.max(0, rows.length - 1)}`;
    renderBatchPreview();
  };

  const setBatchSubmitting = (submitting) => {
    batchState.submitting = Boolean(submitting);
    if (batchStartBtn) batchStartBtn.disabled = batchState.submitting || !batchState.parsed.some((r) => r.ok);
    if (batchCancelBtn) batchCancelBtn.disabled = !batchState.submitting;
    if (batchUploadCsvBtn) batchUploadCsvBtn.disabled = batchState.submitting;
    if (batchDownloadTemplateBtn) batchDownloadTemplateBtn.disabled = batchState.submitting;
    if (batchUploadImagesBtn) batchUploadImagesBtn.disabled = batchState.submitting;
  };

  const runBatchInsert = async () => {
    if (batchState.submitting) return;
    const rows = (batchState.parsed || []).filter((r) => r?.ok);
    if (!rows.length) {
      if (batchProgress) batchProgress.textContent = "没有可提交的行（请先解析并校验）";
      return;
    }

    batchState.cancelled = false;
    setBatchSubmitting(true);
    appendBatchLog(`start: total_ok=${rows.length}`);

    let done = 0;
    let ok = 0;
    let fail = 0;

    for (const r of rows) {
      if (batchState.cancelled) break;
      done += 1;
      if (batchProgress) batchProgress.textContent = `processing ${done}/${rows.length} · ok=${ok} · fail=${fail}`;
      try {
        const data = r.data || {};
        const imageFile = batchState.imageByLine.get(r.line) || null;
        if (!imageFile) {
          fail += 1;
          r.status = "fail";
          appendBatchLog(`fail line=${r.line} sku=${data?.sku || ""} msg=image not bound`);
          continue;
        }

        const form = new FormData();
        form.append("image", imageFile);
        form.append("category", String(data.category || ""));
        form.append("sku", String(data.sku || ""));
        form.append("name", String(data.name || ""));
        form.append("stock", String(data.stock || ""));
        form.append("weight", String(data.weight || ""));
        form.append("price", String(data.price || ""));
        form.append("status", String(data.status || ""));
        form.append("length", String(data.length || ""));
        form.append("width", String(data.width || ""));
        form.append("height", String(data.height || ""));

        const res = await postAuthedFormData("/api/wholesales/goods_insert", form);
        r.res = res;
        if (String(res?.code) === "2") {
          fail += 1;
          r.status = "fail";
          appendBatchLog(`fail line=${r.line} sku=${data?.sku || ""} msg=${res?.msg || "code=2"}`);
          batchState.cancelled = true;
          break;
        }
        if (String(res?.code) === "0") {
          ok += 1;
          r.status = "ok";
          appendBatchLog(`ok line=${r.line} sku=${data?.sku || ""}`);
        } else {
          fail += 1;
          r.status = "fail";
          appendBatchLog(`fail line=${r.line} sku=${data?.sku || ""} msg=${res?.msg || "error"}`);
        }
      } catch (e) {
        fail += 1;
        r.status = "fail";
        appendBatchLog(`fail line=${r.line} sku=${r.data?.sku || ""} msg=network`);
      }
    }

    if (batchState.cancelled) appendBatchLog("cancelled");
    appendBatchLog(`done: ok=${ok} fail=${fail}`);
    if (batchProgress) batchProgress.textContent = `done · ok=${ok} · fail=${fail}${batchState.cancelled ? " · cancelled" : ""}`;
    setBatchSubmitting(false);
    renderBatchPreview();
    if (ok > 0) {
      page = 1;
      await load();
    }
  };

  const setCreateMode = (mode) => {
    createMode = mode === "batch" ? "batch" : "single";
    localStorage.setItem("ws_wholesales_create_mode", createMode);
    if (createSingleWrap) createSingleWrap.classList.toggle("hidden", createMode !== "single");
    if (createBatchWrap) createBatchWrap.classList.toggle("hidden", createMode !== "batch");
    if (createModeSingleBtn) {
      createModeSingleBtn.classList.toggle("bg-white", createMode === "single");
      createModeSingleBtn.classList.toggle("border", createMode === "single");
      createModeSingleBtn.classList.toggle("border-slate-200", createMode === "single");
      createModeSingleBtn.classList.toggle("text-slate-800", createMode === "single");
      createModeSingleBtn.classList.toggle("text-slate-600", createMode !== "single");
    }
    if (createModeBatchBtn) {
      createModeBatchBtn.classList.toggle("bg-white", createMode === "batch");
      createModeBatchBtn.classList.toggle("border", createMode === "batch");
      createModeBatchBtn.classList.toggle("border-slate-200", createMode === "batch");
      createModeBatchBtn.classList.toggle("text-slate-800", createMode === "batch");
      createModeBatchBtn.classList.toggle("text-slate-600", createMode !== "batch");
    }
    if (createMode === "single") void loadCategories();
  };

  window.addEventListener("beforeunload", () => {
    revokeAllBatchImageUrls();
  });

  const load = async () => {
    const original = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    setSummary("加载中...");
    try {
      const res = await postAuthedJson("/api/wholesales/goods_list", {
        keyword: String(keyword.value ?? "").trim(),
        page: String(page),
        size: String(size),
      });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        renderRows([]);
        setSummary(res?.msg || "登录已失效（code=2）");
        return;
      }
      if (String(res?.code) !== "0") {
        renderRows([]);
        setSummary(res?.msg || "加载失败");
        total = 0;
        setPageText();
        return;
      }
      const data = res?.data || {};
      const list = Array.isArray(data?.list) ? data.list : [];
      total = Number(data?.num ?? list.length) || list.length;
      renderRows(list);
      setSummary(`本页 ${list.length} 条 · 共 ${total} 条`);
      setPageText();
    } catch {
      renderRows([]);
      setSummary("网络异常，请稍后重试");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = original;
    }
  };

  const loadCategories = async () => {
    if (!createCategory || categoriesLoaded) return;
    createCategory.innerHTML = '<option value="">加载中...</option>';
    try {
      const res = await postAuthedJson("/api/wholesales/category_list", {});
      if (String(res?.code) === "2") {
        createCategory.innerHTML = '<option value="">登录已失效，请重新登录</option>';
        return;
      }
      if (String(res?.code) !== "0") {
        createCategory.innerHTML = '<option value="">加载失败</option>';
        return;
      }
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.list) ? res.data.list : [];
      categoriesList = list
        .map((c) => ({
          id: String(c?.cat_id ?? "").trim(),
          name: String(c?.cat_name ?? c?.cat_id ?? "").trim(),
        }))
        .filter((c) => c.id);
      createCategory.innerHTML = '<option value="">请选择分类</option>';
      for (const c of categoriesList.slice(0, 500)) {
        const id = c.id;
        const name = c.name || id;
        if (!id) continue;
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name;
        createCategory.appendChild(opt);
      }
      categoriesLoaded = true;
    } catch {
      createCategory.innerHTML = '<option value="">加载失败</option>';
    }
  };

  const updateGoodsField = async (goodsId, field, val) => {
    const id = String(goodsId ?? "").trim();
    const f = String(field ?? "").trim();
    const v = String(val ?? "").trim();
    if (!id || !f) return { ok: false, res: { code: "1", msg: "missing goods_id/field", data: {} } };

    const res = await postAuthedJson("/api/wholesales/goods_update", { goods_id: id, field: f, val: v });
    setPre(rawPre, res);
    if (String(res?.code) === "2") {
      setSummary(res?.msg || "登录已失效（code=2）");
      return { ok: false, res };
    }
    if (String(res?.code) !== "0") {
      setSummary(res?.msg || "修改失败");
      return { ok: false, res };
    }
    return { ok: true, res };
  };

  const renderCategorySelectOptions = (selectedId) => {
    const sel = String(selectedId ?? "").trim();
    const list = Array.isArray(categoriesList) ? categoriesList : [];
    if (!list.length) return `<option value="${escapeHtml(sel)}">${escapeHtml(sel || "-")}</option>`;
    return list
      .slice(0, 800)
      .map((c) => {
        const id = String(c?.id ?? "").trim();
        const name = String(c?.name ?? id).trim();
        if (!id) return "";
        const selected = id === sel ? " selected" : "";
        return `<option value="${escapeHtml(id)}"${selected}>${escapeHtml(name)}</option>`;
      })
      .join("");
  };

  const setCreateTip = (text, kind) => {
    if (!createTip) return;
    if (!text) {
      createTip.textContent = "";
      createTip.className = "text-[11px] text-slate-400";
      return;
    }
    const k = kind === "error" ? "error" : kind === "ok" ? "ok" : "info";
    createTip.textContent = text;
    createTip.className =
      k === "error" ? "text-[11px] text-rose-600" : k === "ok" ? "text-[11px] text-emerald-600" : "text-[11px] text-slate-500";
  };

  const renderCreateImagePreview = () => {
    if (!createImgPreview) return;
    if (!createImageFile) {
      createImgPreview.innerHTML = '<div class="text-[11px] text-slate-400">未选择图片</div>';
      return;
    }
    const url = URL.createObjectURL(createImageFile);
    createImgPreview.innerHTML = `<img src="${escapeHtml(url)}" class="w-full h-full object-contain" alt="preview" />`;
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 2000);
  };

  const submitCreate = async () => {
    if (!createSubmit || !createCategory) return;
    setCreateTip("");
    const category = String(createCategory.value ?? "").trim();
    const sku = String(createSku?.value ?? "").trim();
    const name = String(createName?.value ?? "").trim();
    const stock = String(createStock?.value ?? "").trim();
    const weight = String(createWeight?.value ?? "").trim();
    const price = String(createPrice?.value ?? "").trim();
    const status = String(createStatus?.value ?? "1").trim();
    const length = String(createLength?.value ?? "").trim();
    const width = String(createWidth?.value ?? "").trim();
    const height = String(createHeight?.value ?? "").trim();

    const requiredMissing = [];
    if (!createImageFile) requiredMissing.push("image");
    if (!category) requiredMissing.push("category");
    if (!sku) requiredMissing.push("sku");
    if (!name) requiredMissing.push("name");
    if (!stock) requiredMissing.push("stock");
    if (!weight) requiredMissing.push("weight");
    if (!price) requiredMissing.push("price");
    if (!length) requiredMissing.push("length");
    if (!width) requiredMissing.push("width");
    if (!height) requiredMissing.push("height");
    if (requiredMissing.length) {
      setCreateTip(`缺少必填：${requiredMissing.join(", ")}`, "error");
      return;
    }

    if (!isImageFile(createImageFile)) {
      setCreateTip("请上传图片文件（jpg/png/webp/gif 等）", "error");
      return;
    }

    const original = createSubmit.innerHTML;
    createSubmit.disabled = true;
    createSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>提交中...';
    try {
      const form = new FormData();
      form.append("image", createImageFile);
      form.append("category", category);
      form.append("sku", sku);
      form.append("name", name);
      form.append("stock", stock);
      form.append("weight", weight);
      form.append("price", price);
      form.append("status", status);
      form.append("length", length);
      form.append("width", width);
      form.append("height", height);
      const res = await postAuthedFormData("/api/wholesales/goods_insert", form);
      setPre(createRaw, res);
      if (createRaw) createRaw.classList.toggle("hidden", String(res?.code) === "0");
      if (String(res?.code) === "2") {
        setCreateTip(res?.msg || "登录已失效（code=2），请重新登录后再试", "error");
        return;
      }
      if (String(res?.code) !== "0") {
        setCreateTip(res?.msg || "提交失败", "error");
        return;
      }
      setCreateTip("新增成功", "ok");
      // reset a few fields
      createImageFile = null;
      if (createImgInput) createImgInput.value = "";
      renderCreateImagePreview();
      if (createSku) createSku.value = "";
      if (createName) createName.value = "";
      if (createStock) createStock.value = "";
      if (createWeight) createWeight.value = "";
      if (createPrice) createPrice.value = "";
      if (createLength) createLength.value = "";
      if (createWidth) createWidth.value = "";
      if (createHeight) createHeight.value = "";
      page = 1;
      await load();
    } catch {
      setCreateTip("网络异常，请稍后重试", "error");
    } finally {
      createSubmit.disabled = false;
      createSubmit.innerHTML = original;
    }
  };

  const updateOnSale = async (goodsId, nextOn) => {
    const id = String(goodsId ?? "").trim();
    if (!id) return;
    const btn = tbody.querySelector(`button.ws-sale-toggle[data-id='${CSS.escape(id)}']`);
    const original = btn?.innerHTML || "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-slate-400 text-xl"></i>';
    }
    try {
      const res = await postAuthedJson("/api/wholesales/goods_update", { goods_id: id, field: "is_on_sale", val: nextOn ? "1" : "0" });
      if (String(res?.code) === "2") {
        setSummary(res?.msg || "登录已失效（code=2）");
        return;
      }
      if (String(res?.code) !== "0") return;
      await load();
    } catch {
      // ignore
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original || btn.innerHTML;
      }
    }
  };

  const deleteGoods = async (goodsId) => {
    const id = String(goodsId ?? "").trim();
    if (!id) return;
    const btn = tbody.querySelector(`button.ws-delete[data-id='${CSS.escape(id)}']`);
    const sku = String(btn?.dataset?.sku ?? "").trim();
    const nm = String(btn?.dataset?.name ?? "").trim();
    const ok = await showConfirmPopover(btn || document.body, {
      title: "确认删除",
      message: `删除后不可恢复。\n${nm ? `名称：${nm}\n` : ""}${sku ? `SKU：${sku}\n` : ""}确认继续？`,
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    const original = btn?.innerHTML || "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>删除中...';
    }
    try {
      const res = await postAuthedJson("/api/wholesales/goods_drop", { goods_id: id });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        setSummary(res?.msg || "登录已失效（code=2）");
        return;
      }
      if (String(res?.code) !== "0") {
        setSummary(res?.msg || "删除失败");
        return;
      }
      setSummary("删除成功");
      await load();
    } catch {
      setSummary("网络异常，请稍后重试");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original || btn.innerHTML;
      }
    }
  };

  const uploadGoodsImage = async (goodsId, file) => {
    const id = String(goodsId ?? "").trim();
    if (!id || !file) return;
    if (!isImageFile(file)) return;
    const label = tbody.querySelector(`input.ws-img-file[data-id='${CSS.escape(id)}']`)?.closest("label");
    const original = label?.innerHTML || "";
    if (label) {
      label.classList.add("opacity-60", "cursor-not-allowed");
      label.innerHTML = '<span class="text-xs font-semibold text-slate-700"><i class="fas fa-circle-notch fa-spin mr-1"></i>上传中...</span>';
    }
    try {
      const form = new FormData();
      form.append("goods_id", id);
      form.append("image", file);
      const res = await postAuthedFormData("/api/wholesales/images_update", form);
      if (String(res?.code) === "2") {
        setSummary(res?.msg || "登录已失效（code=2）");
        return;
      }
      if (String(res?.code) !== "0") return;
      await load();
    } catch {
      // ignore
    } finally {
      if (label) {
        label.classList.remove("opacity-60", "cursor-not-allowed");
        label.innerHTML = original || label.innerHTML;
      }
    }
  };

  const startInlineEdit = async (btnEl) => {
    const b = btnEl?.closest?.("[data-ws-edit='1']");
    if (!b) return;
    if (b.dataset.editing === "1") return;

    const goodsId = String(b.dataset.id ?? "").trim();
    const field = String(b.dataset.field ?? "").trim();
    const current = String(b.dataset.value ?? "").trim();
    if (!goodsId || !field) return;

    const originalHtml = b.innerHTML;
    const originalTitle = b.getAttribute("title") || "";
    const originalEditing = b.dataset.editing;

    const restore = () => {
      b.dataset.editing = originalEditing || "";
      b.innerHTML = originalHtml;
      if (originalTitle) b.setAttribute("title", originalTitle);
      else b.removeAttribute("title");
    };

    b.dataset.editing = "1";
    b.removeAttribute("title");

    const editorWrap = document.createElement("span");
    editorWrap.className = "inline-flex items-center gap-2";

    let inputEl = null;
    let selectEl = null;

    if (field === "category") {
      if (!categoriesLoaded) {
        try {
          await loadCategories();
        } catch {
          // ignore
        }
      }
      if (Array.isArray(categoriesList) && categoriesList.length) {
        const sel = document.createElement("select");
        sel.className = "px-2 py-1 rounded-xl border border-slate-200 text-xs bg-white";
        sel.innerHTML = renderCategorySelectOptions(current);
        selectEl = sel;
        editorWrap.appendChild(sel);
      } else {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.className = "px-2 py-1 rounded-xl border border-slate-200 text-xs bg-white w-28";
        inp.value = current;
        inputEl = inp;
        editorWrap.appendChild(inp);
      }
    } else {
      const inp = document.createElement("input");
      inp.type = field === "price" ? "number" : "text";
      if (inp.type === "number") inp.step = "0.01";
      inp.className = "px-2 py-1 rounded-xl border border-slate-200 text-xs bg-white w-40";
      inp.value = current;
      inputEl = inp;
      editorWrap.appendChild(inp);
    }

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center";
    cancelBtn.innerHTML = '<i class="fas fa-xmark"></i>';

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className =
      "w-8 h-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center justify-center";
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';

    editorWrap.appendChild(cancelBtn);
    editorWrap.appendChild(saveBtn);

    b.innerHTML = "";
    b.appendChild(editorWrap);

    const getValue = () => {
      if (selectEl) return String(selectEl.value ?? "").trim();
      return String(inputEl?.value ?? "").trim();
    };

    const commit = async () => {
      const next = getValue();
      if (!next) {
        setSummary("请输入有效值");
        restore();
        return;
      }
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      try {
        const { ok } = await updateGoodsField(goodsId, field, next);
        if (!ok) {
          restore();
          return;
        }
        setSummary("修改成功");
        await load();
      } catch {
        setSummary("网络异常，请稍后重试");
        restore();
      }
    };

    cancelBtn.addEventListener("click", restore);
    saveBtn.addEventListener("click", commit);

    const onKeyDown = (e) => {
      if (e.key === "Escape") restore();
      if (e.key === "Enter") commit();
    };
    if (inputEl) inputEl.addEventListener("keydown", onKeyDown);
    if (selectEl) selectEl.addEventListener("keydown", onKeyDown);

    // focus
    try {
      (inputEl || selectEl)?.focus?.();
      if (inputEl && inputEl.type !== "number") inputEl.select?.();
    } catch {
      // ignore
    }
  };

  refreshBtn.addEventListener("click", () => {
    page = 1;
    load();
  });
  keyword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      page = 1;
      load();
    }
  });
  if (prevBtn) prevBtn.addEventListener("click", () => { if (page > 1) { page -= 1; load(); } });
  if (nextBtn) nextBtn.addEventListener("click", () => { page += 1; load(); });

  if (createToggle && createPanel) {
    createToggle.addEventListener("click", async () => {
      const hidden = createPanel.classList.contains("hidden") || createPanel.hidden;
      createPanel.hidden = !hidden;
      createPanel.classList.toggle("hidden", !hidden);
      createToggle.innerHTML = hidden
        ? '<i class="fas fa-chevron-up mr-1"></i>收起'
        : '<i class="fas fa-chevron-down mr-1"></i>展开';
      if (hidden) {
        setCreateMode(createMode);
        if (createMode === "single") await loadCategories();
      }
    });
  }

  if (createImgBtn && createImgInput) createImgBtn.addEventListener("click", () => createImgInput.click());
  if (createImgInput) {
    createImgInput.addEventListener("change", () => {
      const f = createImgInput.files?.[0];
      if (!f) return;
      createImageFile = f;
      renderCreateImagePreview();
    });
  }
  if (createSubmit) createSubmit.addEventListener("click", submitCreate);

  // init create mode UI
  setCreateMode(createMode);
  setBatchSubmitting(false);
  if (batchProgress) batchProgress.textContent = "-";
  if (batchCsvName) batchCsvName.textContent = "未选择 CSV";
  if (batchImagesName) batchImagesName.textContent = "未选择图片";
  renderImagePool();

  if (createModeSingleBtn) createModeSingleBtn.addEventListener("click", () => setCreateMode("single"));
  if (createModeBatchBtn) createModeBatchBtn.addEventListener("click", () => setCreateMode("batch"));

  if (batchDownloadTemplateBtn) {
    batchDownloadTemplateBtn.addEventListener("click", () => {
      downloadTextFile("wholesales_goods_template.csv", csvTemplateText());
    });
  }
  if (batchUploadCsvBtn && batchCsvFile) batchUploadCsvBtn.addEventListener("click", () => batchCsvFile.click());
  if (batchCsvFile) {
    batchCsvFile.addEventListener("change", async () => {
      const f = batchCsvFile.files?.[0];
      if (!f) return;
      batchState.csvText = "";
      batchState.parsed = [];
      setBatchLogVisible(false);
      if (batchLog) batchLog.textContent = "";
      if (batchCsvName) batchCsvName.textContent = f.name || "csv";
      try {
        batchState.csvText = await f.text();
      } catch {
        if (batchProgress) batchProgress.textContent = "读取 CSV 失败";
        return;
      }
      parseBatchCsv();
    });
  }
  if (batchStartBtn) batchStartBtn.addEventListener("click", runBatchInsert);
  if (batchUploadImagesBtn && batchImagesInput) batchUploadImagesBtn.addEventListener("click", () => batchImagesInput.click());
  if (batchImagesInput) {
    batchImagesInput.addEventListener("change", () => {
      const files = Array.from(batchImagesInput.files || []).filter(Boolean);
      const pendingLine = batchState.pendingRowFileLine;
      if (Number.isFinite(pendingLine) && files.length) {
        // keep pool in sync: ensure this file can be rendered & reused
        try {
          const current = Array.isArray(batchState.imageFiles) ? batchState.imageFiles : [];
          const next = current.concat(files);
          const byId = new Map(next.map((f) => [fileId(f), f]));
          batchState.imageFiles = Array.from(byId.values());
        } catch {
          // ignore
        }
        revokeAllBatchImageUrls();
        bindImageToLine(pendingLine, files[0]);
        batchState.pendingRowFileLine = null;
        batchImagesInput.value = "";
        return;
      }

      revokeAllBatchImageUrls();
      batchState.imageFiles = files;
      if (batchImagesName) batchImagesName.textContent = files.length ? `已选择 ${files.length} 张图片` : "未选择图片";
      renderImagePool();
      // keep existing bindings if still in pool
      const byId = new Map(files.map((f) => [fileId(f), f]));
      for (const [k, v] of Array.from(batchState.imageByLine.entries())) {
        const id = fileId(v);
        if (!byId.has(id)) batchState.imageByLine.delete(k);
      }
      if (String(batchState.csvText || "").trim()) parseBatchCsv();
    });
  }

  // drag & drop bindings
  if (batchImagePoolBody) {
    batchImagePoolBody.addEventListener("dragstart", (e) => {
      const el = e.target?.closest?.("[data-file-id]");
      if (!el) return;
      const id = el.dataset.fileId;
      if (!id) return;
      try {
        e.dataTransfer.setData("text/plain", id);
      } catch {
        // ignore
      }
    });
  }
  if (batchPreviewTbody) {
    batchPreviewTbody.addEventListener("dragover", (e) => {
      const drop = e.target?.closest?.(".ws-batch-drop");
      if (!drop) return;
      e.preventDefault();
    });
    batchPreviewTbody.addEventListener("drop", (e) => {
      const drop = e.target?.closest?.(".ws-batch-drop");
      if (!drop) return;
      e.preventDefault();
      const line = drop.dataset.line;
      let id = "";
      try {
        id = e.dataTransfer.getData("text/plain");
      } catch {
        id = "";
      }
      if (!line || !id) return;
      const f = (batchState.imageFiles || []).find((x) => fileId(x) === id);
      if (!f) return;
      bindImageToLine(line, f);
    });

    batchPreviewTbody.addEventListener("click", (e) => {
      const up = e.target?.closest?.("button.ws-batch-row-upload");
      if (up && batchImagesInput) {
        const line = up.dataset.line;
        batchState.pendingRowFileLine = line ? Number(line) : null;
        batchImagesInput.click();
        return;
      }
      const ub = e.target?.closest?.("button.ws-batch-row-unbind");
      if (ub) {
        const line = ub.dataset.line;
        if (line) unbindImageFromLine(line);
      }
    });
  }
  if (batchCancelBtn) {
    batchCancelBtn.disabled = true;
    batchCancelBtn.addEventListener("click", () => {
      if (!batchState.submitting) return;
      batchState.cancelled = true;
      if (batchProgress) batchProgress.textContent = "已请求停止，等待当前行完成…";
    });
  }

  tbody.addEventListener("click", (e) => {
    const edit = e.target?.closest?.("[data-ws-edit='1']");
    if (edit) {
      startInlineEdit(edit);
      return;
    }
    const t = e.target?.closest?.("button.ws-sale-toggle");
    if (t) {
      const id = t.dataset.id;
      const on = String(t.dataset.on ?? "") === "1";
      updateOnSale(id, !on);
      return;
    }
    const d = e.target?.closest?.("button.ws-delete");
    if (d) {
      deleteGoods(d.dataset.id);
    }
  });
  tbody.addEventListener("change", (e) => {
    const input = e.target?.closest?.("input.ws-img-file");
    if (!input) return;
    const f = input.files?.[0];
    if (!f) return;
    uploadGoodsImage(input.dataset.id, f);
    input.value = "";
  });

  // initial
  renderCreateImagePreview();
  load();
}

export function setupWholesalesSender() {
  const fields = {
    name: document.getElementById("ws-sender-name"),
    company: document.getElementById("ws-sender-company"),
    postCode: document.getElementById("ws-sender-postCode"),
    mailBox: document.getElementById("ws-sender-mailBox"),
    mobile: document.getElementById("ws-sender-mobile"),
    phone: document.getElementById("ws-sender-phone"),
    countryCode: document.getElementById("ws-sender-countryCode"),
    prov: document.getElementById("ws-sender-prov"),
    city: document.getElementById("ws-sender-city"),
    area: document.getElementById("ws-sender-area"),
    address: document.getElementById("ws-sender-address"),
  };
  const refreshBtn = document.getElementById("ws-sender-refresh");
  const saveBtn = document.getElementById("ws-sender-save");
  const msgEl = document.getElementById("ws-sender-msg");

  if (!refreshBtn || !saveBtn) return;

  const setMsg = (text, tone = "info") => {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.className =
      "text-[11px] " +
      (tone === "error"
        ? "text-rose-600"
        : tone === "success"
          ? "text-emerald-600"
          : "text-slate-500");
  };

  const val = (el) => String(el?.value ?? "").trim();

  const fill = (info) => {
    const data = info || {};
    Object.entries(fields).forEach(([k, el]) => {
      if (!el) return;
      const fromSnake = data[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)];
      const v = data[k] ?? fromSnake ?? "";
      el.value = String(v ?? "");
    });
  };

  const toggleLoading = (loading) => {
    [refreshBtn, saveBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = loading;
      btn.classList.toggle("opacity-70", loading);
    });
  };

  const getPayload = () => ({
    name: val(fields.name),
    company: val(fields.company),
    postCode: val(fields.postCode),
    mailBox: val(fields.mailBox),
    mobile: val(fields.mobile),
    phone: val(fields.phone),
    countryCode: val(fields.countryCode),
    prov: val(fields.prov),
    city: val(fields.city),
    area: val(fields.area),
    address: val(fields.address),
  });

  const validate = (payload) => {
    const required = ["name", "company", "postCode", "mailBox", "countryCode", "prov", "city", "area", "address"];
    const missing = required.filter((k) => !String(payload[k] || "").trim());
    if (missing.length) return `请填写必填项：${missing.join("、")}`;
    if (!payload.mobile && !payload.phone) return "手机与电话需至少填写一项";
    return "";
  };

  const load = async () => {
    toggleLoading(true);
    setMsg("加载中...");
    try {
      const res = await postAuthedJson("/api/wholesales/sender_address_info", {});
      if (String(res?.code) === "0") {
        const info = res?.data?.data ?? res?.data ?? {};
        fill(info);
        setMsg("已获取最新地址信息", "success");
      } else if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
      } else {
        setMsg(res?.msg || "获取失败", "error");
      }
    } catch (err) {
      setMsg("网络异常，稍后重试", "error");
    } finally {
      toggleLoading(false);
    }
  };

  const save = async () => {
    const payload = getPayload();
    const err = validate(payload);
    if (err) {
      setMsg(err, "error");
      return;
    }
    toggleLoading(true);
    const original = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>保存中';
    setMsg("保存中...");
    try {
      const res = await postAuthedJson("/api/wholesales/sender_address_update", payload);
      if (String(res?.code) === "0") {
        setMsg("保存成功", "success");
      } else if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
      } else {
        setMsg(res?.msg || "保存失败", "error");
      }
    } catch {
      setMsg("网络异常，稍后重试", "error");
    } finally {
      saveBtn.innerHTML = original;
      toggleLoading(false);
    }
  };

  refreshBtn.addEventListener("click", load);
  saveBtn.addEventListener("click", save);

  load();
}

export function setupWholesalesOrders() {
  const keyword = document.getElementById("ws-orders-keyword");
  const refreshBtn = document.getElementById("ws-orders-refresh");
  const summary = document.getElementById("ws-orders-summary");
  const prevBtn = document.getElementById("ws-orders-prev");
  const nextBtn = document.getElementById("ws-orders-next");
  const pageEl = document.getElementById("ws-orders-page");
  const tbody = document.getElementById("ws-orders-tbody");
  const rawPre = document.getElementById("ws-orders-raw");

  if (!keyword || !refreshBtn || !tbody) return;

  let page = 1;
  let size = 15;
  let total = 0;

  const setSummary = (t) => {
    if (!summary) return;
    summary.textContent = t || "-";
  };
  const setPageText = () => {
    if (!pageEl) return;
    const pages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    pageEl.textContent = `第 ${page} / ${pages} 页`;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= pages;
  };

  const renderRows = (list) => {
    tbody.innerHTML = "";
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-[11px] text-slate-400">暂无数据</td></tr>';
      return;
    }
    for (const o of rows) {
      const orderId = String(o?.order_id ?? "");
      const sn = String(o?.order_sn ?? "");
      const buyer = String(o?.buyer ?? "");
      const time = String(o?.short_order_time ?? "");
      const amount = String(o?.formated_order_amount ?? o?.surplus ?? "");
      const orderStatus = wsStatusBadge("order_status", o?.order_status);
      const shipStatus = wsStatusBadge("shipping_status", o?.shipping_status);
      const payStatus = wsStatusBadge("pay_status", o?.pay_status);

      const goods = Array.isArray(o?.goods_list) ? o.goods_list : [];
      const goodsHtml = goods.slice(0, 6).map((g) => {
        const img = safeExternalUrl(g?.goods_image ?? "");
        const nm = String(g?.goods_name ?? "");
        const sku = String(g?.goods_sn ?? "");
        const qty = String(g?.goods_number ?? "");
        const url = safeExternalUrl(g?.url ?? g?.goods_url ?? "");
        return `
          <div class="flex items-center gap-2 py-1">
            ${
              img
                ? `<img src="${escapeHtml(img)}" class="w-9 h-9 rounded-lg border border-slate-200 object-cover bg-slate-50" onerror="this.style.display='none';" />`
                : `<div class="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50"></div>`
            }
            <div class="min-w-0">
              <div class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(nm)}</div>
              <div class="text-[11px] text-slate-400 font-mono truncate">${escapeHtml(sku)} · x${escapeHtml(qty)}</div>
              ${
                url
                  ? `<button type="button" class="text-[11px] text-accent hover:underline" data-open-url="${escapeHtml(
                      url
                    )}">打开链接</button>`
                  : ""
              }
            </div>
          </div>
        `;
      });

      const tr = document.createElement("tr");
      tr.className = "border-t border-slate-100";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="text-sm font-black text-slate-900">${escapeHtml(sn || "-")}</div>
          <div class="text-[11px] text-slate-400 font-mono">ID:${escapeHtml(orderId)} · ${escapeHtml(time)}</div>
          <div class="text-[11px] text-slate-500 truncate">买家：${escapeHtml(buyer || "-")}</div>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-wrap gap-2">${orderStatus}${shipStatus}${payStatus}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm font-black text-slate-900">${escapeHtml(amount || "-")}</div>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-1">${goodsHtml.join("")}</div>
          ${goods.length > 6 ? `<div class="text-[11px] text-slate-400 mt-2">仅展示前 6 个（共 ${goods.length} 个）</div>` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    }
  };

  const load = async () => {
    const original = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    setSummary("加载中...");
    try {
      const res = await postAuthedJson("/api/wholesales/orders_list", {
        keyword: String(keyword.value ?? "").trim(),
        page: String(page),
        size: String(size),
      });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        renderRows([]);
        setSummary(res?.msg || "加载失败");
        total = 0;
        setPageText();
        return;
      }
      const data = res?.data || {};
      const list = Array.isArray(data?.lists) ? data.lists : Array.isArray(data?.list) ? data.list : [];
      total = Number(data?.num ?? list.length) || list.length;
      renderRows(list);
      setSummary(`本页 ${list.length} 条 · 共 ${total} 条`);
      setPageText();
    } catch {
      renderRows([]);
      setSummary("网络异常，请稍后重试");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = original;
    }
  };

  refreshBtn.addEventListener("click", () => { page = 1; load(); });
  keyword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      page = 1;
      load();
    }
  });
  if (prevBtn) prevBtn.addEventListener("click", () => { if (page > 1) { page -= 1; load(); } });
  if (nextBtn) nextBtn.addEventListener("click", () => { page += 1; load(); });

  load();
}

export function setupWholesalesRefunds() {
  const keyword = document.getElementById("ws-refunds-keyword");
  const refreshBtn = document.getElementById("ws-refunds-refresh");
  const summary = document.getElementById("ws-refunds-summary");
  const prevBtn = document.getElementById("ws-refunds-prev");
  const nextBtn = document.getElementById("ws-refunds-next");
  const pageEl = document.getElementById("ws-refunds-page");
  const tbody = document.getElementById("ws-refunds-tbody");
  const rawPre = document.getElementById("ws-refunds-raw");

  const modal = document.getElementById("ws-refund-modal");
  const modalOverlay = document.getElementById("ws-refund-modal-overlay");
  const modalId = document.getElementById("ws-refund-modal-id");
  const modalNote = document.getElementById("ws-refund-note");
  const modalError = document.getElementById("ws-refund-error");
  const modalCancel = document.getElementById("ws-refund-cancel");
  const modalCancelBtn = document.getElementById("ws-refund-cancel-btn");
  const modalSubmit = document.getElementById("ws-refund-submit");

  if (!keyword || !refreshBtn || !tbody) return;

  let page = 1;
  let size = 15;
  let total = 0;
  let pending = false;

  const setSummary = (t) => {
    if (!summary) return;
    summary.textContent = t || "-";
  };

  const setPageText = () => {
    if (!pageEl) return;
    const pages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    pageEl.textContent = `第 ${page} / ${pages} 页`;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= pages;
  };

  const refundStatusBadge = (val) => {
    const v = String(val ?? "");
    if (v === "1") {
      return '<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50">已同意</span>';
    }
    if (v === "2") {
      return '<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-rose-200 text-rose-600 bg-rose-50">已拒绝</span>';
    }
    return '<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200 text-amber-600 bg-amber-50">申请中</span>';
  };

  const renderRows = (list) => {
    tbody.innerHTML = "";
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-[11px] text-slate-400">暂无数据</td></tr>';
      return;
    }
    for (const o of rows) {
      const refundId = String(o?.refund_id ?? "");
      const orderId = String(o?.order_id ?? "");
      const sn = String(o?.order_sn ?? "");
      const time = String(o?.short_order_time ?? "");
      const amount = String(o?.surplus ?? "");
      const refundReason = String(o?.refund_reason ?? "");
      const refundDesc = String(o?.refund_desc ?? "");
      const applyTime = String(o?.short_apply_time ?? "");
      const handleTime = String(o?.short_handle_time ?? "");
      const adminNote = String(o?.admin_note ?? "");

      const refundStatus = refundStatusBadge(o?.refund_status);

      const actionHtml =
        String(o?.refund_status ?? "") === "0"
          ? `
            <div class="flex items-center gap-2">
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700" data-refund-act="agree" data-refund-id="${escapeHtml(
                refundId
              )}">
                同意
              </button>
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50" data-refund-act="reject" data-refund-id="${escapeHtml(
                refundId
              )}">
                不同意
              </button>
            </div>
          `
          : '<span class="text-xs text-slate-400">-</span>';

      const tr = document.createElement("tr");
      tr.className = "border-t border-slate-100";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="text-sm font-black text-slate-900">${escapeHtml(sn || "-")}</div>
          <div class="text-[11px] text-slate-400 font-mono">ID:${escapeHtml(orderId)} · ${escapeHtml(time)}</div>
          <div class="text-[11px] text-slate-500">扣款金额：${escapeHtml(amount || "-")}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-xs text-slate-700">理由：${escapeHtml(refundReason || "-")}</div>
          ${refundDesc ? `<div class="text-[11px] text-slate-500">补充：${escapeHtml(refundDesc)}</div>` : ""}
          <div class="text-[11px] text-slate-400">申请时间：${escapeHtml(applyTime || "-")}</div>
          ${handleTime ? `<div class="text-[11px] text-slate-400">处理时间：${escapeHtml(handleTime)}</div>` : ""}
          ${adminNote ? `<div class="text-[11px] text-slate-500">审核备注：${escapeHtml(adminNote)}</div>` : ""}
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-wrap gap-2">${refundStatus}</div>
        </td>
        <td class="px-4 py-3">${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    }
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    if (modalNote) modalNote.value = "";
    if (modalError) {
      modalError.textContent = "";
      modalError.classList.add("hidden");
    }
    if (modalSubmit) modalSubmit.disabled = false;
  };

  const openModal = (refundId) => {
    if (!modal) return;
    modal.dataset.refundId = refundId || "";
    if (modalId) modalId.textContent = refundId || "-";
    if (modalNote) modalNote.value = "";
    if (modalError) {
      modalError.textContent = "";
      modalError.classList.add("hidden");
    }
    modal.classList.remove("hidden");
    setTimeout(() => modalNote?.focus(), 50);
  };

  const doRefund = async (refundId, status, note) => {
    if (pending) return false;
    pending = true;
    setSummary("处理中...");
    try {
      const res = await postAuthedJson("/api/wholesales/do_refund", {
        refund_id: String(refundId || ""),
        refund_status: String(status || ""),
        note: note ? String(note) : "",
      });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return false;
      }
      if (String(res?.code) !== "0") {
        setSummary(res?.msg || "操作失败");
        return false;
      }
      return true;
    } catch {
      setSummary("网络异常，请稍后重试");
      return false;
    } finally {
      pending = false;
    }
  };

  const load = async () => {
    const original = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    setSummary("加载中...");
    try {
      const res = await postAuthedJson("/api/wholesales/refund_list", {
        keyword: String(keyword.value ?? "").trim(),
        page: String(page),
        size: String(size),
      });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        renderRows([]);
        setSummary(res?.msg || "加载失败");
        total = 0;
        setPageText();
        return;
      }
      const data = res?.data || {};
      const list = Array.isArray(data?.lists) ? data.lists : Array.isArray(data?.list) ? data.list : [];
      total = Number(data?.num ?? list.length) || list.length;
      renderRows(list);
      setSummary(`本页 ${list.length} 条 · 共 ${total} 条`);
      setPageText();
    } catch {
      renderRows([]);
      setSummary("网络异常，请稍后重试");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = original;
    }
  };

  refreshBtn.addEventListener("click", () => {
    page = 1;
    load();
  });
  keyword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      page = 1;
      load();
    }
  });
  if (prevBtn) prevBtn.addEventListener("click", () => { if (page > 1) { page -= 1; load(); } });
  if (nextBtn) nextBtn.addEventListener("click", () => { page += 1; load(); });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("[data-refund-act]");
    if (!btn) return;
    const refundId = btn.dataset.refundId || "";
    const action = btn.dataset.refundAct || "";
    if (!refundId) return;
    if (action === "agree") {
      const ok = await showConfirmPopover(btn, {
        title: "同意退款",
        message: "确认同意该退款申请？",
        confirmText: "同意",
        cancelText: "取消",
        tone: "primary",
      });
      if (!ok) return;
      const success = await doRefund(refundId, "1", "");
      if (success) load();
      return;
    }
    if (action === "reject") {
      openModal(refundId);
    }
  });

  const submitReject = async () => {
    if (!modal || !modalNote || !modalSubmit) return;
    const refundId = modal.dataset.refundId || "";
    const note = String(modalNote.value ?? "").trim();
    if (!note) {
      if (modalError) {
        modalError.textContent = "请填写不同意理由";
        modalError.classList.remove("hidden");
      }
      return;
    }
    if (modalError) {
      modalError.textContent = "";
      modalError.classList.add("hidden");
    }
    modalSubmit.disabled = true;
    const original = modalSubmit.innerHTML;
    modalSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>提交中...';
    const success = await doRefund(refundId, "2", note);
    modalSubmit.disabled = false;
    modalSubmit.innerHTML = original;
    if (success) {
      closeModal();
      load();
    }
  };

  modalOverlay?.addEventListener("click", closeModal);
  modalCancel?.addEventListener("click", closeModal);
  modalCancelBtn?.addEventListener("click", closeModal);
  modalSubmit?.addEventListener("click", submitReject);
  modalNote?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitReject();
    if (e.key === "Escape") closeModal();
  });

  load();
}
