import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { buildCategorySelector, ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupTikTok() {
  const goUploadBtn = document.getElementById("tiktok-go-upload");
  const backToListBtn = document.getElementById("tiktok-back-to-list");
  const listWrap = document.getElementById("tiktok-list-wrap");
  const uploadWrap = document.getElementById("tiktok-upload-wrap");

  const reset = document.getElementById("tiktok-reset");
  const templateBtn = document.getElementById("tiktok-fetch-template");
  const templateClearBtn = document.getElementById("tiktok-template-clear");
  const templatePre = document.getElementById("tiktok-template");
  const templateFormMsg = document.getElementById("tiktok-template-form-msg");
  const templateForm = document.getElementById("tiktok-template-form");
  const attrSummary = document.getElementById("tiktok-attr-summary");
  const fileInput = document.getElementById("tiktok-file");
  const uploadGoodsBtn = document.getElementById("tiktok-upload-goods");
  const uploadAttrsBtn = document.getElementById("tiktok-upload-attrs");
  const uploadPre = document.getElementById("tiktok-upload-result");
  const imagePreview = document.getElementById("tiktok-image-preview");
  const goodsDescEditor = document.getElementById("tiktok-goods-desc-editor");
  const goodsDescToolbar = document.getElementById("tiktok-goods-desc-toolbar");
  const goodsDescField = document.getElementById("tiktok-goods-desc");
  const salesAttrNamesEl = document.getElementById("tiktok-sales-attr-names");
  const salesAttrMsg = document.getElementById("tiktok-sales-attr-msg");
  const salesAttrCustomInput = document.getElementById("tiktok-sales-attr-custom");
  const salesAttrCustomAdd = document.getElementById("tiktok-sales-attr-custom-add");
  const salesAttrValuesEl = document.getElementById("tiktok-sales-attr-values");
  const salesModeToggle = document.getElementById("tiktok-sales-mode-toggle");
  const salesModeLabel = document.getElementById("tiktok-sales-mode-label");
  const salesAttrNameBlock = document.getElementById("tiktok-sales-attr-name-block");
  const priceStockCard = document.getElementById("tiktok-price-stock-card");
  const uploadModeHint = document.getElementById("tiktok-upload-mode-hint");
  const step5Title = document.getElementById("tiktok-step-5-title");
  const skuGridBlock = document.getElementById("tiktok-sku-grid-block");
  const skuGridEl = document.getElementById("tiktok-sku-grid");
  const skuModal = document.getElementById("tiktok-sku-modal");
  const skuModalOverlay = document.getElementById("tiktok-sku-modal-overlay");
  const skuModalClose = document.getElementById("tiktok-sku-modal-close");
  const skuModalTitle = document.getElementById("tiktok-sku-modal-title");
  const skuModalSubtitle = document.getElementById("tiktok-sku-modal-subtitle");
  const skuModalStatus = document.getElementById("tiktok-sku-modal-status");
  const skuModalImages = document.getElementById("tiktok-sku-modal-images");
  const skuModalUpload = document.getElementById("tiktok-sku-modal-upload");
  const skuModalFile = document.getElementById("tiktok-sku-modal-file");
  const imageViewer = ensureImageViewer();
  const certificationsBlock = document.getElementById("tiktok-certifications-block");
  const certFileInput = document.getElementById("tiktok-cert-file");
  const brandSearchName = document.getElementById("tiktok-brand-search-name");
  const brandSearchBtn = document.getElementById("tiktok-brand-search");
  const brandResults = document.getElementById("tiktok-brand-results");
  const brandSummary = document.getElementById("tiktok-brand-summary");
  const brandList = document.getElementById("tiktok-brand-list");
  const brandBlock = document.getElementById("tiktok-brand-block");
  const brandCard = document.getElementById("tiktok-brand-card");
  const brandTrigger = document.getElementById("tiktok-brand-trigger");
  const brandTriggerLabel = document.getElementById("tiktok-brand-trigger-label");
  const brandSelectedChip = document.getElementById("tiktok-brand-selected-chip");
  const brandDropdown = document.getElementById("tiktok-brand-dropdown");
  const brandStatus = document.getElementById("tiktok-brand-status");
  const brandSelectedHint = document.getElementById("tiktok-brand-selected-hint");
  const brandClearBtn = document.getElementById("tiktok-brand-clear");
  const brandCloseBtn = document.getElementById("tiktok-brand-close");
  const brandResetBtn = document.getElementById("tiktok-brand-reset");
  const brandCreateToggle = document.getElementById("tiktok-brand-create-toggle");
  const brandCreatePanel = document.getElementById("tiktok-brand-create-panel");
  const brandCreateCancel = document.getElementById("tiktok-brand-create-cancel");
  const brandCreateName = document.getElementById("tiktok-brand-create-name");
  const brandCreateBtn = document.getElementById("tiktok-brand-create");
  const brandSearchBtnDefaultHtml = brandSearchBtn ? brandSearchBtn.innerHTML : "";
  const brandCreateBtnDefaultHtml = brandCreateBtn ? brandCreateBtn.innerHTML : "";
  const warehousesBtn = document.getElementById("tiktok-fetch-warehouses");
  const warehousesPre = document.getElementById("tiktok-warehouses");
  const warehouseSelect = document.getElementById("tiktok-warehouse-select");
  const createBtn = document.getElementById("tiktok-create");
  const createPre = document.getElementById("tiktok-create-result");
  const selfCheckMsg = document.getElementById("tiktok-selfcheck-msg");
  const stepBtn1 = document.getElementById("tiktok-step-1-btn");
  const stepBtn2 = document.getElementById("tiktok-step-2-btn");
  const stepBtn3 = document.getElementById("tiktok-step-3-btn");
  const stepBtn4 = document.getElementById("tiktok-step-4-btn");
  const stepBtn5 = document.getElementById("tiktok-step-5-btn");
  const stepDot1 = document.getElementById("tiktok-step-1-dot");
  const stepDot2 = document.getElementById("tiktok-step-2-dot");
  const stepDot3 = document.getElementById("tiktok-step-3-dot");
  const stepDot4 = document.getElementById("tiktok-step-4-dot");
  const stepDot5 = document.getElementById("tiktok-step-5-dot");
  const stepCheck1 = document.getElementById("tiktok-step-1-check");
  const stepCheck2 = document.getElementById("tiktok-step-2-check");
  const stepCheck3 = document.getElementById("tiktok-step-3-check");
  const stepCheck4 = document.getElementById("tiktok-step-4-check");
  const stepCheck5 = document.getElementById("tiktok-step-5-check");
  const stepHint1 = document.getElementById("tiktok-step-1-hint");
  const stepHint2 = document.getElementById("tiktok-step-2-hint");
  const stepHint3 = document.getElementById("tiktok-step-3-hint");
  const stepHint4 = document.getElementById("tiktok-step-4-hint");
  const stepHint5 = document.getElementById("tiktok-step-5-hint");
  let stepPanels = [];
  let stepNext1 = null;
  let stepNext2 = null;
  let stepNext3 = null;
  let stepNext4 = null;
  let stepBack2 = null;
  let stepBack3 = null;
  let stepBack4 = null;
  let stepBack5 = null;

  let activeUploadStep = 1;
  let unlockedUploadStep = 1;
  let salesModeEnabled = true;
  let editingTikTokGoodsId = "";
  let loadingTikTokEditId = "";
  let skuModalMode = "full";
  const SIMPLE_SKU_KEY = "__single_sku__";
  const skuDraft = new Map();

  const applySalesMode = (enabled) => {
    const on = Boolean(enabled);
    salesModeEnabled = on;
    const toggle = (el, show) => {
      if (!el) return;
      el.hidden = !show;
      el.classList.toggle("hidden", !show);
    };
    toggle(salesAttrNameBlock, on);
    toggle(salesAttrValuesEl, on);
    toggle(skuGridBlock, on);
    toggle(priceStockCard, !on);
    if (salesModeLabel) salesModeLabel.textContent = on ? "已开启" : "已关闭";
    if (!on && !skuDraft.has(SIMPLE_SKU_KEY)) {
      skuDraft.set(SIMPLE_SKU_KEY, {
        sku_identifier_type: "GTIN",
        sku_identifier_code: "",
        product_sn: "",
        product_number: "",
        product_price: "",
        attr_img_list: [],
      });
    }
    renderPriceStockCardStatus();
  };

  // Build step panels dynamically to mimic TEMU layout without touching HTML markup.
  (() => {
    if (!uploadWrap) return;
    const catBlock =
      document.getElementById("tiktok-cat-block") ||
      document.getElementById("tiktok-cat-select")?.closest(".space-y-2");
    const tplBlock =
      document.getElementById("tiktok-template-block") ||
      document.getElementById("tiktok-template-form")?.closest(".space-y-3") ||
      document.getElementById("tiktok-template-form")?.closest(".space-y-2");
    const attrBlock = document.getElementById("tiktok-attr-result")?.closest(".bg-slate-50\\/60") ||
      document.getElementById("tiktok-attr-result")?.closest(".bg-slate-50\\/60") ||
      document.getElementById("tiktok-attr-result")?.closest("div");
    const uploadBlock = document.getElementById("tiktok-upload-goods")?.closest(".space-y-2");
    const descBlock =
      document.getElementById("tiktok-desc-block") ||
      document.getElementById("tiktok-goods-name")?.closest(".space-y-2");
    const submitBlock =
      document.getElementById("tiktok-submit-block") ||
      document.getElementById("tiktok-create")?.closest(".space-y-2");

    const oldGrid1 = catBlock?.parentElement;
    const oldGrid2 = uploadBlock?.parentElement;
    const oldDescWrap = descBlock?.parentElement;
    const oldSubmitWrap = submitBlock?.parentElement;

    const mkStep = (id) => {
      const div = document.createElement("div");
      div.id = id;
      div.className = "space-y-3";
      return div;
    };
    const step1 = mkStep("tiktok-panel-cat");
    const step2 = mkStep("tiktok-panel-template");
    const step3 = mkStep("tiktok-panel-upload");
    const step4 = mkStep("tiktok-panel-desc");
    const step5 = mkStep("tiktok-panel-submit");

    if (catBlock) {
      catBlock.classList.add("rounded-2xl", "border", "border-slate-100", "bg-white", "p-4");
      step1.appendChild(catBlock);
      const actions = document.createElement("div");
      actions.className = "flex justify-end";
      actions.innerHTML = `<button id="tiktok-step-next-1" type="button" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">下一步 <i class="fas fa-arrow-right ml-1"></i></button>`;
      step1.appendChild(actions);
    }

    if (tplBlock) {
      tplBlock.classList.add("rounded-2xl", "border", "border-slate-100", "bg-white", "p-4");
      step2.appendChild(tplBlock);
    }
    if (attrBlock) {
      attrBlock.classList.remove("hidden");
      step2.appendChild(attrBlock);
    }
    const actions2 = document.createElement("div");
    actions2.className = "flex items-center justify-between";
    actions2.innerHTML = `
      <button id="tiktok-step-back-2" type="button" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"><i class="fas fa-arrow-left mr-1"></i> 上一步</button>
      <button id="tiktok-step-next-2" type="button" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">下一步 <i class="fas fa-arrow-right ml-1"></i></button>`;
    step2.appendChild(actions2);

    if (uploadBlock) {
      uploadBlock.classList.add("rounded-2xl", "border", "border-slate-100", "bg-white", "p-4");
      step3.appendChild(uploadBlock);
    }
    const actions3 = document.createElement("div");
    actions3.className = "flex items-center justify-between";
    actions3.innerHTML = `
      <button id="tiktok-step-back-3" type="button" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"><i class="fas fa-arrow-left mr-1"></i> 上一步</button>
      <button id="tiktok-step-next-3" type="button" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">下一步 <i class="fas fa-arrow-right ml-1"></i></button>`;
    step3.appendChild(actions3);

    if (descBlock) {
      descBlock.classList.add("rounded-2xl", "border", "border-slate-100", "bg-white", "p-4");
      step4.appendChild(descBlock);
      const actions4 = document.createElement("div");
      actions4.className = "flex items-center justify-between";
      actions4.innerHTML = `
        <button id="tiktok-step-back-4" type="button" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"><i class="fas fa-arrow-left mr-1"></i> 上一步</button>
        <button id="tiktok-step-next-4" type="button" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">下一步 <i class="fas fa-arrow-right ml-1"></i></button>`;
      step4.appendChild(actions4);
    }

    if (submitBlock) {
      submitBlock.classList.add("rounded-2xl", "border", "border-slate-100", "bg-white", "p-4");
      step5.appendChild(submitBlock);
    }

    // Remove empty grids
    if (oldGrid1 && oldGrid1.children.length === 0) oldGrid1.remove();
    if (oldGrid2 && oldGrid2.children.length === 0) oldGrid2.remove();
    if (oldDescWrap && oldDescWrap.children.length === 0) oldDescWrap.remove();
    if (oldSubmitWrap && oldSubmitWrap.children.length === 0) oldSubmitWrap.remove();

    // Append steps
    uploadWrap.appendChild(step1);
    uploadWrap.appendChild(step2);
    uploadWrap.appendChild(step3);
    uploadWrap.appendChild(step4);
    uploadWrap.appendChild(step5);

    // Hide panels 2-4 initially
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    step4.classList.add("hidden");
    step5.classList.add("hidden");
  })();

  if (salesModeToggle) {
    applySalesMode(salesModeToggle.checked);
    salesModeToggle.addEventListener("change", () => {
      applySalesMode(salesModeToggle.checked);
    });
  } else {
    applySalesMode(true);
  }
  if (priceStockCard) {
    priceStockCard.addEventListener("click", () => {
      openPriceStockModal();
    });
  }

  const syncStepNodes = () => {
    stepPanels = [
      document.getElementById("tiktok-panel-cat"),
      document.getElementById("tiktok-panel-template"),
      document.getElementById("tiktok-panel-upload"),
      document.getElementById("tiktok-panel-desc"),
      document.getElementById("tiktok-panel-submit"),
    ];
    stepNext1 = document.getElementById("tiktok-step-next-1");
    stepNext2 = document.getElementById("tiktok-step-next-2");
    stepNext3 = document.getElementById("tiktok-step-next-3");
    stepNext4 = document.getElementById("tiktok-step-next-4");
    stepBack2 = document.getElementById("tiktok-step-back-2");
    stepBack3 = document.getElementById("tiktok-step-back-3");
    stepBack4 = document.getElementById("tiktok-step-back-4");
    stepBack5 = document.getElementById("tiktok-step-back-5");
  };
  syncStepNodes();

  const attrAttrId = document.getElementById("tiktok-attr-attrid");
  const attrTypeId = document.getElementById("tiktok-attr-type-id");
  const attrTypeName = document.getElementById("tiktok-attr-type-name");
  const attrValue = document.getElementById("tiktok-attr-value");
  const attrGoodsId = document.getElementById("tiktok-attr-goods-id");
  const attrSubmit = document.getElementById("tiktok-attr-submit");
  const attrPre = document.getElementById("tiktok-attr-result");
  const tplAttrSel = document.getElementById("tiktok-attr-template-attr");
  const tplValueSel = document.getElementById("tiktok-attr-template-value");
  const attrEntryToggle = document.getElementById("tiktok-attr-entry-toggle");
  const attrEntryBlock = document.getElementById("tiktok-attr-entry-block");

  const catOut = document.getElementById("tiktok-cat-id");
  if (!catOut) return;
  const catRoot = document.getElementById("tiktok-cat-select");

  let draftState = null;
  let draftApplied = false;
  let pendingDraft = null;

  const parseSubViewFromHash = () => {
    const raw = (window.location.hash || "").replace("#", "");
    if (!raw.startsWith("upload-tiktok")) return "";
    const q = raw.split("?")[1] || "";
    const params = new URLSearchParams(q);
    return params.get("mode") === "upload" ? "upload" : "list";
  };

  const setSubView = (mode, opts) => {
    const m = mode === "upload" ? "upload" : "list";
    const updateHash = opts?.updateHash !== false;
    try {
      window.sessionStorage.setItem("topm:tiktok-subview", m);
    } catch {
      // ignore
    }

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

    if (updateHash && routeFromHash() === "upload-tiktok") {
      const next = m === "upload" ? "#upload-tiktok?mode=upload" : "#upload-tiktok";
      if (window.location.hash !== next) window.location.hash = next;
    }
  };

  const getSubView = () => {
    try {
      const v = window.sessionStorage.getItem("topm:tiktok-subview");
      return v === "upload" ? "upload" : "list";
    } catch {
      return "list";
    }
  };

  if (goUploadBtn) {
    goUploadBtn.addEventListener("click", () => {
      clearAll();
      setSubView("upload", { updateHash: true });
    });
  }
  if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
      setSubView("list", { updateHash: true });
      loadTikTokGoodsList();
    });
  }
  setSubView(parseSubViewFromHash() || getSubView(), { updateHash: false });
  window.addEventListener("hashchange", () => {
    if (routeFromHash() !== "upload-tiktok") return;
    const mode = parseSubViewFromHash() || getSubView();
    setSubView(mode, { updateHash: false });
  });

  const updateAttrEntryVisibility = (enabled) => {
    const on = Boolean(enabled);
    if (attrEntryBlock) {
      attrEntryBlock.hidden = !on;
      attrEntryBlock.classList.toggle("hidden", !on);
    }
    if (attrEntryToggle) attrEntryToggle.checked = on;
  };
  updateAttrEntryVisibility(false);
  if (attrEntryToggle) {
    attrEntryToggle.addEventListener("change", () => {
      updateAttrEntryVisibility(attrEntryToggle.checked);
    });
  }

  let lastAttrIndex = new Map();
  let lastTemplateRes = null;
  const selectedAttrs = new Map(); // attrId -> { values: [{ value, goods_attr_id }] }
  let lastTemplateCatId = "";
  let lastBrandList = [];
  let brandDefaultList = [];
  const MAX_CERT_IMAGES = 10;
  const MAX_TIKTOK_IMAGES = 9;
  const MAX_SALES_ATTR_NAMES = 3;
  const NOM_CERT_ID = "nom_mark_images";
  const NOM_CERT_ENTRY = {
    id: NOM_CERT_ID,
    name: "NOM mark images",
    required: false,
    details: "",
    sample: "",
    raw: {},
  };
  const salesAttrSelections = new Map();
  let salesItemsOverride = null;
  let activeSkuKey = "";
  let lastCertifications = [];
  const certificationUploads = new Map(); // certId -> [uploadData]
  let certUploadInFlight = false;
  let templateFetchInFlight = false;
  const uploadQueue = [];
  let uploadPendingCount = 0;
  let uploadInFlight = false;
  const uploadGoodsBtnDefaultHtml = uploadGoodsBtn ? uploadGoodsBtn.innerHTML : "";
  const uploadAttrsBtnDefaultHtml = uploadAttrsBtn ? uploadAttrsBtn.innerHTML : "";
  const createBtnDefaultText = createBtn ? createBtn.textContent : "";
  const uploadModeHintDefaultText = uploadModeHint ? uploadModeHint.textContent : "";
  const step5TitleDefaultText = step5Title ? step5Title.textContent : "";
  const normalizeAttrId = (attrId) => String(attrId ?? "").trim();
  const getSelectedBucket = (attrId) => {
    const id = normalizeAttrId(attrId);
    if (!id) return null;
    let bucket = selectedAttrs.get(id);
    if (!bucket) {
      bucket = { values: [] };
      selectedAttrs.set(id, bucket);
    }
    if (!Array.isArray(bucket.values)) bucket.values = [];
    return bucket;
  };
  const getSelectedValues = (attrId) => {
    const id = normalizeAttrId(attrId);
    if (!id) return [];
    const bucket = selectedAttrs.get(id);
    return Array.isArray(bucket?.values) ? bucket.values : [];
  };
  const isAttrValueSelected = (attrId, value) => {
    const v = String(value ?? "").trim();
    if (!v) return false;
    return getSelectedValues(attrId).some((item) => String(item?.value ?? "").trim() === v);
  };
  const getSelectedAttrCount = () => selectedAttrs.size;
  const getSelectedValueCount = () => {
    let count = 0;
    for (const bucket of selectedAttrs.values()) {
      if (Array.isArray(bucket?.values)) count += bucket.values.length;
    }
    return count;
  };

  const DRAFT_KEY = "topm:tiktok-upload-draft";
  const DRAFT_FIELD_IDS = [
    "tiktok-goods-name",
    "tiktok-goods-sn",
    "tiktok-ali-seller-sn",
    "tiktok-goods-brief",
    "tiktok-goods-desc",
    "tiktok-attrs-json",
    "tiktok-img-json",
    "tiktok-extra-json",
    "tiktok-brand-id",
    "tiktok-sku-stock",
    "tiktok-sku-price",
    "tiktok-sku-identifier-type",
    "tiktok-sku-identifier-code",
    "tiktok-sku-sn",
  ];

  let draftSaveTimer = 0;

  const loadDraft = () => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const clearDraft = () => {
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const readFieldValue = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    if ("value" in el) return el.value;
    return null;
  };

  const writeFieldValue = (id, value) => {
    const el = document.getElementById(id);
    if (!el || !("value" in el)) return;
    el.value = value == null ? "" : String(value);
  };

  const sanitizeGoodsDesc = (html) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = String(html ?? "");
    wrap.querySelectorAll("img, video, iframe, object, embed, svg").forEach((node) => node.remove());
    return wrap.innerHTML.trim();
  };

  const syncGoodsDescField = () => {
    if (!goodsDescEditor || !goodsDescField) return;
    goodsDescField.value = sanitizeGoodsDesc(goodsDescEditor.innerHTML);
    queueDraftSave();
  };

  const syncGoodsDescEditor = () => {
    if (!goodsDescEditor || !goodsDescField) return;
    goodsDescEditor.innerHTML = sanitizeGoodsDesc(goodsDescField.value);
  };

  const getGoodsDescText = () => {
    if (!goodsDescField) return "";
    const wrap = document.createElement("div");
    wrap.innerHTML = goodsDescField.value || "";
    return String(wrap.textContent ?? "").trim();
  };

  const getCatDraft = () => {
    const leafId = String(catOut?.textContent ?? "").trim();
    const pathText = String(document.getElementById("tiktok-cat-id-text")?.textContent ?? "").trim();
    const pathParts = pathText ? pathText.split(" > ").map((x) => String(x).trim()).filter(Boolean) : [];
    let ids = [];
    try {
      const rawIds = catOut?.dataset?.catIds;
      if (rawIds) {
        const parsed = JSON.parse(rawIds);
        if (Array.isArray(parsed)) ids = parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      // ignore
    }
    if (!leafId && !pathText && !pathParts.length && !ids.length) return null;
    return { leafId, pathText, pathParts, ids };
  };

  const buildDraftSnapshot = () => {
    const values = {};
    DRAFT_FIELD_IDS.forEach((id) => {
      const v = readFieldValue(id);
      if (v != null) values[id] = v;
    });
    return {
      v: 1,
      updatedAt: Date.now(),
      values,
      cat: getCatDraft(),
    };
  };

  const hasMeaningfulDraft = (draft) => {
    if (!draft) return false;
    const values = draft.values || {};
    const hasValue = Object.values(values).some((v) => String(v ?? "").trim());
    if (hasValue) return true;
    const cat = draft.cat || {};
    return Boolean(String(cat.leafId ?? "").trim() || String(cat.pathText ?? "").trim());
  };

  const saveDraft = () => {
    const snapshot = buildDraftSnapshot();
    if (!hasMeaningfulDraft(snapshot)) {
      clearDraft();
      return;
    }
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
  };

  const queueDraftSave = () => {
    if (draftSaveTimer) return;
    draftSaveTimer = window.setTimeout(() => {
      draftSaveTimer = 0;
      saveDraft();
    }, 250);
  };

  const applyDraftToForm = (draft) => {
    if (!draft || !draft.values) return;
    const values = draft.values || {};
    DRAFT_FIELD_IDS.forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(values, id)) {
        writeFieldValue(id, values[id]);
      }
    });
    syncGoodsDescEditor();
  };

  if (goodsDescToolbar && goodsDescEditor) {
    goodsDescToolbar.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-rt-cmd]");
      if (!btn) return;
      const cmd = String(btn.dataset.rtCmd ?? "").trim();
      if (!cmd) return;
      goodsDescEditor.focus();
      if (cmd === "createLink") {
        const url = window.prompt("请输入链接地址");
        if (url) document.execCommand("createLink", false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
      window.setTimeout(() => {
        syncGoodsDescField();
        renderTikTokStepper();
      }, 0);
    });
  }

  if (goodsDescEditor) {
    goodsDescEditor.addEventListener("input", () => {
      syncGoodsDescField();
      renderTikTokStepper();
    });
    goodsDescEditor.addEventListener("blur", syncGoodsDescField);
    goodsDescEditor.addEventListener("paste", (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      if (items.some((item) => String(item.type || "").startsWith("image/"))) {
        e.preventDefault();
        return;
      }
      window.setTimeout(() => {
        syncGoodsDescField();
        renderTikTokStepper();
      }, 0);
    });
    goodsDescEditor.addEventListener("drop", (e) => {
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.some((file) => String(file.type || "").startsWith("image/"))) {
        e.preventDefault();
      }
    });
  }

  const restoreAttrSelectionsFromDraft = (draft) => {
    if (!draft || !draft.values) return;
    selectedAttrs.clear();
    const raw = String(draft.values["tiktok-attrs-json"] ?? "").trim();
    if (!raw) return;
    let arr = [];
    try {
      arr = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      const id = String(item?.attrId ?? item?.attr_id ?? "").trim();
      const name = String(item?.attr_value_name ?? item?.value ?? "").trim();
      const goodsAttrId = String(item?.attr_value_id ?? item?.goods_attr_id ?? "").trim();
      if (!id || !name || !goodsAttrId) continue;
      const bucket = getSelectedBucket(id);
      if (!bucket) continue;
      const exists = bucket.values.some(
        (entry) =>
          String(entry?.value ?? "").trim() === name &&
          String(entry?.goods_attr_id ?? "").trim() === goodsAttrId,
      );
      if (!exists) bucket.values.push({ value: name, goods_attr_id: goodsAttrId });
    }
  };

  const canRestoreDraftAttrs = (catId) => {
    if (!draftState || draftApplied) return false;
    const draftCatId = String(draftState?.cat?.leafId ?? "").trim();
    const cid = String(catId ?? "").trim();
    if (!draftCatId || !cid) return false;
    return draftCatId === cid;
  };

  draftState = loadDraft();
  pendingDraft = draftState;
  if (draftState && parseSubViewFromHash() === "upload") {
    setSubView("upload", { updateHash: false });
  }
  const draftCatState = draftState?.cat ? draftState.cat : null;

  buildCategorySelector("tiktok-cat-select", "tiktok", "tiktok-cat-id", {
    restore: Boolean(draftCatState),
    persist: false,
    initialState: draftCatState,
  });

  const getCatId = () => String(catOut?.textContent ?? "").trim();
  const isCatSelected = () => {
    const v = getCatId();
    return Boolean(v) && v !== "-";
  };

  const refreshTemplateEnabled = () => {
    if (!templateBtn) return;
    const leafId = getCatId();
    templateBtn.disabled = !leafId || leafId === "-";
    templateBtn.classList.toggle("opacity-50", templateBtn.disabled);
    templateBtn.classList.toggle("cursor-not-allowed", templateBtn.disabled);
  };

  refreshTemplateEnabled();

  const showTemplateMsg = (message) => {
    if (!templateFormMsg) return;
    if (!message) {
      templateFormMsg.classList.add("hidden");
      templateFormMsg.textContent = "";
      return;
    }
    templateFormMsg.classList.remove("hidden");
    templateFormMsg.textContent = String(message);
  };

  const showUploadMsg = (message) => {
    if (!uploadPre) return;
    if (!message) {
      uploadPre.classList.add("hidden");
      uploadPre.textContent = "";
      return;
    }
    uploadPre.classList.remove("hidden");
    uploadPre.textContent = String(message);
  };

  const showBrandSummary = (message, tone = "") => {
    if (!brandSummary) return;
    const text = String(message || "").trim();
    brandSummary.textContent = text;
    brandSummary.classList.toggle("text-rose-500", tone === "error");
    brandSummary.classList.toggle("text-emerald-600", tone === "success");
    brandSummary.classList.toggle("text-slate-400", !tone || tone === "info");
  };

  const hashCode = (str) => {
    let hash = 0;
    const s = String(str ?? "");
    for (let i = 0; i < s.length; i += 1) {
      hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    return hash;
  };

  const getCurrentBrandId = () => String(document.getElementById("tiktok-brand-id")?.value ?? "").trim();

  const findBrandNameById = (id) => {
    const target = String(id || "").trim();
    if (!target) return "";
    const fromList = lastBrandList.find((b) => String(b?.id ?? b?.brand_id ?? "") === target);
    if (fromList) return String(fromList?.name ?? fromList?.brand_name ?? fromList?.brandName ?? "");
    if (brandResults) {
      const opt = Array.from(brandResults.options).find((o) => String(o.value) === target);
      if (opt) return opt.textContent?.trim() || "";
    }
    return "";
  };

  const updateBrandSelectedHint = () => {
    const id = getCurrentBrandId();
    const name = findBrandNameById(id);
    if (brandTriggerLabel) {
      brandTriggerLabel.textContent = id ? `${name || "未命名品牌"}` : "未选择，点击卡片";
    }
    if (brandSelectedChip) {
      brandSelectedChip.classList.toggle("hidden", !id);
    }
    if (brandSelectedHint) {
      brandSelectedHint.classList.toggle("hidden", !id);
      brandSelectedHint.textContent = id ? "已选 1" : "已选 0";
    }
    if (brandStatus) {
      const base = "text-[11px] px-3 py-1 rounded-full border font-black";
      if (id) {
        brandStatus.className = `${base} attr-status-done`;
        brandStatus.textContent = "已完成";
      } else {
        brandStatus.className = `${base} text-slate-700 bg-white border-slate-200`;
        brandStatus.textContent = "未填写";
      }
    }
    if (brandCard) {
      brandCard.classList.toggle("attr-card-done", Boolean(id));
    }
  };

  const renderBrandList = (list, selectedId = "") => {
    if (!brandList) return;
    let items = Array.isArray(list) ? list : [];
    if (!items.length && brandResults) {
      items = Array.from(brandResults.options)
        .filter((opt) => opt.value)
        .map((opt) => ({ id: opt.value, name: opt.textContent || opt.value }));
    }
    if (!items.length) {
      brandList.innerHTML = '<div class="text-xs text-slate-400 px-3 py-2">暂无品牌</div>';
      return;
    }
    const normalizedSelected = String(selectedId || "").trim();
    const cards = items.map((b) => {
      const id = String(b?.id ?? b?.brand_id ?? "");
      const name = String(b?.name ?? b?.brand_name ?? b?.brandName ?? "");
      const isActive = normalizedSelected && normalizedSelected === id;
      const base =
        "rounded-xl border px-3 py-2 bg-white flex items-center justify-between gap-3 transition cursor-pointer";
      const cls = isActive
        ? `${base} border-accent/40 bg-accent/5 ring-2 ring-accent/20`
        : `${base} border-slate-100 hover:border-accent/40 hover:shadow-sm`;
      return `
        <button type="button" class="${cls}" data-brand-id="${escapeHtml(id)}" title="${escapeHtml(name || "未命名品牌")}">
          <div class="flex-1 min-w-0 text-left">
            <div class="text-sm font-semibold text-slate-800 truncate">${escapeHtml(name || "未命名品牌")}</div>
          </div>
          <span class="text-[10px] font-bold ${isActive ? "text-accent" : "text-slate-300"}">${isActive ? "已选" : ""}</span>
        </button>
      `;
    });
    brandList.innerHTML = cards.join("");
  };

  const normalizeBrandList = (res) => {
    const data = res?.data;
    const brands = data?.brands ?? data?.brand_list ?? data?.brandList ?? data?.list ?? data;
    const list = Array.isArray(brands)
      ? brands
      : Array.isArray(brands?.list)
        ? brands.list
        : brands && typeof brands === "object"
          ? Object.values(brands)
          : [];
    return list
      .map((item) => {
        if (!item) return null;
        const id = String(item.id ?? item.brand_id ?? item.brandId ?? "");
        const name = String(item.name ?? item.brand_name ?? item.brandName ?? id);
        return {
          ...item,
          id,
          name,
          authorized_status: item.authorized_status ?? item.auth_status ?? "",
        };
      })
      .filter((item) => item && (item.id || item.name));
  };

  const setDefaultBrandListIfEmpty = (list) => {
    if (brandDefaultList.length) return;
    brandDefaultList = Array.isArray(list) ? list.slice() : [];
  };

  const filterBrandList = (list, keyword) => {
    const q = String(keyword || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const id = String(b?.id ?? b?.brand_id ?? "").toLowerCase();
      const name = String(b?.name ?? b?.brand_name ?? b?.brandName ?? "").toLowerCase();
      return id.includes(q) || name.includes(q);
    });
  };

  const updateBrandListView = (keyword = "") => {
    const selectedId = getCurrentBrandId();
    renderBrandList(filterBrandList(lastBrandList, keyword), selectedId);
    updateBrandSelectedHint();
  };

  let brandDropdownOpen = false;
  const setBrandDropdown = (open) => {
    if (!brandDropdown) return;
    brandDropdownOpen = Boolean(open);
    brandDropdown.classList.toggle("hidden", !brandDropdownOpen);
    brandDropdown.classList.toggle("flex", brandDropdownOpen);
    if (brandDropdownOpen) {
      updateBrandListView(brandSearchName?.value || "");
      showBrandSummary("");
    } else {
      if (brandCreatePanel) brandCreatePanel.classList.add("hidden");
      if (brandCreateName) brandCreateName.value = "";
    }
  };

  const applyBrandSelection = (brandId, opts = {}) => {
    const id = String(brandId || "").trim();
    if (!id) return;
    const brandInput = document.getElementById("tiktok-brand-id");
    if (brandInput) brandInput.value = id;
    if (brandResults) brandResults.value = id;
    updateBrandListView(brandSearchName?.value || "");
    if (opts.close !== false) setBrandDropdown(false);
    queueDraftSave();
    renderTikTokStepper();
  };

  const renderAttrSummary = () => {
    if (!attrSummary) return;
    const attrCount = getSelectedAttrCount();
    const valueCount = getSelectedValueCount();
    attrSummary.innerHTML =
      attrCount > 0
        ? `<i class="fas fa-circle-check text-emerald-600 mr-1"></i>已选择并记录 ${attrCount} 项属性 / ${valueCount} 个值（已自动写入提交数据）`
        : `<i class="fas fa-circle text-slate-300 mr-1"></i>尚未选择属性`;
  };

  const parseTikTokAttrsJson = () => {
    const textarea = document.getElementById("tiktok-attrs-json");
    const raw = String(textarea?.value ?? "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeTikTokAttrsJson = (arr) => {
    const textarea = document.getElementById("tiktok-attrs-json");
    if (!textarea) return;
    textarea.value = JSON.stringify(Array.isArray(arr) ? arr : []);
    queueDraftSave();
  };

  const resolveTikTokUploadUrl = (data) => {
    const u = safeExternalUrl(
      data?.url ?? data?.uri ?? data?.file_path ?? data?.filePath ?? data?.imgUrl ?? data?.img_url ?? ""
    );
    return u || "";
  };

  const parseTikTokImgJson = () => {
    const textarea = document.getElementById("tiktok-img-json");
    const raw = String(textarea?.value ?? "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
      return [];
    } catch {
      return [];
    }
  };

  const writeTikTokImgJson = (arr) => {
    const textarea = document.getElementById("tiktok-img-json");
    if (!textarea) return;
    textarea.value = JSON.stringify(Array.isArray(arr) ? arr : []);
    queueDraftSave();
  };

  const normalizeArrayLike = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      const text = raw.trim();
      if (!text) return [];
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
      } catch {
        return [];
      }
    }
    if (raw && typeof raw === "object") {
      if (Array.isArray(raw.list)) return raw.list;
      if (Array.isArray(raw.data)) return raw.data;
      return [raw];
    }
    return [];
  };

  const parseGoodsAttrList = (raw) =>
    String(raw ?? "")
      .split(/[|,]/)
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);

  const normalizeTikTokUnit = (raw) => {
    const v = String(raw ?? "").trim().toUpperCase();
    if (!v) return "";
    if (v === "G" || v === "GRAM") return "GRAM";
    if (v === "KG" || v === "KILOGRAM") return "KILOGRAM";
    return v;
  };

  const normalizeTikTokAttrEntries = (raw) =>
    normalizeArrayLike(raw)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const attrId = item?.attrId ?? item?.attr_id ?? item?.attribute_id ?? item?.id;
        const valueId =
          item?.attr_value_id ??
          item?.attrValueId ??
          item?.attr_value_ids ??
          item?.value_id ??
          item?.valueId ??
          item?.goods_attr_id ??
          item?.goodsAttrId;
        const valueName =
          item?.attr_value_name ??
          item?.attrValueName ??
          item?.value_name ??
          item?.valueName ??
          item?.value ??
          item?.name;
        if (attrId == null || valueId == null) return null;
        const normalizedName = String(valueName ?? "").trim() || String(valueId ?? "").trim();
        return {
          attrId: Number.isFinite(Number(attrId)) ? Number(attrId) : String(attrId),
          attr_value_id: String(valueId),
          attr_value_name: normalizedName,
        };
      })
      .filter(Boolean);

  const pickTikTokInfoAttrs = (info) => {
    const candidates = [
      info?.tiktok_product_attributes,
      info?.product_attributes,
      info?.product_attrs,
      info?.product_attr,
      info?.attrs,
      info?.attr_list,
      info?.attribute_list,
      info?.goods_attrs,
      info?.goods_attr_list,
    ];
    for (const raw of candidates) {
      const normalized = normalizeTikTokAttrEntries(raw);
      if (normalized.length) return normalized;
    }
    return [];
  };

  const parseTikTokProducts = (info) => {
    const candidates = [
      info?.products,
      info?.product_list,
      info?.productList,
      info?.sku_list,
      info?.skuList,
      info?.product,
      info?.product_data,
    ];
    for (const raw of candidates) {
      const list = normalizeArrayLike(raw);
      if (list.length) return list;
    }
    return [];
  };

  const parseTikTokSpecDefines = (raw) => {
    const list = normalizeArrayLike(raw);
    return Array.isArray(list) ? list.filter(Boolean) : [];
  };

  const getSpecDefineName = (spec, idx) => {
    const name =
      spec?.spec_name ??
      spec?.specName ??
      spec?.type_name ??
      spec?.typeName ??
      spec?.name ??
      spec?.attr_name ??
      spec?.attrName ??
      spec?.attribute_name ??
      spec?.attributeName;
    const normalized = String(name ?? "").trim();
    return normalized || `规格${idx + 1}`;
  };

  const buildSpecDefineValueMap = (spec) => {
    const map = new Map();
    const ids = normalizeArrayLike(spec?.spec_value_ids ?? spec?.specValueIds ?? spec?.value_ids ?? spec?.valueIds ?? spec?.ids);
    const vals = normalizeArrayLike(spec?.spec_value_vals ?? spec?.specValueVals ?? spec?.value_vals ?? spec?.valueVals ?? spec?.values);
    const len = Math.max(ids.length, vals.length);
    if (len) {
      for (let i = 0; i < len; i += 1) {
        const id = String(ids[i] ?? "").trim();
        if (!id) continue;
        const label = String(vals[i] ?? "").trim() || id;
        map.set(id, label);
      }
      return map;
    }
    const list = normalizeArrayLike(spec?.spec_values ?? spec?.specValues ?? spec?.values);
    list.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id =
        item?.spec_value_id ??
        item?.specValueId ??
        item?.value_id ??
        item?.valueId ??
        item?.id;
      if (id == null) return;
      const label =
        item?.spec_value_val ??
        item?.specValueVal ??
        item?.value_val ??
        item?.valueVal ??
        item?.name ??
        item?.label ??
        item?.text;
      const key = String(id).trim();
      if (!key) return;
      map.set(key, String(label ?? "").trim() || key);
    });
    return map;
  };

  const findAttrValueNameById = (item, valueId) => {
    const target = String(valueId ?? "").trim();
    if (!target) return "";
    const values = normalizeTikTokValues(item);
    const hit = values.find((v) => {
      const id = String(v?.value_id ?? v?.valueId ?? v?.valueID ?? v?.vid ?? v?.id ?? "").trim();
      return id === target;
    });
    return String(hit?.name ?? hit?.value ?? hit?.label ?? hit?.title ?? hit?.text ?? "").trim();
  };

  const readExtraJson = () => {
    const textarea = document.getElementById("tiktok-extra-json");
    if (!textarea) return {};
    const raw = String(textarea.value ?? "").trim();
    if (!raw) return {};
    try {
      return parseJsonObject(raw);
    } catch {
      return null;
    }
  };

  const writeExtraJson = (obj) => {
    const textarea = document.getElementById("tiktok-extra-json");
    if (!textarea) return;
    const payload = obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
    textarea.value = JSON.stringify(payload);
    queueDraftSave();
  };

  const normalizeCertifications = (raw) => {
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (Array.isArray(raw?.list)) list = raw.list;
    else if (raw && typeof raw === "object") list = Object.values(raw);
    return list
      .map((c) => {
        const id = c?.id ?? c?.certification_id ?? c?.certificationId ?? c?.cert_id ?? c?.certId;
        if (id == null) return null;
        const name = c?.name ?? c?.certification_name ?? c?.certName ?? c?.title ?? id;
        const requiredFlag = c?.is_required ?? c?.required;
        const required = requiredFlag === true || requiredFlag === 1 || requiredFlag === "1";
        return {
          id: String(id),
          name: String(name ?? id),
          required,
          details: String(c?.document_details ?? c?.documentDetails ?? c?.detail ?? ""),
          sample: String(c?.sample_image_url ?? c?.sampleImageUrl ?? ""),
          raw: c,
        };
      })
      .filter((c) => c && c.id);
  };

  const ensureNomCert = (list) => {
    const next = Array.isArray(list) ? list.slice() : [];
    if (!next.some((c) => String(c?.id ?? "") === NOM_CERT_ID)) {
      next.push({ ...NOM_CERT_ENTRY });
    }
    return next;
  };

  const getCertUploads = (certId) => {
    const id = String(certId ?? "").trim();
    if (!id) return [];
    const list = certificationUploads.get(id);
    return Array.isArray(list) ? list : [];
  };

  const setCertUploads = (certId, list) => {
    const id = String(certId ?? "").trim();
    if (!id) return;
    const next = Array.isArray(list) ? list : [];
    certificationUploads.set(id, next);
    syncExtraWithCerts();
  };

  const syncExtraWithCerts = () => {
    const extra = readExtraJson();
    if (extra == null) return;
    const types = {};
    const data = {};
    for (const [id, list] of certificationUploads.entries()) {
      if (!Array.isArray(list) || list.length === 0) continue;
      types[id] = ["img"];
      data[id] = list;
    }
    if (Object.keys(types).length) {
      extra.certifications_type = types;
      extra.certifications_data = data;
    } else {
      delete extra.certifications_type;
      delete extra.certifications_data;
    }
    writeExtraJson(extra);
  };

  const restoreCertUploadsFromExtra = () => {
    const extra = readExtraJson();
    if (extra == null) return;
    const data = extra?.certifications_data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    const allowed = new Set(lastCertifications.map((c) => String(c.id)));
    certificationUploads.clear();
    for (const [id, items] of Object.entries(data)) {
      if (allowed.size && !allowed.has(String(id))) continue;
      if (Array.isArray(items)) certificationUploads.set(String(id), items.slice(0, MAX_CERT_IMAGES));
    }
  };

  const setCertMsg = (certId, message, tone = "") => {
    if (!certificationsBlock) return;
    const id = String(certId ?? "").trim();
    if (!id) return;
    const el = certificationsBlock.querySelector(`[data-cert-msg][data-cert-id="${id}"]`);
    if (!el) return;
    const text = String(message || "").trim();
    el.textContent = text;
    el.classList.toggle("hidden", !text);
    el.classList.toggle("text-rose-600", tone === "error");
    el.classList.toggle("text-emerald-600", tone === "success");
    el.classList.toggle("text-slate-400", !tone || tone === "info");
  };

  const renderCertifications = () => {
    if (!certificationsBlock) return;
    if (!lastCertifications.length) {
      certificationsBlock.innerHTML = "";
      return;
    }
    const header = `
      <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
        <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">证</span>
        <span>证书资料上传（每项最多 ${MAX_CERT_IMAGES} 张）</span>
      </div>
    `;
    const cards = lastCertifications
      .map((cert) => {
        const list = getCertUploads(cert.id);
        const count = list.length;
        const sampleBtn = cert.sample
          ? `<button type="button" class="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap" data-cert-sample="${escapeHtml(
              cert.sample
            )}"><i class="fas fa-image mr-1"></i>样例</button>`
          : "";
        const items = list
          .map((it, idx) => {
            const url = resolveTikTokUploadUrl(it);
            const label = `#${idx + 1}`;
            return `
              <div class="group relative rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div class="aspect-square bg-slate-50 flex items-center justify-center">
                  ${
                    url
                      ? `<img src="${escapeHtml(url)}" class="w-full h-full object-contain p-2" alt="${escapeHtml(
                          label
                        )}" onerror="this.style.display='none';" />`
                      : `<div class="text-[11px] text-slate-400">无url</div>`
                  }
                </div>
                <div class="px-2 py-1 text-[11px] text-slate-500 flex items-center justify-between">
                  <span class="font-mono">${escapeHtml(label)}</span>
                  <button type="button" class="text-rose-600 hover:text-rose-700" data-cert-remove="${escapeHtml(
                    cert.id
                  )}" data-cert-idx="${idx}" title="移除">
                    <i class="fas fa-xmark"></i>
                  </button>
                </div>
              </div>
            `;
          })
          .join("");
        return `
          <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span class="break-words">${escapeHtml(cert.name || cert.id)}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full border ${
                    cert.required ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-slate-50 text-slate-500"
                  }">${cert.required ? "必填" : "选填"}</span>
                </div>
                ${
                  cert.details
                    ? `<div class="text-[11px] text-slate-400 mt-1">${escapeHtml(cert.details)}</div>`
                    : ""
                }
              </div>
              <div class="flex items-center gap-2">
                ${sampleBtn}
                <button type="button" class="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 whitespace-nowrap" data-cert-upload="${escapeHtml(
                  cert.id
                )}">
                  <i class="fas fa-upload mr-1"></i>上传
                </button>
              </div>
            </div>
            <div class="text-[11px] text-slate-400 hidden" data-cert-msg data-cert-id="${escapeHtml(cert.id)}"></div>
            ${
              items
                ? `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">${items}</div>`
                : '<div class="text-[11px] text-slate-400">暂无证书图片</div>'
            }
            <div class="text-[11px] text-slate-400">已上传 ${count} / ${MAX_CERT_IMAGES}</div>
          </div>
        `;
      })
      .join("");
    certificationsBlock.innerHTML = `${header}${cards}`;
  };

  const renderTikTokImagePreview = () => {
    if (!imagePreview) return;
    const list = parseTikTokImgJson();
    const pendingHint =
      uploadPendingCount > 0
        ? `<div class="text-[11px] text-amber-600 mb-2"><i class="fas fa-cloud-arrow-up mr-1"></i>等待上传 ${uploadPendingCount} 张</div>`
        : "";
    if (!list.length) {
      imagePreview.innerHTML =
        pendingHint ||
        '<div class="text-[11px] text-slate-400">暂无图片（上传后会自动出现预览）</div>';
      renderTikTokStepper();
      return;
    }
    const items = list.slice(0, 24).map((it, idx) => {
      const url = resolveTikTokUploadUrl(it);
      const label = `#${idx + 1}`;
      return `
        <div class="group relative rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div class="aspect-square bg-slate-50 flex items-center justify-center">
            ${
              url
                ? `<img src="${escapeHtml(url)}" class="w-full h-full object-contain p-2" alt="${escapeHtml(
                    label
                  )}" onerror="this.style.display='none';" />`
                : `<div class="text-[11px] text-slate-400">无 url</div>`
            }
          </div>
          <div class="px-2 py-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span class="font-mono">${escapeHtml(label)}</span>
            <button type="button" class="tiktok-img-remove text-rose-600 hover:text-rose-700" data-idx="${idx}" title="移除">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
      `;
    });
    imagePreview.innerHTML = `
      ${pendingHint}
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        ${items.join("")}
      </div>
      ${list.length > 24 ? `<div class="text-[11px] text-slate-400 mt-2">仅预览前 24 个（当前 ${list.length} 个）</div>` : ""}
    `;
    renderTikTokStepper({ autoAdvance: true });
  };

  const getRequiredCertMissing = () => {
    if (!lastCertifications.length) return [];
    return lastCertifications.filter((c) => c.required && getCertUploads(c.id).length === 0);
  };

  const syncCertificationsFromTemplate = (res) => {
    lastCertifications = ensureNomCert(normalizeCertifications(res?.data?.certifications));
    restoreCertUploadsFromExtra();
    renderCertifications();
  };

  const clearCertificationsState = () => {
    lastCertifications = [];
    certificationUploads.clear();
    renderCertifications();
    syncExtraWithCerts();
  };

  const uploadCertFiles = async (certId, files) => {
    const id = String(certId ?? "").trim();
    if (!id) return;
    if (certUploadInFlight) {
      setCertMsg(id, "正在上传，请稍后...", "info");
      return;
    }
    const current = getCertUploads(id);
    const remaining = Math.max(0, MAX_CERT_IMAGES - current.length);
    if (remaining <= 0) {
      setCertMsg(id, `最多 ${MAX_CERT_IMAGES} 张图片`, "error");
      return;
    }
    const list = Array.from(files || []).filter(Boolean);
    const imageFiles = list.filter((file) => isImageFile(file));
    if (!imageFiles.length) {
      setCertMsg(id, "请上传图片文件", "error");
      return;
    }
    const slice = imageFiles.slice(0, remaining);
    if (slice.length < imageFiles.length) {
      setCertMsg(id, `最多 ${MAX_CERT_IMAGES} 张图片，已自动截取`, "info");
    } else {
      setCertMsg(id, "");
    }
    certUploadInFlight = true;
    try {
      for (const file of slice) {
        const form = new FormData();
        form.append("file", file);
        form.append("use_case", "CERTIFICATION_IMAGE");
        const res = await postAuthedFormData("/api/tiktok/upload_tiktok_img", form);
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0" || !res?.data) {
          setCertMsg(id, res?.msg || "证书上传失败", "error");
          continue;
        }
        const data = { ...res.data };
        if (!data.use_case) data.use_case = "CERTIFICATION_IMAGE";
        const next = getCertUploads(id);
        next.push(data);
        certificationUploads.set(id, next.slice(0, MAX_CERT_IMAGES));
        syncExtraWithCerts();
        renderCertifications();
      }
      setCertMsg(id, "上传完成", "success");
    } catch {
      setCertMsg(id, "网络异常，请稍后重试。", "error");
    } finally {
      certUploadInFlight = false;
    }
  };


  const runTikTokSelfCheck = () => {
    if (!selfCheckMsg) return;
    const required = [
      ["tiktok-cat-id", "cat_id"],
      ["tiktok-brand-id", "\u54c1\u724c"],
      ["tiktok-goods-name", "goods_name"],
      ["tiktok-goods-sn", "goods_sn"],
      ["tiktok-goods-brief", "goods_brief"],
      ["tiktok-goods-desc", "goods_desc"],
      ["tiktok-package-weight", "weight"],
      ["tiktok-package-weight-unit", "unit"],
      ["tiktok-package-width", "wide"],
      ["tiktok-package-height", "high"],
      ["tiktok-package-length", "length"],
    ];
    const missing = required
      .map(([id, label]) => {
        if (id === "tiktok-goods-desc") return [label, getGoodsDescText()];
        return [label, document.getElementById(id)?.value?.trim() || ""];
      })
      .filter(([, v]) => !v)
      .map(([label]) => label);

    const issues = [];
    if (missing.length) issues.push(`缺少必填：${missing.join("，")}`);

    if (salesModeEnabled) {
      if (!salesAttrSelections.size) {
        issues.push("未选择销售属性");
      } else {
        const combos = getTikTokSalesCombos();
        if (!combos.length) {
          issues.push("销售属性值未补全");
        } else {
          const skuRows = combos.map((combo) => {
            const goods_attrs = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
            const label = combo.map((x) => `${x.specName}: ${x.value}`).join(" / ");
            const row = skuDraft.get(goods_attrs) || {};
            return { goods_attrs, label, ...row };
          });
          const requiredFields = [
            "product_sn",
            "product_number",
            "product_price",
            "sku_identifier_type",
            "sku_identifier_code",
          ];
          const missingSku = skuRows.find((row) => requiredFields.some((k) => !String(row?.[k] ?? "").trim()));
          if (missingSku) issues.push(`SKU 组合未补全：${missingSku.label}`);
          const invalidSku = skuRows.find(
            (row) => !validateIdentifierCode(row?.sku_identifier_type, row?.sku_identifier_code)
          );
          if (invalidSku) issues.push(`tiktok_identifier_code 格式不正确：${invalidSku.label}`);
        }
      }
    } else {
      const simpleRow = skuDraft.get(SIMPLE_SKU_KEY) || {};
      const requiredFields = [
        "product_sn",
        "product_number",
        "product_price",
        "sku_identifier_type",
        "sku_identifier_code",
      ];
      const missingSimple = requiredFields.filter((k) => !String(simpleRow?.[k] ?? "").trim());
      if (missingSimple.length) {
        issues.push("单规格 SKU 未填写完整，请补充价格/库存/识别码/卖家SKU");
      } else if (!validateIdentifierCode(simpleRow.sku_identifier_type, simpleRow.sku_identifier_code)) {
        issues.push("sku_identifier_code 格式不正确，请检查类型与长度规则");
      }
    }

    try {
      const attrs = document.getElementById("tiktok-attrs-json")?.value?.trim();
      const arr = attrs ? JSON.parse(attrs) : [];
      if (!Array.isArray(arr) || !arr.length) issues.push("属性模板为空，请先获取并选择属性");
    } catch {
      issues.push("属性 JSON 解析失败");
    }

    try {
      const imgsRaw = document.getElementById("tiktok-img-json")?.value?.trim();
      if (!imgsRaw) issues.push("缺少商品图片（goods_img_json）");
      else {
        const parsed = JSON.parse(imgsRaw);
        const count = Array.isArray(parsed) ? parsed.length : parsed && typeof parsed === "object" ? 1 : 0;
        if (!count) issues.push("商品图片格式不正确或为空");
      }
    } catch {
      issues.push("图片 JSON 解析失败");
    }

    const missingCerts = getRequiredCertMissing();
    if (missingCerts.length) {
      const names = missingCerts.map((c) => c.name || c.id).filter(Boolean);
        const label = names.length ? names.slice(0, 6).join("\\u3001") : "\\u8bc1\\u4e66";
        showUploadMsg(`\\u8bf7\\u5148\\u4e0a\\u4f20\\u8bc1\\u4e66\\uff1a${label}`);
    }
    renderTikTokStepper();

    selfCheckMsg.classList.remove("hidden");
    if (!issues.length) {
      selfCheckMsg.className =
        "mt-2 text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700";
      selfCheckMsg.textContent = "自检通过：属性、图片已就绪，可提交。";
    } else {
      selfCheckMsg.className =
        "mt-2 text-xs px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700";
      selfCheckMsg.textContent = `自检未通过：${issues.join("；")}`;
    }
  };

  if (imagePreview) {
    imagePreview.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".tiktok-img-remove");
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      if (!Number.isFinite(idx) || idx < 0) return;
      const list = parseTikTokImgJson();
      list.splice(idx, 1);
      writeTikTokImgJson(list);
      renderTikTokImagePreview();
    });
  }

  const clearAll = () => {
    setPre(templatePre, "");
    setPre(uploadPre, "");
    showBrandSummary("");
    if (brandList) brandList.innerHTML = "";
    setPre(warehousesPre, "");
    setPre(createPre, "");
    showTemplateMsg("");
    showUploadMsg("");
    if (selfCheckMsg) selfCheckMsg.classList.add("hidden");
    [
      "tiktok-goods-name",
      "tiktok-goods-sn",
      "tiktok-goods-brief",
      "tiktok-goods-desc",
      "tiktok-attrs-json",
      "tiktok-img-json",
      "tiktok-extra-json",
      "tiktok-brand-id",
      "tiktok-sku-stock",
      "tiktok-sku-price",
      "tiktok-sku-identifier-type",
      "tiktok-sku-identifier-code",
      "tiktok-sku-sn",
      "tiktok-ali-seller-sn",
      "tiktok-attr-attrid",
      "tiktok-attr-type-id",
      "tiktok-attr-type-name",
      "tiktok-attr-value",
      "tiktok-attr-goods-id",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (attrGoodsId) attrGoodsId.value = "0";
    if (goodsDescEditor) goodsDescEditor.innerHTML = "";
    const unit = document.getElementById("tiktok-unit");
    if (unit) unit.value = "KILOGRAM";
    if (fileInput) fileInput.value = "";
    updateAttrEntryVisibility(false);
    selectedAttrs.clear();
    resetTemplateState({ keepAttrs: false });
    salesItemsOverride = null;
    renderAttrSummary();
    writeTikTokImgJson([]);
    uploadQueue.length = 0;
    uploadPendingCount = 0;
    uploadInFlight = false;
    updateUploadButtonState();
    renderTikTokImagePreview();
    clearDraft();
    draftState = null;
    draftApplied = false;
    setTikTokEditMode("");
    unlockedUploadStep = 1;
    setUploadStep(1);
    buildCategorySelector("tiktok-cat-select", "tiktok", "tiktok-cat-id", {
      restore: false,
      persist: false,
      initialState: null,
    });
    refreshTemplateEnabled();
    if (typeof setBrandDropdown === "function") setBrandDropdown(false);
  };

  if (reset) reset.addEventListener("click", clearAll);

  const bindDraftInputs = () => {
    DRAFT_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", queueDraftSave);
      el.addEventListener("change", queueDraftSave);
    });
  };
  bindDraftInputs();

  const updateCreateButtonLabel = () => {
    if (!createBtn) return;
    if (editingTikTokGoodsId) {
      createBtn.textContent = "更新并上传";
      return;
    }
    createBtn.textContent = createBtnDefaultText || "提交新增";
  };

  const updateTikTokEditTexts = () => {
    if (editingTikTokGoodsId) {
      if (uploadModeHint) {
        const next =
          uploadModeHintDefaultText && uploadModeHintDefaultText.includes("新增商品")
            ? uploadModeHintDefaultText.replace("新增商品", "编辑商品")
            : "按步骤填写：类目 → 模板属性 → 上传图片 → 商品描述 → 编辑商品";
        uploadModeHint.textContent = next;
      }
      if (step5Title) step5Title.textContent = "编辑商品";
      return;
    }
    if (uploadModeHint) uploadModeHint.textContent = uploadModeHintDefaultText;
    if (step5Title) step5Title.textContent = step5TitleDefaultText || "新增商品";
  };

  const setTikTokEditMode = (id) => {
    editingTikTokGoodsId = String(id ?? "").trim();
    if (!editingTikTokGoodsId) salesItemsOverride = null;
    if (attrGoodsId) attrGoodsId.value = editingTikTokGoodsId || "0";
    updateCreateButtonLabel();
    updateTikTokEditTexts();
    try {
      if (editingTikTokGoodsId) window.sessionStorage.setItem("topm:tiktok-edit-id", editingTikTokGoodsId);
      else window.sessionStorage.removeItem("topm:tiktok-edit-id");
    } catch {
      // ignore
    }
  };

  const normalizeTikTokInfoImages = (raw) =>
    normalizeArrayLike(raw)
      .map((item) => {
        if (!item) return null;
        const url = resolveTikTokUploadUrl(item);
        if (!url) return null;
        return {
          img_url: url,
          img_id: String(item?.img_id ?? item?.id ?? ""),
          uri: item?.uri,
          url: item?.url ?? url,
          width: item?.width,
          height: item?.height,
          use_case: item?.use_case,
        };
      })
      .filter(Boolean);

  const pickAttrImagesForValue = (valueId, raw) => {
    const target = String(valueId ?? "").trim();
    if (!target || !raw) return [];
    if (Array.isArray(raw)) {
      const idx = Number(target);
      if (Number.isFinite(idx) && raw[idx]) {
        const list = normalizeTikTokInfoImages(raw[idx]);
        if (list.length) return list;
      }
      const hit = raw.find((entry) => {
        const id = String(
          entry?.attr_value_id ?? entry?.attrValueId ?? entry?.value_id ?? entry?.id ?? ""
        ).trim();
        return id === target;
      });
      if (hit?.images) return normalizeTikTokInfoImages(hit.images);
      return [];
    }
    if (raw && typeof raw === "object") {
      return normalizeTikTokInfoImages(raw[target]);
    }
    return [];
  };

  const parseEasySwitch = (raw) => {
    if (raw === 0 || raw === "0") return false;
    if (raw === 1 || raw === "1") return true;
    if (raw === true || raw === false) return raw;
    return null;
  };

  const applyTikTokSalesAndSku = (info, opts = {}) => {
    const products = parseTikTokProducts(info);
    const attrImages = info?.attr_images ?? info?.attrImages ?? null;
    const specDefines = parseTikTokSpecDefines(
      info?.spec_defines ?? info?.specDefines ?? info?.spec_define ?? info?.specs
    );
    const goodsAttrLists = products.map((p) =>
      parseGoodsAttrList(p?.goods_attr ?? p?.goods_attrs ?? p?.goodsAttr ?? p?.goodsAttrId ?? "")
    );
    const hasAttr = goodsAttrLists.some((list) => list.length > 0);
    const hasVariants = hasAttr && (products.length > 1 || goodsAttrLists.some((list) => list.length > 1));
    const forceMode =
      Object.prototype.hasOwnProperty.call(opts, "forceSalesMode") && typeof opts.forceSalesMode === "boolean"
        ? opts.forceSalesMode
        : null;
    const salesMode = forceMode === null ? hasVariants : forceMode;

    const templateMainIds = new Set(getTikTokMainSalesItemsRaw().map((item) => String(item.id ?? "").trim()));
    const specItems = specDefines.map((spec, idx) => {
      const tiktokId = spec?.tiktok_id ?? spec?.tiktokId ?? spec?.attribute_id ?? spec?.attr_id ?? "";
      const idRaw =
        tiktokId ??
        spec?.spec_id ??
        spec?.specId ??
        spec?.id ??
        spec?.attribute_id ??
        spec?.attr_id ??
        `spec:${idx + 1}`;
      const id = String(idRaw ?? "").trim() || `spec:${idx + 1}`;
      const tiktokKey = String(tiktokId ?? "").trim();
      const isMain = tiktokKey ? templateMainIds.has(tiktokKey) : false;
      const baseName = getSpecDefineName(spec, idx);
      return {
        id,
        name: baseName,
        baseName,
        raw: spec,
        valueMap: buildSpecDefineValueMap(spec),
        tiktokId: tiktokKey,
        custom: !isMain,
      };
    });
    if (salesMode && specItems.length) {
      salesItemsOverride = specItems;
    } else {
      salesItemsOverride = null;
    }

    if (!salesMode) {
      if (salesModeToggle) salesModeToggle.checked = false;
      applySalesMode(false);
      const row = products[0] || {};
      const stock = row?.product_number ?? row?.sku_stock ?? row?.skuStock ?? "";
      const price = row?.product_price ?? row?.sku_price ?? row?.skuPrice ?? "";
      const sn = row?.product_sn ?? row?.sku_sn ?? row?.skuSn ?? "";
      const idType = row?.tiktok_identifier_type ?? row?.sku_identifier_type ?? row?.skuIdentifierType ?? "";
      const idCode = row?.tiktok_identifier_code ?? row?.sku_identifier_code ?? row?.skuIdentifierCode ?? "";

      if (!skuDraft.has(SIMPLE_SKU_KEY)) {
        skuDraft.set(SIMPLE_SKU_KEY, {
          sku_identifier_type: "GTIN",
          sku_identifier_code: "",
          product_sn: "",
          product_number: "",
          product_price: "",
          attr_img_list: [],
        });
      }
      const simpleRow = skuDraft.get(SIMPLE_SKU_KEY);
      simpleRow.sku_identifier_type = String(idType || "GTIN").trim() || "GTIN";
      simpleRow.sku_identifier_code = String(idCode ?? "").trim();
      simpleRow.product_sn = String(sn ?? "").trim();
      simpleRow.product_number = String(stock ?? "").trim();
      simpleRow.product_price = String(price ?? "").trim();

      writeFieldValue("tiktok-sku-stock", simpleRow.product_number);
      writeFieldValue("tiktok-sku-price", simpleRow.product_price);
      writeFieldValue("tiktok-sku-identifier-type", simpleRow.sku_identifier_type);
      writeFieldValue("tiktok-sku-identifier-code", simpleRow.sku_identifier_code);
      writeFieldValue("tiktok-sku-sn", simpleRow.product_sn);
      renderPriceStockCardStatus();
      return;
    }

    if (salesModeToggle) salesModeToggle.checked = true;
    applySalesMode(true);
    salesAttrSelections.clear();

    const salesItems = getTikTokSalesItemsRaw();
    const usedNames = new Set(salesItems.map((item) => String(item?.name ?? "").trim()).filter(Boolean));
    const getFallbackItem = (idx) => {
      const baseName = `规格${idx + 1}`;
      let name = baseName;
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${baseName}(${suffix})`;
        suffix += 1;
      }
      usedNames.add(name);
      return {
        id: `custom:${idx + 1}`,
        name,
        baseName,
        raw: null,
        valueMap: null,
        custom: true,
      };
    };
    const findItemByValue = (valueId, idx) => {
      const key = String(valueId ?? "").trim();
      if (key) {
        const hit = salesItems.find((it) => it?.valueMap && it.valueMap.has(key));
        if (hit) return hit;
      }
      return salesItems[idx] || getFallbackItem(idx);
    };
    const collected = new Map();
    goodsAttrLists.forEach((list) => {
      list.forEach((valueId, idx) => {
        if (!valueId) return;
        const item = findItemByValue(valueId, idx);
        const bucket = collected.get(item.id) || { item, valuesMap: new Map() };
        const idKey = String(valueId);
        const name =
          item.valueMap?.get(idKey) ||
          (item.raw ? findAttrValueNameById(item.raw, valueId) : "");
        bucket.valuesMap.set(idKey, name || idKey);
        collected.set(item.id, bucket);
      });
    });
    collected.forEach((bucket) => {
      const values = Array.from(bucket.valuesMap.entries()).map(([id, name]) => ({
        value: name,
        goods_attr_id: id,
      }));
      const item = bucket.item;
      const custom = Boolean(item.custom) || String(item.id).startsWith("custom:");
      salesAttrSelections.set(item.id, {
        id: item.id,
        name: item.name,
        baseName: item.baseName ?? item.name,
        custom,
        values,
      });
    });

    skuDraft.clear();
    products.forEach((p, i) => {
      const goodsAttrs = goodsAttrLists[i] || [];
      const key = normalizeGoodsAttrKey(goodsAttrs.join(","));
      if (!key) return;
      const row = {
        sku_identifier_type: String(p?.tiktok_identifier_type ?? p?.sku_identifier_type ?? "GTIN").trim() || "GTIN",
        sku_identifier_code: String(p?.tiktok_identifier_code ?? p?.sku_identifier_code ?? "").trim(),
        product_sn: String(p?.product_sn ?? p?.sku_sn ?? "").trim(),
        product_number: String(p?.product_number ?? p?.sku_stock ?? "").trim(),
        product_price: String(p?.product_price ?? p?.sku_price ?? "").trim(),
        attr_img_list: [],
      };
      const firstAttrId = goodsAttrs[0];
      if (firstAttrId) {
        const images = pickAttrImagesForValue(firstAttrId, attrImages);
        if (images.length) row.attr_img_list = images;
      }
      skuDraft.set(key, row);
    });

    renderTikTokSalesAttrs();
    renderTikTokSalesAttrValues();
    renderTikTokSkuGrid();
  };

  const applyTikTokEditData = async (info, goodsId) => {
    if (!info || typeof info !== "object") return;
    clearAll();
    setTikTokEditMode(goodsId);

    const catId = String(info?.cat_id ?? info?.catId ?? info?.catID ?? "").trim();
    let cateLists = normalizeArrayLike(info?.cate_lists);
    if (!cateLists.length) cateLists = normalizeArrayLike(info?.cateLists);
    if (!cateLists.length) cateLists = normalizeArrayLike(info?.category_list);
    if (!cateLists.length) cateLists = normalizeArrayLike(info?.categoryList);
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
      const cateIds = Array.isArray(cateLists)
        ? cateLists.map((c) => String(c?.category_id ?? c?.cat_id ?? c?.id ?? "").trim()).filter(Boolean)
        : [];
      const cateNames = Array.isArray(cateLists)
        ? cateLists
            .map((c) => String(c?.category_name ?? c?.cat_name ?? c?.name ?? "").trim())
            .filter(Boolean)
        : [];
      const pathText = catName || (cateNames.length ? cateNames.join(" / ") : catId);

      catOut.textContent = catId;
      const catText = document.getElementById("tiktok-cat-id-text");
      if (catText) catText.textContent = pathText || catId;
      try {
        window.localStorage.setItem(
          "topm:cat-selection:tiktok",
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
      await buildCategorySelector("tiktok-cat-select", "tiktok", "tiktok-cat-id");
    }

    if (catId) {
      resetTemplateState({ keepAttrs: false });
      const res = await fetchTikTokTemplate(catId, { goodsId: editingTikTokGoodsId });
      syncTemplateDependencies(res);
      renderTikTokTemplateForm();
    }

    writeFieldValue("tiktok-goods-name", info?.goods_name ?? info?.goodsName ?? "");
    writeFieldValue("tiktok-goods-sn", info?.goods_sn ?? info?.goodsSn ?? "");
    writeFieldValue("tiktok-ali-seller-sn", info?.ali_seller_sn ?? info?.aliSellerSn ?? "");
    writeFieldValue("tiktok-goods-brief", info?.goods_brief ?? info?.goodsBrief ?? "");
    writeFieldValue(
      "tiktok-package-weight",
      info?.goods_weight ?? info?.goodsWeight ?? info?.weight ?? ""
    );
    writeFieldValue(
      "tiktok-package-width",
      info?.wide ?? info?.width ?? info?.package_width ?? info?.packageWidth ?? ""
    );
    writeFieldValue(
      "tiktok-package-height",
      info?.high ?? info?.height ?? info?.package_height ?? info?.packageHeight ?? ""
    );
    writeFieldValue(
      "tiktok-package-length",
      info?.length ?? info?.package_length ?? info?.packageLength ?? ""
    );

    const unit = normalizeTikTokUnit(info?.tiktok_unit ?? info?.unit ?? info?.weight_unit ?? info?.weightUnit ?? "");
    if (unit) writeFieldValue("tiktok-package-weight-unit", unit);

    const goodsDesc = info?.goods_desc ?? info?.goodsDesc ?? info?.goods_description ?? "";
    writeFieldValue("tiktok-goods-desc", goodsDesc);
    syncGoodsDescEditor();

    const brandId = info?.tiktok_brand_id ?? info?.brand_id ?? info?.brandId ?? "";
    if (brandId) applyBrandSelection(brandId);
    updateBrandSelectedHint();

    const attrs = pickTikTokInfoAttrs(info);
    if (attrs.length) {
      writeTikTokAttrsJson(attrs);
      restoreAttrSelectionsFromDraft({ values: { "tiktok-attrs-json": JSON.stringify(attrs) } });
      renderAttrSummary();
      renderTikTokTemplateForm();
    }

    const goodsImages = normalizeTikTokInfoImages(info?.goods_img_json ?? info?.goodsImgJson ?? info?.images ?? []);
    if (goodsImages.length) {
      writeTikTokImgJson(goodsImages);
      renderTikTokImagePreview();
    }

    const easySwitch =
      parseEasySwitch(info?.easyswitch ?? info?.easy_switch ?? info?.easySwitch ?? info?.sales_mode ?? info?.salesMode);
    applyTikTokSalesAndSku(info, { forceSalesMode: easySwitch === null ? undefined : easySwitch });

    if (catId) {
      unlockedUploadStep = 5;
      setUploadStep(5);
    }
  };

  const loadTikTokInfoForEdit = async (goodsId) => {
    const id = String(goodsId ?? "").trim();
    if (!id || loadingTikTokEditId === id) return;
    if (editingTikTokGoodsId && editingTikTokGoodsId === id) {
      setSubView("upload", { updateHash: true });
      return;
    }
    loadingTikTokEditId = id;
    if (listSummary) listSummary.textContent = "加载详情...";
    try {
      const res = await postAuthedJson("/api/tiktok/info", { goods_id: id, id });
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        if (listSummary) listSummary.textContent = res?.msg || "加载失败";
        return;
      }
      const info = res?.data?.data ?? res?.data ?? {};
      await applyTikTokEditData(info, id);
      setSubView("upload", { updateHash: true });
    } catch {
      if (listSummary) listSummary.textContent = "网络异常，请稍后重试。";
    } finally {
      loadingTikTokEditId = "";
    }
  };

  // TikTok goods list (goods.php?action=lists, is_tiktok=1)
  const listKeywords = document.getElementById("tiktok-goods-keywords");
  const listRefresh = document.getElementById("tiktok-goods-refresh");
  const listSummary = document.getElementById("tiktok-goods-summary");
  const listPrev = document.getElementById("tiktok-goods-prev");
  const listNext = document.getElementById("tiktok-goods-next");
  const listPageEl = document.getElementById("tiktok-goods-page");
  const listPageInput = document.getElementById("tiktok-goods-page-input");
  const listPageGo = document.getElementById("tiktok-goods-page-go");
  const listSize = document.getElementById("tiktok-goods-size");
  const listTbody = document.getElementById("tiktok-goods-tbody");

  let listPage = 1;
  let listTotal = 0;

  const readListSize = () => {
    let v = Number(listSize?.value || 15);
    if (!Number.isFinite(v) || v <= 0) v = 15;
    v = Math.floor(v);
    v = Math.max(1, Math.min(200, v));
    return v;
  };

  const setListPager = () => {
    const size = readListSize();
    const pages = size > 0 ? Math.max(1, Math.ceil(listTotal / size)) : 1;
    if (listPageEl) listPageEl.textContent = `第 ${listPage} / ${pages} 页`;
    if (listPrev) listPrev.disabled = listPage <= 1;
    if (listNext) listNext.disabled = listPage >= pages;
  };

  const renderTikTokGoodsRows = (list) => {
    if (!listTbody) return;
    if (!Array.isArray(list) || !list.length) {
      listTbody.innerHTML =
        '<tr class="table-row-hover transition"><td class="px-6 py-10 text-center text-xs text-slate-400" colspan="8">暂无数据</td></tr>';
      return;
    }
    listTbody.innerHTML = list
      .map((g, idx) => {
        const border = idx === list.length - 1 ? "" : "border-b border-slate-50";
        const goodsId = g?.goods_id ?? "-";
        const name = g?.goods_name ?? "-";
        const sn = g?.goods_sn ?? "-";
        const thumb = safeExternalUrl(
          resolveTopmAssetUrl(g?.goods_thumb ?? g?.goods_image ?? g?.goods_img ?? g?.img ?? "")
        );
        const url = safeExternalUrl(g?.url);
        const time = g?.formated_add_time ?? g?.add_time ?? "-";
        const onSale = String(g?.is_on_sale ?? "");
        const review = String(g?.review_status ?? "");
        const price = g?.formated_shop_price ?? g?.shop_price ?? "-";

        const saleBadge =
          onSale === "1"
            ? statusBadge("在售", "border-emerald-200 bg-emerald-50 text-emerald-700")
            : statusBadge("未上架", "border-rose-200 bg-rose-50 text-rose-700");
        const reviewMeta = mapReviewBadge(review);
        const reviewBadge = statusBadge(reviewMeta.name, reviewMeta.cls);

        const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";
        const nameHtml = url
          ? `<button type="button" ${openAttr} class="text-left text-xs font-black text-slate-900 hover:text-accent whitespace-normal break-words">${escapeHtml(
              name,
            )}</button>`
          : `<div class="text-xs font-black text-slate-900 whitespace-normal break-words">${escapeHtml(name || "未命名品牌")}</div>`;
        const thumbHtml = (() => {
          const wrap = (inner) =>
            url ? `<button type="button" ${openAttr} class="block">${inner}</button>` : inner;
          if (!thumb) {
            return wrap(
              '<div class="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400"><i class="fas fa-image"></i></div>',
            );
          }
          // Use <img> (not background-image) so we can set referrerpolicy to avoid hotlink blocks.
          const inner = `
            <div class="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0">
              <img src="${escapeHtml(thumb)}" alt="thumb" loading="lazy" referrerpolicy="no-referrer"
                   class="w-full h-full object-cover"
                   onerror="this.remove();" />
            </div>
          `;
          return wrap(inner);
        })();

        const editBtn = `
          <button type="button" class="tiktok-edit inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700" data-tiktok-edit-id="${escapeHtml(
            goodsId
          )}">
            <i class="fas fa-pen-to-square text-slate-500"></i>
            <span>编辑</span>
          </button>
        `;
        const toggleBtn = `
          <button type="button" class="tiktok-toggle-sale inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700" data-goods-id="${escapeHtml(
            goodsId
          )}" data-next-val="${onSale === "1" ? "0" : "1"}">
            <i class="fas ${onSale === "1" ? "fa-toggle-on text-emerald-600" : "fa-toggle-off text-slate-400"} text-lg"></i>
            <span>${onSale === "1" ? "下架" : "上架"}</span>
          </button>
        `;
        const actions = `<div class="flex items-center justify-end gap-2">${editBtn}${toggleBtn}</div>`;

        return `
          <tr class="table-row-hover ${border} transition">
            <td class="px-6 py-4 font-medium text-slate-900">${escapeHtml(goodsId)}</td>
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
            <td class="px-6 py-4 whitespace-nowrap">${reviewBadge}</td>
            <td class="px-6 py-4 text-right text-xs font-black text-slate-900">${escapeHtml(price)}</td>
            <td class="px-6 py-4 text-xs text-slate-500">${escapeHtml(time)}</td>
            <td class="px-6 py-4 text-right">${actions}</td>
          </tr>
        `;
      })
      .join("");
  };

  const loadTikTokGoodsList = async () => {
    if (listRefresh) {
      listRefresh.disabled = true;
      listRefresh.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    }
    setTableLoading("tiktok-goods-tbody", 8);
    if (listSummary) listSummary.textContent = "加载中...";
    try {
      const keywords = listKeywords?.value?.trim() || "";
      const size = readListSize();
      const res = await postAuthedJson("/api/goods/lists", {
        page: listPage,
        size,
        is_tiktok: 1,
        ...(keywords ? { keywords } : {}),
      });

      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        renderTikTokGoodsRows([]);
        if (listSummary) listSummary.textContent = res?.msg || "加载失败";
        listTotal = 0;
        setListPager();
        return;
      }

      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      listTotal = Number(res?.data?.num ?? list.length) || list.length;
      renderTikTokGoodsRows(list);
      if (listSummary) listSummary.textContent = `本页 ${list.length} 条 · 共 ${listTotal} 条`;
      setListPager();
    } catch {
      renderTikTokGoodsRows([]);
      if (listSummary) listSummary.textContent = "网络异常，请稍后重试。";
      listTotal = 0;
      setListPager();
    } finally {
      if (listRefresh) {
        listRefresh.disabled = false;
        listRefresh.innerHTML = '<i class="fas fa-magnifying-glass mr-1"></i>搜索';
      }
    }
  };

  if (listRefresh) {
    listRefresh.addEventListener("click", () => {
      listPage = 1;
      loadTikTokGoodsList();
    });
  }
  if (listKeywords) {
    listKeywords.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      listPage = 1;
      loadTikTokGoodsList();
    });
  }
  if (listSize) {
    listSize.addEventListener("blur", () => {
      const nextSize = readListSize();
      listSize.value = String(nextSize);
      listPage = 1;
      loadTikTokGoodsList();
    });
  }
  if (listPrev) {
    listPrev.addEventListener("click", () => {
      listPage = Math.max(1, listPage - 1);
      loadTikTokGoodsList();
    });
  }
  if (listNext) {
    listNext.addEventListener("click", () => {
      listPage += 1;
      loadTikTokGoodsList();
    });
  }
  if (listPageGo) {
    listPageGo.addEventListener("click", () => {
      const v = Number(listPageInput?.value || 1) || 1;
      listPage = Math.max(1, Math.floor(v));
      loadTikTokGoodsList();
    });
  }
  if (listPageInput) {
    listPageInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = Number(listPageInput.value || 1) || 1;
      listPage = Math.max(1, Math.floor(v));
      loadTikTokGoodsList();
    });
  }

  if (listTbody) {
    listTbody.addEventListener("click", async (e) => {
      const editBtn = e.target?.closest?.(".tiktok-edit");
      if (editBtn) {
        const pending = editBtn.dataset.pending === "1";
        if (pending) return;
        const goodsId = String(editBtn.dataset.tiktokEditId ?? "").trim();
        if (!goodsId) return;
        editBtn.dataset.pending = "1";
        const originalHtml = editBtn.innerHTML;
        editBtn.classList.add("opacity-70");
        editBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[11px]"></i>编辑中...';
        try {
          await loadTikTokInfoForEdit(goodsId);
        } finally {
          editBtn.dataset.pending = "0";
          editBtn.classList.remove("opacity-70");
          editBtn.innerHTML = originalHtml;
        }
        return;
      }

      const btn = e.target?.closest?.(".tiktok-toggle-sale");
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
          if (listSummary) listSummary.textContent = res?.msg || "操作失败";
          return;
        }
        if (listSummary) listSummary.textContent = res?.msg || "操作成功";
        await loadTikTokGoodsList();
      } catch {
        if (listSummary) listSummary.textContent = "网络异常，请稍后重试。";
      } finally {
        btn.dataset.pending = "0";
        btn.classList.remove("opacity-70");
        btn.innerHTML = originalHtml;
      }
    });
  }

  loadTikTokGoodsList();

  const setAttrSelection = (attrId, value, goodsAttrId, opts = {}) => {
    const id = normalizeAttrId(attrId);
    const v = String(value ?? "").trim();
    const multiple = Boolean(opts.multiple);
    if (!id || !v || !goodsAttrId) return;
    const bucket = getSelectedBucket(id);
    if (!bucket) return;
    if (!multiple) bucket.values = [];
    const exists = bucket.values.some((item) => String(item?.value ?? "").trim() === v);
    if (!exists) bucket.values.push({ value: v, goods_attr_id: String(goodsAttrId) });
    selectedAttrs.set(id, bucket);
    let current = parseTikTokAttrsJson();
    current = current.filter((x) => {
      const xId = String(x?.attrId ?? x?.attr_id ?? "").trim();
      if (xId !== id) return true;
      if (!multiple) return false;
      const xVal = String(x?.attr_value_name ?? x?.value ?? "").trim();
      return xVal !== v;
    });
    current.push({
      attrId: Number.isFinite(Number(id)) ? Number(id) : id,
      attr_value_id: String(goodsAttrId),
      attr_value_name: v,
    });
    writeTikTokAttrsJson(current);
    renderAttrSummary();
    renderTikTokStepper({ autoAdvance: true });
    queueDraftSave();
  };

  const removeAttrSelection = (attrId, value) => {
    const id = normalizeAttrId(attrId);
    const v = String(value ?? "").trim();
    if (!id || !v) return;
    const bucket = selectedAttrs.get(id);
    if (bucket?.values) {
      bucket.values = bucket.values.filter((item) => String(item?.value ?? "").trim() !== v);
    }
    if (!bucket?.values?.length) selectedAttrs.delete(id);
    const current = parseTikTokAttrsJson().filter((x) => {
      const xId = String(x?.attrId ?? x?.attr_id ?? "").trim();
      if (xId !== id) return true;
      const xVal = String(x?.attr_value_name ?? x?.value ?? "").trim();
      return xVal !== v;
    });
    writeTikTokAttrsJson(current);
    renderAttrSummary();
    renderTikTokStepper();
    queueDraftSave();
  };

  const clearAttrSelection = (attrId) => {
    const id = normalizeAttrId(attrId);
    if (!id) return;
    selectedAttrs.delete(id);
    const current = parseTikTokAttrsJson().filter((x) => String(x?.attrId ?? x?.attr_id ?? "").trim() !== id);
    writeTikTokAttrsJson(current);
    renderAttrSummary();
    renderTikTokStepper();
    queueDraftSave();
  };

  const normalizeTikTokValues = (raw) => {
    const pickList = (val) => {
      if (typeof val === "string") {
        const text = val.trim();
        if (!text) return null;
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === "object") return Object.values(parsed);
        } catch {
          return null;
        }
      }
      if (Array.isArray(val)) return val;
      if (val && typeof val === "object") {
        if (Array.isArray(val.list)) return val.list;
        if (Array.isArray(val.values)) return val.values;
        const entries = Object.values(val);
        return entries.length ? entries : null;
      }
      return null;
    };
    const direct = pickList(raw);
    if (direct) {
      const list = direct;
      return list
        .map((v) => {
          if (v == null) return null;
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            const label = String(v);
            return { name: label, value: label };
          }
          if (typeof v === "object") {
            const label =
              v.name ??
              v.value ??
              v.label ??
              v.title ??
              v.text ??
              v.id ??
              v.vid ??
              v.value_id ??
              v.valueId ??
              v.valueID;
            const valueId = v.value_id ?? v.valueId ?? v.valueID ?? v.vid ?? v.id ?? "";
            return { ...v, name: label != null ? String(label) : "", value_id: valueId != null ? String(valueId) : "" };
          }
          return null;
        })
        .filter((v) => v && String(v.name ?? "").trim());
    }
    const candidates = [
      raw?.values,
      raw?.value_list,
      raw?.valueList,
      raw?.value_info_list,
      raw?.valueInfoList,
      raw?.values_list,
      raw?.valuesList,
      raw?.value_arr,
      raw?.valueArr,
      raw?.attribute_value_info_list,
      raw?.attributeValueInfoList,
      raw?.attr_value_list,
      raw?.attrValueList,
      raw?.attr_values,
      raw?.attrValues,
      raw?.property_value_list,
      raw?.propertyValueList,
      raw?.options,
      raw?.option_list,
      raw?.optionList,
      raw?.items,
      raw?.list,
    ];
    let list = [];
    for (const c of candidates) {
      const found = pickList(c);
      if (found) {
        list = found;
        break;
      }
    }
    if (!Array.isArray(list) || !list.length) return [];
    return list
      .map((v) => {
        if (v == null) return null;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          const label = String(v);
          return { name: label, value: label };
        }
        if (typeof v === "object") {
          const label =
            v.name ??
            v.value ??
            v.label ??
            v.title ??
            v.text ??
            v.id ??
            v.vid ??
            v.value_id ??
            v.valueId ??
            v.valueID;
          const valueId = v.value_id ?? v.valueId ?? v.valueID ?? v.vid ?? v.id ?? "";
          return { ...v, name: label != null ? String(label) : "", value_id: valueId != null ? String(valueId) : "" };
        }
        return null;
      })
      .filter((v) => v && String(v.name ?? "").trim());
  };

  const getTikTokTemplateItems = () => {
    const res = lastTemplateRes;
    if (String(res?.code ?? "") !== "0") return [];
    const data = res?.data || {};
    const attrs = Array.isArray(data?.product_attr_arr) ? data.product_attr_arr : [];
    const items = [];
    for (const a of attrs) {
      const id = a?.id;
      const name = a?.name;
      if (id == null || name == null) continue;
      const hasValues = Object.prototype.hasOwnProperty.call(a || {}, "values");
      const multipleFlag = a?.is_multiple_selection;
      const multiple = hasValues && (multipleFlag === true || multipleFlag === 1 || multipleFlag === "1");
      const requiredFlag = a?.is_requried;
      const required = requiredFlag === true || requiredFlag === 1 || requiredFlag === "1";
      items.push({
        id: String(id),
        name: String(name),
        required,
        multiple,
        hasValues,
        type: String(a?.type ?? ""),
        values: hasValues ? normalizeTikTokValues(a?.values) : [],
      });
    }
    // required first
    items.sort((a, b) => (a.required === b.required ? a.name.localeCompare(b.name, "zh-CN") : a.required ? -1 : 1));
    return items;
  }
  const getTikTokMainSalesItemsRaw = () => {
    const res = lastTemplateRes;
    if (String(res?.code ?? "") !== "0") return [];
    const data = res?.data || {};
    const sales = Array.isArray(data?.pro_main_arr) ? data.pro_main_arr : [];
    return sales
      .map((s) => {
        const id = s?.attribute_id ?? s?.attr_id ?? s?.id;
        const name = s?.attribute_name ?? s?.attribute_name_en ?? s?.name ?? id;
        if (id == null || name == null) return null;
        return { id: String(id), name: String(name), raw: s };
      })
      .filter((s) => s && s.id);
  };

  const buildMergedSalesItems = () => {
    const mainItems = getTikTokMainSalesItemsRaw();
    const overrideItems = Array.isArray(salesItemsOverride) ? salesItemsOverride : [];
    if (!mainItems.length && !overrideItems.length) return [];
    const map = new Map();
    mainItems.forEach((item) => {
      map.set(String(item.id), {
        ...item,
        baseName: String(item?.baseName ?? item?.name ?? item?.id ?? "").trim() || String(item?.id ?? ""),
        custom: false,
      });
    });
    overrideItems.forEach((item) => {
      const key = String(item.id ?? "").trim();
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          name: String(item.name ?? existing.name ?? key),
          baseName: String(item.baseName ?? existing.baseName ?? existing.name ?? item.name ?? key),
          valueMap: item.valueMap,
          raw: existing.raw ?? item.raw,
          tiktokId: item.tiktokId ?? existing.tiktokId,
          custom: item.custom ?? existing.custom,
        });
      } else {
        map.set(key, {
          id: key,
          name: String(item.name ?? key),
          baseName: String(item.baseName ?? item.name ?? key),
          raw: item.raw,
          valueMap: item.valueMap,
          tiktokId: item.tiktokId,
          custom: item.custom,
        });
      }
    });
    const items = Array.from(map.values());
    const deduped = [];
    const indexMap = new Map();
    items.forEach((item) => {
      const baseName =
        String(item?.baseName ?? item?.name ?? item?.id ?? "").trim() || String(item?.id ?? "");
      const key = normalizeSalesAttrName(baseName).toLowerCase();
      if (!key) return;
      const existingIdx = indexMap.get(key);
      if (existingIdx == null) {
        indexMap.set(key, deduped.length);
        deduped.push({ ...item, name: baseName, baseName });
        return;
      }
      const existing = deduped[existingIdx];
      const existingCustom = Boolean(existing?.custom);
      const currentCustom = Boolean(item?.custom);
      if (!existingCustom && currentCustom) {
        deduped[existingIdx] = { ...item, name: baseName, baseName };
      }
    });
    return deduped;
  };

  const getTikTokMainSalesAttrIdSet = () => {
    const ids = getTikTokMainSalesItemsRaw().map((item) => String(item.id ?? "").trim()).filter(Boolean);
    const templateIds = new Set(ids);
    if (Array.isArray(salesItemsOverride) && salesItemsOverride.length) {
      const mainIds = new Set();
      salesItemsOverride.forEach((item) => {
        const tid = String(item?.tiktokId ?? item?.id ?? "").trim();
        if (!tid) return;
        if (templateIds.has(tid)) mainIds.add(String(item.id ?? tid).trim());
      });
      return mainIds;
    }
    return templateIds;
  };

  const getTikTokSalesItems = () =>
    buildMergedSalesItems().map((item) => ({
      id: String(item.id),
      name: String(item.name),
      baseName: String(item.baseName ?? item.name),
    }));

  const getTikTokSalesItemsRaw = () => buildMergedSalesItems();

  const applyTemplateSelectedValues = (res) => {
    if (!res || String(res?.code ?? "") !== "0") return;
    if (getSelectedValueCount() > 0) return;
    const existing = parseTikTokAttrsJson();
    if (existing.length) {
      restoreAttrSelectionsFromDraft({ values: { "tiktok-attrs-json": JSON.stringify(existing) } });
      renderAttrSummary();
      return;
    }
    const items = Array.isArray(res?.data?.product_attr_arr) ? res.data.product_attr_arr : [];
    if (!items.length) return;

    selectedAttrs.clear();
    const selected = [];
    const seen = new Set();
    for (const item of items) {
      const attrId = item?.id ?? item?.attr_id ?? item?.attribute_id ?? item?.attrId;
      if (attrId == null) continue;
      const hasValuesProp = Object.prototype.hasOwnProperty.call(item || {}, "values");
      let values = [];
      if (hasValuesProp) {
        values = normalizeTikTokValues(item?.values);
      }
      if (!hasValuesProp || values.length === 0) {
        const defaultValue = String(
          item?.default ??
            item?.default_value ??
            item?.defaultValue ??
            item?.value_default ??
            item?.valueDefault ??
            item?.value ??
            ""
        ).trim();
        if (!defaultValue) continue;
        const key = `${attrId}:${defaultValue}:${defaultValue}`;
        if (seen.has(key)) continue;
        seen.add(key);
        selected.push({
          attrId: Number.isFinite(Number(attrId)) ? Number(attrId) : String(attrId),
          attr_value_id: defaultValue,
          attr_value_name: defaultValue,
        });
        const bucket = getSelectedBucket(attrId);
        if (bucket) bucket.values.push({ value: defaultValue, goods_attr_id: defaultValue });
        continue;
      }
      for (const v of values) {
        const rawSelected = v?.is_selected ?? v?.isSelected ?? v?.selected;
        const isSelected =
          rawSelected === true ||
          rawSelected === 1 ||
          rawSelected === "1" ||
          String(rawSelected ?? "").toLowerCase() === "true";
        if (!isSelected) continue;
        const valueId = String(
          v?.attr_value_id ??
            v?.attrValueId ??
            v?.value_id ??
            v?.valueId ??
            v?.valueID ??
            v?.vid ??
            v?.id ??
            v?.value ??
            ""
        ).trim();
        let valueName = String(
          v?.attr_value_name ??
            v?.attrValueName ??
            v?.value_name ??
            v?.valueName ??
            v?.name ??
            v?.value ??
            v?.label ??
            v?.title ??
            v?.text ??
            ""
        ).trim();
        if (!valueName) valueName = valueId;
        if (!valueId && !valueName) continue;
        const resolvedId = valueId || valueName;
        const key = `${attrId}:${resolvedId}:${valueName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        selected.push({
          attrId: Number.isFinite(Number(attrId)) ? Number(attrId) : String(attrId),
          attr_value_id: resolvedId,
          attr_value_name: valueName || resolvedId,
        });
        const bucket = getSelectedBucket(attrId);
        if (bucket) bucket.values.push({ value: valueName || resolvedId, goods_attr_id: resolvedId });
      }
    }
    if (selected.length) {
      writeTikTokAttrsJson(selected);
      renderAttrSummary();
    }
  };

  const findAttrValueId = (item, val) => {
    const list = Array.isArray(item?.values) ? item.values : [];
    const target = String(val ?? "").trim();
    if (!target) return "";
    const hit = list.find((v) => {
      const name = String(v?.name ?? v?.value ?? v?.label ?? v?.title ?? v?.text ?? v?.id ?? "").trim();
      return name === target;
    });
    return String(hit?.value_id ?? hit?.valueId ?? hit?.valueID ?? hit?.vid ?? hit?.id ?? "").trim();
  };

  const normalizeSalesAttrName = (val) => String(val ?? "").trim();

  const setSalesAttrNameMsg = (text, tone = "info") => {
    if (!salesAttrMsg) return;
    salesAttrMsg.textContent = text || "";
    const base = "text-[11px]";
    if (tone === "error") {
      salesAttrMsg.className = `${base} text-rose-600`;
    } else if (tone === "ok") {
      salesAttrMsg.className = `${base} text-emerald-600`;
    } else {
      salesAttrMsg.className = `${base} text-slate-400`;
    }
  };

  const clearSalesAttrSelections = () => {
    salesAttrSelections.clear();
    skuDraft.clear();
    activeSkuKey = "";
    renderTikTokSalesAttrs();
    renderTikTokSalesAttrValues();
    renderTikTokSkuGrid();
  };

  const dedupeSalesAttrSelections = () => {
    if (!salesAttrSelections.size) return;
    const indexMap = new Map();
    const toDelete = new Set();
    salesAttrSelections.forEach((sel, id) => {
      const baseName = String(sel?.baseName ?? sel?.name ?? sel?.id ?? "").trim() || String(sel?.id ?? "");
      const key = normalizeSalesAttrName(baseName).toLowerCase();
      if (!key) return;
      const existingId = indexMap.get(key);
      if (!existingId) {
        indexMap.set(key, String(id));
        return;
      }
      const existing = salesAttrSelections.get(existingId);
      const existingCustom = Boolean(existing?.custom);
      const currentCustom = Boolean(sel?.custom);
      if (!existingCustom && currentCustom) {
        toDelete.add(existingId);
        indexMap.set(key, String(id));
      } else {
        toDelete.add(String(id));
      }
    });
    toDelete.forEach((id) => salesAttrSelections.delete(id));
  };

  const buildUniqueSalesAttrNameMap = (items, selections) => {
    const map = new Map();
    const addName = (id, base) => {
      const key = String(id ?? "").trim();
      if (!key) return;
      const baseName = String(base ?? key).trim() || key;
      map.set(key, baseName);
    };
    items.forEach((item) => addName(item.id, item.name || item.baseName));
    selections.forEach((sel) => {
      if (!map.has(String(sel.id ?? "").trim())) addName(sel.id, sel.name || sel.baseName);
    });
    return map;
  };

  const getSalesAttrDisplayNames = () => {
    dedupeSalesAttrSelections();
    const items = getTikTokSalesItems();
    const selections = Array.from(salesAttrSelections.values());
    const nameMap = buildUniqueSalesAttrNameMap(items, selections);
    nameMap.forEach((name, id) => {
      const sel = salesAttrSelections.get(id);
      if (sel && sel.name !== name) sel.name = name;
    });
    return nameMap;
  };

  const renderTikTokSalesAttrs = () => {
    if (!salesAttrNamesEl) return;
    const nameMap = getSalesAttrDisplayNames();
    const customNames = new Set(
      Array.from(salesAttrSelections.values())
        .filter((it) => it && it.custom)
        .map((it) => normalizeSalesAttrName(it.baseName ?? it.name).toLowerCase())
        .filter(Boolean)
    );
    const items = getTikTokSalesItems()
      .filter((item) => {
        const key = normalizeSalesAttrName(item.baseName ?? item.name).toLowerCase();
        if (!key) return false;
        return !customNames.has(key);
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    const selectedIds = new Set(Array.from(salesAttrSelections.keys()));
    const customItems = Array.from(salesAttrSelections.values()).filter((it) => it && it.custom);
    const mainIds = getTikTokMainSalesAttrIdSet();

    if (!items.length && !customItems.length) {
      salesAttrNamesEl.innerHTML = '<span class="text-[11px] text-slate-400">暂无销售属性</span>';
      setSalesAttrNameMsg("未返回销售属性，可手动添加自定义名称。", "info");
      return;
    }

    const btns = items.map((item) => {
      const active = selectedIds.has(item.id);
      const isMain = mainIds.has(item.id);
      const cls = active
        ? "border-accent bg-accent/10 text-accent"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
      const badge = isMain ? '<span class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-black">主</span>' : "";
      const label = nameMap.get(String(item.id)) || item.name;
      return `<button type="button" data-sales-spec-id="${escapeHtml(item.id)}" class="px-3 py-1.5 rounded-full text-xs font-semibold border ${cls}">${escapeHtml(
        label
      )}${badge}</button>`;
    });

    const customBtns = customItems.map((item) => {
      const label = `${nameMap.get(String(item.id)) || item.name}（自定义）`;
      return `<button type="button" data-sales-spec-id="${escapeHtml(
        item.id
      )}" class="px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">${escapeHtml(
        label
      )}</button>`;
    });

    salesAttrNamesEl.innerHTML = [...btns, ...customBtns].join("");

    const count = salesAttrSelections.size;
    if (count === 0) {
      setSalesAttrNameMsg(`请选择销售属性名称（最多 ${MAX_SALES_ATTR_NAMES} 个）。`, "info");
    } else if (count >= MAX_SALES_ATTR_NAMES) {
      setSalesAttrNameMsg(`已选择 ${count} 个销售属性名称（最多 ${MAX_SALES_ATTR_NAMES} 个）。`, "ok");
    } else {
      setSalesAttrNameMsg(`已选择 ${count} 个销售属性名称，可再选择 ${MAX_SALES_ATTR_NAMES - count} 个。`, "info");
    }
  };

  const renderTikTokSalesAttrValues = () => {
    if (!salesAttrValuesEl) return;
    const nameMap = getSalesAttrDisplayNames();
    const selections = Array.from(salesAttrSelections.values());
    if (!selections.length) {
      salesAttrValuesEl.innerHTML = '<div class="text-[11px] text-slate-400">先选择销售属性名称，再添加属性值。</div>';
      return;
    }
    const orderMap = new Map(getTikTokSalesItems().map((item, idx) => [item.id, idx]));
    selections.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    salesAttrValuesEl.innerHTML = selections
      .map((sel) => {
        const values = Array.isArray(sel.values) ? sel.values : [];
        const chips = values
          .map(
            (v) => `
              <span class="inline-flex items-center gap-2 text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-full">
                <span>${escapeHtml(v.value)}</span>
                <button type="button" data-sales-value-remove="${escapeHtml(sel.id)}" data-sales-value-id="${escapeHtml(
              v.goods_attr_id
            )}" class="text-rose-600 hover:text-rose-700">
                  <i class="fas fa-xmark"></i>
                </button>
              </span>
            `
          )
          .join("");
        return `
          <div class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3" data-sales-block="${escapeHtml(sel.id)}">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-slate-700">${escapeHtml(nameMap.get(String(sel.id)) || sel.name)}</div>
              <div class="text-[11px] text-slate-400">已添加 ${values.length} 个</div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <input data-sales-value-input="${escapeHtml(sel.id)}" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" placeholder="填写属性值" />
              <button type="button" data-sales-value-add="${escapeHtml(
                sel.id
              )}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">添加</button>
            </div>
            <div class="flex flex-wrap gap-2">${chips || '<span class="text-[11px] text-slate-400">未添加值</span>'}</div>
          </div>
        `;
      })
      .join("");
  };

  const getTikTokSalesCombos = () => {
    const selections = Array.from(salesAttrSelections.values());
    if (!selections.length) return [];
    const lists = selections.map((sel) =>
      (Array.isArray(sel.values) ? sel.values : []).map((v) => ({
        specId: sel.id,
        specName: sel.name,
        value: v.value,
        goods_attr_id: String(v.goods_attr_id ?? "").trim(),
      }))
    );
    if (lists.some((l) => l.length === 0)) return [];
    return lists.reduce((acc, list) => acc.flatMap((prev) => list.map((cur) => prev.concat([cur]))), [[]]);
  };

  const normalizeGoodsAttrKey = (raw) => {
    const list = String(raw ?? "")
      .split(",")
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
    if (!list.length) return "";
    return Array.from(new Set(list)).sort().join(",");
  };

  function isSkuComplete(row, opts = {}) {
    if (!row) return false;
    const mode = opts?.mode || (salesModeEnabled ? "full" : "simple");
    if (mode === "simple") {
      const required = ["product_number", "product_price"];
      return !required.some((k) => !String(row?.[k] ?? "").trim());
    }
    const required = ["product_sn", "product_number", "product_price"];
    if (required.some((k) => !String(row?.[k] ?? "").trim())) return false;
    const images = Array.isArray(row.attr_img_list) ? row.attr_img_list : [];
    return images.length > 0;
  }

  const normalizeIdentifierCode = (raw) =>
    String(raw ?? "")
      .trim()
      .replace(/[\s-]+/g, "")
      .replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 65248))
      .toUpperCase()
      .replace(/[^0-9X]/g, "");

  const validateIdentifierCode = (type, code) => {
    const t = String(type ?? "").trim().toUpperCase();
    const c = normalizeIdentifierCode(code);
    if (!t || !c) return false;
    const isDigits = (len) => new RegExp(`^\\d{${len}}$`).test(c);
    if (t === "GTIN") return isDigits(14);
    if (t === "EAN") return isDigits(8) || isDigits(13) || isDigits(14);
    if (t === "UPC") return isDigits(12);
    if (t === "ISBN") return isDigits(13) || /^[0-9]{9}X$/.test(c);
    if (t === "JAN") return isDigits(8) || isDigits(13);
    return false;
  };

  const renderTikTokSkuGrid = () => {
    if (!skuGridEl) return;
    const combos = getTikTokSalesCombos();
    if (!salesAttrSelections.size) {
      skuGridEl.innerHTML = '<div class="text-[11px] text-slate-400">请选择销售属性名称。</div>';
      renderTikTokStepper();
      return;
    }
    if (!combos.length) {
      skuGridEl.innerHTML = '<div class="text-[11px] text-slate-400">请为已选属性添加值，自动生成组合。</div>';
      renderTikTokStepper();
      return;
    }

    skuGridEl.innerHTML = combos
      .map((combo) => {
        const goodsAttrs = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
        const label = combo.map((x) => `${x.specName}: ${x.value}`).join(" / ");
        if (!skuDraft.has(goodsAttrs)) {
          skuDraft.set(goodsAttrs, {
            sku_identifier_type: "GTIN",
            sku_identifier_code: "",
            product_sn: "",
            product_number: "",
            product_price: "",
            attr_img_list: [],
          });
        }
        const row = skuDraft.get(goodsAttrs);
        const complete = isSkuComplete(row);
        const badge = complete
          ? '<span class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-black">已完成</span>'
          : '<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-black">未完成</span>';
        return `
          <button type="button" data-sku-edit="${escapeHtml(goodsAttrs)}" data-sku-label="${escapeHtml(
          label
        )}" class="w-full text-left border border-slate-100 rounded-2xl p-4 bg-white shadow-soft flex items-center justify-between gap-3 hover:border-accent/40 hover:shadow-glow transition">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-slate-700 truncate">${escapeHtml(label)}</div>
              <div class="text-[11px] text-slate-500 mt-1">排列组合</div>
            </div>
            <div class="flex items-center gap-2">
              ${badge}
            </div>
          </button>
        `;
      })
      .join("");
    renderTikTokStepper();
  };

  function renderPriceStockCardStatus() {
    if (!priceStockCard) return;
    const row = skuDraft.get(SIMPLE_SKU_KEY);
    const done = isSkuComplete(row, { mode: "simple" });
    let statusEl = priceStockCard.querySelector("[data-price-stock-status]");
    if (!statusEl) {
      statusEl = document.createElement("span");
      statusEl.dataset.priceStockStatus = "1";
      statusEl.className =
        "ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black";
      const title = priceStockCard.querySelector(".text-xs") || priceStockCard;
      title.appendChild(statusEl);
    }
    statusEl.textContent = done ? "已完成" : "未填写";
    statusEl.classList.toggle("text-emerald-700", done);
    statusEl.classList.toggle("bg-emerald-50", done);
    statusEl.classList.toggle("border-emerald-200", done);
    statusEl.classList.toggle("text-amber-700", !done);
    statusEl.classList.toggle("bg-amber-50", !done);
    statusEl.classList.toggle("border-amber-200", !done);
  }

  const pickTikTokImageUrls = (data) => {
    const urls = [];
    const push = (u) => {
      const s = String(u ?? "").trim();
      if (s) urls.push(s);
    };
    const d = data ?? {};
    push(d.url);
    push(d.uri);
    push(d.img_url);
    push(d.imgUrl);
    push(d.file_path);
    push(d.filePath);
    push(d.full_url);
    if (Array.isArray(d.images)) d.images.forEach((x) => push(x?.url ?? x?.uri ?? x));
    if (typeof d === "string") push(d);
    return urls.filter(Boolean);
  };

  const uploadTikTokSkuAttrImage = async (file) => {
    if (!file || !isImageFile(file)) {
      return { ok: false, msg: "请上传图片文件" };
    }
    const form = new FormData();
    form.append("file", file);
    form.append("use_case", "ATTRIBUTE_IMAGE");
    const res = await postAuthedFormData("/api/tiktok/upload_attrs_img", form);
    if (String(res?.code) === "2") {
      clearAuth();
      window.location.href = "./login.html";
      return { ok: false, msg: "未登录" };
    }
    if (String(res?.code) !== "0" || !res?.data) {
      return { ok: false, msg: res?.msg || "上传失败", res };
    }
    const urls = pickTikTokImageUrls(res?.data || {});
    return { ok: true, url: urls[0] || resolveTikTokUploadUrl(res?.data || {}), res };
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
        .join("") || '<span class="text-[11px] text-slate-400">暂无图片</span>';
  };

  const renderSkuModalStatus = () => {
    if (!skuModalStatus) return;
    const complete = isSkuComplete(skuDraft.get(activeSkuKey), { mode: skuModalMode });
    skuModalStatus.textContent = complete ? "已完成" : "未完成";
    skuModalStatus.className = complete
      ? "text-[11px] px-2 py-1 rounded-full border font-black text-emerald-700 bg-emerald-50 border-emerald-200"
      : "text-[11px] px-2 py-1 rounded-full border font-black text-amber-700 bg-amber-50 border-amber-200";
  };

  const setSkuModalMode = (mode) => {
    skuModalMode = mode === "simple" ? "simple" : "full";
    if (!skuModal) return;
    const hideFields = ["weight", "width", "height", "length"];
    hideFields.forEach((field) => {
      const input = skuModal.querySelector(`[data-sku-modal-field="${field}"]`);
      const wrap = input?.closest(".space-y-1");
      if (!wrap) return;
      const show = skuModalMode === "full";
      wrap.hidden = !show;
      wrap.classList.toggle("hidden", !show);
    });
    const imageWrap = skuModalImages?.closest(".space-y-2");
    if (imageWrap) {
      const show = skuModalMode === "full";
      imageWrap.hidden = !show;
      imageWrap.classList.toggle("hidden", !show);
    }
  };

  function openSkuModal(key, label) {
    if (!skuModal) return;
    setSkuModalMode("full");
    activeSkuKey = key;
    if (!skuDraft.has(key)) skuDraft.set(key, { attr_img_list: [] });
    const row = skuDraft.get(key);
    if (!String(row?.sku_identifier_type ?? "").trim()) row.sku_identifier_type = "GTIN";
    if (skuModalTitle) skuModalTitle.textContent = "SKU 组合配置";
    if (skuModalSubtitle) skuModalSubtitle.textContent = label || "-";
    skuModal.querySelectorAll("[data-sku-modal-field]").forEach((input) => {
      const field = input.getAttribute("data-sku-modal-field");
      let next = row?.[field] ?? "";
      if (field === "sku_identifier_type" && !String(next || "").trim()) next = "GTIN";
      input.value = next;
    });
    renderSkuModalImages();
    renderSkuModalStatus();
    skuModal.classList.remove("hidden");
  }

  const openPriceStockModal = () => {
    if (!skuModal) return;
    setSkuModalMode("simple");
    activeSkuKey = SIMPLE_SKU_KEY;
    if (!skuDraft.has(SIMPLE_SKU_KEY)) {
      skuDraft.set(SIMPLE_SKU_KEY, {
        sku_identifier_type: "GTIN",
        sku_identifier_code: "",
        product_sn: "",
        product_number: "",
        product_price: "",
        attr_img_list: [],
      });
    }
    const row = skuDraft.get(SIMPLE_SKU_KEY);
    if (!String(row?.sku_identifier_type ?? "").trim()) row.sku_identifier_type = "GTIN";
    if (skuModalTitle) skuModalTitle.textContent = "Price & Stock";
    if (skuModalSubtitle) skuModalSubtitle.textContent = "统一价格与库存";
    skuModal.querySelectorAll("[data-sku-modal-field]").forEach((input) => {
      const field = input.getAttribute("data-sku-modal-field");
      let next = row?.[field] ?? "";
      if (field === "sku_identifier_type" && !String(next || "").trim()) next = "GTIN";
      input.value = next;
    });
    renderSkuModalImages();
    renderSkuModalStatus();
    skuModal.classList.remove("hidden");
  };

  function closeSkuModal() {
    if (!skuModal) return;
    skuModal.classList.add("hidden");
    activeSkuKey = "";
  }

  const toggleSalesAttrSelection = (id, item) => {
    const key = String(id ?? "").trim();
    if (!key) return;
    const mainIds = getTikTokMainSalesAttrIdSet();
    if (salesAttrSelections.has(key)) {
      if (mainIds.has(key)) {
        setSalesAttrNameMsg("主销售属性不可删除。", "error");
        return;
      }
      salesAttrSelections.delete(key);
      renderTikTokSalesAttrs();
      renderTikTokSalesAttrValues();
      renderTikTokSkuGrid();
      return;
    }
    if (salesAttrSelections.size >= MAX_SALES_ATTR_NAMES) {
      setSalesAttrNameMsg(`最多选择 ${MAX_SALES_ATTR_NAMES} 个销售属性名称。`, "error");
      return;
    }
    const payload = item || { id: key, name: key, custom: true, values: [] };
    const baseName = payload.baseName ?? payload.name ?? key;
    salesAttrSelections.set(key, {
      ...payload,
      baseName,
      values: Array.isArray(payload.values) ? payload.values : [],
    });
    renderTikTokSalesAttrs();
    renderTikTokSalesAttrValues();
    renderTikTokSkuGrid();
  };

  const addCustomSalesAttrName = () => {
    if (!salesAttrCustomInput) return;
    const name = normalizeSalesAttrName(salesAttrCustomInput.value);
    if (!name) {
      setSalesAttrNameMsg("请输入自定义销售属性名称。", "error");
      return;
    }
    const items = getTikTokSalesItems();
    const hit = items.find(
      (it) => normalizeSalesAttrName(it.baseName || it.name).toLowerCase() === name.toLowerCase()
    );
    if (hit) {
      toggleSalesAttrSelection(hit.id, { ...hit, custom: false, values: salesAttrSelections.get(hit.id)?.values || [] });
      salesAttrCustomInput.value = "";
      return;
    }
    const id = `custom:${name}`;
    toggleSalesAttrSelection(id, { id, name, custom: true, values: [] });
    salesAttrCustomInput.value = "";
  };

  const syncTemplateDependencies = (res) => {
    lastAttrIndex = new Map();
    const data = res?.data || {};
    const attrs = Array.isArray(data?.product_attr_arr) ? data.product_attr_arr : [];

    for (const a of attrs) {
      const id = a?.id;
      const name = a?.name;
      if (id == null || name == null) continue;
      lastAttrIndex.set(String(id), { kind: "product", raw: a });
    }
    // Only keep product_attr_arr for TikTok template display.

    if (tplAttrSel) {
      tplAttrSel.innerHTML = '<option value="">从模板选择属性（可选）</option>';
      const options = [];
      for (const [id, item] of lastAttrIndex.entries()) {
        const raw = item.raw || {};
        const name = raw.name ?? raw.attribute_name ?? raw.attribute_name_en ?? id;
        const req = raw.is_requried === true ? " *" : "";
        const type = raw.type ? ` (${raw.type})` : "";
        options.push({ id, label: `${name}${type}${req} [${id}]` });
      }
      options.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
      for (const o of options) {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = o.label;
        tplAttrSel.appendChild(opt);
      }
    }

    if (tplValueSel) {
      tplValueSel.innerHTML = '<option value="">从模板选择属性值（可选）</option>';
    }

    if (brandResults) {
      const brands = res?.data?.brands;
      const list = normalizeBrandList({ data: { brands } });
      lastBrandList = list;
      setDefaultBrandListIfEmpty(list);
      brandResults.innerHTML = '<option value="">选择品牌(模板返回)</option>';
      for (const b of list) {
        const opt = document.createElement("option");
        opt.value = String(b.id ?? "");
        const label = `${b.name ?? b.id ?? "-"}`;
        opt.textContent = label;
        brandResults.appendChild(opt);
      }
      updateBrandListView(brandSearchName?.value || "");
      if (list.length) showBrandSummary(`模板返回 ${list.length} 个品牌`);
    }
    syncCertificationsFromTemplate(res);
  };

  const resetTemplateState = (opts = {}) => {
    const keepAttrs = opts.keepAttrs === true;
    selectedAttrs.clear();
    if (!keepAttrs) writeTikTokAttrsJson([]);
    renderAttrSummary();
    lastAttrIndex = new Map();
    lastTemplateRes = null;
    brandDefaultList = [];
    lastBrandList = [];
    if (templateForm) templateForm.innerHTML = "";
    if (tplAttrSel) tplAttrSel.innerHTML = '<option value="">从模板选择属性（可选）</option>';
    if (tplValueSel) tplValueSel.innerHTML = '<option value="">从模板选择属性值（可选）</option>';
    if (brandResults) brandResults.innerHTML = '<option value="">选择品牌(可选)</option>';
    if (brandList) brandList.innerHTML = "";
    let brandInput = document.getElementById("tiktok-brand-id");
    if (!brandInput && brandBlock) brandInput = brandBlock.querySelector("#tiktok-brand-id");
    if (brandInput) brandInput.value = "";
    showBrandSummary("");
    updateBrandSelectedHint();
    showTemplateMsg("");
    clearCertificationsState();
    clearSalesAttrSelections();
  };

  const getRequiredAttrMissing = () => {
    const items = getTikTokTemplateItems();
    const required = items.filter((x) => x.required);
    if (!required.length) return [];
    return required.filter((item) => {
      const id = String(item?.id ?? "").trim();
      if (!id) return false;
      return getSelectedValues(id).length === 0;
    });
  };

  const getMissingDescFields = () => {
    const fields = [
      ["tiktok-goods-name", "商品名称"],
      ["tiktok-goods-sn", "商品货号"],
      ["tiktok-goods-brief", "商品描述"],
      ["tiktok-goods-desc", "商品详情"],
      ["tiktok-package-weight", "weight"],
      ["tiktok-package-weight-unit", "unit"],
      ["tiktok-package-width", "wide"],
      ["tiktok-package-height", "high"],
      ["tiktok-package-length", "length"],
    ];
    const missing = fields
      .map(([id, label]) => {
        if (id === "tiktok-goods-desc") return [label, getGoodsDescText()];
        return [label, String(document.getElementById(id)?.value ?? "").trim()];
      })
      .filter(([, val]) => !val)
      .map(([label]) => label);
    return missing;
  };

  const isDescOk = () => getMissingDescFields().length === 0;

  const isAllSkuCombosComplete = () => {
    if (!salesModeEnabled) {
      const row = skuDraft.get(SIMPLE_SKU_KEY);
      return isSkuComplete(row, { mode: "simple" });
    }
    if (!salesAttrSelections.size) return false;
    const combos = getTikTokSalesCombos();
    if (!combos.length) return false;
    return combos.every((combo) => {
      const key = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
      const row = skuDraft.get(key);
      return isSkuComplete(row);
    });
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

  const unlockToStep = (step) => {
    const s = Number(step) || 1;
    unlockedUploadStep = Math.max(unlockedUploadStep, s);
  };

  const getTikTokProgress = () => {
    const catOk = isCatSelected();
    const templateOk = String(lastTemplateRes?.code ?? "") === "0" && getTikTokTemplateItems().length > 0;
    const missingRequired = getRequiredAttrMissing();
    const brandOk = Boolean(getCurrentBrandId());
    const attrsOk =
      templateOk &&
      missingRequired.length === 0 &&
      brandOk &&
      (getSelectedValueCount() > 0 || getTikTokTemplateItems().every((x) => !x.required));
    const missingCerts = getRequiredCertMissing();
    const certsOk = missingCerts.length === 0;
    const imagesOk = parseTikTokImgJson().length > 0;
    const descOk = isDescOk();
    const skuOk = isAllSkuCombosComplete();
    return {
      done1: catOk,
      done2: attrsOk,
      done3: imagesOk && certsOk,
      done4: descOk,
      done5: skuOk,
      allow2: catOk,
      allow3: attrsOk,
      allow4: imagesOk && certsOk,
      allow5: descOk,
    };
  };

  const renderTikTokStepper = () => {
    const p = getTikTokProgress();

    setStepDone(stepCheck1, unlockedUploadStep >= 1);
    setStepDone(stepCheck2, unlockedUploadStep >= 2);
    setStepDone(stepCheck3, unlockedUploadStep >= 3);
    setStepDone(stepCheck4, unlockedUploadStep >= 4);
    setStepDone(stepCheck5, p.done5);

    if (stepHint1) {
      const selectedText = String(document.getElementById("tiktok-cat-id-text")?.textContent ?? "").trim();
      if (!isCatSelected()) stepHint1.textContent = "请选择末级类目";
      else stepHint1.textContent = selectedText && selectedText !== "-" ? `已选类目：${selectedText}` : "已选类目";
    }
    if (stepHint2) stepHint2.textContent = p.done2 ? "模板已填写" : "属性模板与映射";
    if (stepHint3) stepHint3.textContent = p.done3 ? "图片已上传" : "上传主图/详情图";
    if (stepHint4) stepHint4.textContent = p.done4 ? "描述已填写" : "填写商品描述";
    if (stepHint5) stepHint5.textContent = p.done5 ? "组合已配置" : "请配置组合信息";

    setStepEnabled(stepBtn1, true);
    setStepEnabled(stepBtn2, unlockedUploadStep >= 2);
    setStepEnabled(stepBtn3, unlockedUploadStep >= 3);
    setStepEnabled(stepBtn4, unlockedUploadStep >= 4);
    setStepEnabled(stepBtn5, unlockedUploadStep >= 5);

    if (stepNext1) stepNext1.disabled = !p.allow2;
    if (stepNext2) stepNext2.disabled = !p.allow3;
    if (stepNext3) stepNext3.disabled = !p.allow4;
    if (stepNext4) {
      stepNext4.disabled = false;
      stepNext4.classList.toggle("opacity-50", !p.allow5);
      stepNext4.classList.toggle("cursor-not-allowed", !p.allow5);
      stepNext4.dataset.allow = p.allow5 ? "1" : "0";
    }
    renderPriceStockCardStatus();
  };

  const setUploadStep = (step) => {
    let s = Number(step);
    if (!Number.isFinite(s)) s = 1;
    s = Math.max(1, Math.min(5, Math.floor(s)));
    activeUploadStep = s;

    stepPanels.forEach((p, idx) => {
      if (!p) return;
      const show = idx + 1 <= activeUploadStep;
      setPanelVisible(p, show);
    });

    const actionGroups = [
      [stepNext1],
      [stepBack2, stepNext2],
      [stepBack3, stepNext3],
      [stepBack4, stepNext4],
      [stepBack5],
    ];
    actionGroups.forEach((group, idx) => {
      const on = idx + 1 === activeUploadStep;
      group.forEach((btn) => {
        if (!btn) return;
        btn.hidden = !on;
        btn.classList.toggle("hidden", !on);
      });
    });

    setStepActiveStyle(stepBtn1, stepDot1, s === 1);
    setStepActiveStyle(stepBtn2, stepDot2, s === 2);
    setStepActiveStyle(stepBtn3, stepDot3, s === 3);
    setStepActiveStyle(stepBtn4, stepDot4, s === 4);
    setStepActiveStyle(stepBtn5, stepDot5, s === 5);

    renderTikTokStepper();
  };

  const tryGoStep = (step) => {
    const target = Number(step) || 1;
    if (target <= unlockedUploadStep) return setUploadStep(target);
    renderTikTokStepper();
  };

  if (pendingDraft) {
    applyDraftToForm(pendingDraft);
    restoreAttrSelectionsFromDraft(pendingDraft);
    renderAttrSummary();
    renderTikTokImagePreview();
    updateBrandSelectedHint();
    pendingDraft = null;
  }

  const renderTikTokTemplateForm = () => {
    if (!templateForm) return;
    templateForm.innerHTML = "";
    showTemplateMsg("");
    applyTemplateSelectedValues(lastTemplateRes);

    const appendBrandCard = () => {
      if (!brandBlock) return false;
      brandBlock.classList.remove("hidden");
      brandBlock.classList.add("lg:col-span-2");
      templateForm.appendChild(brandBlock);
      return true;
    };

    const items = getTikTokTemplateItems();
    const requiredItems = items.filter((x) => x.required);
    const optionalItems = items.filter((x) => !x.required);

    const mkSection = (title, subtitle, icon, tone) => {
      const t = tone === "danger" ? "danger" : "neutral";
      const styles = t === "danger" ? "border-rose-100 bg-rose-50/60 text-rose-700" : "border-slate-100 bg-slate-50/70 text-slate-700";
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
          </div>
        </div>
      `;
      return el;
    };

    const renderChoice = (wrap, item, hooks = {}) => {
      const onSelected = hooks.onSelected;
      const onCleared = hooks.onCleared;
      const useDraft = hooks.useDraft === true;
      const draft = hooks.draft instanceof Set ? hooks.draft : null;
      const onDraftChange = hooks.onDraftChange;
      const values = Array.isArray(item.values) ? item.values : [];
      const many = values.length > 36;
      const isMulti = Boolean(item.multiple);
      const baseBtn =
        "px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 text-left flex items-center justify-between gap-2 transition-colors";

      const setBtnSelected = (btn, on) => {
        btn.classList.toggle("ring-2", on);
        btn.classList.toggle("ring-accent/30", on);
        btn.classList.toggle("border-accent/40", on);
        btn.classList.toggle("bg-accent/5", on);
        btn.querySelector("i")?.classList.toggle("hidden", !on);
      };

      const getChosen = () => {
        if (useDraft && draft) return Array.from(draft);
        return getSelectedValues(item.id)
          .map((entry) => String(entry?.value ?? "").trim())
          .filter(Boolean);
      };
      const isChosen = (val) => getChosen().includes(val);

      const buildGrid = (list) => {
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-2 sm:grid-cols-3 gap-2";
        for (const v of list) {
          const label = String(v?.name ?? v?.value ?? v?.id ?? "-");
          const valueId = String(v?.value_id ?? v?.valueId ?? v?.valueID ?? v?.vid ?? v?.id ?? label);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = baseBtn;
          btn.dataset.value = label;
          btn.dataset.valueId = valueId;
          btn.innerHTML = `<span class="truncate">${escapeHtml(label)}</span><i class="fas fa-check text-emerald-600 hidden"></i>`;
          setBtnSelected(btn, isChosen(label));
          btn.addEventListener("click", async () => {
            if (btn.dataset.pending === "1") return;
            const val = String(btn.dataset.value ?? "").trim();
            const valId = String(btn.dataset.valueId ?? "").trim() || val;
            if (!val) return;
            if (useDraft && draft) {
              const has = draft.has(val);
              if (isMulti) {
                if (has) draft.delete(val);
                else draft.add(val);
                setBtnSelected(btn, !has);
              } else {
                draft.clear();
                if (!has) draft.add(val);
                grid.querySelectorAll("button").forEach((b) =>
                  setBtnSelected(b, draft.has(String(b.dataset.value ?? "")))
                );
              }
              if (typeof onDraftChange === "function") onDraftChange(val);
              return;
            }
            if (isChosen(val)) {
              if (isMulti) {
                removeAttrSelection(item.id, val);
                setBtnSelected(btn, false);
              } else {
                clearAttrSelection(item.id);
                grid.querySelectorAll("button").forEach((b) => setBtnSelected(b, false));
              }
              if (typeof onCleared === "function") onCleared(val);
              return;
            }
            if (isMulti) {
              setAttrSelection(item.id, val, valId, { multiple: true, allowLocal: true });
              setBtnSelected(btn, true);
              if (typeof onSelected === "function") onSelected(val);
              return;
            }
            setAttrSelection(item.id, val, valId, { multiple: false, allowLocal: true });
            grid.querySelectorAll("button").forEach((b) => setBtnSelected(b, String(b.dataset.value) === val));
            if (typeof onSelected === "function") onSelected(val);
          });
          grid.appendChild(btn);
        }
        return grid;
      };

      if (!many) {
        wrap.appendChild(buildGrid(values.slice(0, 220)));
        return;
      }

      const tabs = document.createElement("div");
      tabs.className = "flex flex-wrap items-center gap-2";
      const tabBtn = (key, text, icon) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className =
          "px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-black text-slate-700 flex items-center gap-1.5";
        b.dataset.key = key;
        b.innerHTML = `<i class="fas ${escapeHtml(icon)} text-slate-500"></i><span>${escapeHtml(text)}</span>`;
        return b;
      };
      const btnCommon = tabBtn("common", "常用", "fa-bolt");
      const btnAll = tabBtn("all", "全部", "fa-layer-group");
      tabs.appendChild(btnCommon);
      tabs.appendChild(btnAll);

      const content = document.createElement("div");
      content.className = "mt-2 space-y-2";
      const state = { tab: "common", q: "" };
      const renderTab = () => {
        content.innerHTML = "";
        [btnCommon, btnAll].forEach((b) => {
          const on = b.dataset.key === state.tab;
          b.classList.toggle("ring-2", on);
          b.classList.toggle("ring-accent/30", on);
          b.classList.toggle("border-accent/40", on);
          b.classList.toggle("bg-accent/5", on);
        });
        if (state.tab === "all") {
          const searchWrap = document.createElement("div");
          searchWrap.className = "flex items-center gap-2";
          searchWrap.innerHTML = `
            <div class="flex-1 relative">
              <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"></i>
              <input class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" placeholder="输入关键词筛选" />
            </div>
            <button type="button" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">清空</button>
          `;
          const input = searchWrap.querySelector("input");
          const clearBtn = searchWrap.querySelector("button");
          if (input) input.value = state.q || "";
          if (input) input.addEventListener("input", () => { state.q = String(input.value ?? ""); renderTab(); });
          if (clearBtn) clearBtn.addEventListener("click", () => { state.q = ""; if (input) input.value = ""; renderTab(); });
          content.appendChild(searchWrap);

          const q = String(state.q || "").trim().toLowerCase();
          const filtered = q ? values.filter((v) => String(v?.name ?? v?.value ?? v?.id ?? "").toLowerCase().includes(q)) : values;
          content.appendChild(buildGrid(filtered.slice(0, 200)));
          const tip = document.createElement("div");
          tip.className = "text-[11px] text-slate-400";
          tip.textContent =
            filtered.length > 200 ? `匹配 ${filtered.length} 项，仅展示前 200 项；继续输入关键词缩小范围` : `匹配 ${filtered.length} 项`;
          content.appendChild(tip);
          return;
        }
        content.appendChild(buildGrid(values.slice(0, 36)));
        const tip = document.createElement("div");
        tip.className = "text-[11px] text-slate-400";
        tip.textContent = "常用：展示前 36 项；更多请切换到「全部」";
        content.appendChild(tip);
      };
      [btnCommon, btnAll].forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.key || "common"; renderTab(); }));
      wrap.appendChild(tabs);
      wrap.appendChild(content);
      renderTab();
    };

    const ensureAttrModal = (() => {
      let modal = null;
      return () => {
        if (modal) return modal;
        modal = document.getElementById("tiktok-attr-modal");
        if (modal) return modal;
        const overlay = document.createElement("div");
        overlay.id = "tiktok-attr-modal";
        overlay.className = "fixed inset-0 z-[60] hidden items-center justify-center bg-slate-900/40 px-4 py-6";
        overlay.innerHTML = `
          <div class="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-black text-slate-900" data-attr-modal-title>属性选择</div>
                <div class="text-[11px] text-slate-400 mt-0.5" data-attr-modal-subtitle>点击一个选项完成选择</div>
              </div>
              <button type="button" data-attr-modal-close class="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
                <i class="fas fa-xmark"></i>
              </button>
            </div>
            <div class="p-5 max-h-[70vh] overflow-auto" data-attr-modal-body></div>
          </div>
        `;
        document.body.appendChild(overlay);
        const close = () => {
          overlay.classList.add("hidden");
          overlay.classList.remove("flex");
        };
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) close();
        });
        const closeBtn = overlay.querySelector("[data-attr-modal-close]");
        if (closeBtn) closeBtn.addEventListener("click", close);
        modal = overlay;
        return modal;
      };
    })();

    const openAttrModal = (item, hooks = {}) => {
      const modal = ensureAttrModal();
      const title = modal.querySelector("[data-attr-modal-title]");
      const subtitle = modal.querySelector("[data-attr-modal-subtitle]");
      const body = modal.querySelector("[data-attr-modal-body]");
      const hasValues = item?.hasValues === true;
      const valuesList = Array.isArray(item?.values) ? item.values : [];
      const isMulti = hasValues ? Boolean(item?.multiple) : false;
      if (title) title.textContent = item?.name ? String(item.name) : "属性选择";
      if (subtitle) {
        subtitle.textContent = hasValues
          ? isMulti
            ? "可多选，点击选项切换"
            : "点击一个选项完成选择"
          : "请输入属性值";
      }
      const close = () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      };

      if (body) {
        const renderModalBody = () => {
          body.innerHTML = "";
          const wrap = document.createElement("div");
          const modalHasValues = hasValues;
          if (modalHasValues && valuesList.length) {
            renderChoice(wrap, item, {
              onSelected: (val) => {
                if (typeof hooks.onSelected === "function") hooks.onSelected(val);
                if (!isMulti) close();
              },
              onCleared: (val) => {
                if (typeof hooks.onCleared === "function") hooks.onCleared(val);
              },
            });
          } else if (modalHasValues && !valuesList.length) {
            const empty = document.createElement("div");
            empty.className = "text-xs text-slate-400";
            empty.textContent = "暂无可选值。";
            wrap.appendChild(empty);
          }

          if (!modalHasValues) {
            const inputWrap = document.createElement("div");
            inputWrap.className = "space-y-2";
            inputWrap.innerHTML = `
              <div class="text-xs text-slate-500">文本输入</div>
              <div class="flex items-center gap-2">
                <input type="text" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs" placeholder="请输入属性值" />
                <button type="button" data-save="1" class="px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">保存</button>
              </div>
              <div data-error="1" class="hidden text-[11px] text-rose-600"></div>
              <button type="button" data-clear="1" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">清空</button>
            `;
            const inputEl = inputWrap.querySelector("input");
            const saveBtn = inputWrap.querySelector("[data-save='1']");
            const clearBtn = inputWrap.querySelector("[data-clear='1']");
            const errorEl = inputWrap.querySelector("[data-error='1']");
            const current = getSelectedValues(item?.id)
              .map((entry) => String(entry?.value ?? "").trim())
              .filter(Boolean)[0];
            if (inputEl && current) inputEl.value = current;
            const showError = (msg) => {
              if (!errorEl) return;
              errorEl.textContent = msg || "";
              errorEl.classList.toggle("hidden", !msg);
            };
            const doSave = () => {
              const val = String(inputEl?.value ?? "").trim();
              if (!val) {
                showError("请输入属性值。");
                return;
              }
              showError("");
              setAttrSelection(item?.id, val, val, { multiple: false, allowLocal: true });
              if (typeof hooks.onSelected === "function") hooks.onSelected(val);
              close();
            };
            const doClear = () => {
              showError("");
              clearAttrSelection(item?.id);
              if (typeof hooks.onCleared === "function") hooks.onCleared("");
              close();
            };
            if (saveBtn) saveBtn.addEventListener("click", doSave);
            if (clearBtn) clearBtn.addEventListener("click", doClear);
            if (inputEl) {
              inputEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  doSave();
                }
              });
            }
            wrap.appendChild(inputWrap);
          }

          body.appendChild(wrap);
        };
        renderModalBody();
      }
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    };

    const renderItem = (item) => {
      const card = document.createElement("div");
      const isReq = Boolean(item.required);
      const baseReq = "relative overflow-hidden rounded-3xl border-2 border-accent/20 bg-accent/5 p-5 pl-6 hover:border-accent/30 transition-colors";
      const baseOpt = "relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-5 pl-6 hover:border-accent/30 transition-colors";
      const hasValues = item?.hasValues === true;
      const valuesCount = Array.isArray(item.values) ? item.values.length : 0;
      const infoText = hasValues
        ? valuesCount
          ? `候选 ${valuesCount} 个属性值`
          : "暂无可选值"
        : "文本输入";
      const typeLabel = hasValues ? (item.multiple ? "多选属性" : "单选属性") : "文本输入";
      const requiredChip = isReq
        ? '<span class="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-black">必填</span>'
        : "";
      const typeChip = `<span class="text-[10px] text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-black border">${typeLabel}</span>`;
      card.className = `${isReq ? baseReq : baseOpt} cursor-pointer`;
      card.innerHTML = `
        <button type="button" data-item-toggle="1" class="w-full text-left">
          <div class="absolute left-2 top-4 bottom-4 w-1 rounded-full ${isReq ? "bg-rose-500" : "bg-slate-400/70"}"></div>
          <div class="pl-2 space-y-2">
            <div class="flex items-start gap-2 text-base font-black text-slate-900">
              <i class="fas fa-list-check text-slate-600 mt-0.5"></i>
              <span class="break-words whitespace-normal">${escapeHtml(item.name)}</span>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-2">
              <i class="fas fa-circle-info"></i>
              <span>${escapeHtml(infoText)}</span>
            </div>
            <div data-chips="1" class="flex flex-wrap gap-1.5 justify-end">
              ${requiredChip}
              ${typeChip}
            </div>
            <div data-result="1" class="mt-2 flex flex-wrap gap-1.5"></div>
          </div>
        </button>
      `;

      const selectedValues = () =>
        getSelectedValues(item.id)
          .map((entry) => String(entry?.value ?? "").trim())
          .filter(Boolean);

      const applyCardStatus = () => {
        const chips = card.querySelector('[data-chips="1"]');
        const resultEl = card.querySelector('[data-result="1"]');
        if (!chips || !resultEl) return;

        let statusEl = chips.querySelector('[data-status="1"]');
        if (!statusEl) {
          statusEl = document.createElement("span");
          statusEl.dataset.status = "1";
          chips.prepend(statusEl);
        }

        const vals = selectedValues();
        const pillBase = "px-2 py-0.5 rounded-full border text-[11px] font-semibold";
        const pillMain = `${pillBase} bg-accent/5 border-accent/20 text-slate-800`;
        const emptyText = '<span class="text-[11px] text-slate-400">未填写</span>';
        const baseStatusCls = "inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-black border shadow-sm";

        if (vals.length) {
          statusEl.className = `${baseStatusCls} attr-status-done`;
          statusEl.innerHTML = '<i class="fas fa-circle-check text-white"></i><span>已完成</span>';
          card.classList.add("attr-card-done");
          card.classList.remove("attr-card-attention");
          resultEl.innerHTML = vals.map((val) => `<span class="${pillMain}">${escapeHtml(val)}</span>`).join("");
          return;
        }

        const pendingCls = isReq
          ? `${baseStatusCls} text-rose-700 bg-rose-50 border-rose-100`
          : `${baseStatusCls} text-slate-700 bg-slate-100 border-slate-200`;
        statusEl.className = pendingCls;
        statusEl.innerHTML = `<i class="fas ${isReq ? "fa-asterisk" : "fa-dot-circle"}"></i><span>${isReq ? "必填未填" : "选填未填"}</span>`;
        card.classList.remove("attr-card-done");
        resultEl.innerHTML = emptyText;
      };

      applyCardStatus();

      const toggle = card.querySelector("[data-item-toggle='1']") || card.querySelector('[data-item-toggle="1"]');
      if (toggle) {
        toggle.addEventListener("click", () => {
        openAttrModal(item, {
          onSelected: () => {
            applyCardStatus();
          },
          onCleared: () => {
            applyCardStatus();
          },
        });
        });
      }

      return card;
    };

    if (requiredItems.length || brandBlock)
      templateForm.appendChild(mkSection("必填项", "优先填写，避免提交失败", "fa-circle-exclamation", "danger"));
    appendBrandCard();
    if (!items.length) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "text-xs text-slate-400";
      emptyMsg.textContent = "模板为空或未加载。";
      templateForm.appendChild(emptyMsg);
      renderAttrSummary();
      return;
    }
    for (const item of requiredItems) templateForm.appendChild(renderItem(item));
    if (optionalItems.length) templateForm.appendChild(mkSection("选填项", "按需选择", "fa-sparkles", "neutral"));
    for (const item of optionalItems) templateForm.appendChild(renderItem(item));
    renderAttrSummary();
    renderTikTokStepper({ autoAdvance: true });
  };

  if (templateClearBtn) {
    templateClearBtn.addEventListener("click", () => {
      selectedAttrs.clear();
      writeTikTokAttrsJson([]);
      renderAttrSummary();
      renderTikTokTemplateForm();
      clearSalesAttrSelections();
      showTemplateMsg("");
      renderTikTokStepper();
      queueDraftSave();
    });
  }

  const fetchTikTokTemplate = async (catId, opts = {}) => {
    const cid = String(catId ?? "").trim();
    if (!cid || cid === "-") return null;
    const editId = String(opts?.goodsId ?? editingTikTokGoodsId ?? "").trim();
    const goodsId = editId || "0";
    if (templateBtn) {
      templateBtn.disabled = true;
      templateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
    }
    try {
      const res = await postAuthedJson("/api/tiktok/getAttributeTemplate", { goods_id: goodsId, cat_id: cid });
      lastTemplateRes = res;
      setPre(templatePre, res);
      if (canRestoreDraftAttrs(cid)) {
        restoreAttrSelectionsFromDraft(draftState);
        draftApplied = true;
      }
      applyTemplateSelectedValues(res);
      renderTikTokTemplateForm();
      syncCertificationsFromTemplate(res);
      renderTikTokSalesAttrs();
      renderTikTokSalesAttrValues();
      renderTikTokSkuGrid();
      return res;
    } catch {
      lastTemplateRes = { code: "1", msg: "网络异常，请稍后重试。", data: {} };
      setPre(templatePre, lastTemplateRes);
      renderTikTokTemplateForm();
      renderTikTokSalesAttrs();
      renderTikTokSalesAttrValues();
      renderTikTokSkuGrid();
      return lastTemplateRes;
    } finally {
      if (templateBtn) {
        templateBtn.disabled = false;
        templateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-1"></i>重新获取模板';
      }
    }
  };

  if (templateBtn) {
    templateBtn.addEventListener("click", async () => {
      if (!isCatSelected()) {
        showTemplateMsg("请先选择末级类目。");
        return;
      }
      const catId = catOut.textContent.trim();
      if (!catId || catId === "-") {
        setPre(templatePre, { code: "1", msg: "请选择末级类目(cat_id)" });
        return;
      }
      resetTemplateState({ keepAttrs: canRestoreDraftAttrs(catId) });
      const res = await fetchTikTokTemplate(catId, { goodsId: id });

      const buildIndex = () => {
        lastAttrIndex = new Map();
        const res = lastTemplateRes;
        const data = res?.data || {};
        const attrs = Array.isArray(data?.product_attr_arr) ? data.product_attr_arr : [];
        const sales = Array.isArray(data?.pro_main_arr) ? data.pro_main_arr : [];

        for (const a of attrs) {
          const id = a?.id;
          const name = a?.name;
          if (id == null || name == null) continue;
          lastAttrIndex.set(String(id), { kind: "product", raw: a });
        }
        for (const s of sales) {
          const id = s?.attribute_id ?? s?.attr_id;
          const name = s?.attribute_name ?? s?.attribute_name_en;
          if (id == null || name == null) continue;
          if (!lastAttrIndex.has(String(id))) lastAttrIndex.set(String(id), { kind: "sales", raw: s });
        }

        if (tplAttrSel) {
          tplAttrSel.innerHTML = '<option value="">从模板选择属性(可选)</option>';
          const options = [];
          for (const [id, item] of lastAttrIndex.entries()) {
            const raw = item.raw || {};
            const name = raw.name ?? raw.attribute_name ?? raw.attribute_name_en ?? id;
            const req = raw.is_requried === true ? " *" : "";
            const type = raw.type ? ` (${raw.type})` : "";
            options.push({ id, label: `${name}${type}${req} [${id}]` });
          }
          options.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
          for (const o of options) {
            const opt = document.createElement("option");
            opt.value = o.id;
            opt.textContent = o.label;
            tplAttrSel.appendChild(opt);
          }
        }

        if (tplValueSel) {
          tplValueSel.innerHTML = '<option value="">从模板选择属性值(可选)</option>';
        }
      };

      buildIndex();

      if (brandResults) {
        const brands = res?.data?.brands ?? lastTemplateRes?.data?.brands;
        const list = normalizeBrandList({ data: { brands } });
        lastBrandList = list;
        setDefaultBrandListIfEmpty(list);
        brandResults.innerHTML = '<option value="">选择品牌(模板返回)</option>';
        for (const b of list) {
          const opt = document.createElement("option");
          opt.value = String(b.id ?? "");
          const label = `${b.name ?? b.id ?? "-"}`;
          opt.textContent = label;
          brandResults.appendChild(opt);
        }
        updateBrandListView(brandSearchName?.value || "");
        if (list.length) showBrandSummary(`模板返回 ${list.length} 个品牌`);
      }
      renderTikTokStepper({ autoAdvance: true });
    });
  }

  const maybeAutoFetchTemplate = async () => {
    const cid = getCatId();
    if (!cid || cid === "-") {
      if (lastTemplateRes) resetTemplateState();
      lastTemplateCatId = "";
      renderTikTokStepper();
      return;
    }
    if (cid === lastTemplateCatId) {
      renderTikTokStepper();
      return;
    }
    resetTemplateState({ keepAttrs: canRestoreDraftAttrs(cid) });
    const res = await fetchTikTokTemplate(cid, { goodsId: editingTikTokGoodsId });
    syncTemplateDependencies(res);
    renderTikTokStepper({ autoAdvance: true });
  };

  const ensureTemplateReady = async () => {
    if (!isCatSelected()) {
      showTemplateMsg("请先选择末级类目。");
      return false;
    }
    const catId = getCatId();
    if (!catId || catId === "-") {
      showTemplateMsg("请选择末级类目(cat_id)");
      return false;
    }
    if (!lastTemplateRes || lastTemplateCatId !== catId) {
      resetTemplateState({ keepAttrs: canRestoreDraftAttrs(catId) });
      const res = await fetchTikTokTemplate(catId, { goodsId: editingTikTokGoodsId });
      syncTemplateDependencies(res);
    }
    return true;
  };

  // Auto fetch template if category already selected (e.g. restored from cache).
  maybeAutoFetchTemplate();
  renderTikTokSalesAttrs();
  renderTikTokSalesAttrValues();
  renderTikTokSkuGrid();

  if (salesAttrNamesEl) {
    salesAttrNamesEl.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-sales-spec-id]");
      if (!btn) return;
      const id = String(btn.dataset.salesSpecId ?? "").trim();
      if (!id) return;
      const items = getTikTokSalesItems();
      const hit = items.find((it) => String(it.id) === id);
      if (hit) {
        toggleSalesAttrSelection(id, { ...hit, custom: false, values: salesAttrSelections.get(id)?.values || [] });
      } else if (salesAttrSelections.has(id)) {
        toggleSalesAttrSelection(id);
      } else {
        const label = id.replace(/^custom:/, "");
        toggleSalesAttrSelection(id, { id, name: label || id, custom: true, values: [] });
      }
    });
  }

  if (salesAttrCustomAdd) {
    salesAttrCustomAdd.addEventListener("click", () => {
      addCustomSalesAttrName();
    });
  }

  if (salesAttrCustomInput) {
    salesAttrCustomInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addCustomSalesAttrName();
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
          setSalesAttrNameMsg("请填写属性值。", "error");
          return;
        }
        if (sel.values?.some((v) => String(v.value ?? "") === val)) {
          setSalesAttrNameMsg("该属性值已存在。", "error");
          return;
        }
        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>记录中';
        try {
        const goodsId = attrGoodsId?.value?.trim() || editingTikTokGoodsId || "0";
          const res = await postAuthedJson("/api/tiktok/insert_attr_input", {
            goods_id: goodsId,
            attr_value: val,
            type_name: sel.name,
            type_id: sel.id,
          });
          if (String(res?.code) === "2") {
            clearAuth();
            window.location.href = "./login.html";
            return;
          }
          if (String(res?.code) !== "0" || !res?.data?.goods_attr_id) {
            setSalesAttrNameMsg(res?.msg || "属性值记录失败。", "error");
            return;
          }
          const goodsAttrId = String(res.data.goods_attr_id ?? "").trim();
          sel.values = Array.isArray(sel.values) ? sel.values : [];
          sel.values.push({ value: val, goods_attr_id: goodsAttrId });
          if (input) input.value = "";
          setSalesAttrNameMsg("属性值已记录。", "ok");
          renderTikTokSalesAttrValues();
          renderTikTokSkuGrid();
        } catch {
          setSalesAttrNameMsg("网络异常，请稍后重试。", "error");
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
          (v) => String(v.goods_attr_id ?? "") !== valId
        );
        renderTikTokSalesAttrValues();
        renderTikTokSkuGrid();
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
      const updateSku = () => {
        if (!activeSkuKey) return;
        if (!skuDraft.has(activeSkuKey)) skuDraft.set(activeSkuKey, { attr_img_list: [] });
        const row = skuDraft.get(activeSkuKey);
        const field = input.getAttribute("data-sku-modal-field");
        row[field] = String(input.value ?? "").trim();
        renderSkuModalStatus();
        renderTikTokSkuGrid();
        renderPriceStockCardStatus();
      };
      input.addEventListener("input", updateSku);
      input.addEventListener("change", updateSku);
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
      if (queue.length < files.length) setSalesAttrNameMsg("每个组合最多上传 10 张图片。", "error");

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
        const res = await uploadTikTokSkuAttrImage(file);
        if (!res.ok || !res.url) {
          updateSkuImg(localId, { uploading: false, uploadError: res.msg || res?.res?.msg || "上传失败" });
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

      skuModalFile.value = "";
      renderSkuModalImages();
      renderSkuModalStatus();
      renderTikTokSkuGrid();
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
      renderSkuModalImages();
      renderSkuModalStatus();
      renderTikTokSkuGrid();
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

  try {
    const obs = new MutationObserver(() => {
      refreshTemplateEnabled();
      maybeAutoFetchTemplate();
      renderTikTokStepper();
      queueDraftSave();
    });
    obs.observe(catOut, { childList: true, characterData: true, subtree: true });
  } catch {
    // ignore
  }

  if (tplAttrSel) {
    tplAttrSel.addEventListener("change", () => {
      const id = tplAttrSel.value;
      const item = lastAttrIndex.get(String(id));
      if (!item) return;
      const raw = item.raw || {};
      const name = raw.name ?? raw.attribute_name ?? raw.attribute_name_en ?? "";

      if (attrAttrId) attrAttrId.value = String(id);
      if (attrTypeId) attrTypeId.value = String(id);
      if (attrTypeName) attrTypeName.value = String(name);

      if (tplValueSel) {
        tplValueSel.innerHTML = '<option value="">从模板选择属性值(可选)</option>';
        const values = normalizeTikTokValues(raw?.values);
        for (const v of values) {
          const vid = v?.id ?? v?.vid ?? v?.value_id ?? v?.valueId ?? v?.valueID;
          const opt = document.createElement("option");
          opt.value = String(v?.name ?? "");
          opt.textContent = `${v?.name ?? "-"}${vid != null ? ` [${vid}]` : ""}`;
          tplValueSel.appendChild(opt);
        }
      }
    });
  }

  if (tplValueSel) {
    tplValueSel.addEventListener("change", () => {
      if (attrValue && tplValueSel.value) attrValue.value = tplValueSel.value;
    });
  }

  const updateFileAccept = () => {
    if (!fileInput) return;
    fileInput.accept = "image/*";
    fileInput.multiple = true;
  };
  updateFileAccept();

  const updateUploadButtonState = () => {
    const pending = uploadPendingCount;
    const busy = pending > 0 || uploadInFlight;
    if (uploadGoodsBtn) {
      uploadGoodsBtn.disabled = busy;
      uploadGoodsBtn.innerHTML = busy
        ? `<i class="fas fa-circle-notch fa-spin mr-1"></i>上传中${pending > 0 ? ` (${pending})` : ""}`
        : uploadGoodsBtnDefaultHtml || uploadGoodsBtn.innerHTML;
    }
    if (uploadAttrsBtn) {
      uploadAttrsBtn.disabled = busy;
      uploadAttrsBtn.innerHTML = busy
        ? `<i class="fas fa-circle-notch fa-spin mr-1"></i>上传中${pending > 0 ? ` (${pending})` : ""}`
        : uploadAttrsBtnDefaultHtml || uploadAttrsBtn.innerHTML;
    }
  };

  const doUploadTikTokFile = async (kind, file) => {
    const uploadKind = String(kind || "upload_goods_img");
    if (!file) return;
    if (!isImageFile(file)) {
      setPre(uploadPre, { code: "1", msg: "请上传图片文件（jpg/png/webp/gif 等）", data: {} });
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      const autoUseCase = uploadKind === "upload_attrs_img" ? "ATTRIBUTE_IMAGE" : "MAIN_IMAGE";
      if (autoUseCase) form.append("use_case", autoUseCase);
      const res = await postAuthedFormData(`/api/tiktok/${uploadKind}`, form);
      setPre(uploadPre, res);

      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }

      // only goods images are used by insert payload (goods_img_json)
      if (String(res?.code) === "0" && uploadKind === "upload_goods_img" && res?.data) {
        const list = parseTikTokImgJson();
        list.push(res.data);
        writeTikTokImgJson(list);
        renderTikTokImagePreview();
      }
    } catch {
      setPre(uploadPre, { code: "1", msg: "网络异常，请稍后重试。", data: {} });
    }
  };

  const processUploadQueue = async () => {
    if (uploadInFlight) return;
    uploadInFlight = true;
    updateUploadButtonState();
    while (uploadQueue.length) {
      const task = uploadQueue.shift();
      if (!task) continue;
      await doUploadTikTokFile(task.kind, task.file);
      uploadPendingCount = Math.max(0, uploadPendingCount - 1);
      updateUploadButtonState();
      renderTikTokImagePreview();
    }
    uploadInFlight = false;
    updateUploadButtonState();
  };

  const enqueueTikTokUploads = (files, kind) => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;
    const k = String(kind || "upload_goods_img");
    let nextList = list;
    if (k === "upload_goods_img") {
      const current = parseTikTokImgJson().length;
      const remaining = Math.max(0, MAX_TIKTOK_IMAGES - current - uploadPendingCount);
      if (remaining <= 0) {
        showUploadMsg(`最多可传${MAX_TIKTOK_IMAGES}张，首张默认主图`);
        return;
      }
      if (list.length > remaining) {
        showUploadMsg(`最多可传${MAX_TIKTOK_IMAGES}张，已自动截取前 ${remaining} 张。`);
        nextList = list.slice(0, remaining);
      } else {
        showUploadMsg("");
      }
    }
    uploadQueue.push(...nextList.map((file) => ({ file, kind: k })));
    uploadPendingCount += nextList.length;
    updateUploadButtonState();
    renderTikTokImagePreview();
    processUploadQueue();
  };

  updateUploadButtonState();

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      const kind = String(fileInput.dataset.kind || "upload_goods_img");
      enqueueTikTokUploads(files, kind);
      fileInput.value = "";
    });
  }
  if (uploadGoodsBtn) {
    uploadGoodsBtn.addEventListener("click", () => {
      if (fileInput) fileInput.dataset.kind = "upload_goods_img";
      updateFileAccept();
      fileInput?.click?.();
    });
  }
  if (uploadAttrsBtn) {
    uploadAttrsBtn.addEventListener("click", () => {
      if (fileInput) fileInput.dataset.kind = "upload_attrs_img";
      updateFileAccept();
      fileInput?.click?.();
    });
  }

  if (certFileInput) {
    certFileInput.addEventListener("change", () => {
      const certId = String(certFileInput.dataset.certId ?? "").trim();
      const files = Array.from(certFileInput.files || []);
      certFileInput.value = "";
      if (!certId || !files.length) return;
      uploadCertFiles(certId, files);
    });
  }

  if (certificationsBlock) {
    certificationsBlock.addEventListener("click", (e) => {
      const uploadBtn = e.target?.closest?.("[data-cert-upload]");
      if (uploadBtn && certFileInput) {
        const certId = uploadBtn.getAttribute("data-cert-upload") || "";
        certFileInput.dataset.certId = certId;
        certFileInput.click();
        return;
      }
      const removeBtn = e.target?.closest?.("[data-cert-remove]");
      if (removeBtn) {
        const certId = removeBtn.getAttribute("data-cert-remove") || "";
        const idx = Number(removeBtn.getAttribute("data-cert-idx") || -1);
        if (certId && Number.isFinite(idx) && idx >= 0) {
          const list = getCertUploads(certId);
          list.splice(idx, 1);
          certificationUploads.set(String(certId), list);
          syncExtraWithCerts();
          renderCertifications();
          setCertMsg(certId, "已移除", "info");
        }
        return;
      }
      const sampleBtn = e.target?.closest?.("[data-cert-sample]");
      if (sampleBtn) {
        const url = sampleBtn.getAttribute("data-cert-sample") || "";
        imageViewer.open(url);
      }
    });
  }

  if (attrSubmit && attrPre) {
    attrSubmit.addEventListener("click", async () => {
      const goodsId = attrGoodsId?.value?.trim() || editingTikTokGoodsId || "0";
      const typeId = attrTypeId?.value?.trim() || "";
      const typeName = attrTypeName?.value?.trim() || "";
      const value = attrValue?.value?.trim() || "";
      const attrId = attrAttrId?.value?.trim() || "";

      if (!attrId || !typeId || !typeName || !value) {
        setPre(attrPre, { code: "1", msg: "请填写 attrId/type_id/type_name/attr_value" });
        return;
      }

      const res = await postAuthedJson("/api/tiktok/insert_attr_input", {
        goods_id: goodsId,
        attr_value: value,
        type_name: typeName,
        type_id: typeId,
      });
      setPre(attrPre, res);

      if (String(res?.code) !== "0" || !res?.data?.goods_attr_id) return;

      const textarea = document.getElementById("tiktok-attrs-json");
      if (!textarea) return;

      let current = [];
      try {
        const parsed = textarea.value?.trim() ? JSON.parse(textarea.value) : [];
        if (Array.isArray(parsed)) current = parsed;
      } catch {
        current = [];
      }

      current.push({
        attrId: Number.isFinite(Number(attrId)) ? Number(attrId) : attrId,
        attr_value_id: String(res.data.goods_attr_id),
        attr_value_name: value,
      });
      textarea.value = JSON.stringify(current);
    });
  }

  if (brandSearchBtn && brandResults) {
    brandSearchBtn.addEventListener("click", async () => {
      if (brandSearchBtn.dataset.pending === "1") return;
      const catId = catOut.textContent.trim();
      const name = brandSearchName?.value?.trim() || "";
      if (!catId || catId === "-") {
        showBrandSummary("请先选择末级类目(cat_id)再搜索品牌", "error");
        return;
      }
      if (!name) {
        showBrandSummary("请输入品牌名", "error");
        return;
      }

      brandSearchBtn.dataset.pending = "1";
      const original = brandSearchBtn.innerHTML;
      brandSearchBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>搜索中';
      brandSearchBtn.disabled = true;
      try {
        const res = await postAuthedJson("/api/tiktok/searchBrand", { name, cat_id: Number(catId) });
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0") {
          showBrandSummary(res?.msg || "品牌搜索失败", "error");
          return;
        }
        const list = normalizeBrandList(res);
        lastBrandList = list;
        brandResults.innerHTML = '<option value="">选择品牌(可选)</option>';
        for (const b of list) {
          const opt = document.createElement("option");
          opt.value = String(b.id ?? "");
          const label = `${b.name ?? b.id ?? "-"}`;
          opt.textContent = label;
          brandResults.appendChild(opt);
        }
        updateBrandListView(brandSearchName?.value || "");
        showBrandSummary(list.length ? `找到 ${list.length} 个品牌` : "未找到品牌", list.length ? "info" : "error");
        updateBrandSelectedHint();
      } finally {
        brandSearchBtn.dataset.pending = "0";
        brandSearchBtn.disabled = false;
        brandSearchBtn.innerHTML = brandSearchBtnDefaultHtml || original;
      }
    });

    brandResults.addEventListener("change", () => {
      const brandId = brandResults.value;
      if (brandId) applyBrandSelection(brandId);
    });
  }

  if (brandTrigger) {
    brandTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      setBrandDropdown(!brandDropdownOpen);
    });
  }

  if (brandCloseBtn) {
    brandCloseBtn.addEventListener("click", () => setBrandDropdown(false));
  }

  if (brandDropdown) {
    brandDropdown.addEventListener("click", (e) => {
      if (e.target === brandDropdown) setBrandDropdown(false);
    });
  }

  if (brandSearchName) {
    brandSearchName.addEventListener("input", () => {
      updateBrandListView(brandSearchName.value);
      showBrandSummary("");
    });
  }

  if (brandList) {
    brandList.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-brand-id]");
      if (!btn) return;
      const brandId = btn.dataset.brandId;
      if (brandId) applyBrandSelection(brandId);
    });
  }

  if (brandClearBtn) {
    brandClearBtn.addEventListener("click", () => {
      const brandInput = document.getElementById("tiktok-brand-id");
      if (brandInput) brandInput.value = "";
      if (brandResults) brandResults.value = "";
      updateBrandListView(brandSearchName?.value || "");
      showBrandSummary("已清空品牌选择");
      queueDraftSave();
      renderTikTokStepper();
    });
  }

  if (brandResetBtn) {
    brandResetBtn.addEventListener("click", () => {
      if (!brandDefaultList.length) {
        showBrandSummary("暂无可重置的品牌数据", "error");
        return;
      }
      lastBrandList = brandDefaultList.slice();
      updateBrandListView(brandSearchName?.value || "");
      showBrandSummary("已重置到初始品牌列表");
    });
  }

  const setCreatePanelOpen = (open) => {
    if (!brandCreatePanel) return;
    const show = Boolean(open);
    brandCreatePanel.classList.toggle("hidden", !show);
    if (show && brandCreateName) {
      brandCreateName.focus();
    }
    if (!show && brandCreateName) {
      brandCreateName.value = "";
    }
  };

  if (brandCreateToggle) {
    brandCreateToggle.addEventListener("click", () => {
      const open = brandCreatePanel?.classList.contains("hidden");
      setCreatePanelOpen(open);
    });
  }
  if (brandCreateCancel) {
    brandCreateCancel.addEventListener("click", () => setCreatePanelOpen(false));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && brandDropdownOpen) setBrandDropdown(false);
  });

  if (brandCreateBtn) {
    brandCreateBtn.addEventListener("click", async () => {
      if (brandCreateBtn.dataset.pending === "1") return;
      const catId = catOut.textContent.trim();
      const name = brandCreateName?.value?.trim() || "";
      if (!catId || catId === "-") {
        showBrandSummary("请先选择末级类目(cat_id)", "error");
        return;
      }
      if (!name) {
        showBrandSummary("请输入新品牌名称", "error");
        return;
      }
      brandCreateBtn.dataset.pending = "1";
      const original = brandCreateBtn.innerHTML;
      brandCreateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>创建中';
      brandCreateBtn.disabled = true;
      try {
        const res = await postAuthedJson("/api/tiktok/createBrand", { name, cat_id: Number(catId) });
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0") {
          showBrandSummary(res?.msg || "创建品牌失败", "error");
          return;
        }
        showBrandSummary(res?.msg || "品牌创建成功", "success");
        if (String(res?.code) === "0" && res?.data?.brand_id) {
          const newId = String(res.data.brand_id);
          applyBrandSelection(newId);
          if (brandResults && !Array.from(brandResults.options).some((opt) => opt.value === newId)) {
            const opt = document.createElement("option");
            opt.value = newId;
            opt.textContent = `${name}`;
            brandResults.appendChild(opt);
          }
          if (name) {
            lastBrandList = [{ id: newId, name }, ...lastBrandList.filter((b) => String(b?.id ?? "") !== newId)];
            updateBrandListView(brandSearchName?.value || "");
          }
        }
        updateBrandSelectedHint();
        setCreatePanelOpen(false);
      } finally {
        brandCreateBtn.dataset.pending = "0";
        brandCreateBtn.disabled = false;
        brandCreateBtn.innerHTML = brandCreateBtnDefaultHtml || original;
      }
    });
  }

  if (warehousesBtn) {
    warehousesBtn.addEventListener("click", async () => {
      const res = await postAuthedJson("/api/tiktok/getWarehouseList", {});
      setPre(warehousesPre, res);

      if (warehouseSelect) {
        const list = Array.isArray(res?.data?.list) ? res.data.list : [];
        warehouseSelect.innerHTML = '<option value="">选择仓库(可选)</option>';
        for (const w of list) {
          const opt = document.createElement("option");
          opt.value = String(w.id ?? "");
          opt.textContent = `${w.name ?? w.id ?? "-"}`;
          warehouseSelect.appendChild(opt);
        }
      }
    });
  }

  if (warehouseSelect) {
    warehouseSelect.addEventListener("change", () => {
      const skuWarehouse = document.getElementById("tiktok-sku-warehouse-id");
      if (skuWarehouse && warehouseSelect.value) skuWarehouse.value = warehouseSelect.value;
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const catId = catOut.textContent.trim();
      if (!catId || catId === "-") {
        setPre(createPre, { code: "1", msg: "请选择末级类目(cat_id)" });
        return;
      }
      const brandId = getCurrentBrandId();
      if (!brandId) {
        setPre(createPre, { code: "1", msg: "请选择品牌" });
        return;
      }
      const brandName = brandId;
      syncGoodsDescField();
      const goodsDescHtml = sanitizeGoodsDesc(goodsDescField?.value ?? "");
      const goodsDescPayload = getGoodsDescText() ? goodsDescHtml : "";

      let extra = {};
      try {
        extra = parseJsonObject(document.getElementById("tiktok-extra-json")?.value);
      } catch {
        setPre(createPre, { code: "1", msg: "额外字段不是合法 JSON 对象" });
        return;
      }

      const basePayload = {
        goods_name: document.getElementById("tiktok-goods-name")?.value?.trim(),
        goods_sn: document.getElementById("tiktok-goods-sn")?.value?.trim(),
        ali_seller_sn: document.getElementById("tiktok-ali-seller-sn")?.value?.trim(),
        cat_id: catId,
        brandName,
        tiktok_brand_id: brandId,
        goods_brief: document.getElementById("tiktok-goods-brief")?.value?.trim(),
        goods_desc: goodsDescPayload,
        weight: document.getElementById("tiktok-package-weight")?.value?.trim(),
        unit: document.getElementById("tiktok-package-weight-unit")?.value?.trim(),
        wide: document.getElementById("tiktok-package-width")?.value?.trim(),
        high: document.getElementById("tiktok-package-height")?.value?.trim(),
        length: document.getElementById("tiktok-package-length")?.value?.trim(),
        tiktok_product_attributes: ensureJsonString(document.getElementById("tiktok-attrs-json")?.value),
        goods_img_json: ensureJsonString(document.getElementById("tiktok-img-json")?.value),
        ...extra,
      };
      const extraWarehouse = extra?.sku_warehouse_id ?? extra?.tiktok_warehouse_id;
      const extraWarehouseId = Array.isArray(extraWarehouse)
        ? String(extraWarehouse[0] ?? "").trim()
        : String(extraWarehouse ?? "").trim();
      const warehouseId = String(
        document.getElementById("tiktok-sku-warehouse-id")?.value ??
          warehouseSelect?.value ??
          extraWarehouseId ??
          ""
      ).trim();
      let payload = { ...basePayload };
      if (salesModeEnabled) {
        const combos = getTikTokSalesCombos();
        if (!salesAttrSelections.size) {
          setPre(createPre, { code: "1", msg: "请先选择销售属性名称" });
          return;
        }
        if (!combos.length) {
          setPre(createPre, { code: "1", msg: "请先为销售属性添加值" });
          return;
        }
        const skuRows = combos.map((combo) => {
          const goods_attrs = normalizeGoodsAttrKey(combo.map((x) => x.goods_attr_id).join(","));
          const label = combo.map((x) => `${x.specName}: ${x.value}`).join(" / ");
          const row = skuDraft.get(goods_attrs) || {};
          return { goods_attrs, label, ...row };
        });
        const missingSku = skuRows.find((row) => {
          const requiredFields = [
            "product_sn",
            "product_number",
            "product_price",
            "sku_identifier_type",
            "sku_identifier_code",
          ];
          return requiredFields.some((k) => !String(row?.[k] ?? "").trim());
        });
        if (missingSku) {
          setPre(createPre, { code: "1", msg: `请补全 SKU 组合信息：${missingSku.label}` });
          return;
        }
        const invalidSku = skuRows.find(
          (row) => !validateIdentifierCode(row?.sku_identifier_type, row?.sku_identifier_code)
        );
        if (invalidSku) {
          setPre(createPre, {
            code: "1",
            msg: `tiktok_identifier_code 格式不正确，请检查类型与长度规则：${invalidSku.label}`,
          });
          return;
        }
        const codes = skuRows
          .map((row) => normalizeIdentifierCode(row?.sku_identifier_code))
          .filter(Boolean);
        if (codes.length && new Set(codes).size !== codes.length) {
          setPre(createPre, { code: "1", msg: "tiktok_identifier_code 不能重复，请检查 SKU 组合" });
          return;
        }
        payload = {
          ...payload,
          easyswitch: 1,
          goods_attr: skuRows.map((r) => r.goods_attrs),
          product_sn: skuRows.map((r) => r.product_sn),
          product_number: skuRows.map((r) => r.product_number),
          product_price: skuRows.map((r) => r.product_price),
          tiktok_identifier_type: skuRows.map((r) => r.sku_identifier_type),
          tiktok_identifier_code: skuRows.map((r) => normalizeIdentifierCode(r.sku_identifier_code)),
        };
        if (warehouseId) payload.tiktok_warehouse_id = skuRows.map(() => warehouseId);
      } else {
        const simpleRow = skuDraft.get(SIMPLE_SKU_KEY) || {};
        const simpleType = String(simpleRow.sku_identifier_type ?? "").trim();
        const simpleCode = String(simpleRow.sku_identifier_code ?? "").trim();
        const simpleSn = String(simpleRow.product_sn ?? "").trim();
        const simpleStock = String(simpleRow.product_number ?? "").trim();
        const simplePrice = String(simpleRow.product_price ?? "").trim();
        payload = {
          ...payload,
          easyswitch: 0,
          sku_stock: simpleStock || document.getElementById("tiktok-sku-stock")?.value?.trim(),
          sku_price: simplePrice || document.getElementById("tiktok-sku-price")?.value?.trim(),
          sku_identifier_type: simpleType || document.getElementById("tiktok-sku-identifier-type")?.value?.trim(),
          sku_identifier_code: normalizeIdentifierCode(
            simpleCode || document.getElementById("tiktok-sku-identifier-code")?.value
          ),
          sku_sn: simpleSn || document.getElementById("tiktok-sku-sn")?.value?.trim(),
        };
        if (warehouseId) payload.sku_warehouse_id = warehouseId;
        if (!validateIdentifierCode(payload.sku_identifier_type, payload.sku_identifier_code)) {
          setPre(createPre, { code: "1", msg: "sku_identifier_code 格式不正确，请检查类型与长度规则" });
          return;
        }
      }

      if (!parseTikTokAttrsJson().length) {
        setPre(createPre, { code: "1", msg: "请先选择并记录至少 1 项属性（在模板里点选即可）" });
        return;
      }
      if (!parseTikTokImgJson().length) {
        setPre(createPre, { code: "1", msg: "请先上传至少 1 张商品图片" });
        return;
      }

      const required = [
        "goods_name",
        "goods_sn",
        "cat_id",
        "brandName",
        "goods_brief",
        "goods_desc",
        "weight",
        "unit",
        "wide",
        "high",
        "length",
        "tiktok_product_attributes",
        "goods_img_json",
      ];
      if (salesModeEnabled) {
        required.push(
          "goods_attr",
          "product_sn",
          "product_number",
          "product_price",
          "tiktok_identifier_type",
          "tiktok_identifier_code"
        );
      } else {
        required.push(
          "sku_stock",
          "sku_price",
          "sku_identifier_type",
          "sku_identifier_code",
          "sku_sn"
        );
      }
      const missing = required.filter((k) => {
        const value = payload[k];
        if (Array.isArray(value)) {
          return value.length === 0 || value.some((entry) => !String(entry ?? "").trim());
        }
        return !String(value ?? "").trim();
      });
      if (missing.length) {
        setPre(createPre, { code: "1", msg: `缺少必填：${missing.join(", ")}` });
        return;
      }

      const isEditing = Boolean(editingTikTokGoodsId);
      if (isEditing) {
        payload.goods_id = editingTikTokGoodsId;
        payload.id = editingTikTokGoodsId;
      }
      const endpoint = isEditing ? "/api/tiktok/update" : "/api/tiktok/insert";
      const res = await postAuthedJson(endpoint, payload);
      setPre(createPre, res);
      if (String(res?.code) === "0") {
        if (!isEditing) {
          clearDraft();
          draftState = null;
          draftApplied = false;
        }
      }
    });
  }
  if (stepBtn1) stepBtn1.addEventListener("click", () => tryGoStep(1));
  if (stepBtn2) stepBtn2.addEventListener("click", () => tryGoStep(2));
  if (stepBtn3) stepBtn3.addEventListener("click", () => tryGoStep(3));
  if (stepBtn4) stepBtn4.addEventListener("click", () => tryGoStep(4));
  if (stepBtn5) stepBtn5.addEventListener("click", () => tryGoStep(5));

  if (stepNext1) {
    stepNext1.addEventListener("click", async () => {
      const originalHtml = stepNext1.innerHTML;
      stepNext1.disabled = true;
      stepNext1.classList.add("opacity-70", "cursor-not-allowed");
      stepNext1.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>加载中...';
      const ok = await ensureTemplateReady();
      stepNext1.innerHTML = originalHtml;
      stepNext1.disabled = false;
      stepNext1.classList.remove("opacity-70", "cursor-not-allowed");
      if (!ok) return;
      unlockToStep(2);
      setUploadStep(2);
    });
  }
  if (stepNext2) {
    stepNext2.addEventListener("click", () => {
      if (String(lastTemplateRes?.code ?? "") !== "0") {
        showTemplateMsg("\u8bf7\u5148\u83b7\u53d6\u5c5e\u6027\u6a21\u677f\u3002");
        return;
      }
      const missing = getRequiredAttrMissing();
      if (missing.length) {
        const names = missing.map((x) => x.name).filter(Boolean);
        const label = names.length ? names.slice(0, 6).join("\u3001") : "\u5fc5\u586b\u5c5e\u6027";
        showTemplateMsg(`\u8bf7\u5148\u9009\u62e9\u5fc5\u586b\u5c5e\u6027\uff1a${label}`);
        return;
      }
      if (!getCurrentBrandId()) {
        showTemplateMsg("\u8bf7\u5148\u9009\u62e9\u54c1\u724c\u3002");
        return;
      }
      unlockToStep(3);
      setUploadStep(3);
    });
  }
  if (stepNext3) {
    stepNext3.addEventListener("click", () => {
      const imgs = parseTikTokImgJson();
      if (!imgs.length && uploadPendingCount === 0) {
        showUploadMsg("\u8bf7\u5148\u4e0a\u4f20\u5546\u54c1\u56fe\u7247\u3002");
        return;
      }
      const missingCerts = getRequiredCertMissing();
      if (missingCerts.length) {
        const names = missingCerts.map((c) => c.name || c.id).filter(Boolean);
        const label = names.length ? names.slice(0, 6).join("\u3001") : "\u8bc1\u4e66";
        showUploadMsg(`\u8bf7\u5148\u4e0a\u4f20\u8bc1\u4e66\uff1a${label}`);
        return;
      }
      showUploadMsg("");
      unlockToStep(4);
      setUploadStep(4);
    });
  }
  if (stepNext4) {
    stepNext4.addEventListener("click", () => {
      const descPanel = document.getElementById("tiktok-panel-desc");
      let descInlineMsg = descPanel?.querySelector?.("[data-step4-inline-msg]");
      if (descPanel && !descInlineMsg) {
        descInlineMsg = document.createElement("div");
        descInlineMsg.dataset.step4InlineMsg = "1";
        descInlineMsg.className =
          "hidden mt-2 text-xs px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700";
        descPanel.appendChild(descInlineMsg);
      }
      if (!isDescOk()) {
        if (descInlineMsg) {
          const missing = getMissingDescFields();
          descInlineMsg.textContent = missing.length
            ? `请先填写：${missing.join("、")}`
            : "请先填写商品名称/货号/描述/包装信息。";
          descInlineMsg.classList.remove("hidden");
        }
        return;
      }
      if (descInlineMsg) descInlineMsg.classList.add("hidden");
      unlockToStep(5);
      setUploadStep(5);
      const step5Panel = document.getElementById("tiktok-panel-submit");
      if (step5Panel && step5Panel.classList.contains("hidden") && descInlineMsg) {
        descInlineMsg.textContent = "步骤 5 未显示，请刷新页面或检查步骤模板是否完整。";
        descInlineMsg.classList.remove("hidden");
      }
    });
  }
  if (stepBack2) stepBack2.addEventListener("click", () => {
    setUploadStep(1);
  });
  if (stepBack3) stepBack3.addEventListener("click", () => {
    setUploadStep(2);
  });
  if (stepBack4) stepBack4.addEventListener("click", () => {
    setUploadStep(3);
  });
  setUploadStep(1);
  // Initial UI render
  renderAttrSummary();
  renderTikTokImagePreview();
  renderCertifications();
  [
    "tiktok-goods-name",
    "tiktok-goods-sn",
    "tiktok-goods-brief",
    "tiktok-package-weight",
    "tiktok-package-weight-unit",
    "tiktok-package-width",
    "tiktok-package-height",
    "tiktok-package-length",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const descPanel = document.getElementById("tiktok-panel-desc");
      const descInlineMsg = descPanel?.querySelector?.("[data-step4-inline-msg]");
      if (descInlineMsg && isDescOk()) descInlineMsg.classList.add("hidden");
      renderTikTokStepper();
    });
    el.addEventListener("change", renderTikTokStepper);
  });
}
