import { postAuthedFormData, postAuthedJson, postAuthedUrlEncoded } from "../js/apiClient.js";
import { clearAuth } from "../js/auth.js";
import {
  buildCategorySelector,
  escapeHtml,
  renderTemuGoodsTableInto,
  routeFromHash,
  safeExternalUrl,
  setPre,
  setTableLoading,
  statusBadge,
} from "./dashboard-shared.js";

export function setupTemu() {
  const reset = document.getElementById("temu-reset");
  const goUploadBtn = document.getElementById("temu-go-upload");
  const backToListBtn = document.getElementById("temu-back-to-list");
  const listWrap = document.getElementById("temu-list-wrap");
  const uploadWrap = document.getElementById("temu-upload-wrap");
  const stepBtn1 = document.getElementById("temu-step-1-btn");
  const stepBtn2 = document.getElementById("temu-step-2-btn");
  const stepBtn3 = document.getElementById("temu-step-3-btn");
  const stepBtn4 = document.getElementById("temu-step-4-btn");
  const stepBtn5 = document.getElementById("temu-step-5-btn");
  const stepDot1 = document.getElementById("temu-step-1-dot");
  const stepDot2 = document.getElementById("temu-step-2-dot");
  const stepDot3 = document.getElementById("temu-step-3-dot");
  const stepDot4 = document.getElementById("temu-step-4-dot");
  const stepDot5 = document.getElementById("temu-step-5-dot");
  const stepCheck1 = document.getElementById("temu-step-1-check");
  const stepCheck2 = document.getElementById("temu-step-2-check");
  const stepCheck3 = document.getElementById("temu-step-3-check");
  const stepCheck4 = document.getElementById("temu-step-4-check");
  const stepCheck5 = document.getElementById("temu-step-5-check");
  const stepHint1 = document.getElementById("temu-step-1-hint");
  const stepHint2 = document.getElementById("temu-step-2-hint");
  const stepHint3 = document.getElementById("temu-step-3-hint");
  const stepHint4 = document.getElementById("temu-step-4-hint");
  const stepHint5 = document.getElementById("temu-step-5-hint");
  const panel1 = document.getElementById("temu-step-1-panel");
  const panel2 = document.getElementById("temu-step-2-panel");
  const panel3 = document.getElementById("temu-step-3-panel");
  const panel4 = document.getElementById("temu-step-4-panel");
  const panel5 = document.getElementById("temu-step-5-panel");
  const actions1 = document.getElementById("temu-step-1-actions");
  const actions2 = document.getElementById("temu-step-2-actions");
  const actions3 = document.getElementById("temu-step-3-actions");
  const actions4 = document.getElementById("temu-step-4-actions");
  const actions5 = document.getElementById("temu-step-5-actions");
  const next1 = document.getElementById("temu-step-next-1");
  const next2 = document.getElementById("temu-step-next-2");
  const next3 = document.getElementById("temu-step-next-3");
  const next4 = document.getElementById("temu-step-next-4");
  const back2 = document.getElementById("temu-step-back-2");
  const back3 = document.getElementById("temu-step-back-3");
  const back4 = document.getElementById("temu-step-back-4");
  const back5 = document.getElementById("temu-step-back-5");
  const templateBtn = document.getElementById("temu-fetch-template");
  const templatePre = document.getElementById("temu-template");
  const templateFormMsg = document.getElementById("temu-template-form-msg");
  const templateForm = document.getElementById("temu-template-form");
  const templateClearBtn = document.getElementById("temu-template-clear");
  const fileInput = document.getElementById("temu-file");
  const uploadBtn = document.getElementById("temu-upload");
  const uploadPre = document.getElementById("temu-upload-result");
  const detailImgsTextarea = document.getElementById("temu-detail-imgs");
  const imagePreview = document.getElementById("temu-image-preview");
  const createBtn = document.getElementById("temu-create");
  const createPre = document.getElementById("temu-create-result");
  const createToast = document.getElementById("temu-create-toast");
  const createBtnDefaultHtml = createBtn ? createBtn.innerHTML : "";
  const salesAttrsEl = document.getElementById("temu-sales-attrs");
  const salesAttrsMsg = document.getElementById("temu-sales-attrs-msg");
  const salesAttrValuesEl = document.getElementById("temu-sales-attr-values");
  const skuGridEl = document.getElementById("temu-sku-grid");
  const skuModal = document.getElementById("temu-sku-modal");
  const skuModalOverlay = document.getElementById("temu-sku-modal-overlay");
  const skuModalClose = document.getElementById("temu-sku-modal-close");
  const skuModalTitle = document.getElementById("temu-sku-modal-title");
  const skuModalSubtitle = document.getElementById("temu-sku-modal-subtitle");
  const skuModalStatus = document.getElementById("temu-sku-modal-status");
  const skuModalImages = document.getElementById("temu-sku-modal-images");
  const skuModalUpload = document.getElementById("temu-sku-modal-upload");
  const skuModalFile = document.getElementById("temu-sku-modal-file");

  const catOut = document.getElementById("temu-cat-id");
  if (!catOut) return;
  const catRoot = document.getElementById("temu-cat-select");

  buildCategorySelector("temu-cat-select", "temu", "temu-cat-id");

  let activeUploadStep = 1;
  let lastTemplateRes = null;
  let lastUploadRes = null;
  const templateSelections = new Map();
  const salesAttrSelections = new Map();
  const skuDraft = new Map();
  const skuDraftSingleCache = new Map();
  let skuAttrIdsByIndex = [];
  let lastTemuInfo = null;
  let activeSkuKey = "";
  const forcedTemplatePidKeys = new Set();
  let cardsByPid = new Map();
  let itemsByPid = new Map();
  let childSlotByPid = new Map();
  let parentTplToChildPidKeys = new Map();
  let templatePidByPidKey = new Map();
  let lastTemplateCatId = "";
  let templateFetchInFlight = false;
  let editingTemuGoodsId = "";
  let applyingTemuEdit = false;

  const isCatSelected = () => {
    const v = String(catOut?.textContent ?? "").trim();
    return Boolean(v) && v !== "-";
  };
  const showTemplateMsg = (message) => {
    if (!templateFormMsg) return;
    if (!message) {
      templateFormMsg.classList.add("hidden");
      templateFormMsg.textContent = "";
      return;
    }
    templateFormMsg.classList.remove("hidden");
    templateFormMsg.textContent = message;
  };

  const getTemplateItems = () => {
    const data = lastTemplateRes?.data || {};
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.templateInfo)) return data.templateInfo;
    if (Array.isArray(data?.template_info)) return data.template_info;
    if (Array.isArray(data?.templateList)) return data.templateList;
    if (Array.isArray(data?.template_list)) return data.template_list;
    if (Array.isArray(data?.template)) return data.template;
    return [];
  };

  const pidKeyFromItem = (item, idx = 0) => {
    const base = String(item?.pid ?? "pid").trim() || "pid";
    return `${base}::${idx}`;
  };

  const getItemPidKey = (item) => item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0);

  const getSelectionForItem = (item) => templateSelections.get(getItemPidKey(item));

  const normalizeUnitId = (u) =>
    String(
      u?.valueUnitId ??
        u?.value_unit_id ??
        u?.valueUnitID ??
        u?.unitId ??
        u?.unit_id ??
        u?.unitID ??
        u?.id ??
        u
    ).trim();

  const normalizeUnitValue = (u) =>
    String(u?.valueUnit ?? u?.unit ?? u?.value ?? u?.code ?? u ?? "").trim();

  const isCompositionItem = (item) => {
    const name = String(item?.name ?? "").trim();
    const ct = Number(item?.controlType ?? item?.control_type ?? item?.controltype ?? 0) || 0;
    return /composition/i.test(name) || ct === 16;
  };

  const resolveUnitLabel = (item, raw) => {
    const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
    const match = unitList.find((u) => {
      const val = normalizeUnitValue(u);
      const id = normalizeUnitId(u);
      const needle = String(raw ?? "").trim();
      return (val && val === needle) || (id && id === needle);
    });
    if (!match) return String(raw ?? "").trim();
    return (
      String(
        match?.unitName ??
          match?.name ??
          match?.label ??
          match?.text ??
          match?.value ??
          match?.unit ??
          match?.valueUnit ??
          raw ??
          ""
      ).trim() || String(raw ?? "").trim()
    );
  };

  const formatValueWithUnit = (item, value, unit) => {
    const v = String(value ?? "").trim();
    const u = String(unit ?? "").trim();
    if (!v) return "";
    if (!u) return v;
    const unitLabel = resolveUnitLabel(item, u);
    return `${v} ${unitLabel}`;
  };

  const isItemSelfDone = (item) => {
    const sel = getSelectionForItem(item);
    if (!sel) return false;
    const values = Array.isArray(sel?.values) ? sel.values : null;
    if (values && values.length) return true;
    const v = String(sel?.value ?? "").trim();
    if (!v) return false;
    const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
    if (unitList.length === 0) return true;
    return Boolean(String(sel?.valueUnit ?? sel?.valueUnitId ?? "").trim());
  };

  const isItemDoneDeep = (item, seen = new Set()) => {
    const pidKey = getItemPidKey(item);
    if (!pidKey) return false;
    if (seen.has(pidKey)) return true;
    seen.add(pidKey);

    if (!isItemSelfDone(item)) return false;

    const tplKey = templatePidByPidKey.get(pidKey) || "0";
    const childSet = parentTplToChildPidKeys.get(tplKey);
    if (!childSet || !childSet.size) return true;

    for (const childPidKey of childSet) {
      const childItem = itemsByPid.get(childPidKey);
      if (!childItem) continue;

      const requiredNow = Boolean(childItem?.required) || forcedTemplatePidKeys.has(childPidKey);
      if (!requiredNow) continue;

      const cards = cardsByPid.get(childPidKey);
      if (cards && cards.size) {
        const anyVisible = Array.from(cards).some((c) => !c.dataset.parentTemplatePid || c.dataset.dependentVisible === "1");
        if (!anyVisible) continue;
      }

      if (!isItemDoneDeep(childItem, seen)) return false;
    }

    return true;
  };

  const getSelectedTemplatePayload = () => {
    const selected = [];
    const stripInternal = (obj) => {
      const out = {};
      Object.entries(obj || {}).forEach(([key, val]) => {
        if (String(key || "").startsWith("__")) return;
        out[key] = val;
      });
      return out;
    };
    const compactPayload = (obj) => {
      const out = {};
      Object.entries(obj || {}).forEach(([key, val]) => {
        if (val == null) return;
        if (typeof val === "string" && val.trim() === "") return;
        if (Array.isArray(val) && val.length === 0) return;
        if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0) return;
        if (typeof val === "string" && val.trim().toLowerCase() === "null") return;
        out[key] = val;
      });
      return out;
    };
    const normalizeValueKey = (v) =>
      String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? v?.value ?? "").trim();
    const pickSelectedValues = (item, selValues) => {
      const rawValues = Array.isArray(item?.values) ? item.values : [];
      if (!Array.isArray(selValues) || selValues.length === 0) return [];
      const wanted = new Set(selValues.map(normalizeValueKey).filter(Boolean));
      const picked = rawValues.filter((v) => wanted.has(normalizeValueKey(v)));
      if (picked.length) return picked;
      return selValues;
    };
    const hasMeaningfulValue = (val) => {
      if (val == null) return false;
      if (typeof val === "string") return val.trim() !== "";
      return true;
    };
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const pushSelected = (item, sel) => {
      const pid = item?.pid;
      if (pid == null) return;
      const selValues = Array.isArray(sel?.values) ? sel.values : null;
      const hasValues = Array.isArray(selValues) && selValues.length > 0;
      const hasValue = hasMeaningfulValue(sel?.value);
      if (!hasValues && !hasValue) return;
      const payload = stripInternal(item);
      const isComposition = isCompositionItem(item);
      const needsPercentUnit = isComposition && !item?.required;
      if (isComposition) {
        payload.valueUnit = needsPercentUnit ? "%" : null;
        payload.valueUnitId = null;
        payload.valueUnitName = needsPercentUnit ? "%" : null;
      }
      if (selValues && selValues.length) {
        const selectedValues = pickSelectedValues(item, selValues);
        if (isComposition) {
          const valueIndex = new Map(
            (Array.isArray(item?.values) ? item.values : [])
              .map((v) => [String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim(), v])
              .filter((pair) => pair[0])
          );
          payload.value = (Array.isArray(selValues) ? selValues : [])
            .map((v) => {
              const vid = v?.vid ?? v?.vvid ?? v?.key ?? null;
              const vidKey = String(vid ?? "").trim();
              const ref = valueIndex.get(vidKey);
              const percent = toNumber(v?.percent ?? v?.vvale ?? v?.ratio ?? v?.pct ?? null);
              return {
                vvid: vid,
                vvale: percent,
                value: v?.value ?? v?.name ?? v?.label ?? ref?.value ?? ref?.name ?? ref?.label ?? vidKey,
              };
            })
            .filter((v) => v.vvid != null && v.vvale != null);
          payload.values = null;
          payload.vid = null;
        } else {
          payload.values = Array.isArray(item?.values) ? item.values : selectedValues;
          if (selectedValues.length === 1) {
            payload.vid = selectedValues[0]?.vid ?? payload.vid ?? null;
            payload.value = selectedValues[0]?.value ?? payload.value ?? null;
          } else if (selectedValues.length > 1) {
            payload.vid = selectedValues.map((v) => v?.vid).filter((v) => v != null).join(",") || payload.vid || null;
            payload.value =
              selectedValues
                .map((v) => v?.value ?? v?.vid ?? "")
                .map((v) => String(v ?? "").trim())
                .filter(Boolean)
                .join(",") || payload.value || null;
          }
        }
      } else {
        payload.values = Array.isArray(item?.values) ? item.values : null;
        payload.value = sel?.value ?? payload.value ?? null;
        if (!isComposition) {
          payload.valueUnit = sel?.valueUnit ?? payload.valueUnit ?? null;
          payload.valueUnitId = sel?.valueUnitId ?? payload.valueUnitId ?? null;
          payload.valueUnitName = sel?.valueUnitName ?? payload.valueUnitName ?? null;
        }
      }
      selected.push(compactPayload(payload));
    };

    if (itemsByPid.size > 0) {
      for (const [pidKey, sel] of templateSelections.entries()) {
        const item = itemsByPid.get(pidKey);
        if (!item || !sel) continue;
        pushSelected(item, sel);
      }
      return selected;
    }

    const items = getTemplateItems();
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const sel = templateSelections.get(pidKeyFromItem(item, i));
      if (!sel) continue;
      pushSelected(item, sel);
    }
    return selected;
  };

  const renderSelectedTemplateJson = () => {};

  const isTemplateFilledOk = () => {
    if (String(lastTemplateRes?.code ?? "") !== "0") return false;
    // Prefer rendered index for deep dependency awareness; fall back to basic check if not ready.
    if (itemsByPid.size > 0) {
      for (const [pidKey, item] of itemsByPid.entries()) {
        const requiredNow = Boolean(item?.required) || forcedTemplatePidKeys.has(pidKey);
        if (!requiredNow) continue;
        if (!isItemDoneDeep(item)) return false;
      }
      return true;
    }
    const items = getTemplateItems();
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const key = pidKeyFromItem(item, i);
      const requiredNow = Boolean(item?.required) || forcedTemplatePidKeys.has(key);
      if (!requiredNow) continue;
      const sel = templateSelections.get(key);
      const hasValues = Array.isArray(sel?.values) && sel.values.length > 0;
      const hasValue = sel?.value != null && String(sel.value).trim() !== "";
      if (!hasValues && !hasValue) return false;
    }
    return true;
  };

  const parseDetailImgsValue = () => {
    const raw = String(detailImgsTextarea?.value ?? "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const getSalesAttrList = () => {
    const data = lastTemplateRes?.data || {};
    if (Array.isArray(data)) {
      const byId = new Map();
      data.forEach((item, idx) => {
        if (!item || typeof item !== "object") return;
        const isSale = item?.isSale ?? item?.is_sale ?? item?.sale ?? null;
        const mainSale = item?.mainSale ?? item?.main_sale ?? null;
        if (
          isSale === false ||
          isSale === "false" ||
          isSale === 0 ||
          isSale === "0" ||
          (isSale == null && !mainSale)
        ) {
          return;
        }
        const id = String(
          item?.parentSpecId ??
            item?.parent_spec_id ??
            item?.specId ??
            item?.spec_id ??
            item?.pid ??
            item?.templatePid ??
            item?.template_pid ??
            item?.id ??
            idx
        ).trim();
        const name = String(
          item?.propertyChooseTitle ??
            item?.property_choose_title ??
            item?.name ??
            item?.specName ??
            item?.spec_name ??
            item?.parentSpecName ??
            item?.parent_spec_name ??
            ""
        ).trim();
        if (!id || !name) return;
        if (!byId.has(id)) byId.set(id, { id, name });
      });
      return Array.from(byId.values());
    }
    const list = Array.isArray(data?.userInputParentSpecList) ? data.userInputParentSpecList : [];
    if (list.length) {
      return list
        .map((item, idx) => {
          const id = String(
            item?.parentSpecId ??
              item?.parent_spec_id ??
              item?.parent_specId ??
              item?.specId ??
              item?.spec_id ??
              item?.id ??
              idx
          ).trim();
          const name = String(
            item?.parentSpecName ??
              item?.parent_spec_name ??
              item?.parent_specName ??
              item?.specName ??
              item?.spec_name ??
              item?.name ??
              ""
          ).trim();
          if (!id || !name) return null;
          return { id, name };
        })
        .filter(Boolean);
    }

    const fromSpecProps = Array.isArray(data?.goodsSpecProperties) ? data.goodsSpecProperties : [];
    if (fromSpecProps.length) {
      const byId = new Map();
      fromSpecProps.forEach((item, idx) => {
        if (!item || typeof item !== "object") return;
        const isSale = item?.isSale ?? item?.is_sale ?? item?.sale ?? null;
        if (isSale === false || isSale === "false" || isSale === 0 || isSale === "0") return;
        const id = String(
          item?.parentSpecId ??
            item?.parent_spec_id ??
            item?.specId ??
            item?.spec_id ??
            item?.pid ??
            item?.templatePid ??
            item?.template_pid ??
            item?.id ??
            idx
        ).trim();
        const name = String(
          item?.propertyChooseTitle ??
            item?.property_choose_title ??
            item?.name ??
            item?.specName ??
            item?.spec_name ??
            item?.parentSpecName ??
            item?.parent_spec_name ??
            ""
        ).trim();
        if (!id || !name) return;
        if (!byId.has(id)) byId.set(id, { id, name });
      });
      return Array.from(byId.values());
    }

    const fallback = Array.isArray(data?.specList) ? data.specList : Array.isArray(data?.spec_list) ? data.spec_list : [];
    return fallback
      .map((item, idx) => {
        const id = String(item?.spec_id ?? item?.specId ?? item?.id ?? idx).trim();
        const name = String(item?.spec_name ?? item?.specName ?? item?.name ?? "").trim();
        if (!id || !name) return null;
        return { id, name };
      })
      .filter(Boolean);
  };

  const setSalesMsg = (text, kind = "info") => {
    if (!salesAttrsMsg) return;
    const t = String(text || "");
    if (!t) {
      salesAttrsMsg.textContent = "";
      salesAttrsMsg.className = "text-[11px] text-slate-400";
      return;
    }
    salesAttrsMsg.textContent = t;
    salesAttrsMsg.className =
      kind === "error" ? "text-[11px] text-rose-600" : kind === "ok" ? "text-[11px] text-emerald-600" : "text-[11px] text-slate-500";
  };

  const renderSalesAttrs = () => {
    if (!salesAttrsEl) return;
    const list = getSalesAttrList();
    const selectedIds = new Set(Array.from(salesAttrSelections.keys()));
    if (!list.length) {
      salesAttrsEl.innerHTML = '<span class="text-[11px] text-slate-400">暂无销售属性</span>';
      setSalesMsg("未返回销售属性，请先获取模板。");
      return;
    }
    salesAttrsEl.innerHTML = list
      .map((item) => {
        const active = selectedIds.has(item.id);
        const cls = active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
        return `<button type="button" data-sales-spec-id="${escapeHtml(item.id)}" class="px-3 py-1.5 rounded-full text-xs font-semibold border ${cls}">${escapeHtml(
          item.name,
        )}</button>`;
      })
      .join("");
    if (selectedIds.size === 0) {
      setSalesMsg("请选择至少 1 个销售属性。");
    } else if (selectedIds.size >= 2) {
      setSalesMsg("已选择 2 个销售属性（最多 2 个）。", "ok");
    } else {
      setSalesMsg("可再选择 1 个销售属性。", "info");
    }
  };

  const renderSalesAttrValues = () => {
    if (!salesAttrValuesEl) return;
    const selections = Array.from(salesAttrSelections.values());
    if (!selections.length) {
      salesAttrValuesEl.innerHTML = '<div class="text-[11px] text-slate-400">先选择销售属性，再添加属性值。</div>';
      return;
    }
    salesAttrValuesEl.innerHTML = selections
      .map((sel) => {
        const values = Array.isArray(sel.values) ? sel.values : [];
        const chips = values
          .map(
            (v) => `
              <span class="inline-flex items-center gap-2 text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-full">
                <span>${escapeHtml(v.value)}</span>
                <button type="button" data-sales-value-remove="${escapeHtml(sel.id)}" data-sales-value-id="${escapeHtml(
              v.goods_attr_id,
            )}" class="text-rose-600 hover:text-rose-700">
                  <i class="fas fa-xmark"></i>
                </button>
              </span>
            `,
          )
          .join("");
        return `
          <div class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3" data-sales-block="${escapeHtml(sel.id)}">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-slate-700">${escapeHtml(sel.name)}</div>
              <div class="text-[11px] text-slate-400">已添加 ${values.length} 个</div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <input data-sales-value-input="${escapeHtml(sel.id)}" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" placeholder="填写属性值" />
              <button type="button" data-sales-value-add="${escapeHtml(
                sel.id,
              )}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">添加</button>
            </div>
            <div class="flex flex-wrap gap-2">${chips || '<span class="text-[11px] text-slate-400">未添加值</span>'}</div>
          </div>
        `;
      })
      .join("");
  };

  const getSalesCombos = () => {
    const selections = Array.from(salesAttrSelections.values());
    if (!selections.length) return [];
    const lists = selections.map((sel) =>
      (Array.isArray(sel.values) ? sel.values : []).map((v) => ({
        specId: sel.id,
        specName: sel.name,
        value: v.value,
        goods_attr_id: String(v.goods_attr_id ?? "").trim(),
      })),
    );
    if (lists.some((l) => l.length === 0)) return [];
    return lists.reduce(
      (acc, list) => acc.flatMap((prev) => list.map((cur) => prev.concat([cur]))),
      [[]],
    );
  };

  const normalizeGoodsAttrKey = (raw) => {
    const list = parseMaybeList(raw)
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
    if (!list.length) return "";
    return Array.from(new Set(list)).sort().join(",");
  };

  const syncSkuDraftKeys = (keys) => {
    const keySet = new Set(keys);
    for (const k of Array.from(skuDraft.keys())) {
      if (!keySet.has(k)) skuDraft.delete(k);
    }
  };

  const renderSkuGrid = () => {
    if (!skuGridEl) return;
    if (applyingTemuEdit && lastTemuInfo) {
      syncSalesAttrIdsFromProducts(lastTemuInfo);
    }
    const remapSalesAttrIdsWithSku = () => {
      if (!salesAttrSelections.size) return;
      let candidateIdsByIndex = skuAttrIdsByIndex;
      if (!candidateIdsByIndex.length && lastTemuInfo) {
        const products = parseMaybeArray(lastTemuInfo?.products) || parseMaybeArray(lastTemuInfo?.product_list) || [];
        const idsByIndex = [];
        products.forEach((p) => {
          const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
          if (!raw) return;
          const ids = parseMaybeList(raw)
            .map((id) => String(id ?? "").trim())
            .filter(Boolean);
          ids.forEach((id, idx) => {
            if (!idsByIndex[idx]) idsByIndex[idx] = [];
            if (!idsByIndex[idx].includes(id)) idsByIndex[idx].push(id);
          });
        });
        candidateIdsByIndex = idsByIndex;
      }
      if (!candidateIdsByIndex.length) return;
      const selections = Array.from(salesAttrSelections.values());
      selections.forEach((sel, idx) => {
        const values = Array.isArray(sel?.values) ? sel.values : [];
        const candidateIds = candidateIdsByIndex[idx] || [];
        if (!values.length || !candidateIds.length) return;
        const candidateSet = new Set(candidateIds);
        const needs = values.some((v) => {
          const gid = String(v?.goods_attr_id ?? "").trim();
          return !gid || !candidateSet.has(gid);
        });
        if (!needs) return;
        if (values.length === candidateIds.length) {
          values.forEach((v, i) => {
            v.goods_attr_id = candidateIds[i];
          });
          return;
        }
        if (values.length === 1) {
          values[0].goods_attr_id = candidateIds[0];
          return;
        }
        let remaining = candidateIds.filter(
          (id) => !values.some((v) => String(v?.goods_attr_id ?? "").trim() === id),
        );
        values.forEach((v) => {
          const gid = String(v?.goods_attr_id ?? "").trim();
          if (gid && candidateSet.has(gid)) return;
          const next = remaining.shift();
          if (next) v.goods_attr_id = next;
        });
      });
    };

    remapSalesAttrIdsWithSku();
    const hydrateSkuDraftFromInfo = () => {
      if (!lastTemuInfo || !salesAttrSelections.size) return;
      const products = parseMaybeArray(lastTemuInfo?.products) || parseMaybeArray(lastTemuInfo?.product_list) || [];
      if (!products.length) return;
      const idsByIndex = [];
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        const ids = parseMaybeList(raw)
          .map((id) => String(id ?? "").trim())
          .filter(Boolean);
        ids.forEach((id, idx) => {
          if (!idsByIndex[idx]) idsByIndex[idx] = [];
          if (!idsByIndex[idx].includes(id)) idsByIndex[idx].push(id);
        });
      });
      if (!idsByIndex.length) return;
      const labelsByIndex = (() => {
        const fromSelections = Array.from(salesAttrSelections.values())
          .map((sel) =>
            (Array.isArray(sel?.values) ? sel.values : [])
              .map((v) => String(v?.value ?? "").trim())
              .filter(Boolean),
          )
          .filter((vals) => vals.length);
        if (fromSelections.length) return fromSelections;
        const templateList = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
          ? lastTemplateRes.data.userInputParentSpecList
          : [];
        return templateList.map((item) => normalizeAttrListValues(item?.attrList ?? item?.attr_list ?? []));
      })();

      products.forEach((row) => {
        const goodsAttrIds = readGoodsAttrIdsFromRow(row);
        if (!goodsAttrIds.length) return;
        const labels = goodsAttrIds
          .map((id, idx) => {
            const pool = idsByIndex[idx] || [];
            const pos = pool.indexOf(id);
            const labelPool = labelsByIndex[idx] || [];
            return pos > -1 ? labelPool[pos] : "";
          })
          .filter(Boolean);
        if (labels.length !== goodsAttrIds.length) return;
        const labelKey = normalizeGoodsAttrKey(labels.join(","));
        if (!labelKey) return;
        const existing = skuDraft.get(labelKey);
        const hasData =
          existing &&
          ["product_sn", "product_number", "product_price", "weight", "width", "height", "length"].some((k) =>
            String(existing?.[k] ?? "").trim(),
          );
        if (hasData) return;
        skuDraft.set(labelKey, {
          product_id: String(getSkuField(row, ["product_id", "productId", "id", "productID"]) ?? "").trim(),
          product_sn: String(getSkuField(row, ["product_sn", "productSn", "sku_sn", "skuSn", "sn"]) ?? "").trim(),
          product_number: String(getSkuField(row, ["product_number", "productNumber", "stock", "qty", "quantity"]) ?? "").trim(),
          product_price: String(getSkuField(row, ["product_price", "productPrice", "price", "sku_price", "skuPrice"]) ?? "").trim(),
          weight: String(getSkuField(row, ["weight", "product_weight", "productWeight"]) ?? "").trim(),
          width: String(getSkuField(row, ["width", "product_width", "productWidth"]) ?? "").trim(),
          height: String(getSkuField(row, ["height", "product_height", "productHeight"]) ?? "").trim(),
          length: String(getSkuField(row, ["length", "product_length", "productLength"]) ?? "").trim(),
          attr_img_list: normalizeSkuAttrImgList(row?.attr_img_list ?? row?.attrImgList ?? row?.images ?? row?.img_list),
        });
      });
    };

    hydrateSkuDraftFromInfo();
    const buildSkuRowLookup = () => {
      const map = new Map();
      if (!lastTemuInfo) return map;
      const products = parseMaybeArray(lastTemuInfo?.products) || parseMaybeArray(lastTemuInfo?.product_list) || [];
      if (!products.length) return map;
      const idsByIndex = [];
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        const ids = parseMaybeList(raw)
          .map((id) => String(id ?? "").trim())
          .filter(Boolean);
        ids.forEach((id, idx) => {
          if (!idsByIndex[idx]) idsByIndex[idx] = [];
          if (!idsByIndex[idx].includes(id)) idsByIndex[idx].push(id);
        });
      });
      if (!idsByIndex.length) return map;
      const labelsByIndex = (() => {
        const fromSelections = Array.from(salesAttrSelections.values())
          .map((sel) =>
            (Array.isArray(sel?.values) ? sel.values : [])
              .map((v) => String(v?.value ?? "").trim())
              .filter(Boolean),
          )
          .filter((vals) => vals.length);
        if (fromSelections.length) return fromSelections;
        const templateList = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
          ? lastTemplateRes.data.userInputParentSpecList
          : [];
        return templateList.map((item) => normalizeAttrListValues(item?.attrList ?? item?.attr_list ?? []));
      })();
      const mapping = (() => {
        const labels = labelsByIndex;
        if (!Array.isArray(labels) || labels.length < 2) return null;
        const ids = new Set();
        const edges = new Map();
        const addEdge = (a, b) => {
          if (!edges.has(a)) edges.set(a, new Set());
          if (!edges.has(b)) edges.set(b, new Set());
          edges.get(a).add(b);
          edges.get(b).add(a);
        };
        products.forEach((p) => {
          const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
          if (!raw) return;
          const list = parseMaybeList(raw)
            .map((id) => String(id ?? "").trim())
            .filter(Boolean);
          list.forEach((id) => ids.add(id));
          for (let i = 0; i < list.length; i += 1) {
            for (let j = i + 1; j < list.length; j += 1) {
              addEdge(list[i], list[j]);
            }
          }
        });
        if (ids.size < 2) return null;
        const color = new Map();
        for (const id of ids) {
          if (color.has(id)) continue;
          color.set(id, 0);
          const queue = [id];
          while (queue.length) {
            const cur = queue.shift();
            const nextColor = 1 - color.get(cur);
            const neighbors = edges.get(cur) || new Set();
            for (const nb of neighbors) {
              if (!color.has(nb)) {
                color.set(nb, nextColor);
                queue.push(nb);
              } else if (color.get(nb) !== nextColor) {
                return null;
              }
            }
          }
        }
        const groups = [[], []];
        for (const [id, c] of color.entries()) {
          groups[c].push(id);
        }
        if (!groups[0].length || !groups[1].length) return null;
        const orderIds = (group) => {
          const groupSet = new Set(group);
          const ordered = [];
          const seen = new Set();
          products.forEach((p) => {
            const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
            if (!raw) return;
            parseMaybeList(raw)
              .map((id) => String(id ?? "").trim())
              .filter(Boolean)
              .forEach((id) => {
                if (!groupSet.has(id) || seen.has(id)) return;
                seen.add(id);
                ordered.push(id);
              });
          });
          group.forEach((id) => {
            if (!seen.has(id)) ordered.push(id);
          });
          return ordered;
        };
        const orderedGroups = [orderIds(groups[0]), orderIds(groups[1])];
        let groupToSpec = [0, 1];
        if (
          labels.length >= 2 &&
          orderedGroups[0].length === labels[1].length &&
          orderedGroups[1].length === labels[0].length &&
          orderedGroups[0].length !== labels[0].length
        ) {
          groupToSpec = [1, 0];
        }
        const idToLabel = new Map();
        groupToSpec.forEach((specIdx, groupIdx) => {
          const specLabels = labels[specIdx] || [];
          const idsOrdered = orderedGroups[groupIdx] || [];
          idsOrdered.forEach((id, i) => {
            const label = String(specLabels[i] ?? "").trim();
            if (label) idToLabel.set(id, label);
          });
        });
        return { idToLabel };
      })();
      products.forEach((row) => {
        const goodsAttrIds = readGoodsAttrIdsFromRow(row);
        if (!goodsAttrIds.length) return;
        const labels = goodsAttrIds
          .map((id, idx) => {
            if (mapping?.idToLabel?.has(id)) return mapping.idToLabel.get(id);
            const pool = idsByIndex[idx] || [];
            const pos = pool.indexOf(id);
            const labelPool = labelsByIndex[idx] || [];
            return pos > -1 ? labelPool[pos] : "";
          })
          .filter(Boolean);
        if (labels.length !== goodsAttrIds.length) return;
        const labelKey = normalizeGoodsAttrKey(labels.join(","));
        if (!labelKey || map.has(labelKey)) return;
        map.set(labelKey, {
          product_id: String(getSkuField(row, ["product_id", "productId", "id", "productID"]) ?? "").trim(),
          product_sn: String(getSkuField(row, ["product_sn", "productSn", "sku_sn", "skuSn", "sn"]) ?? "").trim(),
          product_number: String(getSkuField(row, ["product_number", "productNumber", "stock", "qty", "quantity"]) ?? "").trim(),
          product_price: String(getSkuField(row, ["product_price", "productPrice", "price", "sku_price", "skuPrice"]) ?? "").trim(),
          weight: String(getSkuField(row, ["weight", "product_weight", "productWeight"]) ?? "").trim(),
          width: String(getSkuField(row, ["width", "product_width", "productWidth"]) ?? "").trim(),
          height: String(getSkuField(row, ["height", "product_height", "productHeight"]) ?? "").trim(),
          length: String(getSkuField(row, ["length", "product_length", "productLength"]) ?? "").trim(),
          attr_img_list: normalizeSkuAttrImgList(row?.attr_img_list ?? row?.attrImgList ?? row?.images ?? row?.img_list),
        });
      });
      return map;
    };

    const skuRowLookup = buildSkuRowLookup();
    const combos = getSalesCombos();
    if (!salesAttrSelections.size) {
      skuGridEl.innerHTML = '<div class="text-[11px] text-slate-400">请选择销售属性。</div>';
      return;
    }
    if (!combos.length) {
      skuGridEl.innerHTML = '<div class="text-[11px] text-slate-400">请为已选属性添加值，自动生成 SKU 组合。</div>';
      return;
    }

    const keys = combos.map((c) => normalizeGoodsAttrKey(c.map((x) => x.goods_attr_id).join(",")));
    syncSkuDraftKeys(keys);

    const resolveSkuImgUrl = (raw) => {
      const v = String(raw ?? "").trim();
      if (!v) return "";
      if (/^(blob|data):/i.test(v)) return v;
      if (/^https?:\/\//i.test(v)) return v;
      if (v.startsWith("//")) return `https:${v}`;
      if (v.startsWith("/")) return `https://topm.tech${v}`;
      return `https://topm.tech/${v.replace(/^\.?\//, "")}`;
    };

    const isRowComplete = (row) => {
      if (!row) return false;
      const required = ["product_sn", "product_number", "product_price", "weight", "width", "height", "length"];
      if (required.some((k) => !String(row?.[k] ?? "").trim())) return false;
      const images = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
      return images.length > 0;
    };

    skuGridEl.innerHTML = combos
      .map((combo) => {
        const goodsAttrs = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
        const label = combo.map((x) => `${x.specName}: ${x.value}`).join(" / ");
        const labelKey = normalizeGoodsAttrKey(combo.map((x) => x.value).join(","));
        let row = skuDraft.get(goodsAttrs);
        if (skuRowLookup.size && labelKey && skuRowLookup.has(labelKey)) {
          const existing = skuDraft.get(goodsAttrs);
          const hasData =
            existing &&
            ["product_sn", "product_number", "product_price", "weight", "width", "height", "length"].some((k) =>
              String(existing?.[k] ?? "").trim(),
            );
          if (applyingTemuEdit || !hasData) {
            skuDraft.set(goodsAttrs, { ...skuRowLookup.get(labelKey) });
            row = skuDraft.get(goodsAttrs);
          }
        }
        if (!skuDraft.has(goodsAttrs)) {
          if (salesAttrSelections.size === 1 && skuDraftSingleCache.has(goodsAttrs)) {
            skuDraft.set(goodsAttrs, { ...skuDraftSingleCache.get(goodsAttrs) });
          } else {
            skuDraft.set(goodsAttrs, {
              product_sn: "",
              product_number: "",
              product_price: "",
              weight: "",
              width: "",
              height: "",
              length: "",
              attr_img_list: [],
            });
          }
        }
        if (salesAttrSelections.size === 1) {
          const cached = skuDraft.get(goodsAttrs);
          skuDraftSingleCache.set(goodsAttrs, { ...cached });
        }
        if (!row) row = skuDraft.get(goodsAttrs);
        const complete = isRowComplete(row);
        const badge = complete
          ? '<span class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-black">已完成</span>'
          : '<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-black">未完成</span>';
        const images = Array.isArray(row?.attr_img_list) ? row.attr_img_list : [];
        const previewImgs = images
          .map((img) => resolveSkuImgUrl(img?.img_url ?? img?.url ?? img?.imgUrl ?? img?.img ?? img))
          .filter(Boolean)
          .slice(0, 4)
          .map(
            (url) =>
              `<img src="${escapeHtml(url)}" class="w-9 h-9 rounded-lg object-cover border border-slate-200" />`,
          )
          .join("");
        const previewBlock = previewImgs
          ? `<div class="mt-2 flex flex-wrap items-center gap-2">${previewImgs}<span class="text-[10px] text-slate-400">共 ${images.length} 张</span></div>`
          : `<div class="mt-2 text-[10px] text-slate-400">暂无属性图</div>`;
        const summary = complete
          ? `
            <div class="mt-2 text-[11px] text-slate-500 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div><span class="font-semibold text-slate-600">SKU</span>: ${escapeHtml(row.product_sn || "-")}</div>
              <div><span class="font-semibold text-slate-600">Stock</span>: ${escapeHtml(row.product_number || "-")}</div>
              <div><span class="font-semibold text-slate-600">Price</span>: ${escapeHtml(row.product_price || "-")} MXN</div>
              <div><span class="font-semibold text-slate-600">Weight</span>: ${escapeHtml(row.weight || "-")} g</div>
              <div><span class="font-semibold text-slate-600">Size</span>: ${escapeHtml(
                `${row.length || "-"}x${row.width || "-"}x${row.height || "-"}`,
              )} cm</div>
              <div><span class="font-semibold text-slate-600">Images</span>: ${images.length}</div>
            </div>
            ${previewBlock}
          `
          : `
            <div class="mt-2 text-[11px] text-slate-400">Fill SKU code, stock, price, weight, size, and images in the modal.</div>
            ${previewBlock}
          `;
        return `
          <button type="button" data-sku-edit="${escapeHtml(goodsAttrs)}" data-sku-label="${escapeHtml(
          label,
        )}" class="w-full text-left border border-slate-100 rounded-2xl p-4 bg-white shadow-soft flex flex-col gap-3 hover:border-accent/40 hover:shadow-glow transition">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-slate-700 truncate">${escapeHtml(label)}</div>
              <div class="text-[11px] text-slate-500 mt-1">组合信息</div>
              ${summary}
            </div>
            <div class="flex items-center gap-2">
              ${badge}
            </div>
          </button>
        `;
      })
      .join("");
  };

  const isTemplateOk = () => isTemplateFilledOk();
  const isDescOk = () => {
    const name = String(document.getElementById("temu-goods-name")?.value ?? "").trim();
    const sn = String(document.getElementById("temu-goods-sn")?.value ?? "").trim();
    const brief = String(document.getElementById("temu-goods-brief")?.value ?? "").trim();
    return Boolean(name && sn && brief);
  };
  const isUploadOk = () => {
    const list = parseDetailImgsValue();
    return Array.isArray(list) && list.length > 0;
  };

  const setPanelVisible = (el, show) => {
    if (!el) return;
    el.hidden = !show;
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  };

  const setStepActiveStyle = (btn, dot, active) => {
    if (!btn || !dot) return;
    if (active) {
      btn.classList.add("ring-2", "ring-accent/30", "border-accent/40");
      dot.classList.remove("bg-slate-100", "text-slate-600");
      dot.classList.add("bg-accent/10", "text-accent");
    } else {
      btn.classList.remove("ring-2", "ring-accent/30", "border-accent/40");
      dot.classList.remove("bg-accent/10", "text-accent");
      dot.classList.add("bg-slate-100", "text-slate-600");
    }
  };

  const setStepEnabled = (btn, enabled) => {
    if (!btn) return;
    btn.disabled = !enabled;
    if (enabled) btn.classList.remove("opacity-50", "cursor-not-allowed");
    else btn.classList.add("opacity-50", "cursor-not-allowed");
  };

  const setStepDone = (checkEl, done) => {
    if (!checkEl) return;
    if (done) checkEl.classList.remove("hidden");
    else checkEl.classList.add("hidden");
  };

  const getUploadProgress = () => {
    const done1 = isCatSelected();
    const done2 = isTemplateOk();
    const done3 = isDescOk();
    const done4 = isUploadOk();
    const done5 = false;
    const isEditing = Boolean(editingTemuGoodsId);
    return {
      done1,
      done2,
      done3,
      done4,
      done5,
      allow2: done1 || isEditing,
      allow3: done1 || isEditing,
      allow4: (done1 && done3) || isEditing,
      allow5: (done1 && done3 && done4) || isEditing,
    };
  };

  let autoAdvancing = false;

  const maybeAutoAdvance = () => {
    if (autoAdvancing) return;
    const p = getUploadProgress();
    autoAdvancing = true;
    if (p.done2 && activeUploadStep < 3) setUploadStep(3);
    if (p.done3 && activeUploadStep < 4) setUploadStep(4);
    if (p.done4 && activeUploadStep < 5) setUploadStep(5);
    autoAdvancing = false;
  };

  const renderUploadStepper = () => {
    const p = getUploadProgress();

    setStepDone(stepCheck1, p.done1);
    setStepDone(stepCheck2, p.done2);
    setStepDone(stepCheck3, p.done3);
    setStepDone(stepCheck4, p.done4);
    setStepDone(stepCheck5, p.done5);

    if (stepHint1) {
      const selectedText = String(document.getElementById("temu-cat-id-text")?.textContent ?? "").trim();
      if (!isCatSelected()) stepHint1.textContent = "请选择末级类目";
      else stepHint1.textContent = selectedText && selectedText !== "-" ? `已选类目：${selectedText}` : "已选类目";
    }
    if (stepHint2) stepHint2.textContent = p.done2 ? "模板已填写" : "根据类目获取属性模板";
    if (stepHint3) stepHint3.textContent = p.done3 ? "描述已填写" : "填写商品描述";
    if (stepHint4) stepHint4.textContent = p.done4 ? "详情已完善" : "上传详情图片";
    if (stepHint5) stepHint5.textContent = "填写字段并提交 insert";

    setStepEnabled(stepBtn1, true);
    setStepEnabled(stepBtn2, p.allow2);
    setStepEnabled(stepBtn3, p.allow3);
    setStepEnabled(stepBtn4, p.allow4);
    setStepEnabled(stepBtn5, p.allow5);

    if (next1) next1.disabled = !p.allow2;
    if (next2) next2.disabled = !p.allow3;
    if (next3) next3.disabled = !p.allow4;
    if (next4) next4.disabled = !p.allow5;

    maybeAutoAdvance();
  };

  const setUploadStep = (step) => {
    let s = Number(step);
    if (!Number.isFinite(s)) s = 1;
    s = Math.max(1, Math.min(5, Math.floor(s)));
    activeUploadStep = s;

    // Progressive disclosure: keep completed steps expanded (visible),
    // and show the current step panel. Future steps remain hidden.
    const p = getUploadProgress();
    setPanelVisible(panel1, true);
    setPanelVisible(panel2, s >= 2 || p.done1);
    setPanelVisible(panel3, s >= 3 || p.done2);
    setPanelVisible(panel4, s >= 4 || p.done3);
    setPanelVisible(panel5, s >= 5 || p.done4);

    // Only show action buttons on the active step panel.
    setPanelVisible(actions1, s === 1);
    setPanelVisible(actions2, s === 2);
    setPanelVisible(actions3, s === 3);
    setPanelVisible(actions4, s === 4);
    setPanelVisible(actions5, s === 5);

    setStepActiveStyle(stepBtn1, stepDot1, s === 1);
    setStepActiveStyle(stepBtn2, stepDot2, s === 2);
    setStepActiveStyle(stepBtn3, stepDot3, s === 3);
    setStepActiveStyle(stepBtn4, stepDot4, s === 4);
    setStepActiveStyle(stepBtn5, stepDot5, s === 5);

    renderUploadStepper();
  };

  const tryGoStep = (step) => {
    const target = Number(step) || 1;
    const p = getUploadProgress();
    if (target <= 1) return setUploadStep(1);
    if (target === 2 && p.allow2) return setUploadStep(2);
    if (target === 3 && p.allow3) return setUploadStep(3);
    if (target === 4 && p.allow4) return setUploadStep(4);
    if (target === 5 && p.allow5) return setUploadStep(5);
    renderUploadStepper();
  };

  if (stepBtn1) stepBtn1.addEventListener("click", () => tryGoStep(1));
  if (stepBtn2) stepBtn2.addEventListener("click", () => tryGoStep(2));
  if (stepBtn3) stepBtn3.addEventListener("click", () => tryGoStep(3));
  if (stepBtn4) stepBtn4.addEventListener("click", () => tryGoStep(4));
  if (stepBtn5) stepBtn5.addEventListener("click", () => tryGoStep(5));
  if (next1) next1.addEventListener("click", () => tryGoStep(2));
  if (next2) next2.addEventListener("click", () => tryGoStep(3));
  if (next3) next3.addEventListener("click", () => tryGoStep(4));
  if (next4) next4.addEventListener("click", () => tryGoStep(5));
  if (back2) back2.addEventListener("click", () => tryGoStep(1));
  if (back3) back3.addEventListener("click", () => tryGoStep(2));
  if (back4) back4.addEventListener("click", () => tryGoStep(3));
  if (back5) back5.addEventListener("click", () => tryGoStep(4));

  setUploadStep(isCatSelected() ? 2 : 1);

  const parseDetailImgs = () => parseDetailImgsValue();

  ["temu-goods-name", "temu-goods-sn", "temu-goods-brief"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderUploadStepper);
  });

  const resolveTemuImageUrl = (raw) => {
    const v = String(raw ?? "").trim();
    if (!v) return "";
    // Keep local preview URLs (blob:/data:)
    if (/^(blob|data):/i.test(v)) return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `https://topm.tech${v}`;
    return `https://topm.tech/${v.replace(/^\.?\//, "")}`;
  };

  const getTemuImageName = (item, url) => {
    const raw =
      String(item?.name ?? item?.file_name ?? item?.filename ?? item?.fileName ?? item?.file ?? "").trim();
    if (raw) return raw;
    if (!url) return "";
    try {
      const u = new URL(url, window.location.origin);
      const base = u.pathname.split("/").pop() || "";
      return decodeURIComponent(base);
    } catch {
      const base = String(url).split("?")[0].split("/").pop() || "";
      try {
        return decodeURIComponent(base);
      } catch {
        return base;
      }
    }
  };

  const renderImagePreview = () => {
    if (!imagePreview) return;
    const list = parseDetailImgs();
    if (list === null) {
      imagePreview.innerHTML =
        '<div class="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">goods_detail_img 不是合法 JSON 数组</div>';
      return;
    }
    if (!list.length) {
      imagePreview.innerHTML = '<div class="text-[11px] text-slate-400">暂无图片（上传后会自动出现预览）</div>';
      return;
    }
    const uploadingCount = list.filter((it) => it?.uploading).length;
    const errorCount = list.filter((it) => it?.uploadError).length;
    const okCount = list.filter((it) => it?.uploadedOk).length;

    const items = list.slice(0, 24).map((it, idx) => {
      const raw = it?.img_url ?? it?.url ?? it?.imgUrl ?? "";
      const url = safeExternalUrl(resolveTemuImageUrl(raw));
      const label = `#${idx + 1}`;
      const name = getTemuImageName(it, url) || `image-${idx + 1}`;
      const uploading = Boolean(it?.uploading);
      const hasError = Boolean(it?.uploadError);
      const okBadge = it?.uploadedOk
        ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px]" title="上传成功"><i class="fas fa-check"></i></span>'
        : "";
      const statusBadge = uploading
        ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]" title="上传中"><i class="fas fa-circle-notch fa-spin"></i></span>'
        : hasError
          ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px]" title="上传失败"><i class="fas fa-triangle-exclamation"></i></span>'
          : "";
      const viewBtn = url
        ? `<button type="button" data-view-image="${escapeHtml(url)}" class="temu-img-view inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-accent" title="放大查看">
             <i class="fas fa-magnifying-glass-plus"></i>查看
           </button>`
        : '<span class="text-[10px] text-slate-400">-</span>';
      return `
          <div class="group relative rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="aspect-square bg-slate-50 flex items-center justify-center relative">
              ${
                url
                  ? `<button type="button" data-view-image="${escapeHtml(url)}" class="w-full h-full">
                       <img src="${escapeHtml(url)}" class="w-full h-full object-contain p-2" alt="${escapeHtml(label)}" onerror="this.style.display='none';" />
                     </button>`
                  : `<div class="text-[11px] text-slate-400">无 url</div>`
              }
              ${
                uploading
                  ? '<div class="absolute inset-0 bg-white/70 flex items-center justify-center text-slate-700"><i class="fas fa-circle-notch fa-spin"></i></div>'
                  : ""
              }
            </div>
            <div class="px-2 py-1 text-[11px] text-slate-500 flex items-center justify-between gap-2">
              <span class="font-mono">${escapeHtml(label)}</span>
              <div class="flex items-center gap-2">
                ${statusBadge}
                ${okBadge}
                <button type="button" class="temu-img-remove text-rose-600 hover:text-rose-700" data-idx="${idx}" title="移除">
                  <i class="fas fa-xmark"></i>
                </button>
              </div>
            </div>
            <div class="px-2 pb-2 text-[11px] text-slate-600 flex items-center justify-between gap-2">
              <div class="truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              ${viewBtn}
            </div>
          </div>
        `;
    });
    const statusTip =
      uploadingCount || errorCount
        ? `<div class="mb-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
             ${uploadingCount ? `<span class="inline-flex items-center gap-1"><i class="fas fa-circle-notch fa-spin"></i>上传中 ${uploadingCount}</span>` : ""}
             ${okCount ? `<span class="inline-flex items-center gap-1 text-emerald-600"><i class="fas fa-check"></i>已完成 ${okCount}</span>` : ""}
             ${errorCount ? `<span class="inline-flex items-center gap-1 text-rose-600"><i class="fas fa-triangle-exclamation"></i>失败 ${errorCount}</span>` : ""}
           </div>`
        : "";

    imagePreview.innerHTML = `
      ${statusTip}
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        ${items.join("")}
      </div>
      ${
        list.length > 24
          ? `<div class="text-[11px] text-slate-400 mt-2">仅预览前 24 张（当前 ${list.length} 张）</div>`
          : ""
      }
    `;
  };

  if (imagePreview) {
    imagePreview.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".temu-img-remove");
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      if (!Number.isFinite(idx) || idx < 0) return;
      const list = parseDetailImgs();
      if (!Array.isArray(list)) return;
      list.splice(idx, 1);
      if (detailImgsTextarea) detailImgsTextarea.value = JSON.stringify(list, null, 2);
      renderImagePreview();
      renderUploadStepper();
    });
  }

  if (detailImgsTextarea) {
    detailImgsTextarea.addEventListener("input", () => {
      renderImagePreview();
      renderUploadStepper();
    });
  }
  renderImagePreview();
  renderSalesAttrs();
  renderSalesAttrValues();
  renderSkuGrid();
  const addDetailImg = (
    url,
    { imgId = "0", local = false, localId = null, name = "", uploadedOk = false, uploading = false, uploadError = "" } = {},
  ) => {
    if (!detailImgsTextarea) return;
    const list = Array.isArray(parseDetailImgs()) ? parseDetailImgs() : [];
    list.push({
      img_id: imgId,
      img_url: url,
      local,
      localId: localId || null,
      name,
      uploadedOk: Boolean(uploadedOk),
      uploading: Boolean(uploading),
      uploadError: uploadError || "",
    });
    detailImgsTextarea.value = JSON.stringify(list, null, 2);
    renderImagePreview();
  };

  const updateDetailImg = (predicate, patch) => {
    if (!detailImgsTextarea) return;
    const list = Array.isArray(parseDetailImgs()) ? parseDetailImgs() : [];
    let changed = false;
    const next = list.map((item) => {
      if (!item || (typeof predicate === "function" && !predicate(item))) return item;
      changed = true;
      return { ...item, ...patch };
    });
    if (!changed) return;
    detailImgsTextarea.value = JSON.stringify(next, null, 2);
    renderImagePreview();
  };

  if (salesAttrsEl) {
    salesAttrsEl.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-sales-spec-id]");
      if (!btn) return;
      const id = String(btn.dataset.salesSpecId ?? "").trim();
      const list = getSalesAttrList();
      const found = list.find((x) => x.id === id);
      if (!found) return;
      if (salesAttrSelections.has(id)) {
        salesAttrSelections.delete(id);
      } else {
        if (salesAttrSelections.size >= 2) {
          setSalesMsg("最多选择 2 个销售属性。", "error");
          return;
        }
        salesAttrSelections.set(id, { ...found, values: [] });
      }
      renderSalesAttrs();
      renderSalesAttrValues();
      renderSkuGrid();
    });
  }

  if (salesAttrValuesEl) {
    salesAttrValuesEl.addEventListener("click", async (e) => {
      const addBtn = e.target?.closest?.("[data-sales-value-add]");
      if (addBtn) {
        const specId = String(addBtn.dataset.salesValueAdd ?? "").trim();
        const sel = salesAttrSelections.get(specId);
        if (!sel) return;
        const input = salesAttrValuesEl.querySelector(`[data-sales-value-input="${CSS.escape(specId)}"]`);
        const val = String(input?.value ?? "").trim();
        if (!val) {
          setSalesMsg("请填写属性值。", "error");
          return;
        }
        if (sel.values?.some((v) => String(v.value ?? "") === val)) {
          setSalesMsg("该属性值已存在。", "error");
          return;
        }
        const catId = String(catOut?.textContent ?? "").trim();
        if (!catId || catId === "-") {
          setSalesMsg("请先选择末级类目。", "error");
          return;
        }
        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>记录中';
        try {
          const res = await postAuthedJson("/api/temu/insert_attr_input", {
            goods_id: editingTemuGoodsId ? editingTemuGoodsId : "0",
            attr_value: val,
            type_name: sel.name,
            type_id: sel.id,
            cat_id: catId,
          });
          if (String(res?.code) !== "0" || !res?.data?.goods_attr_id) {
            setSalesMsg(res?.msg || "属性记录失败", "error");
            return;
          }
          const goodsAttrId = String(res.data.goods_attr_id ?? "").trim();
          sel.values = Array.isArray(sel.values) ? sel.values : [];
          sel.values.push({ value: val, goods_attr_id: goodsAttrId });
          if (input) input.value = "";
          setSalesMsg("属性值已记录。", "ok");
          renderSalesAttrValues();
          renderSkuGrid();
        } catch {
          setSalesMsg("网络异常，请稍后重试。", "error");
        } finally {
          addBtn.disabled = false;
          addBtn.innerHTML = "添加";
        }
        return;
      }

      const removeBtn = e.target?.closest?.("[data-sales-value-remove]");
      if (removeBtn) {
        const specId = String(removeBtn.dataset.salesValueRemove ?? "").trim();
        const valId = String(removeBtn.dataset.salesValueId ?? "").trim();
        const sel = salesAttrSelections.get(specId);
        if (!sel) return;
        sel.values = (Array.isArray(sel.values) ? sel.values : []).filter(
          (v) => String(v.goods_attr_id ?? "") !== valId,
        );
        renderSalesAttrValues();
        renderSkuGrid();
      }
    });
  }

  if (skuGridEl) {
    skuGridEl.addEventListener("click", (e) => {
      const editBtn = e.target?.closest?.("[data-sku-edit]");
      if (!editBtn) return;
      const key = String(editBtn.dataset.skuEdit ?? "").trim();
      const label = String(editBtn.dataset.skuLabel ?? "").trim();
      openSkuModal(key, label);
    });
  }

  if (skuModal) {
    skuModal.querySelectorAll("[data-sku-modal-field]").forEach((input) => {
      input.addEventListener("input", () => {
        if (!activeSkuKey) return;
        if (!skuDraft.has(activeSkuKey)) skuDraft.set(activeSkuKey, { attr_img_list: [] });
        const row = skuDraft.get(activeSkuKey);
        const field = input.getAttribute("data-sku-modal-field");
        row[field] = String(input.value ?? "").trim();
        if (salesAttrSelections.size === 1) {
          skuDraftSingleCache.set(activeSkuKey, { ...row });
        }
        renderSkuModalStatus();
        renderSkuGrid();
      });
    });
  }

  if (skuModalUpload) {
    skuModalUpload.addEventListener("click", () => {
      if (skuModalFile) skuModalFile.click();
    });
  }

  if (skuModalFile) {
    skuModalFile.addEventListener("change", async () => {
      if (!activeSkuKey) return;
      const row = skuDraft.get(activeSkuKey);
      if (!row) return;
      const files = Array.from(skuModalFile.files || []);
      if (!files.length) return;
      row.attr_img_list = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
      const remaining = Math.max(0, 10 - row.attr_img_list.length);
      const queue = files.slice(0, remaining);
      if (queue.length < files.length) setSalesMsg("Each SKU supports up to 10 images.", "error");

      const pending = queue.map((file) => {
        const localId = `sku-local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let tempUrl = "";
        try {
          tempUrl = URL.createObjectURL(file);
        } catch {
          tempUrl = "";
        }
        row.attr_img_list.push({
          img_id: "0",
          img_url: tempUrl,
          name: file.name || "",
          localId,
          uploading: true,
          uploadedOk: false,
          uploadError: "",
        });
        return { file, localId, tempUrl };
      });

      renderSkuModalImages();
      renderSkuModalStatus();

      const updateSkuImg = (localId, patch) => {
        const img = row.attr_img_list.find((x) => x?.localId === localId);
        if (!img) return;
        Object.assign(img, patch);
      };

      for (const { file, localId, tempUrl } of pending) {
        const res = await uploadTemuAttrImage(file);
        if (!res.ok || !res.url) {
          updateSkuImg(localId, { uploading: false, uploadError: res.msg || res?.res?.msg || "Upload failed." });
        } else {
          updateSkuImg(localId, { img_url: res.url, uploading: false, uploadedOk: true, uploadError: "" });
        }
        if (tempUrl) {
          try {
            URL.revokeObjectURL(tempUrl);
          } catch {
            // ignore
          }
        }
      }

      if (salesAttrSelections.size === 1) {
        skuDraftSingleCache.set(activeSkuKey, { ...row });
      }
      skuModalFile.value = "";
      renderSkuModalImages();
      renderSkuModalStatus();
      renderSkuGrid();
    });
  }

  if (skuModalImages) {
    skuModalImages.addEventListener("click", (e) => {
      const removeBtn = e.target?.closest?.("[data-sku-modal-img-remove]");
      if (!removeBtn) return;
      const idx = Number(removeBtn.dataset.skuModalImgIdx ?? "-1");
      const row = skuDraft.get(activeSkuKey);
      if (!row || !Array.isArray(row.attr_img_list)) return;
      if (!Number.isFinite(idx) || idx < 0) return;
      row.attr_img_list.splice(idx, 1);
      if (salesAttrSelections.size === 1) {
        skuDraftSingleCache.set(activeSkuKey, { ...row });
      }
      renderSkuModalImages();
      renderSkuModalStatus();
      renderSkuGrid();
    });
  }

  if (skuModalClose) skuModalClose.addEventListener("click", closeSkuModal);
  if (skuModalOverlay) skuModalOverlay.addEventListener("click", closeSkuModal);
  if (skuModal) {
    const handleSkuEsc = (e) => {
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      if (skuModal.classList.contains("hidden")) return;
      const viewer = document.getElementById("image-viewer");
      if (viewer && !viewer.classList.contains("hidden")) return;
      closeSkuModal();
    };
    document.addEventListener("keydown", handleSkuEsc);
  }

  const isImageFile = (f) => {
    const t = String(f?.type ?? "").toLowerCase();
    if (t.startsWith("image/")) return true;
    const name = String(f?.name ?? "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : "";
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff", "heic", "heif"].includes(String(ext || ""));
  };

  const pickTemuImageUrls = (data) => {
    const urls = [];
    const push = (u) => {
      const s = String(u ?? "").trim();
      if (s) urls.push(s);
    };
    const d = data ?? {};
    push(d.imgUrl);
    push(d.img_url);
    push(d.url);
    push(d.uri);
    push(d.full_url);
    push(d.image);
    if (Array.isArray(d.images)) d.images.forEach((x) => push(x?.url ?? x));
    if (Array.isArray(d.url_list)) d.url_list.forEach((x) => push(x?.url ?? x?.uri ?? x));
    if (typeof d === "string") push(d);
    return urls.filter(Boolean);
  };

  const uploadTemuAttrImage = async (file) => {
    if (!file || !isImageFile(file)) {
      return { ok: false, msg: "请上传图片文件（jpg/png/webp/gif 等）" };
    }
    const form = new FormData();
    form.append("file", file);
    form.append("goods_id", "0");
    const res = await postAuthedFormData("/api/temu/upload_goods_img", form);
    const ok = String(res?.msg ?? "").trim().toLowerCase() === "ok";
    const urls = pickTemuImageUrls(res?.data || {});
    return { ok, url: urls[0] || "", res };
  };

  const isSkuComplete = (row) => {
    if (!row) return false;
    const required = ["product_sn", "product_number", "product_price", "weight", "width", "height", "length"];
    if (required.some((k) => !String(row?.[k] ?? "").trim())) return false;
    const images = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
    return images.length > 0;
  };

  const renderSkuModalImages = () => {
    if (!skuModalImages) return;
    const row = skuDraft.get(activeSkuKey) || {};
    const images = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
    skuModalImages.innerHTML =
      images
        .map((img, i) => {
          const uploading = Boolean(img?.uploading);
          const hasError = Boolean(img?.uploadError);
          const okBadge = img?.uploadedOk
            ? '<span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px]" title="Upload OK"><i class="fas fa-check"></i></span>'
            : "";
          const statusBadge = uploading
            ? '<span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-900 text-white text-[9px]" title="Uploading"><i class="fas fa-circle-notch fa-spin"></i></span>'
            : hasError
              ? '<span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px]" title="Upload failed"><i class="fas fa-triangle-exclamation"></i></span>'
              : "";
          return `
            <div class="relative rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button type="button" data-view-image="${escapeHtml(img.img_url || "")}" class="block w-16 h-16 bg-slate-50 relative">
                <img src="${escapeHtml(img.img_url || "")}" class="w-full h-full object-cover" alt="" />
                ${
                  uploading
                    ? '<span class="absolute inset-0 bg-white/70 flex items-center justify-center text-slate-700"><i class="fas fa-circle-notch fa-spin"></i></span>'
                    : ""
                }
              </button>
              <div class="absolute left-1 top-1 flex items-center gap-1">
                ${statusBadge}
                ${okBadge}
              </div>
              <button type="button" data-sku-modal-img-remove="${escapeHtml(activeSkuKey)}" data-sku-modal-img-idx="${i}" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                <i class="fas fa-xmark"></i>
              </button>
            </div>
          `;
        })
        .join("") || '<span class="text-[11px] text-slate-400">No images</span>';
  };

  const renderSkuModalStatus = () => {
    if (!skuModalStatus) return;
    const complete = isSkuComplete(skuDraft.get(activeSkuKey));
    skuModalStatus.textContent = complete ? "已完成" : "未完成";
    skuModalStatus.className = complete
      ? "text-[11px] px-2 py-1 rounded-full border font-black text-emerald-700 bg-emerald-50 border-emerald-200"
      : "text-[11px] px-2 py-1 rounded-full border font-black text-amber-700 bg-amber-50 border-amber-200";
  };

  function openSkuModal(key, label) {
    if (!skuModal) return;
    activeSkuKey = key;
    const row = skuDraft.get(key) || {};
    if (skuModalTitle) skuModalTitle.textContent = "SKU 组合编辑";
    if (skuModalSubtitle) skuModalSubtitle.textContent = label || "-";
    skuModal.querySelectorAll("[data-sku-modal-field]").forEach((input) => {
      const field = input.getAttribute("data-sku-modal-field");
      input.value = row?.[field] ?? "";
    });
    renderSkuModalImages();
    renderSkuModalStatus();
    skuModal.classList.remove("hidden");
  }

  function closeSkuModal() {
    if (!skuModal) return;
    skuModal.classList.add("hidden");
    activeSkuKey = "";
  }

  const removeLocalDetailImgs = (predicate) => {
    if (!detailImgsTextarea) return;
    const list = Array.isArray(parseDetailImgs()) ? parseDetailImgs() : [];
    const next =
      typeof predicate === "function"
        ? list.filter((x) => !(x?.local && predicate(x)))
        : list.filter((x) => !x?.local);
    detailImgsTextarea.value = JSON.stringify(next, null, 2);
    renderImagePreview();
  };

  const renderTemuTemplateForm = () => {
    if (!templateForm) return;
    templateForm.innerHTML = "";
    templateForm.className = "w-full";
    showTemplateMsg("");
    forcedTemplatePidKeys.clear();
    cardsByPid = new Map();
    itemsByPid = new Map();
    childSlotByPid = new Map();
    parentTplToChildPidKeys = new Map();
    templatePidByPidKey = new Map();

    if (String(lastTemplateRes?.code ?? "") !== "0") {
      renderSelectedTemplateJson();
      return;
    }

    const items = getTemplateItems();
    if (!items.length) {
      templateForm.innerHTML =
        '<div class="text-xs text-slate-400">模板为空（未返回 templateInfo）。</div>';
      renderSelectedTemplateJson();
      return;
    }

    // Apply template defaults when no selection exists yet.
    items.forEach((item, idx) => {
      const key = pidKeyFromItem(item, idx);
      if (!key || templateSelections.has(key)) return;
      const defVal = String(item?.defaultValue ?? item?.default_value ?? item?.default ?? "").trim();
      if (!defVal) return;
      const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
      const pick =
        unitList.find((u) => u?.default === true || u?.default === "true" || u?.default === 1 || u?.default === "1") || unitList[0];
      const unitVal = pick?.valueUnit ?? pick?.unit ?? pick?.value ?? pick?.code ?? null;
      const unitId = pick?.valueUnitId ?? pick?.valueUnitID ?? pick?.unitId ?? pick?.unit_id ?? pick?.id ?? null;
      const unitName = pick?.unitName ?? pick?.name ?? pick?.label ?? pick?.text ?? unitVal ?? null;
      templateSelections.set(key, {
        value: defVal,
        valueUnit: unitVal ?? null,
        valueUnitId: unitId ?? null,
        valueUnitName: unitName ?? null,
      });
    });

    const mkLabel = (item) => {
      const name = String(item?.name ?? "-");
      const required = item?.required
        ? '<span class="ml-2 text-[10px] text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">必填</span>'
        : "";
      const max = Number(item?.chooseMaxNum ?? 0) || 0;
      const maxText = max > 1 ? `<span class="ml-2 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">最多选 ${max} 个</span>` : "";
      return `<div class="text-xs font-bold text-slate-700">${escapeHtml(name)}${required}${maxText}</div>`;
    };

    const mkHint = () => "";

    // Basic label resolver that prefers human-friendly fields over ids.
    const valueLabelFor = (v) =>
      typeof v === "string" || typeof v === "number"
        ? String(v)
        : String(
            v?.value ??
              v?.valueName ??
              v?.value_name ??
              v?.name ??
              v?.displayName ??
              v?.display_name ??
              v?.label ??
              v?.text ??
              v?.title ??
              ""
          ).trim();

    let updateDependentOptionalVisibility = () => {};

    const setSelection = (item, sel) => {
      const key = item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0);
      if (!key) return;
      if (sel == null) templateSelections.delete(String(key));
      else templateSelections.set(String(key), sel);
      renderSelectedTemplateJson();
      renderUploadStepper();
      updateDependentOptionalVisibility();
    };

    // Prefer required first for better UX.
    const sorted = getTemplateItems()
      .map((item, idx) => ({ ...item, __pidKey: pidKeyFromItem(item, idx), __idx: idx }))
      .sort((a, b) => {
        const ar = a?.required ? 0 : 1;
        const br = b?.required ? 0 : 1;
        if (ar !== br) return ar - br;
        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "en");
      });

    // V2 renderer: card-based selectors, no internal ids, no dropdowns, and tabs for large lists.
      const renderV2 = () => {
        // Only render the first 300 root-level items for performance, but still allow dependent attributes
        // (parentTemplatePid > 0) to appear under selected values even if they are outside the first 300.
        const limited = sorted;

        const normalizeTemplatePidKey = (raw) => {
          const s = String(raw ?? "").trim();
          if (!s) return "0";
          if (s === "0") return "0";
          return s;
        };
        const findKeyValue = (obj, predicate, depth) => {
          if (!obj || typeof obj !== "object") return null;
          const entries = Object.entries(obj);
          for (const [k, v] of entries) {
            try {
              if (predicate(k, v)) return v;
            } catch {}
            if (depth > 0 && v && typeof v === "object") {
              const inner = findKeyValue(v, predicate, depth - 1);
              if (inner != null) return inner;
            }
          }
          return null;
        };

        const getParentTemplatePidKey = (it) => {
          const raw =
            it?.parentTemplatePid ??
            it?.parentTemplateId ??
            it?.parentTemplateID ??
            it?.parentTemplatePID ??
            it?.parent_template_pid ??
            it?.parent_template_id ??
            it?.parent_templatePid ??
            it?.parent_templateId ??
            it?.parent_templateID ??
            findKeyValue(
              it,
              (k) => /parent.*template.*(pid|id)/i.test(String(k ?? "")) || /parent_template.*(pid|id)/i.test(String(k ?? "")),
              4
            ) ??
            0;
          return normalizeTemplatePidKey(raw);
        };

        const getItemTemplatePidKey = (it) => {
          const raw =
            it?.templatePid ??
            it?.template_pid ??
            it?.templatePID ??
            it?.templatePId ??
            it?.template_id ??
            it?.templateId ??
            it?.templateID ??
            findKeyValue(
              it,
              (k, vv) => {
                const key = String(k ?? "");
                if (!/template/i.test(key)) return false;
                if (!/(pid|id)/i.test(key)) return false;
                return vv != null && String(vv).trim() !== "";
              },
              2
            ) ??
            0;
          return normalizeTemplatePidKey(raw);
        };

        const getValueTemplatePidKey = (v) => {
          const raw =
            v?.templatePid ??
            v?.template_pid ??
            v?.templatePID ??
            v?.templatePId ??
            v?.template_id ??
            v?.templateId ??
            v?.templateID ??
            // Some upstream values nest template pid in extendInfo/additionalInfo/etc; search deeper.
            findKeyValue(
              v,
              (k, vv) => {
                const key = String(k ?? "");
                if (!/template/i.test(key)) return false;
                if (!/(pid|id)/i.test(key)) return false;
                return vv != null && String(vv).trim() !== "";
              },
              4
            ) ??
            0;
          return normalizeTemplatePidKey(raw);
        };

        const dependentItems = limited.filter((x) => getParentTemplatePidKey(x) !== "0");
        const requiredItems = limited.filter((x) => !!x?.required && getParentTemplatePidKey(x) === "0");
        const allOptionalItems = limited.filter((x) => !x?.required);
        const rootOptionalItems = allOptionalItems.filter((x) => getParentTemplatePidKey(x) === "0");
        let optContainer = null;
        let optToggleBtn = null;
        let setOptionalToggleText = null;

        // Build a quick lookup from vid -> label to avoid showing raw IDs.
        const vidLabelIndex = new Map();
        const normalizeVid = (v) => String(v ?? "").trim();
        const indexValueLabels = (items) => {
          vidLabelIndex.clear();
          for (const it of items) {
            const values = Array.isArray(it?.values) ? it.values : [];
            for (const v of values) {
              const key = normalizeVid(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? valueLabelFor(v));
              const label = valueLabelFor(v);
              if (key && label) vidLabelIndex.set(key, label);
            }
          }
        };
        indexValueLabels(limited);

        // templatePid -> value meta (for parent-child linkage by templatePid)
        const valueTemplatePidIndex = new Map();
        // vid -> templatePid (fallback when selections only store vid)
        const vidToTemplatePidKey = new Map();
        const templatePidToPidKey = new Map();
        const indexTemplatePids = (items) => {
          valueTemplatePidIndex.clear();
          vidToTemplatePidKey.clear();
          templatePidToPidKey.clear();
          templatePidByPidKey.clear();
          for (const it of items) {
            const pidKey = it?.__pidKey ?? pidKeyFromItem(it, it?.__idx || 0);
            const itemTplKey = getItemTemplatePidKey(it);
            if (itemTplKey && itemTplKey !== "0") templatePidToPidKey.set(itemTplKey, pidKey);
            templatePidByPidKey.set(pidKey, itemTplKey && itemTplKey !== "0" ? itemTplKey : "0");
            const values = Array.isArray(it?.values) ? it.values : [];
            for (const v of values) {
              const tplKey = getValueTemplatePidKey(v);
              const vidKey = normalizeVid(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? valueLabelFor(v));
              if (vidKey && tplKey) vidToTemplatePidKey.set(vidKey, tplKey);
              if (!tplKey || tplKey === "0") continue;
              if (!valueTemplatePidIndex.has(tplKey)) valueTemplatePidIndex.set(tplKey, []);
              valueTemplatePidIndex.get(tplKey).push({ itemPidKey: pidKey, itemPid: it?.pid, item: it, value: v });
            }
          }
        };
        indexTemplatePids(limited);

        // pid -> Set(cards). Some templates may have duplicated pid; keep UI consistent for all.
        cardsByPid = new Map();
        itemsByPid = new Map();
        childSlotByPid = new Map();

        const registerCard = (pidKey, cardEl) => {
          if (!cardsByPid.has(pidKey)) cardsByPid.set(pidKey, new Set());
          cardsByPid.get(pidKey).add(cardEl);
        };
        const unregisterCard = (pidKey, cardEl) => {
          const s = cardsByPid.get(pidKey);
          if (!s) return;
          s.delete(cardEl);
          if (s.size === 0) cardsByPid.delete(pidKey);
        };

        const getSelection = (item) => templateSelections.get(item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0));

        // Dependent optional attributes (parentTemplatePid > 0):
        // Show only when a selected value's templatePid matches the item's parentTemplatePid.
        const dependentCards = [];
        const registerDependentCard = (item, cardEl) => {
          if (!item || !cardEl) return;
          dependentCards.push({ item, cardEl });
        };

        const getRawValueVidKey = (v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? v?.ID ?? "").trim();

        const computeSelectedTemplatePidKeys = () => {
          const active = new Set();
          // 1) by selected values' templatePid
          for (const [pidKey, sel] of templateSelections.entries()) {
            const srcItem = itemsByPid.get(pidKey);
            const values = Array.isArray(sel?.values) ? sel.values : [];
            for (const v of values) {
              let tplKey = getValueTemplatePidKey(v);
              if (!tplKey || tplKey === "0") {
                const vidKey = normalizeVid(getRawValueVidKey(v));
                if (vidKey) tplKey = vidToTemplatePidKey.get(vidKey) || null;
                if ((!tplKey || tplKey === "0") && srcItem && Array.isArray(srcItem?.values)) {
                  const raw = srcItem.values.find(
                    (sv) => normalizeVid(getRawValueVidKey(sv)) === vidKey
                  );
                  tplKey = getValueTemplatePidKey(raw);
                }
              }
              if (tplKey && tplKey !== "0") active.add(tplKey);
            }
          }
          // 2) by configured parent item templatePid
          for (const [pidKey, sel] of templateSelections.entries()) {
            const item = itemsByPid.get(pidKey);
            if (!item) continue;
            const hasValue =
              (Array.isArray(sel?.values) && sel.values.length > 0) ||
              (sel?.value != null && String(sel.value).trim() !== "");
            if (!hasValue) continue;
            const tplKey = getItemTemplatePidKey(item);
            if (tplKey && tplKey !== "0") active.add(tplKey);
          }
          return active;
        };

        const getSelectedVidsByTemplatePid = () => {
          const map = new Map();
          const pushVid = (tplKey, vid) => {
            const key = String(tplKey ?? "").trim();
            const val = String(vid ?? "").trim();
            if (!key || key === "0" || !val) return;
            if (!map.has(key)) map.set(key, new Set());
            map.get(key).add(val);
          };

          for (const [pidKey, sel] of templateSelections.entries()) {
            const item = itemsByPid.get(pidKey);
            if (!item) continue;
            const tplKey = getItemTemplatePidKey(item);
            if (!tplKey || tplKey === "0") continue;
            const values = Array.isArray(sel?.values) ? sel.values : [];
            for (const v of values) {
              const vid = getRawValueVidKey(v);
              if (vid) pushVid(tplKey, vid);
            }
          }
          return map;
        };

        let refreshingDependentVisibility = false;

        const updateChildSlotVisibility = () => {
          for (const slot of childSlotByPid.values()) {
            const hasVisible = Array.from(slot.children || []).some((c) => c?.style?.display !== "none");
            slot.classList.toggle("hidden", !hasVisible);
          }
        };

        const ensureParentBadge = () => {};

        const ensureNestedUnderParent = (card, item) => {
          const parentKey = getParentTemplatePidKey(item);
          if (!parentKey || parentKey === "0") return;

          const parentPidKey = templatePidToPidKey.get(parentKey);
          if (parentPidKey) {
            const slot = childSlotByPid.get(parentPidKey);
            if (slot) {
              slot.classList.remove("hidden");
              if (card.parentElement !== slot) slot.appendChild(card);
              card.classList.add("attr-card-nested");
              ensureParentBadge(card, parentKey);
              return;
            }
          }

          const owners = valueTemplatePidIndex.get(parentKey) || [];
          for (const meta of owners) {
            const slot = childSlotByPid.get(meta.itemPidKey);
            if (slot) {
              slot.classList.remove("hidden");
              if (card.parentElement !== slot) slot.appendChild(card);
              card.classList.add("attr-card-nested");
              ensureParentBadge(card, parentKey);
              return;
            }
          }

          const parentCard = templateForm.querySelector(`[data-item-card][data-pid='${parentKey}']`);
          if (parentCard && parentCard.parentElement) {
            const container = parentCard.parentElement;
            if (parentCard.nextSibling !== card) container.insertBefore(card, parentCard.nextSibling);
          }
        };

        const refreshDependentOptionalVisibility = () => {
          if (refreshingDependentVisibility) return;
          refreshingDependentVisibility = true;

          const selectedTplPids = computeSelectedTemplatePidKeys();
          const selectedVidsByTpl = getSelectedVidsByTemplatePid();
          let clearedAny = false;
          let forcedChanged = false;

          for (const row of dependentCards) {
            const item = row?.item;
            const card = row?.cardEl;
            if (!card) continue;
            const pidKey = item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0);
            const parentTplKey = getParentTemplatePidKey(item);

          const hideCard = () => {
            card.style.display = "none";
            card.dataset.dependentVisible = "0";
            card.classList.remove("attr-card-attention");
            if (pidKey && forcedTemplatePidKeys.delete(pidKey)) forcedChanged = true;
            if (pidKey && templateSelections.has(pidKey)) {
              templateSelections.delete(pidKey);
              clearedAny = true;
            }
            try {
              updateCardStatus(item);
            } catch {}
          };

            if (!parentTplKey || parentTplKey === "0") {
              hideCard();
              continue;
            }

            if (!selectedTplPids.has(parentTplKey)) {
              hideCard();
              continue;
            }

            const parentVidsMap = Array.isArray(item?.templatePropertyValueParentList)
              ? item.templatePropertyValueParentList.flatMap((x) => x?.parentVids || [])
              : [];
            if (parentVidsMap.length) {
              const selectedVids = selectedVidsByTpl.get(String(parentTplKey)) || new Set();
              const allowed = parentVidsMap.map((v) => String(v ?? "").trim()).filter(Boolean);
              const matched = allowed.some((v) => selectedVids.has(v));
              if (!matched) {
                hideCard();
                continue;
              }
            }

            ensureNestedUnderParent(card, item);
            card.style.display = "";
            card.dataset.dependentVisible = "1";
            if (pidKey && !forcedTemplatePidKeys.has(pidKey)) {
              forcedTemplatePidKeys.add(pidKey);
              forcedChanged = true;
            }
            card.classList.add("attr-card-attention");
            if (!card.dataset.noticeShown) {
              card.dataset.noticeShown = "1";
              setTimeout(() => {
                try {
                  card.scrollIntoView({ behavior: "smooth", block: "center" });
                } catch {}
              }, 30);
            }
            try {
              updateCardStatus(item);
            } catch {}
          }

          if (clearedAny || forcedChanged) {
            try {
              renderSelectedTemplateJson();
              renderUploadStepper();
            } catch {}
          }

          updateChildSlotVisibility();
          refreshingDependentVisibility = false;
        };

        updateDependentOptionalVisibility = refreshDependentOptionalVisibility;

        const getItemSummary = (item) => {
          const sel = getSelection(item);
          if (!sel) return "";
        if (isCompositionItem(item)) {
          const rows = Array.isArray(sel?.values) ? sel.values : [];
          const labels = rows
            .map((r) => {
              const name = String(r?.value ?? r?.name ?? r?.vid ?? "-").trim();
              const pct = r?.percent ?? r?.pct ?? r?.ratio ?? null;
                const p = pct == null ? "" : String(pct);
                if (!name || name === "-") return "";
                return p ? `${name} ${p}%` : name;
              })
              .filter(Boolean);
            if (!labels.length) return "";
            return labels.slice(0, 2).join("、") + (labels.length > 2 ? "…" : "");
          }
          const values = Array.isArray(sel?.values) ? sel.values : null;
          if (values && values.length) {
            const labels = values
              .map((v) => {
                const key = String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? "").trim();
                return vidLabelIndex.get(key) || valueLabelFor(v) || key;
              })
              .filter(Boolean);
            if (!labels.length) return "";
            return labels.slice(0, 2).join("、") + (labels.length > 2 ? "…" : "");
          }
          const v = String(sel?.value ?? "").trim();
          const u = String(sel?.valueUnit ?? sel?.valueUnitId ?? "").trim();
          return formatValueWithUnit(item, v, u);
        };

        const isItemDone = (item) => isItemDoneDeep(item);

        const updateCardStatus = (item) => {
          const pidKey = item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0);
          const cards = cardsByPid.get(pidKey);
          if (!cards || !cards.size) return;

        const sel = getSelection(item);
        const pillBase = "px-2 py-0.5 rounded-full border text-[11px] font-semibold";
        const pillMain = `${pillBase} bg-accent/5 border-accent/20 text-slate-800`;
        const pillMore = `${pillBase} bg-white border-slate-200 text-slate-500`;
        const emptyText = '<span class="text-[11px] text-slate-400">未填写</span>';

        const renderPills = (resultEl, labels) => {
          if (!resultEl) return;
          const list = (labels || []).map((x) => String(x ?? "").trim()).filter(Boolean);
          if (!list.length) {
            resultEl.innerHTML = emptyText;
            return;
          }
          const shown = list.slice(0, 3);
          const extra = list.length - shown.length;
          const pills = shown.map((x) => `<span class="${pillMain}">${escapeHtml(x)}</span>`);
          if (extra > 0) pills.push(`<span class="${pillMore}">+${extra}</span>`);
          resultEl.innerHTML = pills.join("");
        };

        const summaryText = getItemSummary(item) || "";

        const done = isItemDone(item);
        const forced = forcedTemplatePidKeys.has(pidKey);
        const req = forced || Boolean(item?.required);

        // Precompute labels once (shared for all cards with same pid).
        let labelsForPills = [];
        if (!sel) {
          labelsForPills = [];
        } else if (isCompositionItem(item)) {
          const rows = Array.isArray(sel?.values) ? sel.values : [];
          labelsForPills = rows
            .map((r) => {
              const name = String(r?.value ?? r?.name ?? r?.vid ?? "-").trim();
              const pct = r?.percent ?? r?.pct ?? r?.ratio ?? null;
              const p = pct == null ? "" : String(pct);
              if (!name || name === "-") return "";
              return p ? `${name} ${p}%` : name;
            })
            .filter(Boolean);
        } else if (Array.isArray(sel?.values) && sel.values.length) {
          labelsForPills = sel.values
            .map((v) => {
              const key = String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? "").trim();
              return vidLabelIndex.get(key) || valueLabelFor(v) || key;
            })
            .filter(Boolean);
        } else {
          const v = String(sel?.value ?? "").trim();
          const u = String(sel?.valueUnit ?? sel?.valueUnitId ?? "").trim();
          const combined = formatValueWithUnit(item, v, u);
          labelsForPills = combined ? [combined] : [];
        }

        for (const card of cards) {
          const chips = card.querySelector("[data-chips='1']");
          const summaryEl = card.querySelector("[data-summary='1']");
          const resultEl = card.querySelector("[data-result='1']");
          const depsEl = card.querySelector("[data-opt-deps='1']");

          if (summaryEl) summaryEl.textContent = summaryText;
          if (resultEl) renderPills(resultEl, labelsForPills);

          // Dependent optional attributes are rendered in the optional section (priority: matched first),
          // so the per-card dependency slot is intentionally kept empty to avoid duplicates.
          if (depsEl) {
            depsEl.innerHTML = "";
            depsEl.classList.add("hidden");
          }

          if (!chips) continue;
          let statusEl = chips.querySelector("[data-status='1']");
          if (!statusEl) {
            statusEl = document.createElement("span");
            statusEl.dataset.status = "1";
            statusEl.className = "text-[10px] px-2 py-0.5 rounded-full font-black border";
            chips.prepend(statusEl);
          }

          const baseStatusCls = "inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-black border shadow-sm";

          if (done) {
            statusEl.className = `${baseStatusCls} attr-status-done`;
            statusEl.innerHTML = '<i class="fas fa-circle-check text-white"></i><span>已完成</span>';
            statusEl.setAttribute("aria-label", "已完成");
            card.classList.add("attr-card-done");
            card.classList.remove("attr-card-attention");
          } else {
            const pendingCls = req
              ? forced
                ? `${baseStatusCls} attr-status-attention`
                : `${baseStatusCls} text-rose-700 bg-rose-50 border-rose-100`
              : `${baseStatusCls} text-slate-700 bg-slate-100 border-slate-200`;
            statusEl.className = pendingCls;
            statusEl.innerHTML = `<i class="fas ${req ? "fa-asterisk" : "fa-dot-circle"}"></i><span>${forced ? "需补充" : req ? "必填未填" : "选填未填"}</span>`;
            statusEl.setAttribute("aria-label", req ? "必填未填写" : "选填未填写");
            card.classList.remove("attr-card-done");
            if (forced) card.classList.add("attr-card-attention");
            else card.classList.remove("attr-card-attention");
          }
        }
      };
      const getModeMeta = (item) => {
        const name = String(item?.name ?? "").trim();
        const values = Array.isArray(item?.values) ? item.values : null;
        const max = Number(item?.chooseMaxNum ?? 0) || 0;
        const controlType = Number(item?.controlType ?? 0) || 0;
        const min = String(item?.minValue ?? "").trim();
        const maxV = String(item?.maxValue ?? "").trim();
        const minN = Number(min);
        const maxN = Number(maxV);
        const numeric = (min && Number.isFinite(minN)) || (maxV && Number.isFinite(maxN));

        if (values && values.length && isCompositionItem(item)) {
          return {
            kind: "composition",
            text: "Composition",
            icon: "fa-percent",
            note: `候选 ${values.length} 个`,
          };
        }

        if (values && values.length) {
          return {
            kind: max > 1 ? "multi" : "single",
            text: max > 1 ? "多选" : "单选",
            icon: "fa-list-check",
            note: `候选 ${values.length} 个`,
          };
        }
        if (controlType === 0 && numeric) return { kind: "number", text: "数值", icon: "fa-hashtag", note: "数值填写" };
        return { kind: "text", text: "文本", icon: "fa-pen-nib", note: "文本填写" };
      };

      const mkSection = (title, subtitle, icon, tone) => {
        const t = tone === "danger" ? "danger" : tone === "soft" ? "soft" : "neutral";
        const styles =
          t === "danger"
            ? "border-rose-100 bg-rose-50/60 text-rose-700"
            : t === "soft"
              ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
              : "border-slate-100 bg-slate-50/70 text-slate-700";
        const el = document.createElement("div");
        el.className = "lg:col-span-2 mt-2";
        el.innerHTML = `
          <div class="rounded-3xl border ${styles} p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-white/70 border border-white/60 inline-flex items-center justify-center">
                  <i class="fas ${escapeHtml(icon)}"></i>
                </div>
                <div>
                  <div class="text-base font-black">${escapeHtml(title)}</div>
                  <div class="text-xs text-slate-500 mt-0.5">${escapeHtml(subtitle || "")}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <i class="fas fa-circle-info"></i>
                  <span>点击卡片配置属性</span>
                </div>
                <div data-section-actions="1"></div>
              </div>
            </div>
          </div>
        `;
        return el;
      };

      const mkHeader = (item) => {
        const name = String(item?.name ?? "-");
        const required = item?.required
          ? '<span class="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-black"><i class="fas fa-asterisk text-[9px]"></i><span>必填</span></span>'
          : "";
        const max = Number(item?.chooseMaxNum ?? 0) || 0;
        const meta = getModeMeta(item);
        const maxChip =
          meta.kind === "multi" && max > 0
            ? `<span class="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-black">最多 ${max}</span>`
            : "";
        const modeStyles =
          meta.kind === "composition"
            ? "text-amber-800 bg-amber-50 border-amber-200"
            : meta.kind === "multi" || meta.kind === "single"
              ? "text-sky-800 bg-sky-50 border-sky-200"
              : meta.kind === "number"
                ? "text-fuchsia-800 bg-fuchsia-50 border-fuchsia-200"
                : "text-violet-800 bg-violet-50 border-violet-200";
        const modeChip = `<span class="text-[10px] ${modeStyles} border px-2 py-0.5 rounded-full font-black">${escapeHtml(meta.text)}</span>`;
        const note = meta?.note
          ? `<div class="text-[11px] text-slate-400 mt-1 flex items-center gap-2"><i class="fas fa-circle-info"></i><span>${escapeHtml(
              meta.note
            )}</span></div>`
          : "";

        const accentBar = item?.required ? "bg-rose-500" : "bg-slate-400/70";
        return `
          <button type="button" data-item-toggle="1" class="w-full text-left">
            <div class="absolute left-2 top-4 bottom-4 w-1 rounded-full ${accentBar}"></div>
            <div class="pl-2 space-y-2">
              <div class="flex items-start gap-2 text-base font-black text-slate-900">
                <i class="fas ${escapeHtml(meta.icon)} text-slate-600 mt-0.5"></i>
                <span class="break-words whitespace-normal">${escapeHtml(name)}</span>
              </div>
              ${note}
              <div data-chips="1" class="flex flex-wrap gap-1.5 justify-end">${required}${modeChip}${maxChip}</div>
              <div data-result="1" class="mt-2 flex flex-wrap gap-1.5"></div>
              <div data-summary="1" class="text-[11px] text-slate-500 mt-1 break-words whitespace-normal hidden"></div>
            </div>
          </button>
          <div data-opt-deps="1" class="hidden"></div>
        `;
      };

      // isCompositionItem is defined above to support composition-type attributes (controlType=16)

      const createModalShell = ({ title, subtitle }) => {
        try {
          if (typeof window.__topmCloseBubble === "function") window.__topmCloseBubble();
        } catch {}

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.zIndex = "9999";
        overlay.style.background = "rgba(15, 23, 42, 0.45)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.padding = "16px";

        const modal = document.createElement("div");
        modal.className = "w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden";
        modal.style.maxHeight = "85vh";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";

        const header = document.createElement("div");
        header.className = "px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3";
        header.innerHTML = `
          <div class="min-w-0">
            <div class="text-sm font-black text-slate-900 truncate">${escapeHtml(String(title ?? "配置属性"))}</div>
            <div class="text-[11px] text-slate-400 truncate">${escapeHtml(String(subtitle ?? ""))}</div>
          </div>
          <button type="button" data-modal-close="1" class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center">
            <i class="fas fa-xmark"></i>
          </button>
        `;

        const body = document.createElement("div");
        body.className = "p-5";
        body.style.overflow = "auto";

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
          try {
            window.__topmCloseBubble = null;
          } catch {}
          try {
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("mousedown", onMouseDown, true);
          } catch {}
          overlay.remove();
        };

        const onKeyDown = (e) => {
          if (e.key === "Escape") close();
        };
        const onMouseDown = (e) => {
          if (e.target === overlay) close();
        };

        window.__topmCloseBubble = close;
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("mousedown", onMouseDown, true);

        const closeBtn = header.querySelector("[data-modal-close='1']");
        if (closeBtn) closeBtn.addEventListener("click", close);

        return { overlay, modal, body, close };
      };

      const openValueInputModal = ({ pid, item }) => {
        const min = String(item?.minValue ?? "").trim();
        const maxV = String(item?.maxValue ?? "").trim();
        const minN = Number(min);
        const maxN = Number(maxV);
        const precision = Number(item?.valuePrecision ?? 0) || 0;
        const step = precision > 0 ? Math.pow(10, -precision) : 1;
        const numeric = (min && Number.isFinite(minN)) || (maxV && Number.isFinite(maxN));
        const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
        const hasUnits = unitList.length > 0;

        const shell = createModalShell({
          title: String(item?.name ?? "配置属性"),
          subtitle: "填写完成后点击“确认”应用",
        });

        const input = document.createElement("input");
        input.type = numeric ? "number" : "text";
        if (numeric) {
          if (min && Number.isFinite(minN)) input.min = String(minN);
          if (maxV && Number.isFinite(maxN)) input.max = String(maxN);
          input.step = String(step);
        }
        input.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
        input.placeholder = numeric ? "请输入数值" : "请输入";
        input.value = String(getSelection(item)?.value ?? "");

        let unitSelect = null;
        if (hasUnits) {
          unitSelect = document.createElement("select");
          unitSelect.className = "w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
          const existingUnit = String(getSelection(item)?.valueUnit ?? getSelection(item)?.valueUnitId ?? "").trim();
          for (const u of unitList) {
            const val = normalizeUnitValue(u);
            const id = normalizeUnitId(u);
            const label = String(u?.unitName ?? u?.name ?? u?.label ?? u?.text ?? val ?? "").trim() || val || "-";
            if (!val && !label) continue;
            const opt = document.createElement("option");
            opt.value = id || val || label;
            opt.dataset.unitVal = val;
            opt.dataset.unitId = id;
            opt.textContent = label;
            if (existingUnit && (existingUnit === opt.value || existingUnit === id || existingUnit === val)) opt.selected = true;
            unitSelect.appendChild(opt);
          }
          // 默认选中第一项，避免出现“请选择数量单位”占位。
          if (!unitSelect.value && unitSelect.options.length > 0) unitSelect.options[0].selected = true;
        }

        const actions = document.createElement("div");
        actions.className = "mt-4 flex items-center justify-between gap-2";

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className =
          "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
        clearBtn.textContent = "清空";

        const right = document.createElement("div");
        right.className = "flex items-center gap-2";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className =
          "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
        cancelBtn.textContent = "取消";

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90";
        confirmBtn.textContent = "确认";

        right.appendChild(cancelBtn);
        right.appendChild(confirmBtn);
        actions.appendChild(clearBtn);
        actions.appendChild(right);

        shell.body.appendChild(input);
        if (unitSelect) shell.body.appendChild(unitSelect);
        shell.body.appendChild(actions);

        const applyValue = (v) => {
          const raw = String(v ?? "");
          if (!raw.trim()) {
            setSelection(item, null);
            updateCardStatus(item);
            if (unitSelect && unitSelect.options.length) unitSelect.options[0].selected = true;
            return true;
          }
          const unitOpt = unitSelect ? unitSelect.selectedOptions?.[0] : null;
          const unitVal = unitOpt ? String(unitOpt.dataset.unitVal || unitOpt.value || "").trim() : "";
          const unitId = unitOpt ? String(unitOpt.dataset.unitId || unitOpt.value || "").trim() : "";
          const unitLabel = unitSelect ? resolveUnitLabel(item, unitVal || unitId) : "";
          setSelection(item, {
            value: raw,
            valueUnit: unitVal || unitId || null,
            valueUnitId: unitId || null,
            valueUnitName: unitLabel || null,
          });
          updateCardStatus(item);
          return true;
        };

        clearBtn.addEventListener("click", () => {
          input.value = "";
          if (unitSelect && unitSelect.options.length) unitSelect.options[0].selected = true;
        });
        cancelBtn.addEventListener("click", shell.close);
        confirmBtn.addEventListener("click", () => {
          const ok = applyValue(input.value);
          if (ok) shell.close();
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const ok = applyValue(input.value);
            if (ok) shell.close();
          }
        });

        setTimeout(() => input.focus(), 0);
      };

      const renderChoicePicker = ({ pid, values, max, wrap, item, uiMode, autoOpen }) => {
        const inPanel = uiMode === "panel";
        const existing = getSelection(item);
        const getRawId = (v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim();
        const getOptLabel = (v) => valueLabelFor(v) || String(v?.vid ?? v?.id ?? "-");
        // Some templates don't provide a numeric `vid`/`id` for values; fall back to label as key so dropdown isn't empty.
        const getOptKey = (v) => {
          const id = getRawId(v);
          if (id) return id;
          const label = String(getOptLabel(v) ?? "").trim();
          return label && label !== "-" ? label : "";
        };
        let chosen = new Set(
          Array.isArray(existing?.values)
            ? existing.values
                .map((x) => String(getRawId(x) || x?.value || x?.name || x).trim())
                .filter(Boolean)
            : []
        );

        const labelByVid = new Map();
        for (const v of values) {
          const key = getOptKey(v);
          if (!key) continue;
          labelByVid.set(key, getOptLabel(v));
        }
        const getChosenLabels = () =>
          Array.from(chosen)
            .map((vid) => String(labelByVid.get(String(vid)) ?? vid))
            .filter((x) => String(x ?? "").trim() !== "");

        const isMulti = max > 1;
        const showTabs = values.length > 36;
        let setTabActive = null;
        const baseBtn =
          "temu-opt-card px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2 transition-colors";
        const setBtnSelected = (btn, on) => {
          btn.classList.toggle("ring-2", on);
          btn.classList.toggle("ring-accent/30", on);
          btn.classList.toggle("border-accent/40", on);
          btn.classList.toggle("bg-accent/5", on);
          btn.querySelector("i")?.classList.toggle("hidden", !on);
        };

        const optionsWrap = document.createElement("div");
        optionsWrap.dataset.pickerBody = "1";
        optionsWrap.className = "space-y-2";

        const summary = document.createElement("div");
        summary.className = "text-[11px] text-slate-400 flex items-center gap-2 min-w-0";
        const chosenPills = document.createElement("div");
        chosenPills.className = "flex flex-wrap gap-1.5";
        const refreshSummary = () => {
          const labels = getChosenLabels();
          const count = chosen.size;
          if (!isMulti) {
            summary.innerHTML =
              count && labels[0]
                ? `<i class="fas fa-circle-check text-emerald-600"></i><span class="truncate">已选：<span class="font-semibold text-slate-700">${escapeHtml(
                    labels[0]
                  )}</span></span>`
                : `<i class="fas fa-circle text-slate-300"></i>未选择`;

            chosenPills.hidden = !labels.length;
            chosenPills.classList.toggle("hidden", !labels.length);
            chosenPills.innerHTML = labels[0]
              ? `<span class="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">${escapeHtml(
                  labels[0]
                )}</span>`
              : "";
            return;
          }
          const limit = max > 0 ? ` / ${max}` : "";
          const shown = labels.slice(0, 3);
          const more = labels.length > 3 ? "…" : "";
          summary.innerHTML = labels.length
            ? `<i class="fas fa-circle-check text-emerald-600"></i><span class="truncate">已选：${shown
                .map((x) => escapeHtml(x))
                .join("、")}${more}（${count}${limit}）</span>`
            : `<i class="fas fa-circle-check text-emerald-600"></i>已选 ${count}${limit} 项`;

          chosenPills.hidden = !labels.length;
          chosenPills.classList.toggle("hidden", !labels.length);
          const pillLabels = labels.slice(0, 6);
          const extra = labels.length - pillLabels.length;
          const pills = pillLabels.map(
            (x) =>
              `<span class="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">${escapeHtml(
                x
              )}</span>`
          );
          if (extra > 0)
            pills.push(
              `<span class="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-500">+${extra}</span>`
            );
          chosenPills.innerHTML = pills.join("");
        };
        refreshSummary();

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.dataset.pickerToggle = "1";
        toggleBtn.className =
          "px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-slate-50";

        const summaryRow = document.createElement("div");
        summaryRow.className = "space-y-2";
        const topRow = document.createElement("div");
        topRow.className = "flex items-center justify-between gap-3";
        topRow.appendChild(summary);
        topRow.appendChild(toggleBtn);
        summaryRow.appendChild(topRow);
        summaryRow.appendChild(chosenPills);

        let expanded = chosen.size === 0;
        let applyCollapseState = () => {
          const hasSelection = chosen.size > 0;
          if (!hasSelection) expanded = true;
          optionsWrap.hidden = !expanded;
          optionsWrap.classList.toggle("hidden", !expanded);
          toggleBtn.hidden = !hasSelection;
          toggleBtn.textContent = expanded ? "收起" : "修改";
        };
        if (inPanel) {
          expanded = true;
          applyCollapseState = () => {
            optionsWrap.hidden = false;
            optionsWrap.classList.remove("hidden");
            toggleBtn.hidden = true;
          };
        }
        applyCollapseState();

        toggleBtn.addEventListener("click", () => {
          expanded = !expanded;
          applyCollapseState();
        });

        const syncEditorSummary = () => {
          if (!inPanel) return;
          const head = wrap?.previousSibling;
          const summaryEl = head?.querySelector?.("[data-editor-summary='1']");
          if (!summaryEl) return;
          summaryEl.textContent = getItemSummary(item) || "未填写";
        };

        const buildGrid = (list, opts) => {
          const grid = document.createElement("div");
          grid.className = "grid grid-cols-2 sm:grid-cols-3 gap-2";

          for (const v of list) {
            const vid = getOptKey(v);
            if (!vid) continue;
            const label = getOptLabel(v);
            const b = document.createElement("button");
            b.type = "button";
            b.className = baseBtn;
            b.dataset.vid = vid;
            b.innerHTML = `<span class="truncate">${escapeHtml(label)}</span><i class="fas fa-check text-emerald-600 hidden"></i>`;
            setBtnSelected(b, chosen.has(vid));

            b.addEventListener("click", () => {
              const has = chosen.has(vid);
              if (!isMulti) {
                if (has) {
                  chosen.clear();
                  setSelection(item, null);
                  grid.querySelectorAll("button[data-vid]").forEach((x) => setBtnSelected(x, false));
                  refreshSummary();
                  expanded = true;
                  applyCollapseState();
                  if (typeof setTabActive === "function") setTabActive();
                  if (opts?.after) opts.after();
                  return;
                }
                chosen.clear();
                chosen.add(vid);
                grid.querySelectorAll("button[data-vid]").forEach((x) => setBtnSelected(x, x.dataset.vid === vid));
                const raw = values.find((x) => getOptKey(x) === String(vid)) || {};
                const tplKey = getValueTemplatePidKey(raw);
                setSelection(item, {
                  values: [{ vid: getRawId(raw) || String(vid), value: getOptLabel(raw), templatePid: tplKey !== "0" ? tplKey : undefined }],
                });
                refreshSummary();
                updateCardStatus(item);
                // Auto-collapse after a valid single selection.
                expanded = false;
                applyCollapseState();
                if (typeof setTabActive === "function") setTabActive();
                if (opts?.after) opts.after();
                return;
              }

              if (has) chosen.delete(vid);
              else {
                if (max > 0 && chosen.size >= max) return;
                chosen.add(vid);
              }
              setBtnSelected(b, !has);
              const vids = Array.from(chosen);
              if (!vids.length) {
                setSelection(item, null);
                refreshSummary();
                expanded = true;
                applyCollapseState();
                if (typeof setTabActive === "function") setTabActive();
                if (opts?.after) opts.after();
                return;
              }
              const mapped = vids
                .map((id) => {
                  const raw = values.find((x) => getOptKey(x) === String(id)) || {};
                  const tplKey = getValueTemplatePidKey(raw);
                  return { vid: getRawId(raw) || String(id), value: getOptLabel(raw), templatePid: tplKey !== "0" ? tplKey : undefined };
                })
                .filter((x) => x.vid != null || x.value);
              setSelection(item, { values: mapped });
              refreshSummary();
              updateCardStatus(item);
              // Multi-select: keep expanded unless max is reached.
              expanded = !(max > 0 && chosen.size >= max);
              applyCollapseState();
              if (typeof setTabActive === "function") setTabActive();
              if (opts?.after) opts.after();
            });
            grid.appendChild(b);
          }

          return grid;
        };

        if (inPanel) {
          const pickBtn = document.createElement("button");
          pickBtn.type = "button";
          pickBtn.className =
            "w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2 transition-colors";

          const setPickBtnLabel = () => {
            const labels = getChosenLabels();
            const left = labels.length
              ? escapeHtml(labels.slice(0, isMulti ? 3 : 1).join("、")) + (isMulti && labels.length > 3 ? "…" : "")
              : '<span class="text-slate-400">点击选择</span>';
            const right = isMulti ? `<span class="text-[11px] text-slate-400">已选 ${chosen.size}${max > 0 ? ` / ${max}` : ""}</span>` : "";
            pickBtn.innerHTML = `<span class="min-w-0 truncate">${left}</span><span class="flex items-center gap-2">${right}<i class="fas fa-ellipsis text-[11px] text-slate-400"></i></span>`;
          };

          const commitChosen = () => {
            const vids = Array.from(chosen);
            if (!vids.length) {
              setSelection(item, null);
              updateCardStatus(item);
              refreshSummary();
              setPickBtnLabel();
              syncEditorSummary();
              return;
            }
            const mapped = vids
              .map((id) => {
                const raw = values.find((x) => getOptKey(x) === String(id)) || {};
                const tplKey = getValueTemplatePidKey(raw);
                return { vid: getRawId(raw) || String(id), value: getOptLabel(raw), templatePid: tplKey !== "0" ? tplKey : undefined };
              })
              .filter((x) => x.vid != null || x.value);
            setSelection(item, { values: mapped });
            updateCardStatus(item);
            refreshSummary();
            setPickBtnLabel();
            syncEditorSummary();
          };

          const openModal = () => {
            try {
              if (typeof window.__topmCloseBubble === "function") window.__topmCloseBubble();
            } catch {}

            const draft = new Set(Array.from(chosen));

            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.inset = "0";
            overlay.style.zIndex = "9999";
            overlay.style.background = "rgba(15, 23, 42, 0.45)";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.padding = "16px";

            const modal = document.createElement("div");
            modal.className = "w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden";
            modal.style.maxHeight = "85vh";
            modal.style.display = "flex";
            modal.style.flexDirection = "column";

            const header = document.createElement("div");
            header.className = "px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3";
            header.innerHTML = `
              <div class="min-w-0">
                <div class="text-sm font-black text-slate-900 truncate">${escapeHtml(String(item?.name ?? "选择备选项"))}</div>
                <div class="text-[11px] text-slate-400 truncate">${escapeHtml(isMulti ? `多选${max > 0 ? `（最多 ${max}）` : ""}` : "单选")} · 选好后点“确认”应用</div>
              </div>
              <button type="button" data-bubble-close="1" class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center">
                <i class="fas fa-xmark"></i>
              </button>
            `;

            const body = document.createElement("div");
            body.className = "p-5";
            body.style.overflow = "auto";

            const search = document.createElement("input");
            search.type = "text";
            search.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
            search.placeholder = "输入关键词筛选";

            const list = document.createElement("div");
            list.className = "mt-2 overflow-auto";
            list.style.maxHeight = "50vh";

            const footer = document.createElement("div");
            footer.className = "mt-3 flex items-center justify-between gap-2";

            const leftInfo = document.createElement("div");
            leftInfo.className = "text-[11px] text-slate-400 min-w-0 truncate";

            const actions = document.createElement("div");
            actions.className = "flex items-center gap-2";

            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className =
              "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
            clearBtn.textContent = "清空";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className =
              "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
            cancelBtn.textContent = "取消";

            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.className = "px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90";
            confirmBtn.textContent = "确认";

            actions.appendChild(clearBtn);
            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);
            footer.appendChild(leftInfo);
            footer.appendChild(actions);

            body.appendChild(search);
            body.appendChild(list);
            body.appendChild(footer);

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const close = () => {
              try {
                window.__topmCloseBubble = null;
              } catch {}
              try {
                document.removeEventListener("keydown", onKeyDown, true);
                document.removeEventListener("mousedown", onMouseDown, true);
              } catch {}
              overlay.remove();
            };

            const onKeyDown = (e) => {
              if (e.key === "Escape") close();
            };
            const onMouseDown = (e) => {
              // Click backdrop to close (treat as cancel).
              if (e.target === overlay) close();
            };

            window.__topmCloseBubble = close;

            const updateLeftInfo = () => {
              if (!isMulti) {
                leftInfo.textContent = draft.size ? "已选择 1 项" : "未选择";
                return;
              }
              leftInfo.textContent = `已选 ${draft.size}${max > 0 ? ` / ${max}` : ""}`;
            };

            const renderList = () => {
              list.innerHTML = "";
              const q = String(search.value ?? "").trim().toLowerCase();
              const filtered = q
                ? values.filter((v) => String(getOptLabel(v) ?? "").toLowerCase().includes(q))
                : values;

              const useGrid = filtered.length <= 36;
              const container = document.createElement("div");
              container.className = useGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-2" : "space-y-1";

              const slice = filtered.slice(0, useGrid ? 220 : 300);
              for (const v of slice) {
                const vid = getOptKey(v);
                if (!vid) continue;
                const label = getOptLabel(v);
                const selected = draft.has(vid);
                const disabled = isMulti && max > 0 && draft.size >= max && !selected;

                const b = document.createElement("button");
                b.type = "button";
                b.disabled = disabled;
                b.dataset.vid = vid;
                b.className = useGrid
                  ? baseBtn + (disabled ? " opacity-60 cursor-not-allowed" : "")
                  : "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed";
                b.innerHTML = useGrid
                  ? `<span class="truncate">${escapeHtml(label)}</span><i class="fas fa-check text-emerald-600 ${selected ? "" : "hidden"}"></i>`
                  : `
                      <span class="truncate">${escapeHtml(label)}</span>
                      <i class="fas ${selected ? "fa-circle-check text-emerald-600" : "fa-circle text-slate-300"}"></i>
                    `;

                if (useGrid) setBtnSelected(b, selected);

                b.addEventListener("click", () => {
                  const has = draft.has(vid);
                  if (!isMulti) {
                    draft.clear();
                    if (!has) draft.add(vid);
                    updateLeftInfo();
                    renderList();
                    return;
                  }

                  if (has) draft.delete(vid);
                  else {
                    if (max > 0 && draft.size >= max) return;
                    draft.add(vid);
                  }
                  updateLeftInfo();
                  renderList();
                });

                container.appendChild(b);
              }

              if (filtered.length > (useGrid ? 220 : 300)) {
                const tip = document.createElement("div");
                tip.className = "text-[11px] text-slate-400 px-1 mt-2";
                tip.textContent = `匹配 ${filtered.length} 项，当前仅展示前 ${useGrid ? 220 : 300} 项，请继续输入关键词缩小范围`;
                container.appendChild(tip);
              }

              list.appendChild(container);
              updateLeftInfo();
            };

            const closeBtn = header.querySelector("[data-bubble-close='1']");
            if (closeBtn) closeBtn.addEventListener("click", close);
            clearBtn.addEventListener("click", () => {
              draft.clear();
              updateLeftInfo();
              renderList();
            });
            cancelBtn.addEventListener("click", close);
            confirmBtn.addEventListener("click", () => {
              chosen = new Set(Array.from(draft));
              commitChosen();
              close();
            });
            search.addEventListener("input", renderList);

            document.addEventListener("keydown", onKeyDown, true);
            document.addEventListener("mousedown", onMouseDown, true);

            setTimeout(() => {
              renderList();
              search.focus();
            }, 0);
          };

          setPickBtnLabel();
          pickBtn.addEventListener("click", openModal);
          optionsWrap.appendChild(pickBtn);

          wrap.appendChild(summaryRow);
          wrap.appendChild(optionsWrap);
          if (autoOpen) setTimeout(() => openModal(), 0);
          return;
        }

        if (!showTabs) {
          optionsWrap.appendChild(buildGrid(values.slice(0, 220)));
          wrap.appendChild(optionsWrap);
          wrap.appendChild(summaryRow);
          return;
        }

        // Dropdown picker for long lists (> 36).
        const dd = document.createElement("div");
        dd.className = "relative";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className =
          "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 flex items-center justify-between gap-2 hover:bg-slate-50";

        const triggerLabel = document.createElement("div");
        triggerLabel.className = "min-w-0 truncate";
        const caret = document.createElement("i");
        caret.className = "fas fa-chevron-down text-[11px] text-slate-400";
        trigger.appendChild(triggerLabel);
        trigger.appendChild(caret);

        const panel = document.createElement("div");
        // In-flow dropdown to avoid overlay covering other fields.
        panel.className = "mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-soft p-2";
        panel.hidden = true;

        const search = document.createElement("input");
        search.type = "text";
        search.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
        search.placeholder = "输入关键词筛选";

        const list = document.createElement("div");
        list.className = "mt-2 max-h-60 overflow-auto space-y-1";

        const actions = document.createElement("div");
        actions.className = "mt-2 flex items-center justify-between gap-2";

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
        clearBtn.textContent = "清空";

        const doneBtn = document.createElement("button");
        doneBtn.type = "button";
        doneBtn.className = "px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90";
        doneBtn.textContent = "完成";
        doneBtn.hidden = !isMulti;

        actions.appendChild(clearBtn);
        actions.appendChild(doneBtn);

        panel.appendChild(search);
        panel.appendChild(list);
        panel.appendChild(actions);

        const setTriggerLabel = () => {
          const labels = getChosenLabels();
          if (!labels.length) {
            triggerLabel.innerHTML = '<span class="text-slate-400">请选择</span>';
            return;
          }
          if (!isMulti) {
            triggerLabel.textContent = labels[0];
            return;
          }
          const shown = labels.slice(0, 3).join("、");
          const more = labels.length > 3 ? `…（${labels.length}）` : `（${labels.length}）`;
          triggerLabel.textContent = `${shown}${more}`;
        };

        const commitChosen = () => {
          const vids = Array.from(chosen);
          if (!vids.length) return setSelection(item, null);
          const mapped = vids
            .map((id) => {
              const raw = values.find((x) => getOptKey(x) === String(id)) || {};
              const tplKey = getValueTemplatePidKey(raw);
              return { vid: getRawId(raw) || String(id), value: getOptLabel(raw), templatePid: tplKey !== "0" ? tplKey : undefined };
            })
            .filter((x) => x.vid != null || x.value);
          setSelection(item, { values: mapped });
          updateCardStatus(item);
        };

        const renderList = () => {
          list.innerHTML = "";
          const q = String(search.value ?? "").trim().toLowerCase();
          const filtered = q
            ? values.filter((v) => String(getOptLabel(v) ?? "").toLowerCase().includes(q))
            : values;

          for (const v of filtered.slice(0, 300)) {
            const vid = getOptKey(v);
            if (!vid) continue;
            const text = getOptLabel(v);
            const selected = chosen.has(vid);
            const disabled = isMulti && max > 0 && chosen.size >= max && !selected;

            const row = document.createElement("button");
            row.type = "button";
            row.disabled = disabled;
            row.className =
              "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed";
            row.innerHTML = `
              <span class="truncate">${escapeHtml(text)}</span>
              <i class="fas ${selected ? "fa-circle-check text-emerald-600" : "fa-circle text-slate-300"}"></i>
            `;
            row.addEventListener("click", () => {
              const has = chosen.has(vid);
              if (!isMulti) {
                chosen.clear();
                if (!has) chosen.add(vid);
                commitChosen();
                refreshSummary();
                updateCardStatus(item);
                setTriggerLabel();
                panel.hidden = true;
                expanded = chosen.size === 0;
                if (chosen.size > 0) expanded = false;
                applyCollapseState();
                syncEditorSummary();
                return;
              }

              if (has) chosen.delete(vid);
              else {
                if (max > 0 && chosen.size >= max) return;
                chosen.add(vid);
              }
              commitChosen();
              refreshSummary();
              updateCardStatus(item);
              setTriggerLabel();
              renderList();
              syncEditorSummary();

              expanded = !(max > 0 && chosen.size >= max);
              applyCollapseState();
              if (max > 0 && chosen.size >= max) panel.hidden = true;
            });
            list.appendChild(row);
          }

          if (filtered.length > 300) {
            const tip = document.createElement("div");
            tip.className = "text-[11px] text-slate-400 px-1";
            tip.textContent = `匹配 ${filtered.length} 项，当前仅展示前 300 项，请继续输入关键词缩小范围`;
            list.appendChild(tip);
          }
        };

        const togglePanel = (next) => {
          const on = typeof next === "boolean" ? next : panel.hidden;
          panel.hidden = !on;
          caret.className = `fas ${on ? "fa-chevron-up" : "fa-chevron-down"} text-[11px] text-slate-400`;
          if (on) {
            search.value = "";
            renderList();
            setTimeout(() => search.focus(), 0);
          }
        };

        trigger.addEventListener("click", () => togglePanel());
        search.addEventListener("input", renderList);
        clearBtn.addEventListener("click", () => {
          chosen.clear();
          commitChosen();
          refreshSummary();
          setTriggerLabel();
          renderList();
          expanded = true;
          applyCollapseState();
          syncEditorSummary();
        });
        doneBtn.addEventListener("click", () => togglePanel(false));

        setTriggerLabel();
        renderList();

        dd.appendChild(trigger);
        dd.appendChild(panel);
        optionsWrap.appendChild(dd);
        wrap.appendChild(optionsWrap);
        wrap.appendChild(summaryRow);
      };

      const renderCompositionPicker = ({ pid, values, max, wrap, item, uiMode, onSaved }) => {
        const inPanel = uiMode === "panel";
        const existing = getSelection(item);
        const getRawId = (v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim();
        const getOptLabel = (v) => valueLabelFor(v) || String(v?.vid ?? v?.id ?? "-");
        const getOptKey = (v) => {
          const id = getRawId(v);
          if (id) return id;
          const label = String(getOptLabel(v) ?? "").trim();
          return label && label !== "-" ? label : "";
        };

        const optIndex = new Map();
        for (const v of values) {
          const key = getOptKey(v);
          if (!key) continue;
          optIndex.set(String(key), { key: String(key), vid: getRawId(v) || String(key), label: getOptLabel(v) });
        }

        const parseExistingRows = () => {
          const sel = existing;
          const list = Array.isArray(sel?.values) ? sel.values : [];
          return list
            .map((r) => {
              const key = String(r?.vid ?? r?.id ?? r?.key ?? r?.value ?? r?.name ?? "").trim();
              const percent = String(r?.percent ?? r?.pct ?? r?.ratio ?? "").trim();
              return { key, percent };
            })
            .filter((r) => r.key || r.percent);
        };

        const rows = parseExistingRows();
        if (!rows.length) rows.push({ key: "", percent: "" });

        const optionsWrap = document.createElement("div");
        optionsWrap.dataset.pickerBody = "1";
        optionsWrap.className = "space-y-2";

        const summary = document.createElement("div");
        summary.className = "text-[11px] text-slate-400 flex items-center gap-2 min-w-0";
        const chosenPills = document.createElement("div");
        chosenPills.className = "flex flex-wrap gap-1.5";

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.dataset.pickerToggle = "1";
        toggleBtn.className =
          "px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-slate-50";

        const summaryRow = document.createElement("div");
        summaryRow.className = "space-y-2";
        const topRow = document.createElement("div");
        topRow.className = "flex items-center justify-between gap-3";
        topRow.appendChild(summary);
        topRow.appendChild(toggleBtn);
        summaryRow.appendChild(topRow);
        summaryRow.appendChild(chosenPills);

        const normalizePercent = (raw) => {
          const t = String(raw ?? "").trim();
          if (!t) return "";
          const n = Number(t);
          if (!Number.isFinite(n)) return "";
          if (n < 0 || n > 100) return "";
          // keep as string for UI; backend can parse number.
          return String(n);
        };

        const getDraftAnalysis = () => {
          const complete = [];
          let hasPartial = false;
          let sum = 0;
          for (const r of rows) {
            const key = String(r?.key ?? "").trim();
            const pctRaw = String(r?.percent ?? "").trim();
            if (!key && !pctRaw) continue;
            const pct = normalizePercent(pctRaw);
            if (!key || !pct) {
              hasPartial = true;
              continue;
            }
            const meta = optIndex.get(key) || { vid: key, label: key };
            const pctNum = Number(pct);
            sum += pctNum;
            complete.push({ key, vid: meta.vid, value: meta.label, percent: pctNum });
          }
          const sumOk = complete.length > 0 && Math.abs(sum - 100) <= 0.001;
          return { complete, hasPartial, sum, sumOk };
        };

        let expanded = true;
        let applyCollapseState = () => {
          const hasSelection = Array.isArray(getSelection(item)?.values) && getSelection(item)?.values.length > 0;
          if (!hasSelection) expanded = true;
          optionsWrap.hidden = !expanded;
          optionsWrap.classList.toggle("hidden", !expanded);
          toggleBtn.hidden = !hasSelection;
          toggleBtn.textContent = expanded ? "收起" : "修改";
        };
        if (inPanel) {
          expanded = true;
          applyCollapseState = () => {
            optionsWrap.hidden = false;
            optionsWrap.classList.remove("hidden");
            toggleBtn.hidden = true;
          };
        }

        const refreshSavedSummary = () => {
          const sel = getSelection(item);
          const list = Array.isArray(sel?.values) ? sel.values : [];
          if (!list.length) {
            summary.innerHTML = `<i class="fas fa-circle text-slate-300"></i>未选择`;
            chosenPills.hidden = true;
            chosenPills.classList.add("hidden");
            chosenPills.innerHTML = "";
            return;
          }

          const labels = list.map((x) => `${String(x?.value ?? x?.name ?? x?.vid ?? "-")} ${String(x?.percent ?? "")}%`);
          const shown = labels.slice(0, 2).map((x) => escapeHtml(x));
          const more = labels.length > 2 ? "…" : "";
          summary.innerHTML = `<i class="fas fa-circle-check text-emerald-600"></i><span class="truncate">已配：${shown.join("、")}${more}（${labels.length}）</span>`;

          chosenPills.hidden = false;
          chosenPills.classList.remove("hidden");
          const pillLabels = labels.slice(0, 6);
          const extra = labels.length - pillLabels.length;
          const pills = pillLabels.map(
            (x) =>
              `<span class="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">${escapeHtml(
                x
              )}</span>`
          );
          if (extra > 0)
            pills.push(
              `<span class="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-500">+${extra}</span>`
            );
          chosenPills.innerHTML = pills.join("");
        };

        // Composition should support multiple rows even if upstream chooseMaxNum is 1.
        // If upstream provides a reasonable max (> 1), respect it; otherwise allow up to 20 rows.
        const maxRows = max > 1 ? max : 20;

        const renderEditor = () => {
          optionsWrap.innerHTML = "";

          const header = document.createElement("div");
          header.className = "flex items-start justify-between gap-2";

          const hint = document.createElement("div");
          hint.className = "text-[11px] text-slate-400 pt-1";
          hint.textContent = "每行选择一个成分，并填写百分比（0-100）。编辑后需点击“确认”。";

          const actions = document.createElement("div");
          actions.className = "flex items-center gap-2";

          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className =
            "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
          addBtn.textContent = "添加一行";

          const resetBtn = document.createElement("button");
          resetBtn.type = "button";
          resetBtn.className =
            "px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50";
          resetBtn.textContent = "还原";

          const saveBtn = document.createElement("button");
          saveBtn.type = "button";
          saveBtn.className =
            "px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed";
          saveBtn.textContent = "确认";

          actions.appendChild(addBtn);
          actions.appendChild(resetBtn);
          actions.appendChild(saveBtn);
          header.appendChild(hint);
          header.appendChild(actions);

          const msg = document.createElement("div");
          msg.className = "text-[11px] px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 text-slate-600";

          const updateDraftStatus = () => {
            const a = getDraftAnalysis();
            const hasAny = rows.some((r) => String(r?.key ?? "").trim() || String(r?.percent ?? "").trim());

            addBtn.disabled = rows.length >= maxRows;
            resetBtn.disabled = !hasAny && !parseExistingRows().length;

            if (a.hasPartial) {
              msg.className = "text-[11px] px-3 py-2 rounded-xl border bg-amber-50 border-amber-100 text-amber-700";
              msg.textContent = "有未填写完整的行：请选择成分并填写百分比。";
              saveBtn.disabled = true;
              return;
            }
            if (!a.complete.length) {
              msg.className = "text-[11px] px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 text-slate-600";
              msg.textContent = "未填写。";
              saveBtn.disabled = true;
              return;
            }
            if (!a.sumOk) {
              msg.className = "text-[11px] px-3 py-2 rounded-xl border bg-amber-50 border-amber-100 text-amber-700";
              msg.textContent = `当前合计 ${a.sum.toFixed(2).replace(/\\.?0+$/, "")}%（需等于 100%）。`;
              saveBtn.disabled = true;
              return;
            }
            msg.className = "text-[11px] px-3 py-2 rounded-xl border bg-emerald-50 border-emerald-100 text-emerald-700";
            msg.textContent = "校验通过：合计 100%。点击“确认”应用。";
            saveBtn.disabled = false;
          };
          optionsWrap.appendChild(header);
          optionsWrap.appendChild(msg);

          const grid = document.createElement("div");
          grid.className = "space-y-2";

          const mkRow = (row, idx) => {
            const wrapRow = document.createElement("div");
            wrapRow.className = "grid grid-cols-12 gap-2 items-center";

            const sel = document.createElement("select");
            sel.className = "col-span-7 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
            sel.innerHTML = '<option value="">请选择成分</option>';
            for (const [key, meta] of optIndex.entries()) {
              const opt = document.createElement("option");
              opt.value = key;
              opt.textContent = String(meta?.label ?? key);
              sel.appendChild(opt);
            }
            sel.value = String(row.key ?? "");
            sel.addEventListener("change", () => {
              row.key = String(sel.value ?? "");
              if (pctInput) pctInput.disabled = !String(row.key ?? "").trim();
              updateDraftStatus();
            });

            const pctWrap = document.createElement("div");
            pctWrap.className = "col-span-4 relative";
            pctWrap.innerHTML = `
              <input type="number" min="0" max="100" step="0.01" class="w-full pr-8 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" placeholder="百分比" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span>
            `;
            const pctInput = pctWrap.querySelector("input");
            if (pctInput) {
              pctInput.value = String(row.percent ?? "");
              pctInput.disabled = !String(row.key ?? "").trim();
              pctInput.addEventListener("input", () => {
                row.percent = String(pctInput.value ?? "");
                updateDraftStatus();
              });
            }

            const rm = document.createElement("button");
            rm.type = "button";
            rm.className =
              "col-span-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50";
            rm.title = "删除";
            rm.innerHTML = '<i class="fas fa-xmark"></i>';
            rm.addEventListener("click", () => {
              rows.splice(idx, 1);
              if (!rows.length) rows.push({ key: "", percent: "" });
              expanded = true;
              renderEditor();
              updateDraftStatus();
            });

            wrapRow.appendChild(sel);
            wrapRow.appendChild(pctWrap);
            wrapRow.appendChild(rm);
            return wrapRow;
          };

          rows.forEach((r, idx) => grid.appendChild(mkRow(r, idx)));
          optionsWrap.appendChild(grid);

          addBtn.disabled = rows.length >= maxRows;
          addBtn.addEventListener("click", () => {
            if (rows.length >= maxRows) return;
            rows.push({ key: "", percent: "" });
            expanded = true;
            renderEditor();
            applyCollapseState();
          });

          resetBtn.addEventListener("click", () => {
            rows.length = 0;
            const restored = parseExistingRows();
            if (restored.length) rows.push(...restored);
            if (!rows.length) rows.push({ key: "", percent: "" });
            expanded = true;
            renderEditor();
            applyCollapseState();
          });

          saveBtn.addEventListener("click", () => {
            const a = getDraftAnalysis();
            if (a.hasPartial || !a.sumOk) return;
            const payload = a.complete.map((x) => ({ vid: x.vid, value: x.value, percent: x.percent, key: x.key }));
            setSelection(item, { values: payload });
            updateCardStatus(item);
            refreshSavedSummary();
            expanded = false;
            applyCollapseState();
            if (typeof onSaved === "function") onSaved();
          });

          updateDraftStatus();
        };

        renderEditor();
        refreshSavedSummary();

        toggleBtn.addEventListener("click", () => {
          expanded = !expanded;
          applyCollapseState();
        });

        wrap.appendChild(optionsWrap);
        wrap.appendChild(summaryRow);
        applyCollapseState();
      };

        const renderItemCard = (item, opts) => {
          const pid = item?.pid;
          if (pid == null) return null;

          const card = document.createElement("div");
        card.dataset.itemCard = "1";
        card.dataset.pid = String(pid);
        const isReq = Boolean(item?.required);
        const parentPidKey = getParentTemplatePidKey(item);
        const nested = opts?.nested === true;
        const baseReq =
          "relative overflow-hidden rounded-3xl border-2 border-accent/20 bg-accent/5 p-5 pl-6 hover:border-accent/30 transition-colors";
        const baseOpt =
          "relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-5 pl-6 hover:border-accent/30 transition-colors";
        card.className = isReq
          ? "relative overflow-hidden rounded-3xl border-2 border-accent/20 bg-accent/5 p-5 pl-6 hover:border-accent/30 transition-colors"
          : "relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-5 pl-6 hover:border-accent/30 transition-colors";
        if (nested) {
          card.className = (isReq ? baseReq : baseOpt) + " bg-slate-50/40 attr-card-nested";
        }
        card.innerHTML = mkHeader(item);

        const pidKey = item?.__pidKey ?? pidKeyFromItem(item, item?.__idx || 0);
        const parentTplKeyActual = getParentTemplatePidKey(item);
        if (parentTplKeyActual && parentTplKeyActual !== "0") {
          if (!parentTplToChildPidKeys.has(parentTplKeyActual)) parentTplToChildPidKeys.set(parentTplKeyActual, new Set());
          parentTplToChildPidKeys.get(parentTplKeyActual).add(pidKey);
        }

        // Slot to host dependent child cards directly inside the parent card.
        const childSlot = document.createElement("div");
        childSlot.dataset.childSlot = "1";
        childSlot.dataset.pid = String(pidKey);
        childSlot.className = "mt-4 space-y-3 hidden";
        card.appendChild(childSlot);
        childSlotByPid.set(pidKey, childSlot);

        const toggle = card.querySelector("[data-item-toggle='1']");
        if (toggle) {
          toggle.addEventListener("click", () => {
            // Use the item's own reference to avoid any pid-key collisions in maps.
            const itemNow = item || itemsByPid.get(pidKey);
            if (!itemNow) return;

            const values = Array.isArray(itemNow?.values) ? itemNow.values : null;
            const max = Number(itemNow?.chooseMaxNum ?? 0) || 0;
            if (values && values.length) {
              if (isCompositionItem(itemNow)) {
                const shell = createModalShell({
                  title: String(itemNow?.name ?? "Composition"),
                  subtitle: "配置完成后点击“确认”应用（合计需为 100%）",
                });
                const bodyWrap = document.createElement("div");
                bodyWrap.className = "space-y-3";
                shell.body.appendChild(bodyWrap);
                renderCompositionPicker({
                  pid,
                  values: values.slice(0, 800),
                  max,
                  wrap: bodyWrap,
                  item: itemNow,
                  uiMode: "panel",
                  onSaved: () => shell.close(),
                });
                return;
              }

              const dummy = document.createElement("div");
              renderChoicePicker({ pid, values: values.slice(0, 800), max, wrap: dummy, item: itemNow, uiMode: "panel", autoOpen: true });
              return;
            }

            openValueInputModal({ pid, item: itemNow });
          });
        }
        registerCard(pidKey, card);
        itemsByPid.set(pidKey, item);
        updateCardStatus(item);

        if (parentPidKey !== "0") {
          card.dataset.parentTemplatePid = parentPidKey;
          card.style.display = "none";
          registerDependentCard(item, card);
        }
        return card;
      };

      const grid = document.createElement("div");
      grid.className = "grid grid-flow-row-dense gap-6 w-full";
      grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
      templateForm.appendChild(grid);

      for (const item of requiredItems) {
        const card = renderItemCard(item);
        if (card) grid.appendChild(card);
      }

      for (const item of rootOptionalItems) {
        const card = renderItemCard(item);
        if (card) grid.appendChild(card);
      }

      for (const item of dependentItems) {
        const card = renderItemCard(item, { nested: true });
        if (card) {
          const parentKey = getParentTemplatePidKey(item);
          const parentCard = templateForm.querySelector(`[data-item-card][data-pid='${parentKey}']`);
          if (parentCard && parentCard.parentElement) {
            parentCard.parentElement.insertBefore(card, parentCard.nextSibling);
          } else {
            grid.appendChild(card);
          }
        }
      }

      refreshDependentOptionalVisibility();

      // No longer limit to top-N; keep message area clean by default.
    };

    renderV2();
    renderSelectedTemplateJson();
    return;

    for (const item of sorted.slice(0, 300)) {
      const pid = item?.pid;
      if (pid == null) continue;

      const card = document.createElement("div");
      card.className = "bg-white border border-slate-100 rounded-2xl p-4 hover:border-accent/30 transition-colors";
      card.innerHTML = `${mkLabel(item)}${mkHint(item)}`;

      const values = Array.isArray(item?.values) ? item.values : null;
      const max = Number(item?.chooseMaxNum ?? 0) || 0;
      const controlType = Number(item?.controlType ?? 0) || 0;

      const wrap = document.createElement("div");
      wrap.className = "mt-3 space-y-2";

      if (values && values.length) {
        const small = values.length <= 12;
        if (max <= 1 && small) {
          const group = document.createElement("div");
          group.className = "grid grid-cols-1 sm:grid-cols-2 gap-2";
          for (const v of values) {
            const label = String(v?.value ?? v?.vid ?? "-");
            const vid = String(v?.vid ?? "");
            const b = document.createElement("button");
            b.type = "button";
            b.className =
              "template-radio px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2";
            b.dataset.vid = vid;
            b.innerHTML = `<span class="truncate">${escapeHtml(label)}</span><i class="fas fa-check text-emerald-600 hidden"></i>`;
            b.addEventListener("click", () => {
              group.querySelectorAll(".template-radio").forEach((x) => {
                x.classList.remove("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5");
                x.querySelector("i")?.classList.add("hidden");
              });
              b.classList.add("ring-2", "ring-accent/30", "border-accent/40", "bg-accent/5");
              b.querySelector("i")?.classList.remove("hidden");
              setSelection(item, { values: [{ vid: v?.vid ?? null, value: v?.value ?? "" }] });
            });
            group.appendChild(b);
          }
          wrap.appendChild(group);
        } else if (max > 1 && small) {
          const group = document.createElement("div");
          group.className = "grid grid-cols-1 sm:grid-cols-2 gap-2";
          const chosen = new Set();
          for (const v of values) {
            const label = String(v?.value ?? v?.vid ?? "-");
            const vid = String(v?.vid ?? "");
            const b = document.createElement("button");
            b.type = "button";
            b.className =
              "template-check px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2";
            b.dataset.vid = vid;
            b.innerHTML = `<span class="truncate">${escapeHtml(label)}</span><i class="fas fa-check text-emerald-600 hidden"></i>`;
            b.addEventListener("click", () => {
              const has = chosen.has(vid);
              if (has) chosen.delete(vid);
              else {
                if (max > 0 && chosen.size >= max) return;
                chosen.add(vid);
              }
              b.classList.toggle("ring-2", !has);
              b.classList.toggle("ring-accent/30", !has);
              b.classList.toggle("border-accent/40", !has);
              b.classList.toggle("bg-accent/5", !has);
              b.querySelector("i")?.classList.toggle("hidden", has);
              const vids = Array.from(chosen);
              if (!vids.length) return setSelection(item, null);
              const mapped = vids
                .map((id) => {
              const raw = values.find((x) => String(x?.vid ?? "") === String(id)) || {};
              return { vid: raw?.vid ?? null, value: raw?.value ?? raw?.name ?? "" };
            })
            .filter((x) => x.vid != null || x.value);
              setSelection(item, { values: mapped });
            });
            group.appendChild(b);
          }
          const tip = document.createElement("div");
          tip.className = "text-[11px] text-slate-400 mt-2";
          tip.textContent = max > 0 ? `最多选择 ${max} 个` : "可多选";
          wrap.appendChild(group);
          wrap.appendChild(tip);
        } else if (max <= 1) {
          const sel = document.createElement("select");
          sel.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
          sel.innerHTML = '<option value="">请选择</option>';
          for (const v of values.slice(0, 800)) {
            const opt = document.createElement("option");
            opt.value = String(v?.vid ?? "");
            opt.textContent = String(v?.value ?? v?.vid ?? "-");
            sel.appendChild(opt);
          }
          sel.addEventListener("change", () => {
            const vid = String(sel.value || "").trim();
            if (!vid) return setSelection(item, null);
            const raw = values.find((x) => String(x?.vid ?? "") === vid) || {};
            setSelection(item, { values: [{ vid: raw?.vid ?? null, value: raw?.value ?? "" }] });
          });
          wrap.appendChild(sel);
        } else {
          const sel = document.createElement("select");
          sel.multiple = true;
          sel.size = Math.min(10, Math.max(6, Math.min(values.length, 12)));
          sel.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
          for (const v of values.slice(0, 800)) {
            const opt = document.createElement("option");
            opt.value = String(v?.vid ?? "");
            opt.textContent = String(v?.value ?? v?.vid ?? "-");
            sel.appendChild(opt);
          }
          sel.addEventListener("change", () => {
            const selected = Array.from(sel.selectedOptions).map((o) => o.value).filter(Boolean);
            if (max > 0 && selected.length > max) {
              const keep = selected.slice(-max);
              Array.from(sel.options).forEach((o) => {
                o.selected = keep.includes(o.value);
              });
            }
            const finalVids = Array.from(sel.selectedOptions).map((o) => o.value).filter(Boolean);
            if (!finalVids.length) return setSelection(item, null);
            const mapped = finalVids
              .map((id) => {
                const raw = values.find((x) => String(x?.vid ?? "") === String(id)) || {};
                return { vid: raw?.vid ?? null, value: raw?.value ?? "" };
              })
              .filter((x) => x.vid != null || x.value);
            setSelection(item, { values: mapped });
          });
          wrap.appendChild(sel);
          const tip = document.createElement("div");
          tip.className = "text-[11px] text-slate-400 mt-2";
          tip.textContent = max > 0 ? `已限制最多选择 ${max} 个` : "可多选";
          wrap.appendChild(tip);
        }
      } else if (controlType === 0) {
        const input = document.createElement("input");
        const min = String(item?.minValue ?? "").trim();
        const maxV = String(item?.maxValue ?? "").trim();
        const minN = Number(min);
        const maxN = Number(maxV);
        const precision = Number(item?.valuePrecision ?? 0) || 0;
        const step = precision > 0 ? Math.pow(10, -precision) : 1;
        const numeric = (min && Number.isFinite(minN)) || (maxV && Number.isFinite(maxN));
        input.type = numeric ? "number" : "text";
        if (numeric) {
          if (min && Number.isFinite(minN)) input.min = String(minN);
          if (maxV && Number.isFinite(maxN)) input.max = String(maxN);
          input.step = String(step);
        }
        input.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
        input.placeholder = "请输入";
        input.addEventListener("input", () => {
          const v = String(input.value ?? "");
          if (!v.trim()) return setSelection(item, null);
          setSelection(item, { value: v });
        });
        wrap.appendChild(input);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white";
        input.placeholder = "请输入";
        input.addEventListener("input", () => {
          const v = String(input.value ?? "");
          if (!v.trim()) return setSelection(item, null);
          setSelection(item, { value: v });
        });
        wrap.appendChild(input);
      }

      card.appendChild(wrap);
      templateForm.appendChild(card);
    }

    if (items.length > 300) {
      showTemplateMsg(`模板项较多（${items.length}），当前仅展示前 300 项。请使用筛选类目/关键字缩小范围。`);
    }
    renderSelectedTemplateJson();
  };

  if (templateClearBtn) {
    templateClearBtn.addEventListener("click", () => {
      templateSelections.clear();
      forcedTemplatePidKeys.clear();
      renderSelectedTemplateJson();
      renderUploadStepper();
      showTemplateMsg("");
    });
  }

  const fetchTemuTemplate = async (catId, goodsId) => {
    const cid = String(catId ?? "").trim();
    const gid = String(goodsId ?? "").trim();
    if (!cid || cid === "-") return null;
    if (templateFetchInFlight) return null;
    templateFetchInFlight = true;
    const originalHtml = templateBtn?.innerHTML || "";
    if (templateBtn) {
      templateBtn.disabled = true;
      templateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    }
    try {
      const res = await postAuthedJson("/api/temu/getAttributeTemplate", { goods_id: gid || 0, cat_id: cid });
      lastTemplateRes = res;
      setPre(templatePre, res);
      renderTemuTemplateForm();
      renderSalesAttrs();
      renderSalesAttrValues();
      renderSkuGrid();
      renderUploadStepper();
      if (String(res?.code) === "0") tryGoStep(3);
      return res;
    } catch {
      lastTemplateRes = { code: "1", msg: "网络异常，请稍后重试。", data: {} };
      setPre(templatePre, lastTemplateRes);
      renderTemuTemplateForm();
      renderSalesAttrs();
      renderSalesAttrValues();
      renderSkuGrid();
      renderUploadStepper();
      return lastTemplateRes;
    } finally {
      templateFetchInFlight = false;
      if (templateBtn) {
        templateBtn.disabled = false;
        templateBtn.innerHTML = originalHtml || templateBtn.innerHTML;
      }
    }
  };

  // Auto fetch template after leaf category selected (cat_id changes).
  const clearTemuTemplateState = () => {
    lastTemplateCatId = "";
    templateSelections.clear();
    forcedTemplatePidKeys.clear();
    salesAttrSelections.clear();
    skuDraft.clear();
    skuDraftSingleCache.clear();
    skuDraftSingleCache.clear();
    skuDraftSingleCache.clear();
    lastTemplateRes = null;
    setPre(templatePre, "");
    showTemplateMsg("");
    renderSalesAttrs();
    renderSalesAttrValues();
    renderSkuGrid();
    renderTemuTemplateForm();
  };

  const catObserver = new MutationObserver(() => {
    if (routeFromHash() !== "upload-temu") return;
    if (applyingTemuEdit) return;
    const cid = String(catOut?.textContent ?? "").trim();

    // When user changes category path (non-leaf), cat_id is reset to "-".
    // In that state, hide/clear the attribute template until a leaf is selected again.
    if (!cid || cid === "-") {
      const hadTemplate = Boolean(lastTemplateCatId) || lastTemplateRes != null || templateSelections.size > 0;
      if (hadTemplate) clearTemuTemplateState();
      if (activeUploadStep !== 1) setUploadStep(1);
      else renderUploadStepper();
      return;
    }

    renderUploadStepper();
    if (activeUploadStep === 1 && isCatSelected()) setUploadStep(2);
    if (cid && cid !== lastTemplateCatId) {
      lastTemplateCatId = cid;
      templateSelections.clear();
      salesAttrSelections.clear();
      skuDraft.clear();
      skuDraftSingleCache.clear();
      lastTemplateRes = null;
      setPre(templatePre, "");
      renderTemuTemplateForm();
      renderSalesAttrs();
      renderSalesAttrValues();
      renderSkuGrid();
      renderUploadStepper();
      void fetchTemuTemplate(cid, editingTemuGoodsId);
    }
  });
  try {
    catObserver.observe(catOut, { childList: true, characterData: true, subtree: true });
  } catch {
    // ignore
  }

  // No "confirm category" step: selecting a leaf category immediately enables template fetching.

  const parseSubViewFromHash = () => {
    const raw = (window.location.hash || "").replace("#", "");
    if (!raw.startsWith("upload-temu")) return "";
    const q = raw.split("?")[1] || "";
    const params = new URLSearchParams(q);
    const hasEdit = Boolean(params.get("edit") || params.get("goods_id") || params.get("id"));
    return params.get("mode") === "upload" || hasEdit ? "upload" : "";
  };

  const parseEditIdFromHash = (opts) => {
    const raw = (window.location.hash || "").replace("#", "");
    if (!raw.startsWith("upload-temu")) return "";
    const q = raw.split("?")[1] || "";
    const params = new URLSearchParams(q);
    const fromHash = String(params.get("edit") || params.get("goods_id") || params.get("id") || "").trim();
    if (fromHash) return fromHash;
    if (!opts?.allowSession) return "";
    try {
      return String(window.sessionStorage.getItem("topm:temu-edit-id") || "").trim();
    } catch {
      return "";
    }
  };

  const updateTemuHash = (mode, editId) => {
    if (routeFromHash() !== "upload-temu") return;
    const params = new URLSearchParams();
    if (mode === "upload") params.set("mode", "upload");
    const eid = String(editId ?? "").trim();
    if (eid) params.set("edit", eid);
    const q = params.toString();
    const next = q ? `#upload-temu?${q}` : "#upload-temu";
    if (window.location.hash !== next) window.location.hash = next;
  };

  const setSubView = (mode, opts) => {
    const m = mode === "upload" ? "upload" : "list";
    const updateHash = opts?.updateHash !== false;
    try {
      window.sessionStorage.setItem("topm:temu-subview", m);
    } catch {
      // ignore
    }

    if (listWrap) {
      const show = m === "list";
      listWrap.hidden = !show;
      if (show) listWrap.classList.remove("hidden");
      else listWrap.classList.add("hidden");
    }
    if (uploadWrap) {
      const show = m === "upload";
      uploadWrap.hidden = !show;
      if (show) uploadWrap.classList.remove("hidden");
      else uploadWrap.classList.add("hidden");
    }

    if (updateHash && routeFromHash() === "upload-temu") {
      const editId =
        opts && Object.prototype.hasOwnProperty.call(opts, "editId")
          ? opts.editId
          : m === "upload"
            ? editingTemuGoodsId
            : "";
      updateTemuHash(m, editId);
    }
  };

  const getSubView = () => {
    try {
      const v = window.sessionStorage.getItem("topm:temu-subview");
      return v === "upload" ? "upload" : "list";
    } catch {
      return "list";
    }
  };

  if (goUploadBtn) {
    goUploadBtn.addEventListener("click", () => {
      clearAll();
      resetCategorySelection();
    });
  }
  if (backToListBtn) backToListBtn.addEventListener("click", () => setSubView("list", { updateHash: true }));
  setSubView(parseSubViewFromHash() || "list", { updateHash: false });

  let restoringTemuEdit = false;
  const restoreTemuEditFromHash = () => {
    const activeMode = parseSubViewFromHash();
    const allowSession = activeMode === "upload";
    const editId = parseEditIdFromHash({ allowSession });
    if (!editId) return;
    if (restoringTemuEdit) return;
    if (editingTemuGoodsId === editId) return;
    restoringTemuEdit = true;
    setSubView("upload", { updateHash: false });
    setTimeout(() => {
      Promise.resolve(loadTemuInfoForEdit(editId))
        .catch(() => {})
        .finally(() => {
          restoringTemuEdit = false;
        });
    }, 0);
  };

  restoreTemuEditFromHash();
  window.addEventListener("hashchange", () => {
    if (routeFromHash() !== "upload-temu") return;
    const mode = parseSubViewFromHash() || "list";
    setSubView(mode, { updateHash: false });
    restoreTemuEditFromHash();
  });

  // TEMU goods list (goods.php?action=lists, is_tiktok=2)
  const listKeywords = document.getElementById("temu-goods-keywords");
  const listRefresh = document.getElementById("temu-goods-refresh");
  const listSummary = document.getElementById("temu-goods-summary");
  const listPrev = document.getElementById("temu-goods-prev");
  const listNext = document.getElementById("temu-goods-next");
  const listPageEl = document.getElementById("temu-goods-page");
  const listPageInput = document.getElementById("temu-goods-page-input");
  const listPageGo = document.getElementById("temu-goods-page-go");
  const listSize = document.getElementById("temu-goods-size");
  const listTbody = document.getElementById("temu-goods-tbody");

  let listPage = 1;
  let listTotal = 0;

  const readListSize = () => {
    let v = Number(listSize?.value || 15);
    if (!Number.isFinite(v) || v <= 0) v = 15;
    v = Math.floor(v);
    v = Math.max(1, Math.min(200, v));
    if (listSize) listSize.value = String(v);
    return v;
  };

  const setListPager = () => {
    const size = readListSize();
    const totalPages = Math.max(1, Math.ceil((Number(listTotal) || 0) / size));
    if (listPage > totalPages) listPage = totalPages;
    if (listPageEl) listPageEl.textContent = `${listPage} / ${totalPages}`;
    if (listPrev) listPrev.disabled = listPage <= 1;
    if (listNext) listNext.disabled = listPage >= totalPages;
    if (listSummary) listSummary.textContent = `共 ${Number(listTotal) || 0} 条 · 每页 ${size} 条`;
  };

  const loadTemuGoodsList = async () => {
    if (listRefresh) {
      listRefresh.disabled = true;
      listRefresh.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    }
    setTableLoading("temu-goods-tbody", 8);

    const size = readListSize();
    const keywords = String(listKeywords?.value ?? "").trim();

    try {
      const res = await postAuthedJson("/api/goods/lists", {
        page: listPage,
        size,
        is_tiktok: 2,
        ...(keywords ? { keywords } : {}),
      });

      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }

      if (String(res?.code) !== "0") {
        renderTemuGoodsTableInto("temu-goods-tbody", []);
        if (listSummary) listSummary.textContent = "加载失败";
        listTotal = 0;
        setListPager();
        return;
      }

      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      listTotal = Number(res?.data?.num ?? list.length) || 0;
      renderTemuGoodsTableInto("temu-goods-tbody", list);
      setListPager();
    } catch {
      renderTemuGoodsTableInto("temu-goods-tbody", []);
      if (listSummary) listSummary.textContent = "网络异常";
      listTotal = 0;
      setListPager();
    } finally {
      if (listRefresh) {
        listRefresh.disabled = false;
        listRefresh.innerHTML = '<i class="fas fa-magnifying-glass mr-1"></i>搜索';
      }
    }
  };

  const showUploadSuccessDialog = () => {
    const existing = document.getElementById("temu-upload-success-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "temu-upload-success-modal";
    overlay.className = "fixed inset-0 z-[80] flex items-center justify-center px-4 py-6";
    overlay.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <i class="fas fa-circle-check text-emerald-600"></i>
          </div>
          <div>
            <div class="text-base font-black text-slate-900">上传成功</div>
            <div class="text-xs text-slate-400 mt-0.5">请选择接下来的操作</div>
          </div>
        </div>
        <div class="px-5 py-4 text-sm text-slate-600">
          您可以继续上传新商品，或返回商品列表。
        </div>
        <div class="px-5 pb-5 flex items-center justify-end gap-2">
          <button type="button" data-upload-success-action="back" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">返回列表</button>
          <button type="button" data-upload-success-action="continue" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">继续上传</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
    };
    const onClick = (e) => {
      const btn = e.target?.closest?.("[data-upload-success-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-upload-success-action");
      close();
      if (action === "continue") {
        clearAll();
        resetCategorySelection();
        setSubView("upload", { updateHash: true });
        return;
      }
      setSubView("list", { updateHash: true });
      loadTemuGoodsList();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    overlay.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown, true);
  };

  const updateTemuListRowDom = (row, onSaleValue) => {
    if (!row) return;
    const badgeWrap = row.querySelector("[data-sale-badge]");
    const isOn = String(onSaleValue) === "1";
    if (badgeWrap) {
      badgeWrap.innerHTML = statusBadge(
        isOn ? "在售" : "非在售",
        isOn ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200",
      );
    }
    const toggleBtn = row.querySelector(".temu-toggle-sale");
    if (toggleBtn) {
      toggleBtn.dataset.currentVal = isOn ? "1" : "0";
      toggleBtn.dataset.nextVal = isOn ? "0" : "1";
      const icon = toggleBtn.querySelector("i.fas");
      if (icon) {
        icon.className = `fas ${isOn ? "fa-toggle-on text-emerald-600" : "fa-toggle-off text-slate-400"} text-lg`;
      }
      const label = toggleBtn.querySelector("span");
      if (label) label.textContent = isOn ? "点击下架" : "点击上架";
    }
  };

  const animateToggleIcon = (btn) => {
    if (!btn) return;
    const icon = btn.querySelector("i.fas");
    if (!icon) return;
    icon.classList.remove("temu-toggle-anim");
    // Force reflow to restart animation.
    void icon.offsetWidth;
    icon.classList.add("temu-toggle-anim");
  };

  const updateTemuListRow = (goodsId, onSaleValue) => {
    if (!listTbody) return;
    const row = listTbody.querySelector(`tr[data-goods-id="${CSS.escape(String(goodsId))}"]`);
    updateTemuListRowDom(row, onSaleValue);
  };

  const pickTemuInfoData = (res) => {
    const data = res?.data;
    if (!data) return {};
    if (data?.info && typeof data.info === "object") return data.info;
    if (data?.goods_info && typeof data.goods_info === "object") return data.goods_info;
    return data;
  };

  const parseMaybeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      const raw = val.trim();
      if (!raw) return null;
      if (raw.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const parseMaybeList = (val) => {
    const arr = parseMaybeArray(val);
    if (arr) return arr;
    if (typeof val === "string") {
      const raw = val.trim();
      if (!raw) return [];
      if (raw.includes(",")) {
        return raw
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return [raw];
    }
    return [];
  };

  const normalizeAttrListValues = (raw) => {
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (item == null) return "";
          if (typeof item === "string" || typeof item === "number") return String(item).trim();
          return String(
            item?.value ??
              item?.name ??
              item?.label ??
              item?.title ??
              item?.text ??
              item?.spec_value ??
              item?.specValue ??
              ""
          ).trim();
        })
        .filter(Boolean);
    }
    if (typeof raw === "string") {
      const s = raw.trim();
      if (!s) return [];
      return s
        .split(/[,，\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    if (raw && typeof raw === "object") {
      const inner =
        parseMaybeArray(raw?.list) ||
        parseMaybeArray(raw?.values) ||
        parseMaybeArray(raw?.value_list) ||
        parseMaybeArray(raw?.valueList);
      if (inner) return normalizeAttrListValues(inner);
    }
    return [];
  };

  const parseMaybeObject = (val) => {
    if (!val) return null;
    if (typeof val === "object" && !Array.isArray(val)) return val;
    if (typeof val === "string") {
      const raw = val.trim();
      if (!raw || !raw.startsWith("{")) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const normalizeAttrEntries = (val) => {
    const obj = parseMaybeObject(val);
    if (!obj) return null;
    const entries = Object.entries(obj);
    if (!entries.length) return null;
    const valueObjects = entries
      .map(([, v]) => v)
      .filter((v) => v && typeof v === "object" && !Array.isArray(v));
    if (valueObjects.length === entries.length) return valueObjects;
    return entries.map(([pid, value]) => ({ pid, value }));
  };

  const normalizeDetailImgs = (val) => {
    if (typeof val === "string") {
      const raw = val.trim();
      if (raw && !raw.startsWith("[")) {
        return raw
          .split(/[\n,]+/)
          .map((x) => x.trim())
          .filter(Boolean)
          .map((url) => ({ img_id: "0", img_url: url }));
      }
    }
    const list = parseMaybeArray(val) || [];
    return list
      .map((item) => {
        if (typeof item === "string") return { img_id: "0", img_url: item };
        if (!item || typeof item !== "object") return null;
        const url = item?.img_url ?? item?.url ?? item?.imgUrl ?? item?.img ?? "";
        if (!url) return null;
        return {
          img_id: item?.img_id ?? item?.id ?? "0",
          img_url: url,
          name: item?.name ?? item?.file_name ?? item?.filename ?? "",
        };
      })
      .filter(Boolean);
  };

  const applyTemplateSelectionsFromInfo = (attrs) => {
    templateSelections.clear();
    const items = getTemplateItems();
    if (!items.length || !Array.isArray(attrs)) return;
    const byPid = new Map();
    const byName = new Map();
    items.forEach((item, idx) => {
      const pid = String(item?.pid ?? "").trim();
      const name = String(item?.name ?? "").trim();
      const key = pidKeyFromItem(item, idx);
      if (pid) {
        const list = byPid.get(pid) || [];
        list.push({ item, key });
        byPid.set(pid, list);
      }
      if (name) {
        const lower = name.toLowerCase();
        const list = byName.get(lower) || [];
        list.push({ item, key });
        byName.set(lower, list);
      }
    });

    const readAttrValues = (attr) => {
      const values =
        parseMaybeArray(attr?.values) ||
        parseMaybeArray(attr?.value_list) ||
        parseMaybeArray(attr?.valueList) ||
        parseMaybeArray(attr?.value);
      return Array.isArray(values) ? values : null;
    };

    const buildSelection = (item, attr) => {
      if (!item || !attr) return null;
      const isComposition = isCompositionItem(item);
      if (isComposition) {
        const raw = readAttrValues(attr) || [];
        const rows = raw
          .map((r) => ({
            vid: r?.vvid ?? r?.vid ?? r?.id ?? r?.key ?? r?.value_id ?? null,
            value: r?.value ?? r?.name ?? r?.label ?? r?.text ?? r?.vid ?? r?.id ?? "",
            percent: r?.vvale ?? r?.percent ?? r?.pct ?? r?.ratio ?? null,
          }))
          .filter((r) => r.vid != null || String(r.value ?? "").trim());
        return rows.length ? { values: rows } : null;
      }

      const values = readAttrValues(attr);
      if (values && values.length) {
        return {
          values: values.map((v) => ({
            vid: v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? v?.value ?? null,
            value: v?.value ?? v?.name ?? v?.label ?? v?.text ?? v?.vid ?? v?.id ?? "",
          })),
        };
      }

      const rawVid = attr?.vid ?? attr?.value_id ?? attr?.valueId ?? attr?.valueID ?? null;
      const explicitValue = attr?.value ?? attr?.attr_value ?? attr?.valueName ?? attr?.label ?? "";
      const rawName = String(attr?.name ?? "").trim();
      const itemName = String(item?.name ?? "").trim();
      const rawValue =
        String(explicitValue ?? "").trim() ||
        (rawName && itemName && rawName !== itemName ? rawName : "");
      if (rawVid != null && String(rawVid).trim() !== "") {
        const ids = String(rawVid)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const values = Array.isArray(item?.values) ? item.values : [];
        if (ids.length > 1) {
          return {
            values: ids
              .map((id) => {
                const hit = values.find((v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "") === String(id));
                const fallback = rawValue ? rawValue : id;
                return { vid: id, value: hit?.value ?? hit?.name ?? hit?.label ?? fallback };
              })
              .filter((v) => v.vid != null || v.value),
          };
        }
        const hit = values.find((v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "") === String(ids[0]));
        const singleFallback = rawValue ? rawValue : ids[0];
        return { values: [{ vid: ids[0], value: hit?.value ?? hit?.name ?? hit?.label ?? singleFallback }] };
      }

      if (rawValue != null && String(rawValue).trim() !== "") {
        return {
          value: rawValue,
          valueUnit: attr?.valueUnit ?? attr?.unit ?? attr?.value_unit ?? null,
          valueUnitId: attr?.valueUnitId ?? attr?.valueUnitID ?? attr?.unit_id ?? null,
          valueUnitName: attr?.valueUnitName ?? attr?.valueUnit ?? attr?.unit_name ?? null,
        };
      }
      return null;
    };

    const pickMatch = (candidates) => {
      if (!candidates || !candidates.length) return null;
      return candidates.find((c) => !templateSelections.has(c.key)) || candidates[0];
    };

    const getDefaultValue = (item) => {
      const raw = item?.defaultValue ?? item?.default_value ?? item?.default ?? "";
      const v = String(raw ?? "").trim();
      return v ? v : "";
    };

    const pickDefaultUnit = (item) => {
      const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
      if (!unitList.length) return { valueUnit: null, valueUnitId: null, valueUnitName: null };
      const pick = unitList.find((u) => u?.default === true || u?.default === "true" || u?.default === 1 || u?.default === "1") || unitList[0];
      const unitVal = pick?.valueUnit ?? pick?.unit ?? pick?.value ?? pick?.code ?? "";
      const unitId = pick?.valueUnitId ?? pick?.valueUnitID ?? pick?.unitId ?? pick?.unit_id ?? pick?.id ?? null;
      const unitName = pick?.unitName ?? pick?.name ?? pick?.label ?? pick?.text ?? unitVal ?? null;
      return {
        valueUnit: unitVal || null,
        valueUnitId: unitId || null,
        valueUnitName: unitName || null,
      };
    };

    attrs.forEach((attr) => {
      const pid = String(attr?.pid ?? attr?.propertyId ?? attr?.id ?? "").trim();
      const name = String(attr?.name ?? attr?.propertyName ?? attr?.attr_name ?? attr?.attrName ?? "").trim();
      const match = pickMatch((pid && byPid.get(pid)) || (name && byName.get(name.toLowerCase())) || []);
      if (!match) return;
      const sel = buildSelection(match.item, attr);
      if (sel) templateSelections.set(match.key, sel);
    });

    // If edit payload doesn't include a field, fall back to template defaultValue.
    items.forEach((item, idx) => {
      const key = pidKeyFromItem(item, idx);
      if (templateSelections.has(key)) return;
      const defVal = getDefaultValue(item);
      if (!defVal) return;
      const units = pickDefaultUnit(item);
      templateSelections.set(key, {
        value: defVal,
        valueUnit: units.valueUnit,
        valueUnitId: units.valueUnitId,
        valueUnitName: units.valueUnitName,
      });
    });
  };

  const applyTemplateSelectionsFromTemplate = () => {
    const items = getTemplateItems();
    if (!items.length) return;
    templateSelections.clear();

    const pickValueList = (item) => (Array.isArray(item?.values) ? item.values : []);
    const isTruthy = (v) => v === true || v === "true" || v === 1 || v === "1";

    items.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const key = pidKeyFromItem(item, idx);
      const values = pickValueList(item);
      const findValueById = (id) =>
        values.find((v) => String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim() === String(id ?? "").trim());
      const findValueByLabel = (label) =>
        values.find(
          (v) => String(v?.value ?? v?.name ?? v?.label ?? v?.text ?? "").trim() === String(label ?? "").trim()
        );
      const selectedValues = values.filter(
        (v) => isTruthy(v?.default) || isTruthy(v?.selected) || isTruthy(v?.checked) || isTruthy(v?.isDefault) || isTruthy(v?.isSelected)
      );
      if (selectedValues.length) {
        templateSelections.set(key, {
          values: selectedValues.map((v) => ({
            vid: v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? null,
            value: v?.value ?? v?.name ?? v?.label ?? v?.text ?? v?.vid ?? v?.id ?? "",
          })),
        });
        return;
      }

      const rawVid = item?.vid ?? item?.value_id ?? item?.valueId ?? item?.valueID ?? null;
      const rawValue = item?.value ?? item?.attr_value ?? item?.valueName ?? item?.label ?? "";
      const rawValueUnit = item?.valueUnit ?? item?.unit ?? item?.value_unit ?? null;
      if (rawVid != null && String(rawVid).trim() !== "") {
        const ids = String(rawVid)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const mapped = ids
          .map((id) => {
            const hit = findValueById(id);
            const fallback = rawValue ? rawValue : id;
            return { vid: id, value: hit?.value ?? hit?.name ?? hit?.label ?? fallback };
          })
          .filter((v) => v.vid != null || v.value);
        if (mapped.length) {
          templateSelections.set(key, { values: mapped });
          return;
        }
      }
      if (rawValue != null && String(rawValue).trim() !== "") {
        const parts = String(rawValue)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          const mapped = parts
            .map((val) => {
              const hit = findValueByLabel(val);
              const vid = hit?.vid ?? hit?.id ?? hit?.value_id ?? hit?.valueId ?? hit?.valueID ?? null;
              return { vid: vid ?? val, value: hit?.value ?? hit?.name ?? hit?.label ?? val };
            })
            .filter((v) => v.vid != null || v.value);
          if (mapped.length) {
            templateSelections.set(key, { values: mapped });
            return;
          }
        }
      }
      if (rawValue != null && String(rawValue).trim() !== "") {
        templateSelections.set(key, {
          value: rawValue,
          valueUnit: rawValueUnit ?? null,
          valueUnitId: item?.valueUnitId ?? item?.valueUnitID ?? item?.unit_id ?? null,
          valueUnitName: item?.valueUnitName ?? item?.unit_name ?? rawValueUnit ?? null,
        });
        return;
      }

      const defaultValue = String(item?.defaultValue ?? item?.default_value ?? item?.default ?? "").trim();
      if (defaultValue) {
        const unitList = Array.isArray(item?.valueUnitList) ? item.valueUnitList : [];
        const pick =
          unitList.find((u) => u?.default === true || u?.default === "true" || u?.default === 1 || u?.default === "1") || unitList[0];
        const unitVal = pick?.valueUnit ?? pick?.unit ?? pick?.value ?? pick?.code ?? null;
        const unitId = pick?.valueUnitId ?? pick?.valueUnitID ?? pick?.unitId ?? pick?.unit_id ?? pick?.id ?? null;
        const unitName = pick?.unitName ?? pick?.name ?? pick?.label ?? pick?.text ?? unitVal ?? null;
        templateSelections.set(key, {
          value: defaultValue,
          valueUnit: unitVal ?? null,
          valueUnitId: unitId ?? null,
          valueUnitName: unitName ?? null,
        });
      }
    });
  };

  const applySalesAttrsFromInfo = (info) => {
    salesAttrSelections.clear();
    const templateList = getSalesAttrList();
    const byId = new Map(templateList.map((x) => [String(x.id), x]));
    const byName = new Map(templateList.map((x) => [String(x.name).toLowerCase(), x]));
    const salesValueIndex = (() => {
      const out = new Map();
      const data = lastTemplateRes?.data || {};
      const add = (valueId, value, specId, specName) => {
        const vid = String(valueId ?? "").trim();
        const val = String(value ?? "").trim();
        if (!vid || !val) return;
        if (!out.has(vid)) out.set(vid, { specId: String(specId ?? "").trim(), specName: String(specName ?? "").trim(), value: val });
      };

      const fromSpecProps = Array.isArray(data?.goodsSpecProperties) ? data.goodsSpecProperties : [];
      fromSpecProps.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const specId = item?.parentSpecId ?? item?.parent_spec_id ?? item?.specId ?? item?.spec_id ?? item?.pid ?? item?.templatePid ?? item?.template_pid;
        const specName =
          item?.propertyChooseTitle ??
          item?.property_choose_title ??
          item?.name ??
          item?.specName ??
          item?.spec_name ??
          item?.parentSpecName ??
          item?.parent_spec_name ??
          "";
        const values = Array.isArray(item?.values) ? item.values : [];
        values.forEach((v) => add(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID, v?.value ?? v?.name ?? v?.label, specId, specName));
      });

      const fromTemplate = getTemplateItems();
      fromTemplate.forEach((item) => {
        const specId = item?.parentSpecId ?? item?.parent_spec_id ?? item?.specId ?? item?.spec_id ?? item?.pid ?? item?.templatePid ?? item?.template_pid;
        const specName =
          item?.propertyChooseTitle ??
          item?.property_choose_title ??
          item?.name ??
          item?.specName ??
          item?.spec_name ??
          item?.parentSpecName ??
          item?.parent_spec_name ??
          "";
        const values = Array.isArray(item?.values) ? item.values : [];
        values.forEach((v) => add(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID, v?.value ?? v?.name ?? v?.label, specId, specName));
      });
      return out;
    })();
    const candidates = [
      parseMaybeArray(info?.goods_attr_list),
      normalizeAttrEntries(info?.goods_attr_list),
      parseMaybeArray(info?.goods_attr),
      normalizeAttrEntries(info?.goods_attr),
      parseMaybeArray(info?.spec_list),
      normalizeAttrEntries(info?.spec_list),
      parseMaybeArray(info?.specs),
      normalizeAttrEntries(info?.specs),
      parseMaybeArray(info?.sales_attrs),
      normalizeAttrEntries(info?.sales_attrs),
      parseMaybeArray(info?.sales_attr_list),
      normalizeAttrEntries(info?.sales_attr_list),
    ].filter(Boolean);
    const list = candidates.find((arr) => Array.isArray(arr) && arr.length) || [];

    const ensureParent = (specId, specName) => {
      const cleanName = String(specName ?? "").trim();
      const template = (specId && byId.get(String(specId))) || byName.get(cleanName.toLowerCase());
      const id = String(template?.id ?? specId ?? cleanName).trim();
      const name = String(template?.name ?? cleanName).trim();
      if (!id || !name) return null;
      if (!salesAttrSelections.has(id)) {
        if (salesAttrSelections.size >= 2) return null;
        salesAttrSelections.set(id, { id, name, values: [] });
      }
      return salesAttrSelections.get(id);
    };

    const addValue = (specId, specName, value, goodsAttrId) => {
      const cleanName = String(specName ?? "").trim();
      const cleanValue = String(value ?? "").trim();
      if (!cleanName || !cleanValue) return;
      const entry = ensureParent(specId, cleanName);
      if (!entry) return;
      entry.values = Array.isArray(entry.values) ? entry.values : [];
      const valId = String(goodsAttrId || cleanValue).trim();
      if (entry.values.some((v) => String(v.goods_attr_id ?? "") === valId)) return;
      entry.values.push({ value: cleanValue, goods_attr_id: valId });
    };

    const defaultParents = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
      ? lastTemplateRes.data.userInputParentSpecList
      : [];
    const salesSpecOrder = new Map();
    const productAttrIdsByIndex = (() => {
      const byIndex = [];
      const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id, idx) => {
          const v = String(id ?? "").trim();
          if (!v) return;
          if (!byIndex[idx]) byIndex[idx] = [];
          if (!byIndex[idx].includes(v)) byIndex[idx].push(v);
        });
      });
      return byIndex;
    })();
    const productAttrIds = (() => {
      const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
      const ids = [];
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id) => {
          const v = String(id ?? "").trim();
          if (v && !ids.includes(v)) ids.push(v);
        });
      });
      return ids;
    })();
    const mapAttrListToIds = (attrList, specIndex = 0) => {
      const list = normalizeAttrListValues(attrList);
      if (!list.length) return [];
      const byIndex = productAttrIdsByIndex[specIndex] || [];
      if (byIndex.length === list.length) {
        return list.map((value, idx) => ({ value, goods_attr_id: byIndex[idx] }));
      }
      if (list.length === 1 && byIndex.length >= 1) {
        const pick = byIndex[0];
        return [{ value: list[0], goods_attr_id: pick }];
      }
      if (productAttrIds.length === list.length) {
        return list.map((value, idx) => ({ value, goods_attr_id: productAttrIds[idx] }));
      }
      return list.map((value) => ({ value, goods_attr_id: value }));
    };
    let defaultSpecIndex = 0;
    defaultParents.forEach((p) => {
      const isDefault = p?.default ?? p?.isDefault ?? p?.selected ?? p?.checked;
      if (!(isDefault === true || isDefault === "true" || isDefault === 1 || isDefault === "1")) return;
      const specId = String(p?.parentSpecId ?? p?.parent_spec_id ?? p?.specId ?? p?.spec_id ?? p?.id ?? "").trim();
      const specName = String(p?.parentSpecName ?? p?.parent_spec_name ?? p?.specName ?? p?.spec_name ?? p?.name ?? "").trim();
      const orderKey = specId || specName;
      if (orderKey && !salesSpecOrder.has(orderKey)) salesSpecOrder.set(orderKey, defaultSpecIndex);
      const mapped = mapAttrListToIds(
        p?.attrList ?? p?.attr_list ?? p?.attrListStr ?? p?.attr_list_str,
        defaultSpecIndex,
      );
      defaultSpecIndex += 1;
      if (!mapped.length) return;
      const parent = ensureParent(specId, specName);
      if (!parent) return;
      mapped.forEach((item) => addValue(specId, specName, item.value, item.goods_attr_id));
    });
    const userInputList = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
      ? lastTemplateRes.data.userInputParentSpecList
      : [];
    userInputList.forEach((p, idx) => {
      const specId = String(p?.parentSpecId ?? p?.parent_spec_id ?? p?.specId ?? p?.spec_id ?? p?.id ?? "").trim();
      const specName = String(p?.parentSpecName ?? p?.parent_spec_name ?? p?.specName ?? p?.spec_name ?? p?.name ?? "").trim();
      if (!specId && !specName) return;
      const orderKey = specId || specName;
      const mapped = mapAttrListToIds(
        p?.attrList ?? p?.attr_list ?? p?.attrListStr ?? p?.attr_list_str,
        salesSpecOrder.has(orderKey) ? salesSpecOrder.get(orderKey) : idx,
      );
      const existing =
        (specId && salesAttrSelections.get(specId)) || (specName && salesAttrSelections.get(specName)) || null;
      if (!mapped.length && !existing) return;
      const entry = existing || ensureParent(specId, specName);
      if (!entry) return;
      if (Array.isArray(entry.values) && entry.values.length) return;
      if (mapped.length) {
        mapped.forEach((item) => addValue(specId, specName, item.value, item.goods_attr_id));
      }
    });

    const specProps = Array.isArray(lastTemplateRes?.data?.goodsSpecProperties)
      ? lastTemplateRes.data.goodsSpecProperties
      : [];
    specProps.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const isSale = item?.isSale ?? item?.is_sale ?? item?.sale ?? null;
      if (isSale === false || isSale === "false" || isSale === 0 || isSale === "0") return;
      const specId = String(
        item?.parentSpecId ??
          item?.parent_spec_id ??
          item?.specId ??
          item?.spec_id ??
          item?.pid ??
          item?.templatePid ??
          item?.template_pid ??
          item?.id ??
          ""
      ).trim();
      const specName = String(
        item?.propertyChooseTitle ??
          item?.property_choose_title ??
          item?.name ??
          item?.specName ??
          item?.spec_name ??
          item?.parentSpecName ??
          item?.parent_spec_name ??
          ""
      ).trim();
      const values = Array.isArray(item?.values) ? item.values : [];
      const selectedValues = values.filter(
        (v) =>
          v?.selected === true ||
          v?.selected === "true" ||
          v?.selected === 1 ||
          v?.default === true ||
          v?.default === "true" ||
          v?.default === 1 ||
          v?.isDefault === true ||
          v?.isSelected === true
      );
      if (selectedValues.length) {
        selectedValues.forEach((v) => {
          const value = String(v?.value ?? v?.name ?? v?.label ?? "").trim();
          const goodsAttrId = String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim();
          addValue(specId, specName, value, goodsAttrId);
        });
        return;
      }
      if (item?.vid != null || item?.value != null) {
        const rawVid = String(item?.vid ?? "").trim();
        const rawValue = String(item?.value ?? "").trim();
        if (rawVid || rawValue) {
          if (rawVid.includes(",") || rawValue.includes(",")) {
            const ids = rawVid
              ? rawVid.split(",").map((x) => x.trim()).filter(Boolean)
              : [];
            const vals = rawValue ? rawValue.split(",").map((x) => x.trim()).filter(Boolean) : [];
            const max = Math.max(ids.length, vals.length);
            for (let i = 0; i < max; i += 1) {
              const vid = ids[i] || vals[i];
              const val = vals[i] || ids[i];
              if (vid || val) addValue(specId, specName, val || vid, vid);
            }
          } else {
            addValue(specId, specName, rawValue || rawVid, rawVid);
          }
        }
      }
    });

    const readValueList = (row) => {
      return (
        parseMaybeArray(row?.values) ||
        parseMaybeArray(row?.value_list) ||
        parseMaybeArray(row?.valueList) ||
        parseMaybeArray(row?.spec_values) ||
        parseMaybeArray(row?.spec_value_list) ||
        parseMaybeArray(row?.specValueList)
      );
    };

    list.forEach((row) => {
      if (!row || typeof row !== "object") return;
      const specName = String(
        row?.spec_name ?? row?.specName ?? row?.parent_spec_name ?? row?.parentSpecName ?? row?.name ?? row?.attr_name ?? ""
      ).trim();
      const specId = String(row?.spec_id ?? row?.specId ?? row?.parent_spec_id ?? row?.parentSpecId ?? row?.id ?? "").trim();
      const valueList = readValueList(row);
      if (Array.isArray(valueList) && valueList.length) {
        valueList.forEach((v) => {
          const value = String(v?.spec_value ?? v?.specValue ?? v?.value ?? v?.attr_value ?? v?.name ?? v?.label ?? "").trim();
          const goodsAttrId = String(v?.goods_attr_id ?? v?.goodsAttrId ?? v?.attr_id ?? v?.attrId ?? v?.id ?? "").trim();
          addValue(specId, specName, value, goodsAttrId);
        });
        return;
      }
      const value = String(row?.spec_value ?? row?.specValue ?? row?.value ?? row?.attr_value ?? row?.label ?? "").trim();
      const goodsAttrId = String(row?.goods_attr_id ?? row?.goodsAttrId ?? row?.attr_id ?? row?.attrId ?? "").trim();
      addValue(specId, specName, value, goodsAttrId);
    });

    if (!salesAttrSelections.size) {
      const items = getTemplateItems();
      items.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const isSale = item?.isSale ?? item?.is_sale ?? item?.sale ?? null;
        const mainSale = item?.mainSale ?? item?.main_sale ?? null;
        if (
          isSale === false ||
          isSale === "false" ||
          isSale === 0 ||
          isSale === "0" ||
          (isSale == null && !mainSale)
        )
          return;
        const specId = String(
          item?.parentSpecId ??
            item?.parent_spec_id ??
            item?.specId ??
            item?.spec_id ??
            item?.pid ??
            item?.templatePid ??
            item?.template_pid ??
            item?.id ??
            ""
        ).trim();
        const specName = String(
          item?.propertyChooseTitle ??
            item?.property_choose_title ??
            item?.name ??
            item?.specName ??
            item?.spec_name ??
            item?.parentSpecName ??
            item?.parent_spec_name ??
            ""
        ).trim();
        const values = Array.isArray(item?.values) ? item.values : [];
        const selectedValues = values.filter(
          (v) =>
            v?.selected === true ||
            v?.selected === "true" ||
            v?.selected === 1 ||
            v?.default === true ||
            v?.default === "true" ||
            v?.default === 1 ||
            v?.isDefault === true ||
            v?.isSelected === true
        );
        if (selectedValues.length) {
          selectedValues.forEach((v) => {
            const value = String(v?.value ?? v?.name ?? v?.label ?? "").trim();
            const goodsAttrId = String(v?.vid ?? v?.id ?? v?.value_id ?? v?.valueId ?? v?.valueID ?? "").trim();
            addValue(specId, specName, value, goodsAttrId);
          });
          return;
        }
        const rawVid = String(item?.vid ?? "").trim();
        const rawValue = String(item?.value ?? "").trim();
        if (rawVid || rawValue) {
          if (rawVid.includes(",") || rawValue.includes(",")) {
            const ids = rawVid
              ? rawVid.split(",").map((x) => x.trim()).filter(Boolean)
              : [];
            const vals = rawValue ? rawValue.split(",").map((x) => x.trim()).filter(Boolean) : [];
            const max = Math.max(ids.length, vals.length);
            for (let i = 0; i < max; i += 1) {
              const vid = ids[i] || vals[i];
              const val = vals[i] || ids[i];
              if (vid || val) addValue(specId, specName, val || vid, vid);
            }
          } else {
            addValue(specId, specName, rawValue || rawVid, rawVid);
          }
        }
      });
    }

    const hasAnySalesValues = () =>
      Array.from(salesAttrSelections.values()).some((v) => Array.isArray(v?.values) && v.values.length > 0);

    if (!salesAttrSelections.size) {
      const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
      const attrIds = new Set();
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id) => attrIds.add(String(id)));
      });
      if (attrIds.size) {
        const fallbackSpec = templateList.length === 1 ? templateList[0] : null;
        attrIds.forEach((id) => {
          const hit = salesValueIndex.get(id);
          if (hit) {
            const resolvedSpec =
              (hit.specId && byId.get(String(hit.specId))) || (hit.specName && byName.get(hit.specName.toLowerCase()));
            addValue(hit.specId || resolvedSpec?.id || "", hit.specName || resolvedSpec?.name || "", hit.value, id);
            return;
          }
          if (fallbackSpec) addValue(fallbackSpec.id, fallbackSpec.name, id, id);
        });
      }
    }

    if (salesAttrSelections.size && !hasAnySalesValues()) {
      const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
      const attrIds = new Set();
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id) => attrIds.add(String(id)));
      });
      if (attrIds.size) {
        const fallbackSpec = templateList.length === 1 ? templateList[0] : null;
        attrIds.forEach((id) => {
          const hit = salesValueIndex.get(id);
          if (hit) {
            const resolvedSpec =
              (hit.specId && byId.get(String(hit.specId))) || (hit.specName && byName.get(hit.specName.toLowerCase()));
            addValue(hit.specId || resolvedSpec?.id || "", hit.specName || resolvedSpec?.name || "", hit.value, id);
            return;
          }
          if (fallbackSpec) addValue(fallbackSpec.id, fallbackSpec.name, id, id);
        });
      }
    }
  };

  const applySalesValuesFromUserInputList = (info) => {
    const userInputList = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
      ? lastTemplateRes.data.userInputParentSpecList
      : [];
    if (!userInputList.length) return;
    const salesSpecOrder = new Map();
    let defaultSpecIndex = 0;
    userInputList.forEach((p) => {
      const isDefault = p?.default ?? p?.isDefault ?? p?.selected ?? p?.checked;
      if (!(isDefault === true || isDefault === "true" || isDefault === 1 || isDefault === "1")) return;
      const specId = String(p?.parentSpecId ?? p?.parent_spec_id ?? p?.specId ?? p?.spec_id ?? p?.id ?? "").trim();
      const specName = String(p?.parentSpecName ?? p?.parent_spec_name ?? p?.specName ?? p?.spec_name ?? p?.name ?? "").trim();
      const orderKey = specId || specName;
      if (orderKey && !salesSpecOrder.has(orderKey)) salesSpecOrder.set(orderKey, defaultSpecIndex);
      defaultSpecIndex += 1;
    });

    const templateList = getSalesAttrList();
    const byId = new Map(templateList.map((x) => [String(x.id), x]));
    const byName = new Map(templateList.map((x) => [String(x.name).toLowerCase(), x]));

    const productAttrIds = (() => {
      const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
      const ids = [];
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id) => {
          const v = String(id ?? "").trim();
          if (v && !ids.includes(v)) ids.push(v);
        });
      });
      return ids;
    })();

    const mapAttrListToIds = (attrList, specIndex = 0) => {
      const list = normalizeAttrListValues(attrList);
      if (!list.length) return [];
      const byIndex = productAttrIdsByIndex[specIndex] || [];
      if (byIndex.length === list.length) {
        return list.map((value, idx) => ({ value, goods_attr_id: byIndex[idx] }));
      }
      if (list.length === 1 && byIndex.length >= 1) {
        const pick = byIndex[0];
        return [{ value: list[0], goods_attr_id: pick }];
      }
      if (productAttrIds.length === list.length) {
        return list.map((value, idx) => ({ value, goods_attr_id: productAttrIds[idx] }));
      }
      return list.map((value) => ({ value, goods_attr_id: value }));
    };

    userInputList.forEach((p, idx) => {
      const isDefault = p?.default ?? p?.isDefault ?? p?.selected ?? p?.checked;
      const specId = String(p?.parentSpecId ?? p?.parent_spec_id ?? p?.specId ?? p?.spec_id ?? p?.id ?? "").trim();
      const specName = String(p?.parentSpecName ?? p?.parent_spec_name ?? p?.specName ?? p?.spec_name ?? p?.name ?? "").trim();
      if (!specId && !specName) return;
      if (!(isDefault === true || isDefault === "true" || isDefault === 1 || isDefault === "1")) {
        if (!salesAttrSelections.has(specId) && !salesAttrSelections.has(specName)) return;
      }
      const template = (specId && byId.get(specId)) || (specName && byName.get(specName.toLowerCase()));
      const id = String(template?.id ?? specId ?? specName).trim();
      const name = String(template?.name ?? specName).trim();
      if (!id || !name) return;
      if (!salesAttrSelections.has(id)) {
        if (salesAttrSelections.size >= 2) return;
        salesAttrSelections.set(id, { id, name, values: [] });
      }
      const entry = salesAttrSelections.get(id);
      if (!entry) return;
      if (Array.isArray(entry.values) && entry.values.length) return;
      const orderKey = specId || specName;
      const mapped = mapAttrListToIds(
        p?.attrList ?? p?.attr_list ?? p?.attrListStr ?? p?.attr_list_str,
        salesSpecOrder.has(orderKey) ? salesSpecOrder.get(orderKey) : idx,
      );
      if (!mapped.length) return;
      entry.values = Array.isArray(entry.values) ? entry.values : [];
      mapped.forEach((item) => {
        const cleanValue = String(item.value ?? "").trim();
        if (!cleanValue) return;
        const valId = String(item.goods_attr_id ?? cleanValue).trim();
        if (entry.values.some((v) => String(v.goods_attr_id ?? "") === valId)) return;
        entry.values.push({ value: cleanValue, goods_attr_id: valId });
      });
    });
  };

  const getSkuField = (row, keys) => {
    for (const key of keys) {
      const value = row?.[key];
      if (value != null && String(value).trim() !== "") return value;
    }
    return "";
  };

  const normalizeSkuAttrImgList = (raw) => {
    const list =
      parseMaybeArray(raw) ||
      parseMaybeArray(raw?.attr_img_list) ||
      parseMaybeArray(raw?.attrImgList) ||
      parseMaybeArray(raw?.img_list) ||
      parseMaybeArray(raw?.images) ||
      [];
    if (!Array.isArray(list)) return [];
    return list
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string") return { img_id: "0", img_url: img };
        const url = img?.img_url ?? img?.url ?? img?.imgUrl ?? img?.img ?? "";
        if (!url) return null;
        return { img_id: img?.img_id ?? img?.imgId ?? img?.id ?? "0", img_url: url };
      })
      .filter(Boolean);
  };

  const readGoodsAttrIdsFromRow = (row) => {
    let raw = String(
      getSkuField(row, [
        "goods_attrs",
        "goods_attr",
        "goodsAttr",
        "goods_attr_id",
        "goodsAttrId",
        "attr_ids",
        "attrIds",
      ]),
    ).trim();
    let ids = parseMaybeList(raw)
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);
    if (!ids.length) {
      const specs =
        parseMaybeArray(row?.specs) ||
        parseMaybeArray(row?.spec_list) ||
        parseMaybeArray(row?.specList) ||
        parseMaybeArray(row?.attrs) ||
        [];
      if (Array.isArray(specs) && specs.length) {
        ids = specs
          .map((s) => s?.goods_attr_id ?? s?.goodsAttrId ?? s?.attr_id ?? s?.attrId ?? s?.id ?? "")
          .map((s) => String(s ?? "").trim())
          .filter(Boolean);
      }
    }
    return ids;
  };

  const applySkuFromInfo = (info) => {
    skuDraft.clear();
    skuDraftSingleCache.clear();
    skuAttrIdsByIndex = [];

    const readSkuList = () => {
      const direct =
        parseMaybeArray(info?.sku_list) ||
        parseMaybeArray(info?.skuList) ||
        parseMaybeArray(info?.sku_data) ||
        parseMaybeArray(info?.skuData) ||
        parseMaybeArray(info?.sku) ||
        parseMaybeArray(info?.products) ||
        parseMaybeArray(info?.product_list) ||
        parseMaybeArray(info?.productList);
      if (Array.isArray(direct) && direct.length) return direct;

      const raw = parseMaybeArray(info?.goods_attr) || parseMaybeArray(info?.goods_attrs) || [];
      if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") return raw;
      return null;
    };

    const productsForAttrs = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
    productsForAttrs.forEach((p) => {
      const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
      if (!raw) return;
      const ids = parseMaybeList(raw)
        .map((id) => String(id ?? "").trim())
        .filter(Boolean);
      ids.forEach((id, idx) => {
        if (!skuAttrIdsByIndex[idx]) skuAttrIdsByIndex[idx] = [];
        if (!skuAttrIdsByIndex[idx].includes(id)) skuAttrIdsByIndex[idx].push(id);
      });
    });
    const productAttrIds = (() => {
      const ids = [];
      productsForAttrs.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        parseMaybeList(raw).forEach((id) => {
          const v = String(id ?? "").trim();
          if (v && !ids.includes(v)) ids.push(v);
        });
      });
      return ids;
    })();

    if (salesAttrSelections.size && productAttrIds.length) {
      Array.from(salesAttrSelections.values()).forEach((sel, idx) => {
        const values = Array.isArray(sel?.values) ? sel.values : [];
        if (values.length !== 1) return;
        const only = values[0] || {};
        const gid = String(only.goods_attr_id ?? "").trim();
        if (gid && productAttrIds.includes(gid)) return;
        const pick = productAttrIds[idx] ?? productAttrIds[0];
        if (pick) only.goods_attr_id = pick;
      });
    }

    const labelsByIndex = (() => {
      const fromSelections = Array.from(salesAttrSelections.values())
        .map((sel) =>
          (Array.isArray(sel?.values) ? sel.values : [])
            .map((v) => String(v?.value ?? "").trim())
            .filter(Boolean),
        )
        .filter((vals) => vals.length);
      if (fromSelections.length) return fromSelections;
      const templateList = Array.isArray(lastTemplateRes?.data?.userInputParentSpecList)
        ? lastTemplateRes.data.userInputParentSpecList
        : [];
      return templateList.map((item) => normalizeAttrListValues(item?.attrList ?? item?.attr_list ?? []));
    })();

    const skuList = readSkuList();
    if (Array.isArray(skuList) && skuList.length) {
      skuList.forEach((row) => {
        if (!row || typeof row !== "object") return;
        const goodsAttrIds = readGoodsAttrIdsFromRow(row);
        const goodsAttrs = normalizeGoodsAttrKey(goodsAttrIds.join(","));
        if (!goodsAttrs) return;
        skuDraft.set(goodsAttrs, {
          product_id: String(getSkuField(row, ["product_id", "productId", "id", "productID"]) ?? "").trim(),
          product_sn: String(getSkuField(row, ["product_sn", "productSn", "sku_sn", "skuSn", "sn"]) ?? "").trim(),
          product_number: String(getSkuField(row, ["product_number", "productNumber", "stock", "qty", "quantity"]) ?? "").trim(),
          product_price: String(getSkuField(row, ["product_price", "productPrice", "price", "sku_price", "skuPrice"]) ?? "").trim(),
          weight: String(getSkuField(row, ["weight", "product_weight", "productWeight"]) ?? "").trim(),
          width: String(getSkuField(row, ["width", "product_width", "productWidth"]) ?? "").trim(),
          height: String(getSkuField(row, ["height", "product_height", "productHeight"]) ?? "").trim(),
          length: String(getSkuField(row, ["length", "product_length", "productLength"]) ?? "").trim(),
          attr_img_list: normalizeSkuAttrImgList(row?.attr_img_list ?? row?.attrImgList ?? row?.images ?? row?.img_list),
        });
        if (goodsAttrIds.length && labelsByIndex.length) {
          const labels = goodsAttrIds
            .map((id, idx) => {
              const pool = skuAttrIdsByIndex[idx] || [];
              const pos = pool.indexOf(id);
              const labelPool = labelsByIndex[idx] || [];
              return pos > -1 ? labelPool[pos] : "";
            })
            .filter(Boolean);
          if (labels.length === goodsAttrIds.length) {
            const labelKey = normalizeGoodsAttrKey(labels.join(","));
            if (labelKey && !skuDraft.has(labelKey)) {
              skuDraft.set(labelKey, skuDraft.get(goodsAttrs));
            }
          }
        }
      });
    } else {
      const rawKeys = parseMaybeArray(info?.goods_attr) || parseMaybeArray(info?.goods_attrs) || [];
      if (!Array.isArray(rawKeys) || rawKeys.length === 0) return;
      const skuKeys = rawKeys
        .map((k) => {
          if (typeof k === "string") return k;
          if (k && typeof k === "object") return k?.goods_attr ?? k?.goods_attrs ?? k?.goods_attr_id ?? "";
          return "";
        })
        .map((k) => normalizeGoodsAttrKey(k))
        .filter(Boolean);
      const fields = {
        product_sn: parseMaybeList(info?.product_sn),
        product_number: parseMaybeList(info?.product_number),
        product_price: parseMaybeList(info?.product_price),
        weight: parseMaybeList(info?.weight),
        width: parseMaybeList(info?.width),
        height: parseMaybeList(info?.height),
        length: parseMaybeList(info?.length),
      };
      skuKeys.forEach((key, idx) => {
        const goodsAttrs = normalizeGoodsAttrKey(key);
        if (!goodsAttrs) return;
        skuDraft.set(goodsAttrs, {
          product_id: "",
          product_sn: String(fields.product_sn[idx] ?? "").trim(),
          product_number: String(fields.product_number[idx] ?? "").trim(),
          product_price: String(fields.product_price[idx] ?? "").trim(),
          weight: String(fields.weight[idx] ?? "").trim(),
          width: String(fields.width[idx] ?? "").trim(),
          height: String(fields.height[idx] ?? "").trim(),
          length: String(fields.length[idx] ?? "").trim(),
          attr_img_list: [],
        });
      });
    }

    const imgs = parseMaybeArray(info?.attr_img_list) || [];
    if (!Array.isArray(imgs) || !imgs.length) return;
    for (const img of imgs) {
      if (!img || typeof img !== "object") continue;
      const rawKey = normalizeGoodsAttrKey(img?.goods_attrs ?? img?.goods_attr ?? "");
      const rawAttrId = String(img?.goods_attr_id ?? img?.goodsAttrId ?? "").trim();
      const imgUrl = img?.img_url ?? img?.url ?? img?.imgUrl ?? "";
      if (!imgUrl) continue;
      let targetKey = rawKey;
      if (!targetKey && rawAttrId) {
        for (const key of skuDraft.keys()) {
          if (key.split(",").map((x) => x.trim()).includes(rawAttrId)) {
            targetKey = key;
            break;
          }
        }
      }
      if (!targetKey || !skuDraft.has(targetKey)) continue;
      const row = skuDraft.get(targetKey);
      row.attr_img_list = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
      row.attr_img_list.push({
        img_id: img?.img_id ?? img?.imgId ?? "0",
        img_url: imgUrl,
      });
    }
  };

  const pruneSalesSelectionsForSingleSku = (info) => {
    if (salesAttrSelections.size <= 1) return;
    const selections = Array.from(salesAttrSelections.values());
    const withValues = selections.filter((s) => Array.isArray(s?.values) && s.values.length > 0);
    if (withValues.length !== 1) return;
    const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
    if (!products.length) return;
    const rawAttrs = products
      .map((p) => String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim())
      .filter(Boolean);
    if (!rawAttrs.length) return;
    const hasCombo = rawAttrs.some((v) => v.includes(","));
    const uniqueIds = new Set();
    rawAttrs.forEach((v) => parseMaybeList(v).forEach((id) => uniqueIds.add(String(id))));
    if (hasCombo || uniqueIds.size > 1) return;
    salesAttrSelections.clear();
    const only = withValues[0];
    salesAttrSelections.set(String(only.id), { ...only });
  };

  const applyTemuEditData = async (info, goodsId) => {
    if (!info || typeof info !== "object") return;
    applyingTemuEdit = true;
    try {
      clearAll({ resetHash: false });
      lastTemuInfo = info;
      setTemuEditMode(goodsId);

      const catId = String(info?.cat_id ?? info?.catId ?? info?.catID ?? "").trim();
      const cateLists =
        parseMaybeArray(info?.cate_lists) ||
        parseMaybeArray(info?.cateLists) ||
        parseMaybeArray(info?.category_list) ||
        parseMaybeArray(info?.categoryList) ||
        [];
      const catName = String(
        info?.cate_names ??
          info?.cateNames ??
          info?.cat_name ??
          info?.catName ??
          info?.cat_path ??
          info?.catPath ??
          ""
      ).trim();
      if (catId && catOut) {
        lastTemplateCatId = catId;
        const cateIds = Array.isArray(cateLists)
          ? cateLists
              .map((c) => String(c?.category_id ?? c?.cat_id ?? c?.id ?? "").trim())
              .filter(Boolean)
          : [];
        const cateNames = Array.isArray(cateLists)
          ? cateLists
              .map((c) =>
                String(c?.category_name_zh_cn ?? c?.category_name ?? c?.cat_name ?? c?.name ?? "").trim()
              )
              .filter(Boolean)
          : [];
        const pathText = catName || (cateNames.length ? cateNames.join(" / ") : catId);

        catOut.textContent = catId;
        const catText = document.getElementById("temu-cat-id-text");
        if (catText) catText.textContent = pathText || catId;
        try {
          window.localStorage.setItem(
            "topm:cat-selection:temu",
            JSON.stringify({
              leafId: catId,
              ids: cateIds.length ? cateIds : [catId],
              pathText: pathText || catId,
              pathParts: cateNames.length ? cateNames : undefined,
            })
          );
        } catch {
          // ignore
        }
        await buildCategorySelector("temu-cat-select", "temu", "temu-cat-id");
      }

      const nameEl = document.getElementById("temu-goods-name");
      if (nameEl) nameEl.value = String(info?.goods_name ?? info?.goodsName ?? "").trim();
      const snEl = document.getElementById("temu-goods-sn");
      if (snEl) snEl.value = String(info?.goods_sn ?? info?.goodsSn ?? "").trim();
      const briefEl = document.getElementById("temu-goods-brief");
      if (briefEl) briefEl.value = String(info?.goods_brief ?? info?.goodsBrief ?? "").trim();
      const aliSnEl = document.getElementById("temu-ali-seller-sn");
      if (aliSnEl) aliSnEl.value = String(info?.ali_seller_sn ?? info?.aliSellerSn ?? "").trim();

      const detailImgs = normalizeDetailImgs(
        info?.goods_detail_img ?? info?.goods_detail_imgs ?? info?.detail_img ?? info?.detail_imgs
      );
      if (detailImgsTextarea) detailImgsTextarea.value = JSON.stringify(detailImgs, null, 2);
      renderImagePreview();

      if (catId) {
        await fetchTemuTemplate(catId, goodsId);
        const templateData = lastTemplateRes?.data || {};
        const attrs =
          parseMaybeArray(info?.goods_attrs) ||
          normalizeAttrEntries(info?.goods_attrs) ||
          parseMaybeArray(info?.attrs) ||
          normalizeAttrEntries(info?.attrs) ||
          parseMaybeArray(info?.attributes) ||
          normalizeAttrEntries(info?.attributes) ||
          parseMaybeArray(info?.attr_list) ||
          normalizeAttrEntries(info?.attr_list) ||
          parseMaybeArray(info?.attrList) ||
          normalizeAttrEntries(info?.attrList) ||
          parseMaybeArray(info?.attribute_list) ||
          normalizeAttrEntries(info?.attribute_list) ||
          parseMaybeArray(info?.attributeList) ||
          normalizeAttrEntries(info?.attributeList) ||
          parseMaybeArray(info?.props) ||
          normalizeAttrEntries(info?.props) ||
          parseMaybeArray(info?.properties) ||
          normalizeAttrEntries(info?.properties) ||
          [];
        const fallbackAttrs =
          parseMaybeArray(templateData?.goods_attrs) ||
          normalizeAttrEntries(templateData?.goods_attrs) ||
          parseMaybeArray(templateData?.attrs) ||
          normalizeAttrEntries(templateData?.attrs) ||
          parseMaybeArray(templateData?.attributes) ||
          normalizeAttrEntries(templateData?.attributes) ||
          parseMaybeArray(templateData?.attr_list) ||
          normalizeAttrEntries(templateData?.attr_list) ||
          parseMaybeArray(templateData?.attrList) ||
          normalizeAttrEntries(templateData?.attrList) ||
          parseMaybeArray(templateData?.attribute_list) ||
          normalizeAttrEntries(templateData?.attribute_list) ||
          parseMaybeArray(templateData?.attributeList) ||
          normalizeAttrEntries(templateData?.attributeList) ||
          parseMaybeArray(templateData?.props) ||
          normalizeAttrEntries(templateData?.props) ||
          parseMaybeArray(templateData?.properties) ||
          normalizeAttrEntries(templateData?.properties) ||
          [];
        if (attrs.length || fallbackAttrs.length) {
          applyTemplateSelectionsFromInfo(attrs.length ? attrs : fallbackAttrs);
        } else {
          applyTemplateSelectionsFromTemplate();
        }

        const mergedSalesInfo =
          attrs.length || !templateData
            ? info
            : {
                ...info,
                goods_attr_list:
                  templateData?.goods_attr_list ?? templateData?.sales_attr_list ?? templateData?.spec_list ?? templateData?.specs,
                goods_attr: templateData?.goods_attr ?? info?.goods_attr,
                spec_list: templateData?.spec_list ?? info?.spec_list,
                specs: templateData?.specs ?? info?.specs,
                sales_attrs: templateData?.sales_attrs ?? info?.sales_attrs,
                sales_attr_list: templateData?.sales_attr_list ?? info?.sales_attr_list,
              };
        applySalesAttrsFromInfo(mergedSalesInfo);
        applySalesValuesFromUserInputList(info);
        syncSalesAttrIdsFromProducts(info);
        applySkuFromInfo(info);
        pruneSalesSelectionsForSingleSku(info);
        renderTemuTemplateForm();
        renderSalesAttrs();
        renderSalesAttrValues();
        renderSkuGrid();
        renderUploadStepper();
      }

      setSubView("upload", { updateHash: true, editId: goodsId });
      if (catId) setUploadStep(5);
    } finally {
      applyingTemuEdit = false;
    }
  };

  const loadTemuInfoForEdit = async (goodsId) => {
    const id = String(goodsId ?? "").trim();
    if (!id) return;
    if (listSummary) listSummary.textContent = "加载详情...";
    try {
      const res = await postAuthedJson("/api/temu/info", { goods_id: id, id });
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        if (listSummary) listSummary.textContent = res?.msg || "加载失败";
        return;
      }
      const info = pickTemuInfoData(res);
      await applyTemuEditData(info, id);
    } catch {
      if (listSummary) listSummary.textContent = "网络异常";
    }
  };

  if (listRefresh) {
    listRefresh.addEventListener("click", () => {
      listPage = 1;
      loadTemuGoodsList();
    });
  }
  if (listKeywords) {
    listKeywords.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      listPage = 1;
      loadTemuGoodsList();
    });
  }
  if (listSize) {
    listSize.addEventListener("change", () => {
      listPage = 1;
      loadTemuGoodsList();
    });
  }
  if (listPrev) {
    listPrev.addEventListener("click", () => {
      listPage = Math.max(1, listPage - 1);
      loadTemuGoodsList();
    });
  }
  if (listNext) {
    listNext.addEventListener("click", () => {
      listPage += 1;
      loadTemuGoodsList();
    });
  }
  if (listPageGo) {
    listPageGo.addEventListener("click", () => {
      const v = Number(listPageInput?.value || 1) || 1;
      listPage = Math.max(1, Math.floor(v));
      loadTemuGoodsList();
    });
  }
  if (listPageInput) {
    listPageInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = Number(listPageInput.value || 1) || 1;
      listPage = Math.max(1, Math.floor(v));
      loadTemuGoodsList();
    });
  }

  if (listTbody) {
    listTbody.addEventListener("click", async (e) => {
      const editBtn = e.target?.closest?.(".temu-edit");
      if (editBtn) {
        const pending = editBtn.dataset.pending === "1";
        if (pending) return;
        const goodsId = String(editBtn.dataset.temuEditId ?? "").trim();
        if (!goodsId) return;
        editBtn.dataset.pending = "1";
        const originalHtml = editBtn.innerHTML;
        editBtn.classList.add("opacity-70");
        editBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[11px]"></i>编辑中...';
        try {
          await loadTemuInfoForEdit(goodsId);
        } finally {
          editBtn.dataset.pending = "0";
          editBtn.classList.remove("opacity-70");
          editBtn.innerHTML = originalHtml;
        }
        return;
      }

      const btn = e.target?.closest?.(".temu-toggle-sale");
      if (!btn) return;
      const pending = btn.dataset.pending === "1";
      if (pending) return;
      const goodsId = String(btn.dataset.goodsId ?? "").trim();
      const nextVal = String(btn.dataset.nextVal ?? "").trim();
      if (!goodsId || (nextVal !== "0" && nextVal !== "1")) return;

      btn.dataset.pending = "1";
      btn.classList.add("opacity-70", "cursor-not-allowed");
      btn.disabled = true;
      const rowEl = btn.closest("tr");
      const currentVal = String(btn.dataset.currentVal ?? (nextVal === "1" ? "0" : "1")).trim();
      updateTemuListRowDom(rowEl, nextVal);
      animateToggleIcon(btn);
      try {
        const res = await postAuthedJson("/api/goods/toggle_on_sale", { id: goodsId, val: nextVal });
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0") {
          if (listSummary) listSummary.textContent = res?.msg || "操作失败";
          updateTemuListRowDom(rowEl, currentVal);
          return;
        }
        if (listSummary) listSummary.textContent = res?.msg || "操作成功";
        updateTemuListRowDom(rowEl, nextVal);
      } catch {
        if (listSummary) listSummary.textContent = "网络异常，请稍后重试。";
        updateTemuListRowDom(rowEl, currentVal);
      } finally {
        btn.dataset.pending = "0";
        btn.classList.remove("opacity-70", "cursor-not-allowed");
        btn.disabled = false;
      }
    });
  }

  loadTemuGoodsList();

  const resetCategorySelection = () => {
    try {
      window.localStorage.removeItem("topm:cat-selection:temu");
    } catch {
      // ignore
    }
    if (catOut) catOut.textContent = "-";
    const catText = document.getElementById("temu-cat-id-text");
    if (catText) catText.textContent = "-";
    if (catRoot) catRoot.innerHTML = "";
    buildCategorySelector("temu-cat-select", "temu", "temu-cat-id");
  };

  const setTemuEditMode = (goodsId) => {
    const id = String(goodsId ?? "").trim();
    editingTemuGoodsId = id;
    try {
      if (id) window.sessionStorage.setItem("topm:temu-edit-id", id);
      else window.sessionStorage.removeItem("topm:temu-edit-id");
    } catch {
      // ignore
    }
    if (!createBtn) return;
    if (editingTemuGoodsId) {
      createBtn.innerHTML = '<i class="fas fa-pen-to-square mr-1"></i>更新并上传';
    } else {
      createBtn.innerHTML = createBtnDefaultHtml || createBtn.innerHTML;
    }
  };

  const syncSalesAttrIdsFromProducts = (info) => {
    if (!salesAttrSelections.size) return;
    const products = parseMaybeArray(info?.products) || parseMaybeArray(info?.product_list) || [];
    if (!products.length) return;
    const deriveAttrIdLabelMaps = (labelsByIndex) => {
      if (!Array.isArray(labelsByIndex) || labelsByIndex.length < 2) return null;
      const ids = new Set();
      const edges = new Map();
      const addEdge = (a, b) => {
        if (!edges.has(a)) edges.set(a, new Set());
        if (!edges.has(b)) edges.set(b, new Set());
        edges.get(a).add(b);
        edges.get(b).add(a);
      };
      products.forEach((p) => {
        const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
        if (!raw) return;
        const list = parseMaybeList(raw)
          .map((id) => String(id ?? "").trim())
          .filter(Boolean);
        list.forEach((id) => ids.add(id));
        for (let i = 0; i < list.length; i += 1) {
          for (let j = i + 1; j < list.length; j += 1) {
            addEdge(list[i], list[j]);
          }
        }
      });
      if (ids.size < 2) return null;
      const color = new Map();
      for (const id of ids) {
        if (color.has(id)) continue;
        color.set(id, 0);
        const queue = [id];
        while (queue.length) {
          const cur = queue.shift();
          const nextColor = 1 - color.get(cur);
          const neighbors = edges.get(cur) || new Set();
          for (const nb of neighbors) {
            if (!color.has(nb)) {
              color.set(nb, nextColor);
              queue.push(nb);
            } else if (color.get(nb) !== nextColor) {
              return null;
            }
          }
        }
      }
      const groups = [[], []];
      for (const [id, c] of color.entries()) {
        groups[c].push(id);
      }
      if (!groups[0].length || !groups[1].length) return null;
      const orderIds = (group) => {
        const groupSet = new Set(group);
        const ordered = [];
        const seen = new Set();
        products.forEach((p) => {
          const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
          if (!raw) return;
          parseMaybeList(raw)
            .map((id) => String(id ?? "").trim())
            .filter(Boolean)
            .forEach((id) => {
              if (!groupSet.has(id) || seen.has(id)) return;
              seen.add(id);
              ordered.push(id);
            });
        });
        group.forEach((id) => {
          if (!seen.has(id)) ordered.push(id);
        });
        return ordered;
      };
      const orderedGroups = [orderIds(groups[0]), orderIds(groups[1])];
      let groupToSpec = [0, 1];
      if (
        labelsByIndex.length >= 2 &&
        orderedGroups[0].length === labelsByIndex[1].length &&
        orderedGroups[1].length === labelsByIndex[0].length &&
        orderedGroups[0].length !== labelsByIndex[0].length
      ) {
        groupToSpec = [1, 0];
      }
      const labelToIdBySpec = labelsByIndex.map(() => new Map());
      const idToLabel = new Map();
      groupToSpec.forEach((specIdx, groupIdx) => {
        const labels = labelsByIndex[specIdx] || [];
        const idsOrdered = orderedGroups[groupIdx] || [];
        idsOrdered.forEach((id, i) => {
          const label = String(labels[i] ?? "").trim();
          if (!label) return;
          labelToIdBySpec[specIdx].set(label, id);
          idToLabel.set(id, label);
        });
      });
      return { labelToIdBySpec, idToLabel, idsBySpec: groupToSpec.map((_, idx) => orderedGroups[idx]) };
    };

    const idsByIndex = [];
    products.forEach((p) => {
      const raw = String(p?.goods_attr ?? p?.goods_attrs ?? p?.goods_attr_id ?? p?.goodsAttrId ?? "").trim();
      if (!raw) return;
      const ids = parseMaybeList(raw)
        .map((id) => String(id ?? "").trim())
        .filter(Boolean);
      ids.forEach((id, idx) => {
        if (!idsByIndex[idx]) idsByIndex[idx] = [];
        if (!idsByIndex[idx].includes(id)) idsByIndex[idx].push(id);
      });
    });
    if (!idsByIndex.length) return;
    const selections = Array.from(salesAttrSelections.values());
    const labelsByIndex = selections.map((sel) =>
      (Array.isArray(sel?.values) ? sel.values : []).map((v) => String(v?.value ?? "").trim()).filter(Boolean),
    );
    const mapping = deriveAttrIdLabelMaps(labelsByIndex);
    if (mapping) {
      skuAttrIdsByIndex = mapping.idsBySpec || skuAttrIdsByIndex;
      selections.forEach((sel, idx) => {
        const values = Array.isArray(sel?.values) ? sel.values : [];
        const labelToId = mapping.labelToIdBySpec?.[idx];
        if (!labelToId) return;
        values.forEach((v) => {
          const label = String(v?.value ?? "").trim();
          if (!label) return;
          const gid = labelToId.get(label);
          if (gid) v.goods_attr_id = gid;
        });
      });
      return;
    }
    selections.forEach((sel, idx) => {
      const values = Array.isArray(sel?.values) ? sel.values : [];
      const candidateIds = idsByIndex[idx] || [];
      if (!values.length || !candidateIds.length) return;
      const candidateSet = new Set(candidateIds);
      const needsMap = values.some((v) => {
        const gid = String(v?.goods_attr_id ?? "").trim();
        return !gid || !candidateSet.has(gid);
      });
      if (!needsMap) return;
      if (values.length === candidateIds.length) {
        values.forEach((v, i) => {
          v.goods_attr_id = candidateIds[i];
        });
        return;
      }
      if (values.length === 1) {
        values[0].goods_attr_id = candidateIds[0];
        return;
      }
      let remaining = candidateIds.filter(
        (id) => !values.some((v) => String(v?.goods_attr_id ?? "").trim() === id),
      );
      values.forEach((v) => {
        const gid = String(v?.goods_attr_id ?? "").trim();
        if (gid && candidateSet.has(gid)) return;
        const next = remaining.shift();
        if (next) v.goods_attr_id = next;
      });
    });
  };

  const clearAll = (opts = {}) => {
    const resetHash = opts.resetHash !== false;
    const keepEditId = String(opts.editId ?? "").trim();
    const keepEdit = opts.keepEdit === true && keepEditId;
    if (keepEdit) setTemuEditMode(keepEditId);
    else setTemuEditMode("");
    if (resetHash) {
      setSubView("upload", { updateHash: true, editId: keepEdit ? keepEditId : "" });
    } else {
      setSubView("upload", { updateHash: false });
    }
    setPre(templatePre, "");
    setPre(uploadPre, "");
    setPre(createPre, "");
    lastTemplateRes = null;
    lastUploadRes = null;
    lastTemuInfo = null;
    templateSelections.clear();
    renderSelectedTemplateJson();
    renderTemuTemplateForm();
    ["temu-goods-name", "temu-goods-sn", "temu-goods-brief", "temu-ali-seller-sn", "temu-detail-imgs"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (fileInput) fileInput.value = "";
    salesAttrSelections.clear();
    skuDraft.clear();
    skuDraftSingleCache.clear();
    skuAttrIdsByIndex = [];
    renderSalesAttrs();
    renderSalesAttrValues();
    renderSkuGrid();
    setUploadStep(1);
    renderImagePreview();
  };

  const showCreateToast = (message, ok = true) => {
    if (!createToast) return;
    const msg = String(message || "").trim();
    if (!msg) {
      createToast.classList.add("hidden");
      createToast.textContent = "";
      return;
    }
    createToast.classList.remove("hidden");
    createToast.className =
      "text-xs px-3 py-2 rounded-xl border " +
      (ok ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700");
    createToast.textContent = msg;
  };

  if (reset) reset.addEventListener("click", clearAll);

  if (templateBtn) {
    templateBtn.addEventListener("click", async () => {
      const catId = catOut.textContent.trim();
      if (!catId || catId === "-") {
        setPre(templatePre, { code: "1", msg: "Please select a leaf category (cat_id)." });
        return;
      }
      lastTemplateCatId = catId;
      templateSelections.clear();
      salesAttrSelections.clear();
      skuDraft.clear();
      lastTemplateRes = null;
      renderTemuTemplateForm();
      renderSalesAttrs();
      renderSalesAttrValues();
      renderSkuGrid();
      renderUploadStepper();
      setUploadStep(2);
      await fetchTemuTemplate(catId, goodsId);
    });
  }

  let pendingDetailUploads = 0;
  const uploadBtnDefaultHtml = uploadBtn ? uploadBtn.innerHTML : "";
  const setDetailUploadBusy = () => {
    if (!uploadBtn) return;
    const busy = pendingDetailUploads > 0;
    uploadBtn.disabled = busy;
    uploadBtn.innerHTML = busy ? '<i class="fas fa-circle-notch fa-spin mr-1"></i>Uploading...' : uploadBtnDefaultHtml;
  };

  const doUploadTemuImage = async (file, slot) => {
    if (!file) return;
    const localId = slot?.localId || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let tempUrl = slot?.tempUrl || "";
    if (!tempUrl) {
      try {
        tempUrl = URL.createObjectURL(file);
      } catch {
        tempUrl = "";
      }
    }
    if (slot?.localId) {
      updateDetailImg((x) => x?.localId === localId, { uploading: true, uploadError: "" });
    } else {
      addDetailImg(tempUrl, { imgId: localId, local: true, localId, name: file.name || "", uploading: true });
    }
    if (!isImageFile(file)) {
      lastUploadRes = { code: "1", msg: "Please upload image file (jpg/jpeg/png/webp/gif/bmp).", data: {} };
      updateDetailImg((x) => x?.localId === localId, { uploading: false, uploadError: lastUploadRes.msg });
      renderUploadStepper();
      return;
    }

    pendingDetailUploads += 1;
    setDetailUploadBusy();
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("goods_id", "0");
      const res = await postAuthedFormData("/api/temu/upload_goods_img", form);
      lastUploadRes = res;
      renderUploadStepper();

      const uploadedUrls = pickTemuImageUrls(res?.data || {}).filter(Boolean);
      const isOk = String(res?.msg ?? "").trim().toLowerCase() === "ok";
      if (isOk && uploadedUrls.length) {
        const firstUrl = uploadedUrls[0];
        updateDetailImg(
          (x) => x?.localId === localId || (!tempUrl || x?.img_url === tempUrl),
          { img_url: firstUrl, local: false, uploadedOk: true, uploading: false, uploadError: "" },
        );
        if (uploadedUrls.length > 1) {
          uploadedUrls.slice(1).forEach((u, idx) =>
            addDetailImg(u, { imgId: `srv-${idx + 1}`, local: false, localId: null, name: file.name || "", uploadedOk: true }),
          );
        }
        tryGoStep(5);
      } else {
        updateDetailImg((x) => x?.localId === localId, { uploading: false, uploadError: res?.msg || "Upload failed." });
      }
    } catch {
      lastUploadRes = { code: "1", msg: "Network error, please retry.", data: {} };
      updateDetailImg((x) => x?.localId === localId, { uploading: false, uploadError: lastUploadRes.msg });
      renderUploadStepper();
    } finally {
      if (tempUrl) {
        try {
          URL.revokeObjectURL(tempUrl);
        } catch {
          // ignore
        }
      }
      pendingDetailUploads = Math.max(0, pendingDetailUploads - 1);
      setDetailUploadBusy();
      if (fileInput) fileInput.value = "";
    }
  };

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      (async () => {
        const slots = files.map((file) => {
          const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          let tempUrl = "";
          try {
            tempUrl = URL.createObjectURL(file);
          } catch {
            tempUrl = "";
          }
          addDetailImg(tempUrl, {
            imgId: localId,
            local: true,
            localId,
            name: file.name || "",
            uploading: true,
          });
          return { file, localId, tempUrl };
        });
        for (const slot of slots) {
          await doUploadTemuImage(slot.file, slot);
        }
      })();
      fileInput.value = "";
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      // single button UX: click to choose file, then auto upload on selection
      if (!fileInput) return;
      fileInput.click();
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const catId = catOut.textContent.trim();
      if (!catId || catId === "-") {
        showCreateToast("请选择末级类目(cat_id)", false);
        return;
      }

      const detailImgs = parseDetailImgs();
      if (detailImgs === null) {
        showCreateToast("goods_detail_img 不是合法 JSON 数组", false);
        return;
      }

      const combos = getSalesCombos();
      if (!salesAttrSelections.size) {
        showCreateToast("请先选择销售属性", false);
        return;
      }
      if (!combos.length) {
        showCreateToast("请先为销售属性添加值", false);
        return;
      }

      const skuRows = combos.map((combo) => {
        const goods_attrs = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
        const label = combo.map((x) => `${x.specName}: ${x.value}`).join(" / ");
        const row = skuDraft.get(goods_attrs) || {};
        return { goods_attrs, label, ...row };
      });

      const missingSku = skuRows.find((row) => {
        const requiredFields = ["product_sn", "product_number", "product_price", "weight", "width", "height", "length"];
        const hasMissing = requiredFields.some((k) => !String(row?.[k] ?? "").trim());
        const images = Array.isArray(row?.attr_img_list) ? row.attr_img_list : [];
        return hasMissing || images.length === 0;
      });
      if (missingSku) {
        showCreateToast(`请补全 SKU 组合信息：${missingSku.label}`, false);
        return;
      }

      const normalAttrs = getSelectedTemplatePayload();
      const payload = {
        goods_name: document.getElementById("temu-goods-name")?.value?.trim(),
        goods_sn: document.getElementById("temu-goods-sn")?.value?.trim(),
        cat_id: catId,
        goods_brief: document.getElementById("temu-goods-brief")?.value?.trim(),
        goods_detail_img: detailImgs,
        goods_attrs: normalAttrs,
        goods_attr: skuRows.map((r) => r.goods_attrs),
        goods_id: "0",
        product_sn: skuRows.map((r) => r.product_sn),
        product_number: skuRows.map((r) => r.product_number),
        product_price: skuRows.map((r) => r.product_price),
        weight: skuRows.map((r) => r.weight),
        width: skuRows.map((r) => r.width),
        height: skuRows.map((r) => r.height),
        length: skuRows.map((r) => r.length),
        attr_img_list: skuRows.reduce((acc, row) => {
          const sn = String(row?.product_sn ?? "").trim();
          if (!sn) return acc;
          const imgs = (Array.isArray(row.attr_img_list) ? row.attr_img_list : []).slice(0, 10);
          if (!imgs.length) return acc;
          acc[sn] = imgs.map((img) => ({
            img_id: img?.img_id ?? 0,
            img_url: img?.img_url || img?.url || "",
          }));
          return acc;
        }, {}),
        ali_seller_sn: document.getElementById("temu-ali-seller-sn")?.value?.trim(),
      };

      const required = ["goods_name", "goods_sn", "cat_id", "goods_brief"];
      const missing = required.filter((k) => !String(payload[k] ?? "").trim());
      if (missing.length) {
        showCreateToast(`缺少必填：${missing.join(", ")}`, false);
        return;
      }

      if (!payload.goods_detail_img.length) {
        showCreateToast("请先完善商品详情并填写 goods_detail_img", false);
        return;
      }

      const originalHtml = createBtn.innerHTML;
      createBtn.disabled = true;
      createBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>提交中...';
      try {
        const isEdit = Boolean(editingTemuGoodsId);
        const submitUrl = isEdit ? "/api/temu/update" : "/api/temu/insert";
        const submitPayload = isEdit
          ? {
              ...payload,
              goods_id: editingTemuGoodsId,
              id: editingTemuGoodsId,
              product_id: skuRows.map((r) => String(r.product_id ?? "").trim() || "0"),
            }
          : payload;
        const res = await postAuthedUrlEncoded(submitUrl, submitPayload);
        if (String(res?.code ?? "") === "0") {
          setTemuEditMode("");
          showCreateToast("", true);
          if (createPre) createPre.textContent = "";
          showUploadSuccessDialog();
        } else {
          showCreateToast(res?.msg || "提交失败", false);
        }
      } catch {
        showCreateToast("网络异常，请稍后重试。", false);
      } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = originalHtml;
      }
    });
  }
}
