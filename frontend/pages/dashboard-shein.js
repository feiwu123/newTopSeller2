import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth } from "../js/auth.js";
import {
  buildCategorySelector,
  ensureJsonString,
  escapeHtml,
  extractFirstUrl,
  normalizeImgUrl,
  renderCopyBtn,
  routeFromHash,
  safeExternalUrl,
  setPre,
  setTableLoading,
  showConfirmPopover,
  statusBadge,
} from "./dashboard-shared.js";

export function setupShein() {
  const refresh = document.getElementById("shein-refresh");
  const keywordsInput = document.getElementById("shein-keywords");
  const summary = document.getElementById("shein-goods-summary");
  const tbody = document.getElementById("shein-goods-tbody");
  const prev = document.getElementById("shein-prev");
  const next = document.getElementById("shein-next");
  const pageEl = document.getElementById("shein-page");
  const pageInput = document.getElementById("shein-page-input");
  const pageGo = document.getElementById("shein-page-go");
  const sizeInput = document.getElementById("shein-size");

  const listWrap = document.getElementById("shein-list-wrap");
  const uploadWrap = document.getElementById("shein-upload-wrap");
  const goUploadBtn = document.getElementById("shein-go-upload");
  const backToListBtn = document.getElementById("shein-back-to-list");
  const resetUploadBtn = document.getElementById("shein-reset");

  const stepBtn1 = document.getElementById("shein-step-1-btn");
  const stepBtn2 = document.getElementById("shein-step-2-btn");
  const stepBtn3 = document.getElementById("shein-step-3-btn");
  const stepBtn4 = document.getElementById("shein-step-4-btn");
  const stepDot1 = document.getElementById("shein-step-1-dot");
  const stepDot2 = document.getElementById("shein-step-2-dot");
  const stepDot3 = document.getElementById("shein-step-3-dot");
  const stepDot4 = document.getElementById("shein-step-4-dot");
  const stepCheck1 = document.getElementById("shein-step-1-check");
  const stepCheck2 = document.getElementById("shein-step-2-check");
  const stepCheck3 = document.getElementById("shein-step-3-check");
  const stepCheck4 = document.getElementById("shein-step-4-check");
  const stepHint1 = document.getElementById("shein-step-1-hint");
  const stepHint2 = document.getElementById("shein-step-2-hint");
  const stepHint3 = document.getElementById("shein-step-3-hint");
  const stepHint4 = document.getElementById("shein-step-4-hint");

  const panel1 = document.getElementById("shein-step-1-panel");
  const panel2 = document.getElementById("shein-step-2-panel");
  const panel3 = document.getElementById("shein-step-3-panel");
  const panel4 = document.getElementById("shein-step-4-panel");
  const next1 = document.getElementById("shein-step-next-1");
  const next2 = document.getElementById("shein-step-next-2");
  const next3 = document.getElementById("shein-step-next-3");
  const back2 = document.getElementById("shein-step-back-2");
  const back3 = document.getElementById("shein-step-back-3");
  const back4 = document.getElementById("shein-step-back-4");

  const catOut = document.getElementById("shein-cat-id");
  const catOutText = document.getElementById("shein-cat-id-text");
  const templateBtn = document.getElementById("shein-fetch-template");
  const templateClearBtn = document.getElementById("shein-template-clear");
  const templatePre = document.getElementById("shein-template");
  const templateMsg = document.getElementById("shein-template-msg");
  const templateForm = document.getElementById("shein-template-form");
  const attrModal = document.getElementById("shein-attr-modal");
  const attrModalOverlay = document.getElementById("shein-attr-modal-overlay");
  const attrModalClose = document.getElementById("shein-attr-modal-close");
  const attrModalTitle = document.getElementById("shein-attr-modal-title");
  const attrModalSubtitle = document.getElementById("shein-attr-modal-subtitle");
  const attrModalBody = document.getElementById("shein-attr-modal-body");
  const attrModalClear = document.getElementById("shein-attr-modal-clear");
  const attrModalCancel = document.getElementById("shein-attr-modal-cancel");
  const attrModalConfirm = document.getElementById("shein-attr-modal-confirm");
  const sheinOthersInput = document.getElementById("shein-others");
  const sheinGoodsAttrInput = document.getElementById("shein-goods-attr");
  const specDefinesInput = document.getElementById("shein-spec-defines");
  const sheinSpecBlock = document.getElementById("shein-spec-block");
  const sheinSpecExtras = sheinOthersInput?.closest(".grid");
  const sheinSpecMsg = document.getElementById("shein-spec-msg");
  const sheinSpecMainCard = document.getElementById("shein-spec-main-card");
  const sheinSpecMainSummary = document.getElementById("shein-spec-main-summary");
  const sheinSpecMainBadge = document.getElementById("shein-spec-main-badge");
  const sheinSpecOtherCard = document.getElementById("shein-spec-other-card");
  const sheinSpecOtherSummary = document.getElementById("shein-spec-other-summary");
  const sheinSpecOtherBadge = document.getElementById("shein-spec-other-badge");

  const imagePreview = document.getElementById("shein-image-preview");
  const supplyBlock = document.getElementById("shein-supply-block");
  const supplyTable = document.getElementById("shein-supply-table");
  const supplyMsg = document.getElementById("shein-supply-msg");

  const goodsNameInput = document.getElementById("shein-goods-name");
  const goodsSnInput = document.getElementById("shein-goods-sn");
  const goodsBriefInput = document.getElementById("shein-goods-brief");
  const aliSellerSnInput = document.getElementById("shein-ali-seller-sn");
  const goodsWeightInput = document.getElementById("shein-goods-weight");
  const lengthInput = document.getElementById("shein-length");
  const wideInput = document.getElementById("shein-wide");
  const highInput = document.getElementById("shein-high");
  const productSnInput = document.getElementById("shein-product-sn");
  const productNumberInput = document.getElementById("shein-product-number");
  const productPriceInput = document.getElementById("shein-product-price");
  const albumImagesInput = document.getElementById("shein-album-images");
  const squareImagesInput = document.getElementById("shein-square-images");
  const colorBlockImagesInput = document.getElementById("shein-color-block-images");
  const detailImagesInput = document.getElementById("shein-detail-images");
  const createBtn = document.getElementById("shein-create");
  const createPre = document.getElementById("shein-create-result");

  if (!refresh || !tbody) return;

  let page = 1;
  let size = 15;
  let total = 0;
  let sheinStep = 1;
  let templateRes = null;
  let lastTemplateCatId = "";
  let lastUploadOk = false;
  let lastSubmitOk = false;
  let sheinAttrList = [];
  let sheinAttrByKey = new Map();
  const sheinAttrSelections = new Map();
  let activeAttrKey = "";
  let activeModalMode = "attr";
  let activeSpecKind = "";
  let sheinSpecMainList = [];
  let sheinSpecOtherList = [];
  let sheinSpecMainRows = [];
  let sheinSpecOtherRows = [];
  let sheinImageBuckets = new Map();
  let sheinSupplyRows = new Map();
  let editingSheinGoodsId = "";

  const setSummary = (t) => {
    if (!summary) return;
    summary.textContent = t || "-";
  };
  const setPager = () => {
    const pages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    if (pageEl) pageEl.textContent = `第 ${page} / ${pages} 页`;
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
  };

  const getCatId = () => {
    const v = String(catOut?.dataset?.catLeafId || catOut?.textContent || "").trim();
    return v && v !== "-" ? v : "";
  };

  const getTypeId = () => {
    const v = String(catOut?.dataset?.catTypeId || "").trim();
    return v && v !== "-" ? v : "";
  };

  const setTemplateMsg = () => {};
  if (templateMsg) {
    templateMsg.hidden = true;
    templateMsg.classList.add("hidden");
    templateMsg.textContent = "";
  }
  if (templatePre) {
    templatePre.hidden = true;
    templatePre.classList.add("hidden");
    templatePre.textContent = "";
  }

  const parseJsonMaybe = (raw) => {
    const v = String(raw ?? "").trim();
    if (!v) return "";
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  };
  const parseMaybeJson = (raw) => {
    if (raw == null) return null;
    if (typeof raw === "string") {
      const v = raw.trim();
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return raw;
      }
    }
    return raw;
  };
  const setInputValue = (el, value) => {
    if (!el) return;
    el.value = value == null ? "" : String(value);
  };
  const setTextareaJson = (el, value) => {
    if (!el) return;
    if (value == null || value === "") {
      el.value = "";
      return;
    }
    if (typeof value === "string") {
      el.value = value;
      return;
    }
    el.value = JSON.stringify(value, null, 2);
  };
  const parseList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (raw == null) return [];
    if (typeof raw === "string") {
      const cleaned = raw.replace(/[\[\]]/g, "");
      return cleaned
        .split(/[>,/|\\s]+/)
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);
    }
    return [];
  };
  const pickCatName = (item) =>
    item?.cat_name ?? item?.cate_name ?? item?.category_name ?? item?.name ?? item?.label ?? item?.title;
  const pickCatId = (item) =>
    item?.cat_id ??
    item?.cate_id ??
    item?.category_id ??
    item?.id ??
    item?.value ??
    item?.catId ??
    item?.cateId ??
    item?.categoryId;
  const isSelectedCat = (item) =>
    item?.is_selected === 1 ||
    item?.is_selected === "1" ||
    item?.selected === true ||
    item?.selected === 1 ||
    item?.checked === true ||
    item?.checked === 1;

  const buildCatInitialState = (info) => {
    const leafId =
      info?.cat_id ??
      info?.catId ??
      info?.category_id ??
      info?.categoryId ??
      info?.cat_id_leaf ??
      info?.cat_leaf_id ??
      "";
    const typeId = info?.type_id ?? info?.typeId ?? "";
    const pathText =
      info?.cat_path_text ??
      info?.cat_path_name ??
      info?.cat_path ??
      info?.cat_path_str ??
      "";
    const pathIdsRaw = info?.cat_path_ids ?? info?.cat_ids ?? info?.cat_path_id ?? "";
    const idsFromPath = parseList(pathIdsRaw);
    const pathPartsFromPath = parseList(info?.cat_path_parts ?? info?.cat_path_names ?? info?.cat_path_list ?? "");

    const cateNames = parseList(info?.cate_names ?? info?.cateNames ?? info?.cate_name ?? "");
    const cateListsRaw = parseMaybeJson(info?.cate_lists ?? info?.cateLists ?? "");
    const cateLists = Array.isArray(cateListsRaw)
      ? cateListsRaw
      : cateListsRaw && typeof cateListsRaw === "object"
        ? Object.values(cateListsRaw)
        : [];
    const idsFromLists = [];
    const pathPartsFromLists = [];
    const pickFromLevel = (list, nameHint) => {
      if (!Array.isArray(list)) return null;
      if (nameHint) {
        const hit = list.find((item) => String(pickCatName(item) ?? "").trim() === String(nameHint).trim());
        if (hit) return hit;
      }
      return list.find((item) => isSelectedCat(item)) || null;
    };

    if (cateLists.length) {
      if (Array.isArray(cateLists[0])) {
        cateLists.forEach((levelList, idx) => {
          const picked = pickFromLevel(levelList, cateNames[idx]);
          if (!picked) return;
          const cid = pickCatId(picked);
          const cname = pickCatName(picked);
          if (cid != null) idsFromLists.push(String(cid));
          if (cname != null) pathPartsFromLists.push(String(cname));
        });
      } else {
        cateLists.forEach((item) => {
          const cid = pickCatId(item);
          const cname = pickCatName(item);
          if (cid != null) idsFromLists.push(String(cid));
          if (cname != null) pathPartsFromLists.push(String(cname));
        });
      }
    }

    const ids = idsFromPath.length ? idsFromPath : idsFromLists;
    const pathParts =
      pathPartsFromPath.length ? pathPartsFromPath : cateNames.length ? cateNames : pathPartsFromLists;
    let finalLeafId = String(leafId || "");
    if (!finalLeafId && ids.length) finalLeafId = String(ids[ids.length - 1] ?? "");
    const finalPathText = String(pathText || (pathParts.length ? pathParts.join(" > ") : ""));
    if (!finalLeafId && !ids.length && !finalPathText && !pathParts.length && !typeId) return null;
    return {
      ids,
      leafId: finalLeafId,
      pathText: finalPathText,
      pathParts,
      typeId: String(typeId || ""),
    };
  };

  const getSheinTemplateAttrs = () => {
    const data = templateRes?.data || {};
    const productAttrs = Array.isArray(data?.product_attr_arr) ? data.product_attr_arr : [];
    const proNumAttrs = Array.isArray(data?.pro_attr_num_arr) ? data.pro_attr_num_arr : [];
    return [...productAttrs, ...proNumAttrs];
  };

  const isSelectedAttrValue = (item) =>
    item?.is_selected === 1 ||
    item?.is_selected === "1" ||
    item?.is_selected === true ||
    item?.selected === 1 ||
    item?.selected === "1" ||
    item?.selected === true ||
    item?.checked === 1 ||
    item?.checked === "1" ||
    item?.checked === true;

  const getAttrValuesList = (attr) => {
    const raw =
      attr?.values_list ??
      attr?.valuesList ??
      attr?.value_list ??
      attr?.valueList ??
      attr?.values ??
      "";
    const parsed = parseMaybeJson(raw);
    return Array.isArray(parsed) ? parsed : [];
  };

  const getAttrOptions = (attr) => {
    const list = Array.isArray(attr?.attribute_value_info_list) ? attr.attribute_value_info_list : [];
    const valuesList = getAttrValuesList(attr);
    const selectedIds = new Set();
    const selectedNames = new Set();
    const extraById = new Map();
    valuesList.forEach((item) => {
      const id =
        item?.attribute_value_id ??
        item?.value_id ??
        item?.id ??
        item?.valueId ??
        item?.attributeValueId ??
        "";
      const name =
        item?.attribute_value ??
        item?.attribute_value_name ??
        item?.value ??
        item?.value_name ??
        item?.name ??
        item?.label ??
        "";
      const extra = item?.attribute_extra_value ?? item?.extra_value ?? item?.extra ?? "";
      if (id != null && String(id).trim()) selectedIds.add(String(id).trim());
      if (name != null && String(name).trim()) selectedNames.add(String(name).trim());
      if (id != null && String(id).trim() && extra != null && String(extra).trim()) {
        extraById.set(String(id).trim(), String(extra).trim());
      }
    });
    return list
      .map((item) => {
        const label =
          item?.attribute_value_name ??
          item?.value_name ??
          item?.value ??
          item?.name ??
          item?.attribute_value ??
          item?.text ??
          item?.label ??
          item?.title ??
          "";
        const fallback = item?.attribute_value_id ?? item?.value_id ?? item?.id ?? "";
        const extra =
          item?.attribute_value ??
          item?.value ??
          item?.value_name ??
          item?.attribute_value_name ??
          label ??
          "";
        return {
          id: String(fallback || "").trim(),
          label: String(label || fallback || "").trim(),
          extraValue: String(extraById.get(String(fallback || "").trim()) || extra || "").trim(),
          isSelected:
            isSelectedAttrValue(item) ||
            (fallback != null && selectedIds.has(String(fallback).trim())) ||
            (label && selectedNames.has(String(label).trim())),
        };
      })
      .filter((opt) => opt.label);
  };

  const getSpecValueOptions = (attr) => {
    const list = Array.isArray(attr?.attribute_value_info_list) ? attr.attribute_value_info_list : [];
    return list
      .map((item) => {
        const label =
          item?.attribute_value_name ??
          item?.value_name ??
          item?.value ??
          item?.name ??
          item?.attribute_value ??
          item?.text ??
          item?.label ??
          item?.title ??
          "";
        const id = item?.attribute_value_id ?? item?.value_id ?? item?.id ?? item?.valueId ?? "";
        const text = String(label || id || "").trim();
        return text ? { id: String(id || text).trim(), label: text } : null;
      })
      .filter(Boolean);
  };

  const normalizeSpecList = (raw) => {
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((attr, idx) => {
        const rawId = attr?.attribute_id ?? attr?.attributeId ?? attr?.id ?? "";
        const name = String(attr?.attribute_name ?? attr?.name ?? attr?.title ?? "").trim();
        if (!name) return null;
        return {
          key: `spec-${rawId || idx}`,
          id: String(rawId || "").trim(),
          name,
          values: getSpecValueOptions(attr),
          raw: attr,
        };
      })
      .filter(Boolean);
  };

  const getSpecList = (kind) => (kind === "main" ? sheinSpecMainList : sheinSpecOtherList);
  const getSpecRows = (kind) => (kind === "main" ? sheinSpecMainRows : sheinSpecOtherRows);
  const setSpecRows = (kind, rows) => {
    if (kind === "main") sheinSpecMainRows = rows;
    else sheinSpecOtherRows = rows;
  };

  const renderSpecCards = () => {
    const mainRows = sheinSpecMainRows.filter((r) => r?.name && r?.value);
    const otherRows = sheinSpecOtherRows.filter((r) => r?.name && r?.value);
    if (sheinSpecMainSummary) {
      if (!mainRows.length) {
        sheinSpecMainSummary.textContent = "未选择";
        sheinSpecMainSummary.className = "text-xs text-slate-400";
      } else {
        sheinSpecMainSummary.innerHTML = mainRows
          .map(
            (r) =>
              `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 mr-1 mb-1">${escapeHtml(
                `${r.name}: ${r.value}`,
              )}</span>`,
          )
          .join("");
      }
    }
    if (sheinSpecOtherSummary) {
      if (!otherRows.length) {
        sheinSpecOtherSummary.textContent = "未选择";
        sheinSpecOtherSummary.className = "text-xs text-slate-400";
      } else {
        sheinSpecOtherSummary.innerHTML = otherRows
          .map(
            (r) =>
              `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 mr-1 mb-1">${escapeHtml(
                `${r.name}: ${r.value}`,
              )}</span>`,
          )
          .join("");
      }
    }

    if (sheinSpecMainCard) {
      sheinSpecMainCard.classList.toggle("attr-card-done", mainRows.length > 0);
    }
    if (sheinSpecOtherCard) {
      sheinSpecOtherCard.classList.toggle("attr-card-done", otherRows.length > 0);
    }

    if (sheinSpecMsg) {
      const hasData = sheinSpecMainList.length || sheinSpecOtherList.length;
      sheinSpecMsg.textContent = hasData ? "主规格必选，最多 3 个属性值" : "模板未返回规格信息";
    }
    updateStep2Availability();
  };

  const getMainSpecRows = () =>
    sheinSpecMainRows.filter((row) => String(row?.name ?? "").trim() && String(row?.value ?? "").trim());

  const getFirstMainSpecRow = () => {
    const rows = getMainSpecRows();
    return rows.length ? [rows[0]] : [];
  };

  const buildSpecKey = (row) => `${String(row?.name ?? "").trim()}::${String(row?.value ?? "").trim()}`;

  const IMAGE_TYPE_META = {
    "2": {
      label: "细节图",
      required: true,
      max: 11,
      ratios: [1, 3 / 4, 4 / 5, 13 / 16],
      min: 900,
      maxSize: 2200,
    },
    "5": { label: "方形图", required: true, max: 1, ratios: [1], min: 900, maxSize: 2200 },
    "6": { label: "色块图", required: false, max: 10, ratios: [1], min: 80, maxSize: 80 },
    "7": { label: "详情图", required: false, max: 10, ratios: [3 / 4], min: 900 },
  };

  const syncSheinImageBuckets = () => {
    const rows = getFirstMainSpecRow();
    const next = new Map();
    rows.forEach((row) => {
      const key = buildSpecKey(row);
      const existing = sheinImageBuckets.get(key);
      if (existing) {
        existing.name = String(row?.name ?? "").trim();
        existing.value = String(row?.value ?? "").trim();
        next.set(key, existing);
        return;
      }
      next.set(key, {
        name: String(row?.name ?? "").trim(),
        value: String(row?.value ?? "").trim(),
        images: { "2": [], "5": [], "6": [], "7": [] },
      });
    });
    sheinImageBuckets = next;
  };

  const setImageHint = (msg, isError) => {
    if (!stepHint3) return;
    if (!msg) {
      stepHint3.textContent = "上传细节/方形/色块/详情图";
      stepHint3.classList.remove("text-rose-500");
      return;
    }
    stepHint3.textContent = msg;
    stepHint3.classList.toggle("text-rose-500", Boolean(isError));
  };

  const hasValidMainSpec = () => getMainSpecRows().length > 0;

  const updateStep2Availability = () => {
    if (!next2) return;
    const ok = hasValidMainSpec();
    next2.disabled = !ok;
    next2.classList.toggle("opacity-50", !ok);
    next2.classList.toggle("cursor-not-allowed", !ok);
    if (!ok) setImageHint("请先选择主规格名称和内容", true);
    else setImageHint("");
  };

  const renderSheinImageCards = () => {
    if (!imagePreview) return;
    syncSheinImageBuckets();
    const rows = getFirstMainSpecRow();
    if (!rows.length) {
      imagePreview.innerHTML = '<div class="text-xs text-slate-400">请先选择主规格名称和内容。</div>';
      return;
    }

    const blocks = rows
      .map((row) => {
        const key = buildSpecKey(row);
        const bucket = sheinImageBuckets.get(key);
        const header = `主规格：${escapeHtml(row.name)} · ${escapeHtml(row.value)}`;
        const sections = Object.entries(IMAGE_TYPE_META)
          .map(([type, meta]) => {
            const list = bucket?.images?.[type] || [];
            const requiredTag = meta.required ? '<span class="text-rose-500 font-bold">必传</span>' : "可选";
            const maxText = meta.max ? `最多 ${meta.max} 张` : "";
            const ratioText =
              type === "2"
                ? "比例 1:1/3:4/4:5/13:16"
                : type === "5"
                  ? "比例 1:1"
                  : type === "6"
                    ? "80×80"
                    : "比例 3:4";
            const sizeText =
              type === "6"
                ? "像素 80×80"
                : type === "7"
                  ? "像素 >900"
                  : "像素 900-2200";
            const listHtml = list.length
              ? `<div class="flex flex-wrap gap-2">` +
                list
                  .map(
                    (it, idx) => `
                      <div class="inline-flex items-center gap-2 text-[11px] text-slate-600">
                        <button type="button" data-view-image="${escapeHtml(it.img_url)}" class="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img src="${escapeHtml(it.img_url)}" alt="img" class="w-full h-full object-cover" />
                        </button>
                        <button type="button" data-image-remove="1" data-spec-key="${escapeHtml(
                          key,
                        )}" data-image-type="${escapeHtml(type)}" data-image-idx="${idx}" class="text-rose-500 hover:text-rose-600">
                          删除
                        </button>
                      </div>
                    `,
                  )
                  .join("") +
                `</div>`
              : '<div class="text-[11px] text-slate-400">暂无图片</div>';

            return `
              <div class="rounded-2xl border border-slate-100 bg-white p-3 space-y-2" data-image-card="1" data-spec-key="${escapeHtml(
                key,
              )}" data-image-type="${escapeHtml(type)}">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-xs font-bold text-slate-700">${escapeHtml(meta.label)}</div>
                  <div class="text-[11px] text-slate-400">${requiredTag} ${ratioText} ${sizeText} ${maxText}</div>
                </div>
                <div class="flex items-center gap-2">
                  <input type="file" accept="image/png,image/jpeg" multiple data-image-input="1" class="hidden" />
                  <button type="button" data-image-upload="1" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800">
                    <i class="fas fa-upload mr-1"></i>上传
                  </button>
                  <span class="text-[11px] text-slate-400">上传成功后展示在下方。</span>
                </div>
                <div data-image-msg="1" class="hidden text-[11px] text-rose-500"></div>
                <div class="space-y-2">${listHtml}</div>
              </div>
            `;
          })
          .join("");
        return `
          <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div class="text-sm font-bold text-slate-800">${header}</div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">${sections}</div>
          </div>
        `;
      })
      .join("");

    imagePreview.innerHTML = blocks;
  };

  const syncSheinImageJson = () => {
    const rows = getFirstMainSpecRow();
    const getMainSpecValueId = (row) => {
      const src = sheinSpecMainList.find((it) => it.name === row.name);
      const opt = src?.values?.find((it) => String(it?.label ?? "") === String(row.value ?? ""));
      return String(opt?.id ?? "").trim();
    };
    const buildPayload = (type) => {
      const result = {};
      rows.forEach((row) => {
        const valueId = getMainSpecValueId(row);
        if (!valueId) return;
        const key = buildSpecKey(row);
        const bucket = sheinImageBuckets.get(key);
        const list = (bucket?.images?.[type] || []).map((it) => ({ img_url: it.img_url }));
        if (list.length) result[valueId] = list;
      });
      return result;
    };

    const album = buildPayload("2");
    const square = buildPayload("5");
    const color = buildPayload("6");
    const detail = buildPayload("7");
    if (albumImagesInput) albumImagesInput.value = Object.keys(album).length ? JSON.stringify(album, null, 2) : "";
    if (squareImagesInput) squareImagesInput.value = Object.keys(square).length ? JSON.stringify(square, null, 2) : "";
    if (colorBlockImagesInput) colorBlockImagesInput.value = Object.keys(color).length ? JSON.stringify(color, null, 2) : "";
    if (detailImagesInput) detailImagesInput.value = Object.keys(detail).length ? JSON.stringify(detail, null, 2) : "";
  };

  const buildSupplyKey = (main, other) => {
    const mainKey = `${String(main?.name ?? "").trim()}::${String(main?.value ?? "").trim()}`;
    const otherKey = other ? `${String(other?.name ?? "").trim()}::${String(other?.value ?? "").trim()}` : "";
    return otherKey ? `${mainKey}||${otherKey}` : mainKey;
  };

  const syncSupplyRows = () => {
    const mainRows = getMainSpecRows();
    const otherRows = sheinSpecOtherRows.filter(
      (row) => String(row?.name ?? "").trim() && String(row?.value ?? "").trim(),
    );
    const next = new Map();
    if (otherRows.length) {
      mainRows.forEach((main) => {
        otherRows.forEach((other) => {
          const key = buildSupplyKey(main, other);
          const existing = sheinSupplyRows.get(key) || {};
          next.set(key, { main, other, price: existing.price || "", stock: existing.stock || "", sn: existing.sn || "" });
        });
      });
    } else {
      mainRows.forEach((main) => {
        const key = buildSupplyKey(main, null);
        const existing = sheinSupplyRows.get(key) || {};
        next.set(key, { main, other: null, price: existing.price || "", stock: existing.stock || "", sn: existing.sn || "" });
      });
    }
    sheinSupplyRows = next;
  };

  const syncSupplyJson = () => {
    const rows = Array.from(sheinSupplyRows.values());
    const prices = rows.map((row) => row.price);
    const stocks = rows.map((row) => row.stock);
    const sns = rows.map((row) => row.sn);
    if (productPriceInput) productPriceInput.value = JSON.stringify(prices, null, 2);
    if (productNumberInput) productNumberInput.value = JSON.stringify(stocks, null, 2);
    if (productSnInput) productSnInput.value = JSON.stringify(sns, null, 2);
  };

  const renderSupplyTable = () => {
    if (!supplyTable || !supplyBlock) return;
    syncSupplyRows();
    const rows = Array.from(sheinSupplyRows.values());
    if (supplyMsg) {
      supplyMsg.classList.add("hidden");
      supplyMsg.textContent = "";
    }
    if (!rows.length) {
      supplyTable.innerHTML = '<div class="text-xs text-slate-400">请先选择主规格名称和内容。</div>';
      return;
    }
    const mainName = String(rows[0]?.main?.name ?? "主规格").trim() || "主规格";
    const otherName = rows[0]?.other ? String(rows[0]?.other?.name ?? "次规格").trim() || "次规格" : "";
    const headerOther = otherName
      ? `<th class="px-4 py-2 text-xs font-semibold text-slate-500">${escapeHtml(otherName)}</th>`
      : "";

    const bodyHtml = rows
      .map((row, idx) => {
        const mainValue = `${row.main.name}：${row.main.value}`;
        const otherValue = row.other ? `${row.other.name}：${row.other.value}` : "";
        const rowKey = buildSupplyKey(row.main, row.other);
        const otherCell = otherName
          ? `<td class="px-4 py-2 text-xs text-slate-700 whitespace-nowrap">${escapeHtml(otherValue)}</td>`
          : "";
        return `
          <tr class="border-b border-slate-100">
            <td class="px-4 py-2 text-xs text-slate-700 whitespace-nowrap">${escapeHtml(mainValue)}</td>
            ${otherCell}
            <td class="px-4 py-2">
              <input data-supply-field="price" data-supply-idx="${idx}" value="${escapeHtml(
                row.price || "",
              )}" data-supply-key="${escapeHtml(
          rowKey,
        )}" class="w-32 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white" placeholder="Shop price" />
            </td>
            <td class="px-4 py-2">
              <input data-supply-field="stock" data-supply-idx="${idx}" value="${escapeHtml(
                row.stock || "",
              )}" data-supply-key="${escapeHtml(
          rowKey,
        )}" class="w-28 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white" placeholder="stock" />
            </td>
            <td class="px-4 py-2">
              <input data-supply-field="sn" data-supply-idx="${idx}" value="${escapeHtml(
                row.sn || "",
              )}" data-supply-key="${escapeHtml(
          rowKey,
        )}" class="w-36 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white" placeholder="商品货号" />
            </td>
          </tr>
        `;
      })
      .join("");

    supplyTable.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="text-xs text-slate-400 border-b border-slate-100 bg-slate-50/60">
            <th class="px-4 py-2 font-semibold text-slate-500">${escapeHtml(mainName)}</th>
            ${headerOther}
            <th class="px-4 py-2 font-semibold text-slate-500">Shop price<span class="text-rose-500">*</span></th>
            <th class="px-4 py-2 font-semibold text-slate-500">stock<span class="text-rose-500">*</span></th>
            <th class="px-4 py-2 font-semibold text-slate-500">商品货号<span class="text-rose-500">*</span></th>
          </tr>
        </thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    `;

    if (!supplyTable.dataset.bound) {
      supplyTable.dataset.bound = "1";
      supplyTable.addEventListener("input", (e) => {
        const input = e.target;
        if (!input?.matches?.("[data-supply-field]")) return;
        const field = String(input.dataset.supplyField || "");
        const key = String(input.dataset.supplyKey || "");
        if (!key) return;
        const row = sheinSupplyRows.get(key);
        if (!row) return;
        row[field] = String(input.value || "").trim();
        sheinSupplyRows.set(key, row);
        syncSupplyJson();
      });
    }

    syncSupplyJson();
  };

  const validateSheinImagesReady = () => {
    syncSheinImageBuckets();
    const rows = getFirstMainSpecRow();
    if (!rows.length) return { ok: false, msg: "请先选择主规格名称和内容。" };
    for (const row of rows) {
      const key = buildSpecKey(row);
      const bucket = sheinImageBuckets.get(key);
      const detailCount = bucket?.images?.["2"]?.length || 0;
      const squareCount = bucket?.images?.["5"]?.length || 0;
      if (detailCount < 1) {
        return { ok: false, msg: `主规格 ${row.name}-${row.value} 需要至少 1 张细节图。` };
      }
      if (squareCount < 1) {
        return { ok: false, msg: `主规格 ${row.name}-${row.value} 需要至少 1 张方形图。` };
      }
    }
    return { ok: true, msg: "" };
  };

  const validateSheinSupplyReady = () => {
    syncSupplyRows();
    const rows = Array.from(sheinSupplyRows.values());
    if (!rows.length) return { ok: false, msg: "请先选择主规格名称和内容。" };
    const missing = rows.find((row) => !(row.price && row.stock && row.sn));
    if (missing) {
      const main = `${missing.main?.name || "主规格"}-${missing.main?.value || ""}`;
      const other = missing.other ? `${missing.other?.name || "次规格"}-${missing.other?.value || ""}` : "";
      const label = other ? `${main} / ${other}` : main;
      return { ok: false, msg: `供应信息未填完整：${label}` };
    }
    return { ok: true, msg: "" };
  };

  const setSupplyHint = (msg) => {
    if (!supplyMsg) return;
    if (!msg) {
      supplyMsg.classList.add("hidden");
      supplyMsg.textContent = "";
      return;
    }
    supplyMsg.classList.remove("hidden");
    supplyMsg.textContent = msg;
  };

  const setTemplateVisibility = (show) => {
    const on = Boolean(show);
    const toggle = (el) => {
      if (!el) return;
      el.hidden = !on;
      el.classList.toggle("hidden", !on);
    };
    toggle(templateForm);
    toggle(sheinSpecBlock);
    toggle(sheinSpecExtras);
  };
  setTemplateVisibility(false);

  const buildSpecDefines = (rows, list) => {
    const map = new Map();
    rows.forEach((row) => {
      const name = String(row?.name ?? "").trim();
      const value = String(row?.value ?? "").trim();
      if (!name || !value) return;
      const src = list.find((it) => it.name === name);
      const valueItem = src?.values?.find((it) => String(it?.label ?? "") === value);
      const typeId = src?.id || name;
      const key = String(typeId || name);
      if (!map.has(key)) {
        map.set(key, { type_id: typeId, type_name: name, spec_value_ids: [], spec_value_vals: [] });
      }
      const entry = map.get(key);
      const valId = valueItem?.id ?? value;
      if (!entry.spec_value_ids.includes(valId)) entry.spec_value_ids.push(valId);
      if (!entry.spec_value_vals.includes(value)) entry.spec_value_vals.push(value);
    });
    return Array.from(map.values());
  };

  const syncSpecDefines = () => {
    if (!specDefinesInput) return;
    const mainDefines = buildSpecDefines(sheinSpecMainRows, sheinSpecMainList);
    const otherDefines = buildSpecDefines(sheinSpecOtherRows, sheinSpecOtherList);
    const all = [...mainDefines, ...otherDefines];
    specDefinesInput.value = all.length ? JSON.stringify(all, null, 2) : "";
    syncSheinGoodsAttr();
  };

  const syncSheinGoodsAttr = () => {
    if (!sheinGoodsAttrInput) return;
    const mainDefines = buildSpecDefines(sheinSpecMainRows, sheinSpecMainList);
    const otherDefines = buildSpecDefines(sheinSpecOtherRows, sheinSpecOtherList);
    const list = [];
    [...mainDefines, ...otherDefines].forEach((item) => {
      const typeId = String(item?.type_id ?? "").trim();
      const values = Array.isArray(item?.spec_value_ids) ? item.spec_value_ids : [];
      values.forEach((val) => {
        const valueId = String(val ?? "").trim();
        if (typeId && valueId) list.push(`${typeId}|${valueId}`);
      });
    });
    sheinGoodsAttrInput.value = list.length ? JSON.stringify(list, null, 2) : "";
  };

  const syncSheinOthers = () => {
    if (!sheinOthersInput) return;
    const entries = [];
    sheinAttrList.forEach((attr) => {
      const sel = sheinAttrSelections.get(attr.key);
      if (!sel) return;
      const attrId = String(attr?.id ?? "").trim();
      if (!attrId) return;
      const entry = { attribute_id: attrId };
      if (attr.mode === "0") {
        const val = String(sel?.value ?? "").trim();
        if (val) entry.attribute_extra_value = val;
      } else if (attr.mode === "4") {
        const rows = Array.isArray(sel?.rows) ? sel.rows : [];
        const extras = rows
          .map((r) => {
            const name = String(r?.name ?? "").trim();
            const value = String(r?.value ?? "").trim();
            if (name && value) return `${name}:${value}`;
            return value || name;
          })
          .filter(Boolean);
        if (extras.length) entry.attribute_extra_value = extras.join(",");
      } else {
        const values = Array.isArray(sel?.values) ? sel.values : [];
        const ids = [];
        const extras = [];
        values.forEach((v) => {
          const opt = attr.options.find((o) => String(o.label) === String(v));
          const id = String(opt?.id ?? "").trim();
          const extra = String(opt?.extraValue ?? v ?? "").trim();
          if (id) ids.push(id);
          if (extra) extras.push(extra);
        });
        if (ids.length) entry.attribute_value_id = ids.join(",");
        if (extras.length) entry.attribute_extra_value = extras.join(",");
      }
      const hasValues = Boolean(entry.attribute_value_id || entry.attribute_extra_value);
      if (hasValues) entries.push(entry);
    });
    sheinOthersInput.value = entries.length ? JSON.stringify(entries, null, 2) : "";
  };

  const SHEIN_MODE_LABELS = {
    "0": "\u6587\u672c",
    "1": "\u591a\u9009",
    "3": "\u5355\u9009",
    "4": "\u81ea\u5b9a\u4e49",
  };
  const SHEIN_MODE_META = {
    "0": { text: "\u6587\u672c", icon: "fa-pen-nib", chip: "text-violet-800 bg-violet-50 border-violet-200" },
    "1": { text: "\u591a\u9009", icon: "fa-list-check", chip: "text-sky-800 bg-sky-50 border-sky-200" },
    "3": { text: "\u5355\u9009", icon: "fa-circle-dot", chip: "text-sky-800 bg-sky-50 border-sky-200" },
    "4": { text: "\u81ea\u5b9a\u4e49", icon: "fa-sliders", chip: "text-amber-800 bg-amber-50 border-amber-200" },
  };

  const applyAttrSelectionsFromTemplate = () => {
    if (!sheinAttrList.length) return;
    let changed = false;
    sheinAttrList.forEach((attr) => {
      if (sheinAttrSelections.has(attr.key)) return;
      if (attr.mode === "1" || attr.mode === "3") {
        const picked = attr.options
          .filter((opt) => opt.isSelected)
          .map((opt) => String(opt.label || "").trim())
          .filter(Boolean);
        if (!picked.length) return;
        sheinAttrSelections.set(attr.key, { mode: attr.mode, values: attr.mode === "3" ? [picked[0]] : picked });
        changed = true;
        return;
      }
      if (attr.mode === "0") {
        const valuesList = getAttrValuesList(attr.raw);
        if (!valuesList.length) return;
        const candidate = valuesList.find((v) => String(v?.attribute_extra_value ?? "").trim()) || valuesList[0];
        const value =
          candidate?.attribute_extra_value ??
          candidate?.extra_value ??
          candidate?.attribute_value ??
          candidate?.attribute_value_name ??
          "";
        if (!String(value ?? "").trim()) return;
        sheinAttrSelections.set(attr.key, { mode: attr.mode, value: String(value).trim() });
        changed = true;
        return;
      }
      if (attr.mode === "4") {
        const valuesList = getAttrValuesList(attr.raw);
        if (!valuesList.length) return;
        const idToLabel = new Map(attr.options.map((opt) => [String(opt.id ?? ""), String(opt.label ?? "")]));
        const rows = valuesList
          .map((v) => {
            const id =
              v?.attribute_value_id ??
              v?.value_id ??
              v?.id ??
              v?.valueId ??
              v?.attributeValueId ??
              "";
            const name =
              v?.attribute_value ??
              v?.attribute_value_name ??
              idToLabel.get(String(id ?? "")) ??
              v?.value ??
              v?.name ??
              "";
            const value = v?.attribute_extra_value ?? v?.extra_value ?? v?.extra ?? "";
            return { name: String(name ?? "").trim(), value: String(value ?? "").trim() };
          })
          .filter((row) => row.name || row.value);
        if (!rows.length) return;
        sheinAttrSelections.set(attr.key, { mode: attr.mode, rows });
        changed = true;
      }
    });
    if (changed) syncSheinOthers();
  };

  const renderSheinTemplateForm = () => {
    if (!templateForm) return;
    setTemplateVisibility(Boolean(templateRes));
    templateForm.className = "grid grid-flow-row-dense gap-6 w-full";
    templateForm.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
    templateForm.innerHTML = "";
    const rawAttrs = getSheinTemplateAttrs();
    if (!rawAttrs.length) {
      templateForm.innerHTML = '<div class="text-xs text-slate-400">\u6682\u65e0\u57fa\u672c\u5c5e\u6027\u6a21\u677f</div>';
      return;
    }

    sheinAttrList = rawAttrs.map((attr, idx) => {
      const rawId = attr?.attribute_id ?? attr?.attributeId ?? attr?.id ?? "";
      const key = `attr-${rawId || idx}`;
      const name = String(attr?.attribute_name ?? attr?.name ?? attr?.title ?? `\u5c5e\u6027 ${idx + 1}`).trim();
      const mode = String(attr?.attribute_mode ?? "").trim();
      const options = mode === "1" || mode === "3" ? getAttrOptions(attr) : [];
      return { key, id: String(rawId || "").trim(), name, mode, options, raw: attr };
    });
    sheinAttrByKey = new Map(sheinAttrList.map((item) => [item.key, item]));
    applyAttrSelectionsFromTemplate();

    const cardHtml = sheinAttrList
      .map((attr) => {
        const modeLabel = SHEIN_MODE_LABELS[attr.mode] || "\u5176\u4ed6";
        const modeMeta = SHEIN_MODE_META[attr.mode] || { text: modeLabel, icon: "fa-shapes", chip: "text-slate-700 bg-slate-50 border-slate-200" };
        const optionCount = attr.options.length;
        const badge = attr.mode === "1" || attr.mode === "3" ? `\u5019\u9009 ${optionCount} \u4e2a` : "";
        const sel = sheinAttrSelections.get(attr.key);
        const hasText = sel?.value && String(sel.value).trim();
        const hasValues = Array.isArray(sel?.values) && sel.values.length;
        const customRows = Array.isArray(sel?.rows) ? sel.rows : [];
        const customFilled = customRows.filter((r) => (r?.value ?? "").toString().trim());
        const selectedHtml = customFilled.length
          ? `<div class="space-y-1 text-xs text-slate-700">${customFilled
              .map((r) => {
                const name = String(r?.name ?? "").trim();
                const value = String(r?.value ?? "").trim();
                const label = name && value ? `${name}：${value}` : value || name;
                return `<div class="break-words">${escapeHtml(label)}</div>`;
              })
              .join("")}</div>`
          : hasValues
            ? `<div class="flex flex-wrap gap-2">${sel.values
                .map(
                  (v) =>
                    `<span class="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600">${escapeHtml(
                      String(v),
                    )}</span>`,
                )
                .join("")}</div>`
            : hasText
              ? `<div class="text-xs text-slate-700 break-words">${escapeHtml(String(sel.value))}</div>`
              : '<div class="text-xs text-slate-400">\u672a\u586b\u5199</div>';
        const selectedCls = hasValues || hasText ? "attr-card-done" : "";
        const baseCls =
          "relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-5 pl-6 text-left w-full hover:border-accent/30 transition-colors";
        const accentBar = hasValues || hasText ? "bg-emerald-500" : "bg-slate-400/70";
        const modeChip = `<span class="text-[10px] ${modeMeta.chip} border px-2 py-0.5 rounded-full font-black">${escapeHtml(
          modeMeta.text,
        )}</span>`;
        const candidateHtml = (() => {
          if (attr.mode !== "1" && attr.mode !== "3") return "";
          const labels = attr.options.map((opt) => String(opt?.label ?? "").trim()).filter(Boolean);
          if (!labels.length) return "";
          return `
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span class="inline-flex items-center gap-1.5 text-amber-600">
                <i class="fas fa-circle-exclamation"></i>
                <span>${escapeHtml(badge || "\u5019\u9009")}</span>
              </span>
            </div>
          `;
        })();

        return `
          <button type="button" data-attr-card="1" data-attr-key="${escapeHtml(
            attr.key,
          )}" class="${baseCls} ${selectedCls}">
            <div class="absolute left-2 top-4 bottom-4 w-1 rounded-full ${accentBar}"></div>
            <div class="absolute -right-8 -top-10 text-slate-100 text-6xl rotate-12 pointer-events-none">
              <i class="fas fa-tags"></i>
            </div>
            <div class="pl-2 space-y-2">
              <div class="flex items-start gap-2 text-base font-black text-slate-900">
                <i class="fas ${escapeHtml(modeMeta.icon)} text-slate-600 mt-0.5"></i>
                <span class="break-words whitespace-normal">${escapeHtml(attr.name)}</span>
              </div>
              ${candidateHtml}
              <div class="flex flex-wrap gap-1.5 justify-end">${modeChip}</div>
              <div class="mt-2">${selectedHtml}</div>
            </div>
          </button>
        `;
      })
      .join("");

    templateForm.innerHTML = cardHtml;
    templateForm.querySelectorAll("[data-attr-card]").forEach((card) => {
      if (card.dataset.bound === "1") return;
      card.dataset.bound = "1";
      card.addEventListener("click", () => {
        const key = String(card.dataset.attrKey || "").trim();
        const attr = sheinAttrByKey.get(key);
        if (!attr) return;
        openAttrModal(attr);
      });
    });
    syncSheinOthers();
  };

  const openSpecModal = (kind) => {
    if (!attrModal || !attrModalBody) return;
    if (attrModal.parentElement !== document.body) {
      document.body.appendChild(attrModal);
    }
    const isMain = kind === "main";
    activeModalMode = "spec";
    activeSpecKind = isMain ? "main" : "other";
    if (attrModalTitle) attrModalTitle.textContent = isMain ? "主规格" : "次规格";
    if (attrModalSubtitle) {
      attrModalSubtitle.textContent = isMain ? "必选 1-3 个属性值" : "可选";
    }
    const specList = getSpecList(activeSpecKind);
    const maxRows = isMain
      ? Math.max(1, Math.min(3, specList.length || 3))
      : Math.max(1, Math.min(10, specList.length || 3));
    const existingRows = getSpecRows(activeSpecKind);
    const rowsState = existingRows.length ? existingRows.map((r) => ({ name: r?.name ?? "", value: r?.value ?? "" })) : [{ name: "", value: "" }];

    const getUsedNames = (skipIdx) => {
      const used = new Set();
      rowsState.forEach((row, idx) => {
        if (idx === skipIdx) return;
        const name = String(row?.name ?? "").trim();
        if (name) used.add(name);
      });
      return used;
    };

    const getSelectedNameCount = () => {
      const used = new Set();
      rowsState.forEach((row) => {
        const name = String(row?.name ?? "").trim();
        if (name) used.add(name);
      });
      return used.size;
    };

    const buildNameOptions = (selectedName, idx) => {
      const used = getUsedNames(idx);
      const placeholder = `<option value="" ${selectedName ? "" : "selected"}>请选择名称</option>`;
      const opts = specList
        .map(
          (item) => {
            const name = String(item.name || "").trim();
            if (!name) return "";
            const isSelected = name === selectedName;
            const disabled = !isSelected && used.has(name);
            return `<option value="${escapeHtml(name)}" ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(
              name,
            )}</option>`;
          },
        )
        .join("");
      return placeholder + opts;
    };

    const getValuesForName = (name) => {
      if (!name) return [];
      const item = specList.find((it) => it.name === name);
      return item?.values || [];
    };

    const buildValueOptions = (selectedValue, name) => {
      const values = getValuesForName(name);
      if (!values.length) {
        return `<option value="" selected>暂无可选内容</option>`;
      }
      const placeholder = `<option value="" ${selectedValue ? "" : "selected"}>请选择内容</option>`;
      const opts = values
        .map((v) => {
          const label = String(v?.label ?? "").trim();
          if (!label) return "";
          return `<option value="${escapeHtml(label)}" ${label === selectedValue ? "selected" : ""}>${escapeHtml(
            label,
          )}</option>`;
        })
        .join("");
      return placeholder + opts;
    };

    attrModalBody.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-semibold">
          <div>名称</div>
          <div>内容</div>
          <div class="text-right">操作</div>
        </div>
        <div id="shein-spec-modal-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl"></div>
        <div id="shein-spec-rows" class="space-y-2"></div>
        <div class="flex items-center justify-between">
          <div class="text-[11px] text-slate-400">最多可添加 ${maxRows} 行</div>
          <button id="shein-spec-add" type="button" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <i class="fas fa-plus mr-1"></i>添加行
          </button>
        </div>
      </div>
    `;

    const rowsWrap = attrModalBody.querySelector("#shein-spec-rows");
    const addBtn = attrModalBody.querySelector("#shein-spec-add");
    const msgEl = attrModalBody.querySelector("#shein-spec-modal-msg");

    const renderRows = () => {
      if (!rowsWrap) return;
      rowsWrap.innerHTML = "";
      rowsState.forEach((row, idx) => {
        const rowEl = document.createElement("div");
        rowEl.dataset.specRow = "1";
        rowEl.className = "grid grid-cols-3 gap-2 items-center";
        rowEl.innerHTML = `
          <select data-spec-name="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            ${buildNameOptions(String(row?.name ?? "").trim(), idx)}
          </select>
          <select data-spec-value="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            ${buildValueOptions(String(row?.value ?? "").trim(), String(row?.name ?? "").trim())}
          </select>
          <div class="flex justify-end">
            <button type="button" data-spec-del="1" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        rowsWrap.appendChild(rowEl);
        const nameSelect = rowEl.querySelector("[data-spec-name]");
        const valueSelect = rowEl.querySelector("[data-spec-value]");
        if (nameSelect) {
          nameSelect.addEventListener("change", () => {
            row.name = String(nameSelect.value || "").trim();
            row.value = "";
            if (msgEl) msgEl.classList.add("hidden");
            renderRows();
          });
        }
        if (valueSelect) {
          valueSelect.addEventListener("change", () => {
            row.value = String(valueSelect.value || "").trim();
            if (msgEl) msgEl.classList.add("hidden");
          });
        }
        const delBtn = rowEl.querySelector("[data-spec-del]");
        if (delBtn) {
          delBtn.disabled = rowsState.length <= 1;
          delBtn.classList.toggle("opacity-50", rowsState.length <= 1);
          delBtn.addEventListener("click", () => {
            if (rowsState.length <= 1) return;
            rowsState.splice(idx, 1);
            renderRows();
            if (addBtn) {
              const noMoreNames = getSelectedNameCount() >= specList.length;
              addBtn.disabled = rowsState.length >= maxRows || noMoreNames;
            }
          });
        }
      });
    };

    renderRows();
    if (addBtn) {
      addBtn.disabled = rowsState.length >= maxRows || getSelectedNameCount() >= specList.length;
      addBtn.addEventListener("click", () => {
        const noMoreNames = getSelectedNameCount() >= specList.length;
        if (rowsState.length >= maxRows || noMoreNames) return;
        rowsState.push({ name: "", value: "" });
        renderRows();
        addBtn.disabled = rowsState.length >= maxRows || getSelectedNameCount() >= specList.length;
      });
    }

    attrModalBody.scrollTop = 0;
    attrModal.classList.remove("hidden");
    attrModal.hidden = false;
    attrModal.style.display = "flex";
  };



  const openAttrModal = (attr) => {
    if (!attrModal || !attrModalBody) return;
    if (attrModal.parentElement !== document.body) {
      document.body.appendChild(attrModal);
    }
    activeModalMode = "attr";
    activeSpecKind = "";
    activeAttrKey = attr?.key || "";
    const modeLabel = SHEIN_MODE_LABELS[attr?.mode] || "\u5176\u4ed6";
    const optionCount = attr?.options?.length || 0;
    const subtitle =
      attr?.mode === "1" || attr?.mode === "3" ? `${modeLabel} \u00b7 \u5019\u9009 ${optionCount} \u4e2a` : modeLabel;
    if (attrModalTitle) attrModalTitle.textContent = attr?.name || "-";
    if (attrModalSubtitle) attrModalSubtitle.textContent = subtitle;

    const sel = sheinAttrSelections.get(activeAttrKey);
    if (attr?.mode === "0") {
      const value = sel?.value ?? "";
      attrModalBody.innerHTML = `
        <div class="space-y-2">
          <div class="text-[11px] text-slate-500">\u8bf7\u8f93\u5165${escapeHtml(modeLabel)}\u503c</div>
          <input id="shein-attr-input" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" value="${escapeHtml(
            String(value),
          )}" placeholder="\u8bf7\u8f93\u5165${escapeHtml(modeLabel)}\u503c" />
        </div>
      `;
    } else if (attr?.mode === "4") {
      const rawList = Array.isArray(attr?.raw?.attribute_value_info_list) ? attr.raw.attribute_value_info_list : [];
      const options = rawList.map((opt) => String(opt?.attribute_value ?? "").trim()).filter(Boolean);
      const maxRows = Math.max(1, options.length || 1);
      const existingRows = Array.isArray(sel?.rows) && sel.rows.length ? sel.rows : [{ name: "", value: "" }];

      attrModalBody.innerHTML = `
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-semibold">
            <div>\u540d\u79f0</div>
            <div>\u5185\u5bb9</div>
            <div class="text-right">\u64cd\u4f5c</div>
          </div>
          <div id="shein-custom-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl"></div>
          <div id="shein-custom-rows" class="space-y-2"></div>
          <div class="flex items-center justify-between">
            <div class="text-[11px] text-slate-400">\u6700\u591a\u53ef\u6dfb\u52a0 ${maxRows} \u884c</div>
            <button id="shein-custom-add" type="button" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <i class="fas fa-plus mr-1"></i>\u6dfb\u52a0\u884c
            </button>
          </div>
        </div>
      `;

      const rowsWrap = attrModalBody.querySelector("#shein-custom-rows");
      const addBtn = attrModalBody.querySelector("#shein-custom-add");
      const msgEl = attrModalBody.querySelector("#shein-custom-msg");

      const buildOptions = (selectedName, rows, rowIndex) => {
        if (!options.length) return `<option value="">\u8bf7\u8f93\u5165\u540d\u79f0</option>`;
        const taken = new Set(
          rows
            .filter((_, idx) => idx !== rowIndex)
            .map((r) => String(r?.name ?? "").trim())
            .filter(Boolean)
        );
        const placeholder = `<option value="" ${selectedName ? "" : "selected"}>\u8bf7\u9009\u62e9\u540d\u79f0</option>`;
        return (
          placeholder +
          options
          .map((name) => {
            const isSelected = name === selectedName;
            const isDisabled = !isSelected && taken.has(name);
            return `<option value="${escapeHtml(name)}" ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}>${escapeHtml(
              name
            )}</option>`;
          })
          .join("")
        );
      };

      const renderRows = (rows) => {
        if (!rowsWrap) return;
        rowsWrap.innerHTML = "";
        rows.forEach((row, idx) => {
          const rowEl = document.createElement("div");
          rowEl.className = "grid grid-cols-3 gap-2 items-center";
          rowEl.innerHTML = `
            <select data-custom-name="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
              ${buildOptions(String(row?.name ?? "").trim(), rows, idx)}
            </select>
            <input data-custom-value="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" value="${escapeHtml(
              String(row?.value ?? ""),
            )}" placeholder="\u8bf7\u586b\u5199\u5185\u5bb9" />
            <div class="flex justify-end">
              <button type="button" data-custom-del="1" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;
          rowsWrap.appendChild(rowEl);
          const nameSelect = rowEl.querySelector("[data-custom-name]");
          if (nameSelect) {
            nameSelect.addEventListener("change", () => {
              row.name = String(nameSelect.value || "").trim();
              if (msgEl) msgEl.classList.add("hidden");
              renderRows(rows);
            });
          }
          const valueInput = rowEl.querySelector("[data-custom-value]");
          if (valueInput) {
            valueInput.addEventListener("input", () => {
              row.value = String(valueInput.value || "");
              if (msgEl) msgEl.classList.add("hidden");
            });
          }
          const delBtn = rowEl.querySelector("[data-custom-del]");
          if (delBtn) {
            delBtn.disabled = rows.length <= 1;
            delBtn.classList.toggle("opacity-50", rows.length <= 1);
            delBtn.addEventListener("click", () => {
              if (rows.length <= 1) return;
              rows.splice(idx, 1);
              renderRows(rows);
              if (addBtn) addBtn.disabled = rows.length >= maxRows;
            });
          }
        });
      };

      const rowsState = existingRows.map((r) => ({ name: r?.name ?? "", value: r?.value ?? "" }));
      renderRows(rowsState);

      if (addBtn) {
        addBtn.disabled = rowsState.length >= maxRows;
        addBtn.addEventListener("click", () => {
          if (rowsState.length >= maxRows) return;
          rowsState.push({ name: "", value: "" });
          renderRows(rowsState);
          addBtn.disabled = rowsState.length >= maxRows;
        });
      }
    } else {
      const options = Array.isArray(attr?.options) ? attr.options : [];
      if (!options.length) {
        attrModalBody.innerHTML = '<div class="text-xs text-slate-400">\u6682\u65e0\u5019\u9009\u9879</div>';
      } else {
        const selected = new Set(Array.isArray(sel?.values) ? sel.values : []);
        attrModalBody.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${options
              .map((opt, idx) => {
                const label = String(opt?.label ?? "");
                const display = label || `\u9009\u9879 ${idx + 1}`;
                const isSelected = selected.has(label) || selected.has(display);
                const activeCls = isSelected ? "ring-2 ring-accent/30 border-accent/40 bg-accent/5 shein-opt-active" : "";
                return `
                  <button type="button" data-shein-opt="1" data-value="${escapeHtml(display)}"
                    class="shein-opt-btn px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2 hover:bg-slate-50 ${activeCls}">
                    <span class="flex-1 break-words">${escapeHtml(display)}</span>
                    <i class="fas fa-check text-emerald-600 ${isSelected ? "" : "hidden"}"></i>
                  </button>
                `;
              })
              .join("")}
          </div>
        `;

        const buttons = Array.from(attrModalBody.querySelectorAll("[data-shein-opt]"));
        buttons.forEach((btn) => {
          btn.addEventListener("click", () => {
            const isMulti = attr.mode === "1";
            if (!isMulti) {
              buttons.forEach((b) => {
                b.classList.remove("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5", "shein-opt-active");
                b.querySelector("i")?.classList.add("hidden");
              });
            }
            const active = btn.classList.contains("shein-opt-active");
            if (isMulti) {
              if (active) {
                btn.classList.remove("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5", "shein-opt-active");
                btn.querySelector("i")?.classList.add("hidden");
              } else {
                btn.classList.add("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5", "shein-opt-active");
                btn.querySelector("i")?.classList.remove("hidden");
              }
            } else {
              btn.classList.add("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5", "shein-opt-active");
              btn.querySelector("i")?.classList.remove("hidden");
            }
          });
        });
      }
    }

    attrModalBody.scrollTop = 0;
    attrModal.classList.remove("hidden");
    attrModal.hidden = false;
    attrModal.style.display = "flex";
  };


  const closeAttrModal = () => {
    if (!attrModal) return;
    attrModal.classList.add("hidden");
    attrModal.hidden = true;
    attrModal.style.display = "none";
    activeAttrKey = "";
    activeModalMode = "attr";
    activeSpecKind = "";
  };

  const commitAttrModal = () => {
    if (activeModalMode === "spec") {
      const kind = activeSpecKind || "main";
      const isMain = kind === "main";
      const rows = Array.from(attrModalBody?.querySelectorAll("[data-spec-row]") || []).map((row) => {
        const name = String(row.querySelector("[data-spec-name]")?.value ?? "").trim();
        const value = String(row.querySelector("[data-spec-value]")?.value ?? "").trim();
        return { name, value };
      });
      const cleaned = rows.filter((r) => r.name && r.value);
      if (isMain) {
        if (!cleaned.length) {
          const msgEl = attrModalBody?.querySelector("#shein-spec-modal-msg");
          if (msgEl) {
            msgEl.textContent = "主规格至少选择 1 个属性值";
            msgEl.classList.remove("hidden");
          }
          return;
        }
        if (cleaned.length > 3) {
          const msgEl = attrModalBody?.querySelector("#shein-spec-modal-msg");
          if (msgEl) {
            msgEl.textContent = "主规格最多选择 3 个属性值";
            msgEl.classList.remove("hidden");
          }
          return;
        }
      }
      setSpecRows(kind, cleaned);
      closeAttrModal();
      renderSpecCards();
      syncSpecDefines();
      renderImagePreview();
      return;
    }
    const attr = sheinAttrByKey.get(activeAttrKey);
    if (!attr || !attrModalBody) return;
    if (attr.mode === "0") {
      const input = attrModalBody.querySelector("#shein-attr-input");
      const val = String(input?.value || "").trim();
      if (val) sheinAttrSelections.set(attr.key, { mode: attr.mode, value: val });
      else sheinAttrSelections.delete(attr.key);
    } else if (attr.mode === "4") {
      const rows = Array.from(attrModalBody.querySelectorAll("#shein-custom-rows > div")).map((row) => {
        const name = String(row.querySelector("[data-custom-name]")?.value ?? "").trim();
        const value = String(row.querySelector("[data-custom-value]")?.value ?? "").trim();
        return { name, value };
      });
      const missingName = rows.some((r) => !r.name);
      if (missingName) {
        const msgEl = attrModalBody.querySelector("#shein-custom-msg");
        if (msgEl) {
          msgEl.textContent = "\u8bf7\u4e3a\u6bcf\u4e00\u884c\u9009\u62e9\u540d\u79f0";
          msgEl.classList.remove("hidden");
        }
        return;
      }
      const cleaned = rows.filter((r) => r.name || r.value);
      if (cleaned.length) sheinAttrSelections.set(attr.key, { mode: attr.mode, rows: cleaned });
      else sheinAttrSelections.delete(attr.key);
    } else {
      const buttons = Array.from(attrModalBody.querySelectorAll(".shein-opt-active"));
      const values = buttons.map((el) => String(el.dataset.value || "").trim()).filter(Boolean);
      if (values.length) sheinAttrSelections.set(attr.key, { mode: attr.mode, values });
      else sheinAttrSelections.delete(attr.key);
    }
    closeAttrModal();
    renderSheinTemplateForm();
  };

  const renderRows = (list) => {
    if (!tbody) return;
    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML =
        '<tr class="table-row-hover transition"><td class="px-6 py-10 text-center text-xs text-slate-400" colspan="8">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map((g, idx) => {
        const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
        const goodsId = g?.goods_id ?? "-";
        const name = g?.goods_name ?? "-";
        const sn = g?.goods_sn ?? "-";
        const thumb = normalizeImgUrl(g?.goods_thumb ?? g?.goods_image ?? g?.goods_img ?? g?.img ?? "");
        const url = safeExternalUrl(g?.url);
        const time = g?.formated_add_time ?? g?.add_time ?? "-";
        const onSale = String(g?.is_on_sale ?? "");
        const review = String(g?.review_status ?? "");
        const price = g?.formated_shop_price ?? g?.shop_price ?? "-";

        const saleBadge =
          onSale === "1"
            ? statusBadge("在售", "border-emerald-200 bg-emerald-50 text-emerald-700")
            : statusBadge("未上架", "border-rose-200 bg-rose-50 text-rose-700");
        const reviewMeta = (() => {
          const map = {
            "1": { label: "未审核", cls: "border-slate-200 bg-slate-50 text-slate-600" },
            "2": { label: "审核未通过", cls: "border-rose-200 bg-rose-50 text-rose-700" },
            "3": { label: "审核通过", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
            "5": { label: "无需审核", cls: "border-slate-200 bg-slate-50 text-slate-600" },
          };
          const item = map[review];
          if (!review) return statusBadge("-", "border-slate-200 bg-slate-50 text-slate-500");
          if (item) return statusBadge(item.label, item.cls);
          return statusBadge(review, "border-slate-200 bg-slate-50 text-slate-700");
        })();

        const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";
        const nameHtml = url
          ? `<button type="button" ${openAttr} class="text-left text-xs font-black text-slate-900 hover:text-accent whitespace-normal break-words">${escapeHtml(
              name,
            )}</button>`
          : `<div class="text-xs font-black text-slate-900 whitespace-normal break-words">${escapeHtml(name)}</div>`;
        const thumbHtml = (() => {
          if (!thumb) {
            return '<div class="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400"><i class="fas fa-image"></i></div>';
          }
          const box = `<div class="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200" style="background-image: url('${escapeHtml(
            thumb,
          )}');"></div>`;
          return url ? `<button type="button" ${openAttr} class="block">${box}</button>` : box;
        })();

        const editBtn = `
          <button type="button" class="shein-edit inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700" data-shein-edit-id="${escapeHtml(
            goodsId,
          )}">
            <i class="fas fa-pen-to-square text-slate-500"></i>
            <span>编辑</span>
          </button>
        `;
        const toggleBtn = `
          <button type="button" class="shein-toggle-sale inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700" data-goods-id="${escapeHtml(
            goodsId,
          )}" data-next-val="${onSale === "1" ? "0" : "1"}">
            <i class="fas ${onSale === "1" ? "fa-toggle-on text-emerald-600" : "fa-toggle-off text-slate-400"} text-lg"></i>
            <span>${onSale === "1" ? "下架" : "上架"}</span>
          </button>
        `;
        const actions = `<div class="flex items-center justify-end gap-2">${editBtn}${toggleBtn}</div>`;

        return `
          <tr class="table-row-hover ${border} transition">
            <td class="px-6 py-4 font-medium text-slate-900">${escapeHtml(String(goodsId))}</td>
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
            <td class="px-6 py-4 whitespace-nowrap">${saleBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap">${reviewMeta}</td>
            <td class="px-6 py-4 text-right text-xs font-black text-slate-900">${escapeHtml(String(price))}</td>
            <td class="px-6 py-4 text-xs text-slate-500">${escapeHtml(String(time))}</td>
            <td class="px-6 py-4 text-right">${actions}</td>
          </tr>
        `;
      })
      .join("");
  };

  const load = async () => {
    refresh.disabled = true;
    refresh.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    setTableLoading("shein-goods-tbody", 8);
    setSummary("加载中...");
    try {
      const keywords = keywordsInput?.value?.trim() || "";
      const res = await postAuthedJson("/api/goods/lists", {
        page,
        size,
        is_tiktok: 0,
        ...(keywords ? { keywords } : {}),
      });

      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }

      if (String(res?.code) !== "0") {
        renderRows([]);
        setSummary(res?.msg || "加载失败");
        total = 0;
        setPager();
        return;
      }

      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      total = Number(res?.data?.num ?? list.length) || list.length;
      renderRows(list);
      setSummary(`本页 ${list.length} 条 · 共 ${total} 条`);
      setPager();
    } catch {
      renderRows([]);
      setSummary("网络异常，请稍后重试。");
    } finally {
      refresh.disabled = false;
      refresh.innerHTML = '<i class="fas fa-magnifying-glass mr-1"></i>搜索';
    }
  };

  const applyStepUnlocks = () => {
    const catOk = Boolean(getCatId());
    const tplOk = Boolean(templateRes);
    const specOk = hasValidMainSpec();
    const imgOk = validateSheinImagesReady().ok;
    const supplyOk = validateSheinSupplyReady().ok;
    lastUploadOk = imgOk && supplyOk;
    const unlocks = [true, catOk, Boolean(catOk && tplOk && specOk), Boolean(imgOk && supplyOk)];
    const btns = [stepBtn1, stepBtn2, stepBtn3, stepBtn4];
    const checks = [stepCheck1, stepCheck2, stepCheck3, stepCheck4];
    unlocks.forEach((on, idx) => {
      const btn = btns[idx];
      if (btn) {
        btn.disabled = !on;
        btn.classList.toggle("opacity-50", !on);
        btn.classList.toggle("cursor-not-allowed", !on);
      }
      const check = checks[idx];
      if (check) {
        check.hidden = !on;
        check.classList.toggle("hidden", !on);
      }
    });
    return unlocks;
  };

  const updateStepChecks = () => {
    applyStepUnlocks();
  };

  const setStep = (n) => {
    const unlocks = applyStepUnlocks();
    const maxUnlocked = Math.max(1, unlocks.lastIndexOf(true) + 1);
    sheinStep = Math.min(Math.max(n, 1), maxUnlocked);
    const panels = [panel1, panel2, panel3, panel4];
    panels.forEach((p, idx) => {
      if (!p) return;
      const show = idx + 1 <= sheinStep;
      p.hidden = !show;
      p.classList.toggle("hidden", !show);
    });
    const actionGroups = [
      [next1],
      [back2, next2],
      [back3, next3],
      [back4],
    ];
    actionGroups.forEach((group, idx) => {
      const on = idx + 1 === sheinStep;
      group.forEach((btn) => {
        if (!btn) return;
        btn.hidden = !on;
        btn.classList.toggle("hidden", !on);
      });
    });
    updateStepChecks();
  };

  const openAllSteps = () => {
    sheinStep = 4;
    const panels = [panel1, panel2, panel3, panel4];
    panels.forEach((p) => {
      if (!p) return;
      p.hidden = false;
      p.classList.remove("hidden");
    });
    const actionGroups = [
      [next1],
      [back2, next2],
      [back3, next3],
      [back4],
    ];
    actionGroups.forEach((group, idx) => {
      const on = idx === actionGroups.length - 1;
      group.forEach((btn) => {
        if (!btn) return;
        btn.hidden = !on;
        btn.classList.toggle("hidden", !on);
      });
    });
    updateStepChecks();
  };

  const renderImagePreview = () => {
    renderSheinImageCards();
    syncSheinImageJson();
    renderSupplyTable();
  };

  const resetUpload = () => {
    templateRes = null;
    lastTemplateCatId = "";
    lastUploadOk = false;
    lastSubmitOk = false;
    sheinAttrSelections.clear();
    sheinAttrList = [];
    sheinAttrByKey = new Map();
    sheinSpecMainList = [];
    sheinSpecOtherList = [];
    sheinSpecMainRows = [];
    sheinSpecOtherRows = [];
    sheinImageBuckets = new Map();
    renderSpecCards();
    syncSpecDefines();
    if (templatePre) templatePre.textContent = "";
    if (templateForm) templateForm.innerHTML = "";
    if (createPre) setPre(createPre, "");
    if (sheinOthersInput) sheinOthersInput.value = "";
    if (sheinGoodsAttrInput) sheinGoodsAttrInput.value = "";
    if (specDefinesInput) specDefinesInput.value = "";
    if (productSnInput) productSnInput.value = "";
    if (productNumberInput) productNumberInput.value = "";
    if (productPriceInput) productPriceInput.value = "";
    if (albumImagesInput) albumImagesInput.value = "";
    if (squareImagesInput) squareImagesInput.value = "";
    if (colorBlockImagesInput) colorBlockImagesInput.value = "";
    if (detailImagesInput) detailImagesInput.value = "";
    if (goodsNameInput) goodsNameInput.value = "";
    if (goodsSnInput) goodsSnInput.value = "";
    if (goodsBriefInput) goodsBriefInput.value = "";
    if (aliSellerSnInput) aliSellerSnInput.value = "";
    if (goodsWeightInput) goodsWeightInput.value = "";
    if (lengthInput) lengthInput.value = "";
    if (wideInput) wideInput.value = "";
    if (highInput) highInput.value = "";
    renderImagePreview();
    setTemplateMsg("");
    setTemplateVisibility(false);
    setStep(1);
  };

  if (refresh) {
    refresh.addEventListener("click", () => {
      page = 1;
      load();
    });
  }
  if (keywordsInput) {
    keywordsInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      page = 1;
      load();
    });
  }
  if (sizeInput) {
    sizeInput.addEventListener("blur", () => {
      const v = Number(sizeInput.value || 15);
      const nextSize = Math.max(1, Math.min(200, Math.floor(Number.isFinite(v) ? v : 15)));
      if (nextSize === size) return;
      size = nextSize;
      sizeInput.value = String(size);
      page = 1;
      load();
    });
  }
  if (prev) prev.addEventListener("click", () => { page = Math.max(1, page - 1); load(); });
  if (next) next.addEventListener("click", () => { page += 1; load(); });
  if (pageGo) {
    pageGo.addEventListener("click", () => {
      const v = Number(pageInput?.value || 1) || 1;
      page = Math.max(1, Math.floor(v));
      load();
    });
  }
  if (pageInput) {
    pageInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = Number(pageInput.value || 1) || 1;
      page = Math.max(1, Math.floor(v));
      load();
    });
  }

  if (tbody) {
    tbody.addEventListener("click", async (e) => {
      const editBtn = e.target?.closest?.(".shein-edit");
      if (editBtn) {
        const pending = editBtn.dataset.pending === "1";
        if (pending) return;
        const goodsId = String(editBtn.dataset.sheinEditId ?? "").trim();
        if (!goodsId) return;
        editBtn.dataset.pending = "1";
        const originalHtml = editBtn.innerHTML;
        editBtn.classList.add("opacity-70");
        editBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[11px]"></i>编辑中...';
        resetUpload();
        setSubView("upload", { updateHash: true });
        try {
          await loadSheinInfoForEdit(goodsId);
        } finally {
          editBtn.dataset.pending = "0";
          editBtn.classList.remove("opacity-70");
          editBtn.innerHTML = originalHtml;
        }
        return;
      }
      const btn = e.target?.closest?.(".shein-toggle-sale");
      if (!btn) return;
      const pending = btn.dataset.pending === "1";
      if (pending) return;
      const goodsId = String(btn.dataset.goodsId ?? "").trim();
      const nextVal = String(btn.dataset.nextVal ?? "").trim();
      if (!goodsId || (nextVal !== "0" && nextVal !== "1")) return;
      btn.dataset.pending = "1";
      const originalHtml = btn.innerHTML;
      btn.classList.add("opacity-70");
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[11px]"></i>切换中...';
      try {
        const res = await postAuthedJson("/api/goods/toggle_on_sale", { id: goodsId, val: nextVal });
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0") {
          setSummary(res?.msg || "操作失败");
          return;
        }
        setSummary(res?.msg || "操作成功");
        await load();
      } catch {
        setSummary("网络异常，请稍后重试。");
      } finally {
        btn.dataset.pending = "0";
        btn.classList.remove("opacity-70");
        btn.innerHTML = originalHtml;
      }
    });
  }

  const parseSubViewFromHash = () => {
    const raw = (window.location.hash || "").replace("#", "");
    if (!raw.startsWith("upload-shein")) return "";
    const q = raw.split("?")[1] || "";
    const params = new URLSearchParams(q);
    return params.get("mode") === "upload" ? "upload" : "";
  };

  const updateSheinHash = (mode) => {
    if (routeFromHash() !== "upload-shein") return;
    const params = new URLSearchParams();
    if (mode === "upload") params.set("mode", "upload");
    const q = params.toString();
    const next = q ? `#upload-shein?${q}` : "#upload-shein";
    if (window.location.hash !== next) window.location.hash = next;
  };

  const setSubView = (mode, opts) => {
    const m = mode === "upload" ? "upload" : "list";
    const updateHash = opts?.updateHash !== false;
    if (listWrap) {
      const show = m === "list";
      listWrap.hidden = !show;
      listWrap.classList.toggle("hidden", !show);
    }
    if (uploadWrap) {
      const show = m === "upload";
      uploadWrap.hidden = !show;
      uploadWrap.classList.toggle("hidden", !show);
    }
    if (updateHash && routeFromHash() === "upload-shein") updateSheinHash(m);
  };

  if (goUploadBtn) {
    goUploadBtn.addEventListener("click", () => {
      resetUpload();
      setSubView("upload", { updateHash: true });
    });
  }
  if (backToListBtn) backToListBtn.addEventListener("click", () => setSubView("list", { updateHash: true }));
  if (resetUploadBtn) resetUploadBtn.addEventListener("click", resetUpload);

  buildCategorySelector("shein-cat-select", "shein", "shein-cat-id");

  if (catOut) {
    const observer = new MutationObserver(() => {
      const catId = getCatId();
      const typeId = getTypeId();
      const pathText = String(catOut?.dataset?.catPathText || "").trim();
      const label = pathText || catId;
      if (catOutText) catOutText.textContent = label || "-";
      if (stepHint1) stepHint1.textContent = label ? `已选类目 ${label}` : "请选择叶子类目";
      if (catId && stepDot1) {
        stepDot1.classList.remove("bg-accent/10", "text-accent");
        stepDot1.classList.add("bg-emerald-100", "text-emerald-700");
      }
      const nextTypeId = typeId || catId;
      if (nextTypeId && nextTypeId !== lastTemplateCatId) {
        templateRes = null;
        sheinAttrSelections.clear();
        sheinAttrList = [];
        sheinAttrByKey = new Map();
        sheinSpecMainList = [];
        sheinSpecOtherList = [];
        sheinSpecMainRows = [];
        sheinSpecOtherRows = [];
        renderSpecCards();
        syncSpecDefines();
        renderImagePreview();
        if (templateForm) templateForm.innerHTML = "";
        fetchTemplate(nextTypeId, { silent: false });
      }
      updateStepChecks();
    });
    try {
      observer.observe(catOut, { childList: true, characterData: true, subtree: true });
    } catch {
      // ignore
    }
  }

  if (templateForm && !templateForm.dataset.bound) {
    templateForm.dataset.bound = "1";
    templateForm.addEventListener("click", (e) => {
      const card = e.target?.closest?.("[data-attr-card]");
      if (!card) return;
      const key = String(card.dataset.attrKey || "").trim();
      const attr = sheinAttrByKey.get(key);
      if (!attr) return;
      openAttrModal(attr);
    });
  }
  if (sheinSpecMainCard) {
    sheinSpecMainCard.addEventListener("click", () => openSpecModal("main"));
  }
  if (sheinSpecOtherCard) {
    sheinSpecOtherCard.addEventListener("click", () => openSpecModal("other"));
  }
  if (!document.body.dataset.sheinAttrBound) {
    document.body.dataset.sheinAttrBound = "1";
    document.addEventListener(
      "click",
      (e) => {
        const card = e.target?.closest?.("[data-attr-card]");
        if (!card) return;
        const key = String(card.dataset.attrKey || "").trim();
        const attr = sheinAttrByKey.get(key);
        if (!attr) return;
        openAttrModal(attr);
      },
      true
    );
  }

  if (attrModalOverlay) attrModalOverlay.addEventListener("click", closeAttrModal);
  if (attrModalClose) attrModalClose.addEventListener("click", closeAttrModal);
  if (attrModalCancel) attrModalCancel.addEventListener("click", closeAttrModal);
  if (attrModalConfirm) attrModalConfirm.addEventListener("click", commitAttrModal);
  if (attrModalClear) {
    attrModalClear.addEventListener("click", () => {
      if (activeModalMode === "spec") {
        if (activeSpecKind === "main") sheinSpecMainRows = [];
        if (activeSpecKind === "other") sheinSpecOtherRows = [];
        closeAttrModal();
        renderSpecCards();
        syncSpecDefines();
        renderImagePreview();
        return;
      }
      if (activeAttrKey) sheinAttrSelections.delete(activeAttrKey);
      closeAttrModal();
      renderSheinTemplateForm();
    });
  }

  if (stepBtn1) stepBtn1.addEventListener("click", () => setStep(1));
  if (stepBtn2) {
    stepBtn2.addEventListener("click", () => {
      if (stepBtn2.disabled) return;
      setStep(2);
      renderImagePreview();
    });
  }
  if (stepBtn3) {
    stepBtn3.addEventListener("click", () => {
      if (stepBtn3.disabled) return;
      if (!hasValidMainSpec()) {
        setImageHint("请先选择主规格名称和内容", true);
        return;
      }
      setStep(3);
      renderImagePreview();
    });
  }
  if (stepBtn4) {
    stepBtn4.addEventListener("click", () => {
      if (stepBtn4.disabled) return;
      const check = validateSheinImagesReady();
      if (!check.ok) {
        setImageHint(check.msg, true);
        setSupplyHint("");
        return;
      }
      const supplyCheck = validateSheinSupplyReady();
      if (!supplyCheck.ok) {
        setImageHint(supplyCheck.msg, true);
        setSupplyHint(supplyCheck.msg);
        return;
      }
      setImageHint("");
      setSupplyHint("");
      setStep(4);
    });
  }
  if (next1) next1.addEventListener("click", () => {
    if (!getCatId()) return;
    setStep(2);
  });
  if (back2) back2.addEventListener("click", () => setStep(1));
  if (next2) {
    next2.addEventListener("click", () => {
      if (!hasValidMainSpec()) {
        setImageHint("请先选择主规格名称和内容", true);
        return;
      }
      setStep(3);
      renderImagePreview();
    });
  }
  if (back3) back3.addEventListener("click", () => setStep(2));
  if (next3) {
    next3.addEventListener("click", () => {
      const check = validateSheinImagesReady();
      if (!check.ok) {
        setImageHint(check.msg, true);
        setSupplyHint("");
        return;
      }
      const supplyCheck = validateSheinSupplyReady();
      if (!supplyCheck.ok) {
        setImageHint(supplyCheck.msg, true);
        setSupplyHint(supplyCheck.msg);
        return;
      }
      setImageHint("");
      setSupplyHint("");
      setStep(4);
    });
  }
  if (back4) back4.addEventListener("click", () => setStep(3));

  const setSheinEditingId = (id) => {
    editingSheinGoodsId = String(id ?? "").trim();
    try {
      if (editingSheinGoodsId) window.sessionStorage.setItem("topm:shein-edit-id", editingSheinGoodsId);
      else window.sessionStorage.removeItem("topm:shein-edit-id");
    } catch {
      // ignore
    }
  };

  const applySheinEditData = async (info, goodsId) => {
    const id = String(goodsId ?? "").trim();
    if (!info || !id) return;
    setSheinEditingId(id);

    const cateListsRaw = parseMaybeJson(info?.cate_lists ?? info?.cateLists ?? "");
    const cateLists =
      Array.isArray(cateListsRaw) && Array.isArray(cateListsRaw[0]) ? cateListsRaw : null;
    const catState = buildCatInitialState(info);
    if (catState) {
      await buildCategorySelector("shein-cat-select", "shein", "shein-cat-id", {
        initialState: catState,
        levels: cateLists,
        restore: false,
        persist: false,
      });
    }
    const catId = String(catState?.leafId ?? info?.cat_id ?? info?.catId ?? info?.category_id ?? "").trim();
    const typeId = String(catState?.typeId ?? info?.type_id ?? info?.typeId ?? "").trim();
    const tplId = typeId || catId;
    if (tplId) await fetchTemplate(tplId, { silent: true, goodsId: id });

    setInputValue(goodsNameInput, info?.goods_name ?? info?.goodsName ?? info?.title ?? "");
    setInputValue(goodsSnInput, info?.goods_sn ?? info?.goodsSn ?? info?.sn ?? "");
    setInputValue(goodsBriefInput, info?.goods_brief ?? info?.goodsBrief ?? info?.brief ?? "");
    setInputValue(aliSellerSnInput, info?.ali_seller_sn ?? info?.aliSellerSn ?? "");
    setInputValue(goodsWeightInput, info?.goods_weight ?? info?.weight ?? "");
    setInputValue(lengthInput, info?.length ?? info?.goods_length ?? info?.long ?? "");
    setInputValue(wideInput, info?.wide ?? info?.width ?? "");
    setInputValue(highInput, info?.high ?? info?.height ?? "");

    const goodsAttrPayload =
      parseMaybeJson(info?.shein_goods_attr ?? info?.goods_attr ?? info?.goods_attrs ?? info?.goods_attr_arr);
    setTextareaJson(sheinGoodsAttrInput, goodsAttrPayload);
    setTextareaJson(sheinOthersInput, parseMaybeJson(info?.sheinOthers ?? info?.shein_others ?? info?.others));

    const specDefines = parseMaybeJson(info?.spec_defines ?? info?.specDefines ?? info?.spec_define ?? info?.specs);
    setTextareaJson(specDefinesInput, specDefines);

    const specArr = Array.isArray(specDefines) ? specDefines : [];
    if (specArr.length) {
      const main = specArr[0] || {};
      const other = specArr[1] || {};
      const mainVals = Array.isArray(main?.spec_value_vals) ? main.spec_value_vals : [];
      const otherVals = Array.isArray(other?.spec_value_vals) ? other.spec_value_vals : [];
      sheinSpecMainRows = mainVals
        .map((v) => ({ name: String(main?.type_name ?? main?.type_id ?? "主规格"), value: String(v ?? "").trim() }))
        .filter((r) => r.value);
      sheinSpecOtherRows = otherVals
        .map((v) => ({ name: String(other?.type_name ?? other?.type_id ?? "次规格"), value: String(v ?? "").trim() }))
        .filter((r) => r.value);
    }

    const productSn = parseMaybeJson(info?.product_sn ?? info?.productSn ?? info?.product_sn_list ?? "");
    const productNumber = parseMaybeJson(info?.product_number ?? info?.productNumber ?? info?.product_stock ?? "");
    const productPrice = parseMaybeJson(info?.product_price ?? info?.productPrice ?? info?.shop_price ?? "");
    setTextareaJson(productSnInput, productSn);
    setTextareaJson(productNumberInput, productNumber);
    setTextareaJson(productPriceInput, productPrice);

    const albumImages = parseMaybeJson(info?.album_images ?? info?.albumImages ?? "");
    const squareImages = parseMaybeJson(info?.square_images ?? info?.squareImages ?? "");
    const colorBlockImages = parseMaybeJson(info?.color_block_images ?? info?.colorBlockImages ?? "");
    const detailImages = parseMaybeJson(info?.detail_images ?? info?.detailImages ?? "");
    setTextareaJson(albumImagesInput, albumImages);
    setTextareaJson(squareImagesInput, squareImages);
    setTextareaJson(colorBlockImagesInput, colorBlockImages);
    setTextareaJson(detailImagesInput, detailImages);

    if (Array.isArray(productPrice) && sheinSpecMainRows.length) {
      const mainRows = sheinSpecMainRows.filter((r) => r?.name && r?.value);
      const otherRows = sheinSpecOtherRows.filter((r) => r?.name && r?.value);
      const prices = Array.isArray(productPrice) ? productPrice : [];
      const stocks = Array.isArray(productNumber) ? productNumber : [];
      const sns = Array.isArray(productSn) ? productSn : [];
      const next = new Map();
      let idx = 0;
      if (otherRows.length) {
        mainRows.forEach((main) => {
          otherRows.forEach((other) => {
            const key = buildSupplyKey(main, other);
            next.set(key, {
              main,
              other,
              price: String(prices[idx] ?? ""),
              stock: String(stocks[idx] ?? ""),
              sn: String(sns[idx] ?? ""),
            });
            idx += 1;
          });
        });
      } else {
        mainRows.forEach((main) => {
          const key = buildSupplyKey(main, null);
          next.set(key, {
            main,
            other: null,
            price: String(prices[idx] ?? ""),
            stock: String(stocks[idx] ?? ""),
            sn: String(sns[idx] ?? ""),
          });
          idx += 1;
        });
      }
      sheinSupplyRows = next;
    }

    const isRecord = (val) => val && typeof val === "object" && !Array.isArray(val);
    if (
      Array.isArray(albumImages) ||
      Array.isArray(squareImages) ||
      Array.isArray(colorBlockImages) ||
      Array.isArray(detailImages) ||
      isRecord(albumImages) ||
      isRecord(squareImages) ||
      isRecord(colorBlockImages) ||
      isRecord(detailImages)
    ) {
      const rows = sheinSpecMainRows.filter((r) => r?.name && r?.value);
      const idToValue = new Map();
      sheinSpecMainList.forEach((spec) => {
        spec.values.forEach((opt) => {
          const id = String(opt?.id ?? "").trim();
          const label = String(opt?.label ?? "").trim();
          if (id) idToValue.set(id, label);
        });
      });
      const nextBuckets = new Map();
      rows.forEach((row) => {
        nextBuckets.set(buildSpecKey(row), {
          name: String(row?.name ?? "").trim(),
          value: String(row?.value ?? "").trim(),
          images: { "2": [], "5": [], "6": [], "7": [] },
        });
      });
      const pushImages = (list, type) => {
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const name = String(item?.spec_name ?? item?.specName ?? "").trim();
            const value = String(item?.spec_value ?? item?.specValue ?? "").trim();
            const row = rows.find((r) => r.name === name && r.value === value) || rows[0];
            if (!row) return;
            const key = buildSpecKey(row);
            const bucket = nextBuckets.get(key);
            if (!bucket) return;
            const imgs = Array.isArray(item?.images) ? item.images : [];
            imgs.forEach((img) => {
              const url = String(img?.img_url ?? img?.url ?? "").trim();
              if (!url) return;
              bucket.images[type].push({ img_url: url, img_id: String(img?.img_id ?? "0") });
            });
          });
          return;
        }
        if (!isRecord(list)) return;
        Object.entries(list).forEach(([valueId, imgs]) => {
          const value = idToValue.get(String(valueId)) || "";
          const row = rows.find((r) => r.value === value) || rows[0];
          if (!row) return;
          const key = buildSpecKey(row);
          const bucket = nextBuckets.get(key);
          if (!bucket) return;
          const imgList = Array.isArray(imgs) ? imgs : [];
          imgList.forEach((img) => {
            const url = String(img?.img_url ?? img?.url ?? "").trim();
            if (!url) return;
            bucket.images[type].push({ img_url: url, img_id: String(img?.img_id ?? "0") });
          });
        });
      };
      pushImages(albumImages, "2");
      pushImages(squareImages, "5");
      pushImages(colorBlockImages, "6");
      pushImages(detailImages, "7");
      if (nextBuckets.size) sheinImageBuckets = nextBuckets;
    }

    renderSpecCards();
    syncSpecDefines();
    renderSheinTemplateForm();
    renderImagePreview();
    openAllSteps();
  };

  const loadSheinInfoForEdit = async (goodsId) => {
    const id = String(goodsId ?? "").trim();
    if (!id) return;
    setSummary("加载详情...");
    try {
      const res = await postAuthedJson("/api/shein/info", { goods_id: id, id });
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setSummary(res?.msg || "加载失败");
        return;
      }
      const data = res?.data?.data ?? res?.data ?? {};
      await applySheinEditData(data, id);
    } catch {
      setSummary("网络异常，请稍后重试。");
    }
  };

  async function fetchTemplate(typeId, opts = {}) {
    const tid = String(typeId ?? "").trim();
    if (!tid) return;
    const silent = opts?.silent === true;
    const goodsId = String(opts?.goodsId ?? "0").trim() || "0";
    if (templateBtn) templateBtn.disabled = true;
    // keep silent
    if (templatePre) templatePre.textContent = "";
    setTemplateVisibility(false);
    sheinAttrSelections.clear();
    sheinAttrList = [];
    sheinAttrByKey = new Map();
    if (templateForm) templateForm.innerHTML = '<div class=\"text-xs text-slate-400\">\u52a0\u8f7d\u4e2d...</div>';
    try {
      const res = await postAuthedJson("/api/shein/getAttributeTemplate", { goods_id: goodsId, type_id: tid });
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") return;
      templateRes = res;
      lastTemplateCatId = tid;
      if (templatePre) templatePre.textContent = "";
      const data = res?.data || {};
      sheinSpecMainList = normalizeSpecList(data?.pro_main_arr);
      sheinSpecOtherList = normalizeSpecList(data?.pro_other_arr);
      sheinSpecMainRows = [];
      sheinSpecOtherRows = [];
      renderSpecCards();
      syncSpecDefines();
      renderSheinTemplateForm();
      setTemplateVisibility(true);
      renderImagePreview();
    } catch {
      // keep silent
    } finally {
      if (templateBtn) templateBtn.disabled = false;
      updateStepChecks();
    }
  }

  if (templateBtn) {
    templateBtn.addEventListener("click", async () => {
      const catId = getCatId();
      const typeId = getTypeId() || catId;
      if (!catId) return;
      await fetchTemplate(typeId);
    });
  }
  if (templateClearBtn) {
    templateClearBtn.addEventListener("click", () => {
      templateRes = null;
      lastTemplateCatId = "";
      sheinAttrSelections.clear();
      sheinAttrList = [];
      sheinAttrByKey = new Map();
      sheinSpecMainList = [];
      sheinSpecOtherList = [];
      sheinSpecMainRows = [];
      sheinSpecOtherRows = [];
      if (templatePre) templatePre.textContent = "";
      if (templateForm) templateForm.innerHTML = "";
      renderSpecCards();
      syncSpecDefines();
      renderImagePreview();
      setTemplateVisibility(false);
      updateStepChecks();
    });
  }

  const readImageSize = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const info = { width: img.width, height: img.height };
        URL.revokeObjectURL(url);
        resolve(info);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("load_failed"));
      };
      img.src = url;
    });

  const ratioMatch = (value, list) => {
    const tolerance = 0.02;
    return list.some((r) => Math.abs(value - r) <= tolerance);
  };

  const validateSheinImageFile = async (file, type) => {
    const meta = IMAGE_TYPE_META[type];
    if (!meta) return "不支持的图片类型";
    const isJpg = file.type === "image/jpeg";
    const isPng = file.type === "image/png";
    if (!isJpg && !isPng) return "仅支持 JPG/JPEG/PNG 格式";
    if (file.size > 3 * 1024 * 1024) return "图片大小需小于 3MB";
    const { width, height } = await readImageSize(file);
    if (type === "6") {
      if (width !== 80 || height !== 80) return "色块图需为 80×80 像素";
      return "";
    }
    const ratio = width / height;
    if (!ratioMatch(ratio, meta.ratios)) return `图片比例不符合 ${meta.ratios.map((r) => r.toFixed(2)).join("/")}`;
    if (meta.min && (width < meta.min || height < meta.min)) return `图片像素需 ≥ ${meta.min}`;
    if (meta.maxSize && (width > meta.maxSize || height > meta.maxSize)) return `图片像素需 ≤ ${meta.maxSize}`;
    return "";
  };

  const setCardMsg = (card, msg) => {
    if (!card) return;
    const msgEl = card.querySelector("[data-image-msg]");
    if (!msgEl) return;
    if (!msg) {
      msgEl.classList.add("hidden");
      msgEl.textContent = "";
      return;
    }
    msgEl.classList.remove("hidden");
    msgEl.textContent = msg;
  };

  const uploadSheinImage = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    if (type) formData.append("image_type", type);
    const res = await postAuthedFormData("/api/shein/upload_shein_img", formData);
    if (String(res?.code) === "2") {
      clearAuth();
      window.location.href = "./login.html";
      return null;
    }
    if (String(res?.code) !== "0") return { error: res?.msg || "上传失败" };
    const raw = res?.data || res;
    const imgUrl =
      raw?.img_url || raw?.url || raw?.data?.img_url || raw?.data?.url || extractFirstUrl(JSON.stringify(raw));
    if (!imgUrl) return { error: "上传失败" };
    return { img_url: imgUrl, img_id: raw?.img_id || "0" };
  };

  if (imagePreview && !imagePreview.dataset.bound) {
    imagePreview.dataset.bound = "1";
    imagePreview.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-image-upload]");
      if (!btn) return;
      const card = btn.closest("[data-image-card]");
      if (!card) return;
      const input = card.querySelector("[data-image-input]");
      if (input) input.click();
    });

    imagePreview.addEventListener("change", async (e) => {
      const input = e.target;
      if (!input?.matches?.("[data-image-input]")) return;
      const card = input.closest("[data-image-card]");
      if (!card) return;
      const specKey = card.dataset.specKey || "";
      const type = card.dataset.imageType || "";
      const bucket = sheinImageBuckets.get(specKey);
      if (!bucket || !IMAGE_TYPE_META[type]) return;
      const files = Array.from(input.files || []);
      input.value = "";
      if (!files.length) return;

      const max = IMAGE_TYPE_META[type].max || 999;
      const current = bucket.images[type]?.length || 0;
      if (current >= max) {
        setCardMsg(card, `最多上传 ${max} 张`);
        return;
      }

      let updated = false;
      for (const file of files) {
        if ((bucket.images[type]?.length || 0) >= max) break;
        const error = await validateSheinImageFile(file, type);
        if (error) {
          setCardMsg(card, error);
          continue;
        }
        setCardMsg(card, "上传中...");
        const res = await uploadSheinImage(file, type);
        if (res?.error) {
          setCardMsg(card, res.error);
          continue;
        }
        bucket.images[type].push(res);
        lastUploadOk = true;
        setCardMsg(card, "");
        updated = true;
      }
      if (updated) renderImagePreview();
    });

    imagePreview.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-image-remove]");
      if (!btn) return;
      const specKey = String(btn.dataset.specKey || "");
      const type = String(btn.dataset.imageType || "");
      const idx = Number(btn.dataset.imageIdx || 0);
      const bucket = sheinImageBuckets.get(specKey);
      if (!bucket || !bucket.images?.[type]) return;
      bucket.images[type].splice(idx, 1);
      renderImagePreview();
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const catId = getCatId();
      if (!catId) {
        setPre(createPre, { code: "1", msg: "请先选择类目" });
        return;
      }
      syncSheinGoodsAttr();
      syncSheinOthers();
      const payload = {
        goods_name: String(goodsNameInput?.value || "").trim(),
        goods_sn: String(goodsSnInput?.value || "").trim(),
        cat_id: catId,
        goods_brief: String(goodsBriefInput?.value || "").trim(),
        ali_seller_sn: String(aliSellerSnInput?.value || "").trim(),
        sheinOthers: ensureJsonString(sheinOthersInput?.value || ""),
        goods_weight: String(goodsWeightInput?.value || "").trim(),
        length: String(lengthInput?.value || "").trim(),
        wide: String(wideInput?.value || "").trim(),
        high: String(highInput?.value || "").trim(),
        shein_goods_attr: parseJsonMaybe(sheinGoodsAttrInput?.value),
        product_sn: parseJsonMaybe(productSnInput?.value),
        product_number: parseJsonMaybe(productNumberInput?.value),
        product_price: parseJsonMaybe(productPriceInput?.value),
        spec_defines: parseJsonMaybe(specDefinesInput?.value),
        album_images: parseJsonMaybe(albumImagesInput?.value),
        square_images: parseJsonMaybe(squareImagesInput?.value),
        color_block_images: parseJsonMaybe(colorBlockImagesInput?.value),
        detail_images: parseJsonMaybe(detailImagesInput?.value),
      };
      createBtn.disabled = true;
      createBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>提交中...';
      try {
        const res = await postAuthedJson("/api/shein/insert", payload);
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        lastSubmitOk = String(res?.code) === "0";
        if (lastSubmitOk) {
          if (createPre) createPre.textContent = "";
          if (stepHint4) stepHint4.textContent = "";
          resetUpload();
          setSubView("list", { updateHash: true });
          try {
            window.localStorage.removeItem("topm:cat-selection:shein");
            window.sessionStorage.removeItem("topm:shein-edit-id");
          } catch {
            // ignore
          }
          return;
        }
        setPre(createPre, res);
        if (stepHint4) stepHint4.textContent = "提交失败";
      } catch {
        setPre(createPre, { code: "1", msg: "提交失败" });
      } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>提交';
        updateStepChecks();
      }
    });
  }

  setSubView(parseSubViewFromHash() || "list", { updateHash: false });
  window.addEventListener("hashchange", () => {
    if (routeFromHash() !== "upload-shein") return;
    const mode = parseSubViewFromHash() || "list";
    setSubView(mode, { updateHash: false });
  });

  renderSpecCards();
  syncSpecDefines();
  renderImagePreview();
  setStep(1);
  load();
}
