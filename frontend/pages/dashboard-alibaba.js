import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupAlibabaTools() {
  if (!isAlibabaUser()) return;

  const stage = document.getElementById("ali-tool-stage");
  const stageTitle = document.getElementById("ali-tool-stage-title");
  const stageDesc = document.getElementById("ali-tool-stage-desc");
  const stageWrap = document.getElementById("ali-tool-stage-wrap");
  const backBtn = document.getElementById("ali-tool-back");
  const cardsArea = document.getElementById("ali-tool-cards-area");
  const configBtn = document.getElementById("ali-config-btn");
  if (!stage || !stageTitle || !stageDesc || !stageWrap) return;

  const cards = Array.from(document.querySelectorAll("[data-ali-tool-card]"));
  const templates = {
    config: document.getElementById("tpl-ali-config"),
    "url-extract": document.getElementById("tpl-ali-url-extract"),
    "url-push": document.getElementById("tpl-ali-url-push"),
    "elegate-browser": document.getElementById("tpl-ali-elegate-browser"),
    "alibaba-products": document.getElementById("tpl-ali-alibaba-products"),
    openapi: document.getElementById("tpl-ali-openapi"),
  };

  const meta = {
    config: { title: "配置管理", desc: "查看/解锁/保存 elegate & OpenAPI 参数" },
    "url-extract": { title: "URL 提取", desc: "从 Alibaba URL 提取 product_id" },
    "url-push": { title: "URL 推送", desc: "粘贴 URL 自动解析 product_id 并一键推送" },
    "elegate-browser": { title: "Ele-Gate 商品", desc: "列表浏览并查看商品详情" },
    "alibaba-products": { title: "Alibaba 商品", desc: "列表浏览、查看详情，并在列表里推送到 TikTok/Shein/TEMU" },
    openapi: { title: "拉取详情（OpenAPI）", desc: "通过 OpenAPI 拉取商品详情 JSON" },
  };

  const state = {
    config: null,
    lastUrl: "",
    lastProductId: "",
    lastProductData: null,
    urlPushItems: [],
  };

  function safeImgUrl(url) {
    const u = safeExternalUrl(url);
    // allow protocol-relative urls from Alibaba CDN
    if (u.startsWith("//")) return `https:${u}`;
    return u;
  }

  function renderImageStrip(urls) {
    const list = (urls || []).map((u) => safeImgUrl(String(u || "").trim())).filter(Boolean);
    if (!list.length) return "";
    const items = list
      .slice(0, 10)
      .map(
        (u) => `
          <button type="button" data-view-image="${escapeHtml(u)}" class="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-accent/50">
            <img src="${escapeHtml(u)}" alt="img" loading="lazy" class="w-full h-full object-cover" />
          </button>
        `
      )
      .join("");
    return `<div class="flex flex-wrap gap-2">${items}</div>`;
  }

  function renderKvGrid(items) {
    const pairs = (items || []).filter((x) => x && x.value !== undefined && x.value !== null && String(x.value).trim() !== "");
    if (!pairs.length) return "";
    const rows = pairs
      .map(
        (it) => `
          <div class="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${escapeHtml(it.label)}</div>
            <div class="mt-1 text-xs text-slate-800 break-all">${renderAnyValue(it.value, it.label)}</div>
          </div>
        `
      )
      .join("");
    return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${rows}</div>`;
  }

  function isProbablyImageUrl(url) {
    const u = String(url || "").trim().toLowerCase();
    if (!u) return false;
    if (u.startsWith("//")) return true;
    if (!u.startsWith("http://") && !u.startsWith("https://")) return false;
    return /\.(png|jpe?g|webp|gif)(\?|#|$)/.test(u);
  }

  function isProbablyUrl(url) {
    const u = String(url || "").trim().toLowerCase();
    if (!u) return false;
    return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("//");
  }

  function extractProductIdFromUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "";
    const m = raw.match(/(\d{6,})/);
    return m ? m[1] : "";
  }

  function pickProductDataFromDesc(descRes) {
    const resp = descRes?.data || {};
    if (resp?.result?.result_data && typeof resp.result.result_data === "object") return resp.result.result_data;
    if (resp?.result_data && typeof resp.result_data === "object") return resp.result_data;
    if (resp?.data && typeof resp.data === "object") return resp.data;
    return null;
  }

  function pickProductTitle(d) {
    if (!d || typeof d !== "object") return "";
    return (
      d.subject ||
      d.title ||
      d.name ||
      d.product_title ||
      d.productName ||
      d.product_info?.subject ||
      d.productInfo?.subject ||
      ""
    );
  }

  function pickProductPrice(d) {
    if (!d || typeof d !== "object") return "";
    const priceObj = d.price || d.sale_price || d.minPrice || d.originalPrice || "";
    if (priceObj && typeof priceObj === "object" && priceObj.value !== undefined) return priceObj.value;
    if (typeof priceObj === "number" || typeof priceObj === "string") return priceObj;
    if (d.min_price) return d.min_price;
    return "";
  }

  function pickProductImages(d) {
    if (!d || typeof d !== "object") return [];
    const imgs = [];
    const main = d.main_image || d.mainImage || d.image || d.mainPic || d.main_img || "";
    if (main) imgs.push(main);
    const candidates = [d.images, d.image_list, d.gallery, d.image?.images, d.image?.imageList, d.product_image_list];
    candidates.forEach((arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((x) => {
        const v = x?.imgUrl || x?.url || x;
        if (v) imgs.push(v);
      });
    });
    return imgs.filter(Boolean);
  }

  function sanitizeHtmlToFragment(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(html || ""), "text/html");

      // Remove dangerous nodes
      doc.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((el) => el.remove());

      // Remove duplicated vendor title "Product Description" (we render our own title)
      const titleNodes = Array.from(doc.querySelectorAll("h1,h2,h3,h4,div,span,strong"));
      titleNodes
        .filter((n) => String(n.textContent || "").trim().toLowerCase() === "product description")
        .forEach((n) => n.remove());

      // Remove dangerous attrs + decorate
      doc.querySelectorAll("*").forEach((el) => {
        // remove event handlers / inline styles
        Array.from(el.attributes || []).forEach((a) => {
          const name = String(a.name || "").toLowerCase();
          const val = String(a.value || "");
          if (name.startsWith("on")) el.removeAttribute(a.name);
          if (name === "style") el.removeAttribute(a.name);
          if ((name === "href" || name === "src") && /^\s*javascript:/i.test(val)) el.removeAttribute(a.name);
        });

        const tag = el.tagName.toLowerCase();
        if (tag === "a") {
          const href = el.getAttribute("href") || "";
          const u = safeExternalUrl(href);
          if (u) {
            el.setAttribute("href", u);
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
            el.setAttribute("data-open-url", u);
            el.className = "text-accent font-semibold hover:underline break-all";
          } else {
            el.removeAttribute("href");
          }
        }

        if (tag === "img") {
          const src = el.getAttribute("src") || "";
          const u = safeImgUrl(src);
          if (u) {
            el.setAttribute("src", u);
            el.setAttribute("loading", "lazy");
            el.setAttribute("data-view-image", u);
            el.className = "max-w-full h-auto rounded-xl border border-slate-200 bg-white";
          } else {
            el.remove();
          }
        }

        // Basic typography classes (overwrite to avoid messy vendor HTML)
        if (tag === "h1") el.className = "text-lg font-black text-slate-900 mt-4";
        if (tag === "h2") el.className = "text-base font-black text-slate-900 mt-3";
        if (tag === "h3") el.className = "text-sm font-black text-slate-900 mt-3";
        if (tag === "p") el.className = "text-sm text-slate-700 leading-relaxed mt-2";
        if (tag === "ul") el.className = "list-disc pl-5 text-sm text-slate-700 mt-2 space-y-1";
        if (tag === "ol") el.className = "list-decimal pl-5 text-sm text-slate-700 mt-2 space-y-1";
        if (tag === "li") el.className = "leading-relaxed";
        if (tag === "table") el.className = "w-full text-left border-collapse mt-2";
        if (tag === "th") el.className = "text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1";
        if (tag === "td") el.className = "text-xs text-slate-700 border border-slate-200 px-2 py-1 align-top";
        if (tag === "blockquote") el.className = "border-l-4 border-accent/30 pl-3 text-sm text-slate-700 mt-2";
      });

      return doc.body;
    } catch {
      return null;
    }
  }

  function renderRichHtml(html) {
    const src = String(html || "").trim();
    if (!src) return "";
    const body = sanitizeHtmlToFragment(src);
    const safe = body ? body.innerHTML : escapeHtml(src);
    return `<div class="rounded-2xl border border-slate-100 bg-white p-4">
      <div class="text-sm font-black text-slate-900 flex items-center gap-2"><i class="fas fa-file-lines text-accent"></i>商品描述</div>
      <div class="mt-3 text-slate-700 text-sm leading-relaxed">${safe}</div>
    </div>`;
  }

  function renderAnyValue(value, keyHint) {
    if (value === null || value === undefined || value === "") return `<span class="text-slate-400">-</span>`;
    if (typeof value === "boolean") {
      const ok = value;
      return `<span class="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold ${ok ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-200 text-slate-600"}">${ok ? "TRUE" : "FALSE"}</span>`;
    }
    if (typeof value === "number") return `<span class="font-semibold">${escapeHtml(String(value))}</span>`;
    if (typeof value === "string") {
      const v = value.trim();
      const hint = String(keyHint || "").toLowerCase();
      if (hint.includes("description") && /<[^>]+>/.test(v)) {
        return renderRichHtml(v);
      }
      if (isProbablyImageUrl(v) || String(keyHint || "").toLowerCase().includes("image")) {
        const u = safeImgUrl(v);
        return u
          ? `<button type="button" data-view-image="${escapeHtml(u)}" class="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white">
               <img src="${escapeHtml(u)}" alt="img" loading="lazy" class="w-full h-full object-cover" />
             </button>`
          : `<span class="text-slate-400">-</span>`;
      }
      if (isProbablyUrl(v) || String(keyHint || "").toLowerCase().includes("url") || String(keyHint || "").toLowerCase().includes("link") || String(keyHint || "").toLowerCase().includes("permalink")) {
        const u = safeImgUrl(v);
        return u
          ? `<button type="button" data-open-url="${escapeHtml(u)}" class="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline break-all">
               <i class="fas fa-arrow-up-right-from-square text-[11px]"></i><span>${escapeHtml(u)}</span>
             </button>`
          : `<span class="text-slate-400">-</span>`;
      }
      return `<span class="font-semibold break-all">${escapeHtml(v)}</span>`;
    }
    if (Array.isArray(value)) {
      if (!value.length) return `<span class="text-slate-400">[]</span>`;

      const allStrings = value.every((x) => typeof x === "string");
      if (allStrings && value.every((x) => isProbablyImageUrl(x) || String(keyHint || "").toLowerCase().includes("gallery"))) {
        return renderImageStrip(value);
      }
      if (allStrings && value.every((x) => !isProbablyUrl(x))) {
        const chips = value
          .slice(0, 80)
          .map((x) => `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">${escapeHtml(String(x))}</span>`)
          .join(" ");
        return `<div class="flex flex-wrap gap-2">${chips}</div>`;
      }

      // array of objects or mixed types: render cards
      const cards = value
        .slice(0, 50)
        .map((item, idx) => {
          const inner = renderObjectSection(item, `${keyHint || "item"}[${idx}]`);
          return `<div class="rounded-xl border border-slate-100 bg-white p-3">${inner}</div>`;
        })
        .join("");
      const more = value.length > 50 ? `<div class="text-[11px] text-slate-400 mt-2">... 仅展示前 50 条</div>` : "";
      return `<div class="space-y-2">${cards}${more}</div>`;
    }
    if (typeof value === "object") {
      return renderObjectSection(value, keyHint);
    }
    return `<span class="text-slate-400">-</span>`;
  }

  function renderObjectSection(obj, titleHint) {
    if (!obj || typeof obj !== "object") return `<span class="text-slate-400">-</span>`;
    const entries = Object.entries(obj);
    if (!entries.length) return `<span class="text-slate-400">{}</span>`;

    // Render primitives first in a grid, then nested sections below.
    const primitiveItems = [];
    const nestedItems = [];

    for (const [k, v] of entries) {
      const isPrimitive = v === null || v === undefined || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
      if (isPrimitive) primitiveItems.push({ label: k, value: v });
      else nestedItems.push([k, v]);
    }

    const primHtml = renderKvGrid(primitiveItems);
    const nestedHtml = nestedItems
      .map(([k, v]) => {
        return `
          <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div class="text-xs font-black text-slate-900">${escapeHtml(String(k))}</div>
            <div class="mt-2">${renderAnyValue(v, k)}</div>
          </div>
        `;
      })
      .join("");

    const header = titleHint ? `<div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">${escapeHtml(String(titleHint))}</div>` : "";
    return `<div class="space-y-3">${header}${primHtml}${nestedHtml}</div>`;
  }

  async function ensureConfigLoaded() {
    if (state.config) return state.config;
    const res = await postAuthedJson("/api/alibaba_tool/config_get", {});
    if (String(res?.code) !== "0") throw new Error(res?.msg || "config_get failed");
    state.config = res?.data?.effective || {};
    return state.config;
  }

  function setActiveCard(toolId) {
    cards.forEach((btn) => {
      const active = btn.dataset.aliToolCard === toolId;
      btn.classList.toggle("ring-2", active);
      btn.classList.toggle("ring-accent/30", active);
      btn.classList.toggle("border-accent/40", active);
      btn.classList.toggle("scale-[1.01]", active);
    });
  }

  let focusedToolId = "";

  function enterFocusMode(toolId) {
    focusedToolId = String(toolId || "");
    if (cardsArea) {
      cardsArea.hidden = true;
      cardsArea.classList.add("hidden");
    }
    stageWrap.hidden = false;
    stageWrap.classList.remove("hidden");

    backBtn?.classList.remove("hidden");
  }

  function exitFocusMode() {
    focusedToolId = "";
    if (cardsArea) {
      cardsArea.hidden = false;
      cardsArea.classList.remove("hidden");
    }
    stageWrap.hidden = true;
    stageWrap.classList.add("hidden");

    backBtn?.classList.add("hidden");
    setActiveCard("__none__");
    stageTitle.textContent = "";
    stageDesc.textContent = "";
    try {
      const heroTitle = document.getElementById("ali-hero-title");
      const heroDesc = document.getElementById("ali-hero-desc");
      if (heroTitle) heroTitle.textContent = "Alibaba 工具";
      if (heroDesc) heroDesc.textContent = "按功能卡片选择，点开再填写";
    } catch {
      // ignore
    }
    stage.replaceChildren();
  }

  function renderTemplate(toolId) {
    const tpl = templates[toolId];
    if (!tpl?.content) return null;
    stage.replaceChildren(tpl.content.cloneNode(true));
    return stage;
  }

  function setupConfigPanel() {
    const root = stage;
    const cfgRefresh = root.querySelector("#ali-cfg-refresh");
    const cfgUnlock = root.querySelector("#ali-cfg-unlock");
    const cfgSave = root.querySelector("#ali-cfg-save");
    const cfgTip = root.querySelector("#ali-cfg-tip");

    const cfgInputs = [
      ["ELEGATE_BASE_ORIGIN", root.querySelector("#ali-cfg-elegate-base-origin")],
      ["ELEGATE_CONSUMER_KEY", root.querySelector("#ali-cfg-elegate-consumer-key")],
      ["ELEGATE_CONSUMER_SECRET", root.querySelector("#ali-cfg-elegate-consumer-secret")],
      ["ALI_OPENAPI_ACCESS_TOKEN", root.querySelector("#ali-cfg-openapi-access-token")],
      ["ALI_OPENAPI_APP_KEY", root.querySelector("#ali-cfg-openapi-app-key")],
      ["ALI_OPENAPI_APP_SECRET", root.querySelector("#ali-cfg-openapi-app-secret")],
      ["ALI_OPENAPI_SERVER_URL", root.querySelector("#ali-cfg-openapi-server-url")],
      ["ALI_COUNTRY_DEFAULT", root.querySelector("#ali-cfg-country-default")],
      ["ALI_PRICE_MULTIPLIER", root.querySelector("#ali-cfg-price-multiplier")],
      ["ALI_PUSH_TIKTOK_URL", root.querySelector("#ali-cfg-push-tiktok-url")],
      ["ALI_PUSH_SHEIN_URL", root.querySelector("#ali-cfg-push-shein-url")],
      ["ALI_PUSH_TEMU_URL", root.querySelector("#ali-cfg-push-temu-url")],
    ];

    if (!cfgRefresh || !cfgUnlock || !cfgSave) return;

    let unlocked = false;

    const setConfigLocked = (locked) => {
      unlocked = !locked;
      cfgInputs.forEach(([, el]) => {
        if (!el) return;
        el.disabled = locked;
      });
      cfgSave.disabled = locked;
      cfgUnlock.innerHTML = locked ? '<i class="fas fa-lock mr-1"></i>解锁' : '<i class="fas fa-lock-open mr-1"></i>已解锁';
      if (cfgTip) cfgTip.textContent = locked ? "默认锁定，修改需解锁并确认。" : "已解锁：可编辑并保存到 backend/.env。";
    };

    const fillConfig = (effective) => {
      cfgInputs.forEach(([k, el]) => {
        if (!el) return;
        el.value = effective?.[k] ?? "";
      });
    };

    const loadConfig = async () => {
      cfgRefresh.disabled = true;
      try {
        const res = await postAuthedJson("/api/alibaba_tool/config_get", {});
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          if (cfgTip) cfgTip.textContent = res?.msg || "配置加载失败";
          return;
        }
        state.config = res?.data?.effective || {};
        fillConfig(state.config);
      } catch {
        if (cfgTip) cfgTip.textContent = "网络异常，配置加载失败。";
      } finally {
        cfgRefresh.disabled = false;
      }
    };

    cfgRefresh.addEventListener("click", loadConfig);

    cfgUnlock.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!unlocked) {
        const ok = await showConfirmPopover(cfgUnlock, {
          title: "解锁配置",
          message: "这些值影响上品与查询工具。\n确认解锁并允许编辑？",
          confirmText: "解锁",
          cancelText: "取消",
          tone: "danger",
        });
        if (!ok) return;
        setConfigLocked(false);
      }
    });

    cfgSave.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!unlocked) return;

      const updates = {};
      cfgInputs.forEach(([k, el]) => {
        if (!el) return;
        updates[k] = String(el.value ?? "").trim();
      });

      const ok = await showConfirmPopover(cfgSave, {
        title: "保存配置",
        message: "将写入 backend/.env 并覆盖对应 KEY。\n确认保存？",
        confirmText: "保存",
        cancelText: "取消",
        tone: "danger",
      });
      if (!ok) return;

      cfgSave.disabled = true;
      try {
        const res = await postAuthedJson("/api/alibaba_tool/config_set", { confirm: "1", updates });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          if (cfgTip) cfgTip.textContent = res?.msg || "保存失败";
          return;
        }
        setConfigLocked(true);
        await loadConfig();
      } catch {
        if (cfgTip) cfgTip.textContent = "网络异常，保存失败。";
      } finally {
        cfgSave.disabled = !unlocked;
      }
    });

    setConfigLocked(true);
    loadConfig();
  }

  function setupUrlExtractPanel() {
    const root = stage;
    const urlInput = root.querySelector("#ali-url-input");
    const urlExtract = root.querySelector("#ali-url-extract");
    const urlProductId = root.querySelector("#ali-url-product-id");
    const urlCopy = root.querySelector("#ali-url-copy");
    const summary = root.querySelector("#ali-url-summary");

    if (!urlExtract || !urlInput || !urlProductId) return;

    urlExtract.addEventListener("click", async () => {
      urlExtract.disabled = true;
      const original = urlExtract.textContent;
      urlExtract.textContent = "处理中...";
      try {
        state.lastUrl = String(urlInput.value || "").trim();
        const res = await postAuthedJson("/api/alibaba_tool/url_extract", { url: urlInput.value });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          urlProductId.value = "";
          if (summary) summary.textContent = res?.msg || "提取失败";
          return;
        }
        const pid = String(res?.data?.product_id ?? "").trim();
        urlProductId.value = pid;
        state.lastProductId = pid;
        if (summary) summary.textContent = `提取成功：product_id=${pid}`;
      } catch {
        if (summary) summary.textContent = "网络异常，提取失败。";
      } finally {
        urlExtract.disabled = false;
        urlExtract.textContent = original || "提取";
      }
    });

    if (urlCopy && urlProductId) {
      urlCopy.addEventListener("click", async () => {
        const v = String(urlProductId.value || "").trim();
        if (!v) return;
        const ok = await copyToClipboard(v);
        if (summary) summary.textContent = ok ? "已复制 product_id" : "复制失败";
      });
    }
  }

  function setupUrlPushPanel() {
    const root = stage;
    const textArea = root.querySelector("#ali-url-push-text");
    const countryEl = root.querySelector("#ali-url-push-country");
    const multEl = root.querySelector("#ali-url-push-mult");
    const parseBtn = root.querySelector("#ali-url-push-parse");
    const runBtn = root.querySelector("#ali-url-push-run");
    const clearBtn = root.querySelector("#ali-url-push-clear");
    const summary = root.querySelector("#ali-url-push-summary");
    const listEl = root.querySelector("#ali-url-push-list");
    const platTikTok = root.querySelector("#ali-url-push-plat-tiktok");
    const platShein = root.querySelector("#ali-url-push-plat-shein");
    const platTemu = root.querySelector("#ali-url-push-plat-temu");

    if (!textArea || !parseBtn || !runBtn || !listEl) return;

    (async () => {
      try {
        const cfg = await ensureConfigLoaded();
        if (countryEl && !countryEl.value) countryEl.value = cfg?.ALI_COUNTRY_DEFAULT || "";
        if (multEl && !multEl.value) multEl.value = cfg?.ALI_PRICE_MULTIPLIER || "21";
      } catch {
        // ignore
      }
    })();

    const setSummary = (msg) => {
      if (summary) summary.textContent = msg;
    };

    const renderList = () => {
      const items = state.urlPushItems || [];
      const hasPushable = items.some((it) => it.productData);
      runBtn.disabled = !hasPushable;
      if (!items.length) {
        listEl.innerHTML =
          '<div class="text-xs text-slate-500 px-3 py-2 rounded-xl border border-dashed border-slate-200 bg-slate-50">粘贴 URL 后点击“解析预览”即可查看详情</div>';
        return;
      }
      const statusBadge = (it) => {
        const s = it.status || "pending";
        const text = it.msg || "";
        if (s === "ok") return `<span class="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] font-bold">已解析</span>`;
        if (s === "pushing") return `<span class="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">推送中</span>`;
        if (s === "pushed") return `<span class="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] font-bold">推送完成</span>`;
        if (s === "fail") return `<span class="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-700 text-[11px] font-bold">失败</span>`;
        if (s === "invalid") return `<span class="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-700 text-[11px] font-bold">未识别</span>`;
        if (s === "loading") return `<span class="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 text-[11px] font-bold">解析中</span>`;
        return `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold">待解析</span>`;
      };

      const cards = items
        .map((it, idx) => {
          const imgs = pickProductImages(it.productData || {});
          const hero = imgs.length
            ? `<button type="button" data-view-image="${escapeHtml(safeImgUrl(imgs[0]))}" class="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white">
                <img src="${escapeHtml(safeImgUrl(imgs[0]))}" alt="img" loading="lazy" class="w-full h-full object-cover" />
              </button>`
            : `<div class="w-20 h-20 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400">无图</div>`;
          const title = escapeHtml(it.title || "(无标题)");
          const price = escapeHtml(String(it.price || "-"));
          const pid = escapeHtml(String(it.pid || ""));
          const urlText = escapeHtml(String(it.url || ""));
          const msg = escapeHtml(String(it.msg || ""));
          const pushView =
            it.pushResult && Object.keys(it.pushResult).length
              ? `<pre class="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded-xl border border-slate-100 p-2 overflow-auto">${escapeHtml(
                  JSON.stringify(it.pushResult, null, 2),
                )}</pre>`
              : "";

          return `
            <div class="rounded-2xl border border-slate-100 bg-white p-3 space-y-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-[11px] text-slate-400">#${idx + 1} · product_id: <span class="font-semibold text-slate-800">${pid || "未识别"}</span></div>
                  <div class="text-sm font-black text-slate-900 truncate">${title}</div>
                  <div class="text-xs text-slate-500 mt-1 break-all">${urlText}</div>
                </div>
                ${statusBadge(it)}
              </div>
              <div class="flex items-center gap-3">
                ${hero}
                <div class="text-xs text-slate-600 space-y-1">
                  <div>价格：<span class="font-semibold">${price || "-"}</span></div>
                  <div>国家：${escapeHtml(countryEl?.value || "-")}</div>
                  <div>状态：${msg || (it.status === "ok" ? "可推送" : "等待操作")}</div>
                </div>
              </div>
              ${pushView}
            </div>
          `;
        })
        .join("");
      listEl.innerHTML = cards;
    };

    const setLoading = (v) => {
      parseBtn.disabled = v;
      runBtn.disabled = v || !(state.urlPushItems || []).some((it) => it.productData);
    };

    const doParse = async () => {
      const lines = String(textArea.value || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      state.urlPushItems = [];
      renderList();
      if (!lines.length) {
        setSummary("请输入至少一个商品 URL");
        return;
      }

      setLoading(true);
      setSummary("解析中...");
      const seen = new Set();
      const items = [];
      for (const line of lines) {
        const pid = extractProductIdFromUrl(line);
        if (!pid) {
          items.push({ url: line, pid: "", status: "invalid", msg: "未识别 product_id" });
          continue;
        }
        if (seen.has(pid)) continue;
        seen.add(pid);
        items.push({ url: line, pid, status: "loading" });
      }

      renderList();

      for (const it of items) {
        if (!it.pid) continue;
        try {
          const country = countryEl?.value || "";
          const res = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", { product_id: it.pid, country });
          if (String(res?.code) === "2") return;
          if (String(res?.code) !== "0") {
            it.status = "fail";
            it.msg = res?.msg || "拉取详情失败";
            renderList();
            continue;
          }
          const data = pickProductDataFromDesc(res);
          if (!data) {
            it.status = "fail";
            it.msg = "未获取到 product_data";
            renderList();
            continue;
          }
          it.productData = data;
          it.title = pickProductTitle(data);
          it.price = pickProductPrice(data);
          it.status = "ok";
          it.msg = "已解析，待推送";
          renderList();
        } catch {
          it.status = "fail";
          it.msg = "网络异常";
          renderList();
        }
      }

      state.urlPushItems = items;
      const okCount = items.filter((x) => x.productData).length;
      setSummary(okCount ? `解析完成，可推送 ${okCount} 条` : "解析完成，没有可推送的商品");
      setLoading(false);
    };

    parseBtn.addEventListener("click", doParse);

    runBtn.addEventListener("click", async () => {
      const items = (state.urlPushItems || []).filter((it) => it.productData);
      const platforms = [
        platTikTok?.checked ? "tiktok" : null,
        platShein?.checked ? "shein" : null,
        platTemu?.checked ? "temu" : null,
      ].filter(Boolean);
      if (!items.length) {
        setSummary("请先解析出可推送的商品");
        return;
      }
      if (!platforms.length) {
        setSummary("请至少选择一个平台");
        return;
      }
      const ok = await showConfirmPopover(runBtn, {
        title: "确认推送",
        message: `即将推送 ${items.length} 个商品到 ${platforms.join("/")}，确定继续吗？`,
        confirmText: "推送",
        cancelText: "取消",
        tone: "primary",
      });
      if (!ok) return;

      setSummary("推送中...");
      runBtn.disabled = true;
      parseBtn.disabled = true;
      let successCount = 0;
      for (const it of items) {
        it.status = "pushing";
        it.msg = "推送中...";
        renderList();
        try {
          const res = await postAuthedJson("/api/alibaba_tool/product_push", {
            product_data: it.productData,
            country: countryEl?.value || "",
            price_multiplier: multEl?.value || "21",
            platforms,
          });
          if (String(res?.code) === "2") return;
          if (String(res?.code) !== "0") {
            it.status = "fail";
            it.msg = res?.msg || "推送失败";
            renderList();
            continue;
          }
          it.status = "pushed";
          it.msg = "推送完成";
          it.pushResult = res?.data || {};
          successCount += 1;
          renderList();
        } catch {
          it.status = "fail";
          it.msg = "网络异常";
          renderList();
        }
      }

      setSummary(`推送完成：成功 ${successCount} / ${items.length}`);
      parseBtn.disabled = false;
      runBtn.disabled = !items.some((x) => x.productData);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        textArea.value = "";
        state.urlPushItems = [];
        setSummary("-");
        renderList();
      });
    }

    renderList();
  }

  function renderElegateDetail(d, detailEl, summaryEl, openBtn) {
    if (!detailEl) return;
    const title = d?.title || d?.name || d?.product_title || "";
    const sku = d?.sku || d?.id || d?.product_id || "";
    const price = d?.sale_price || d?.price || d?.regular_price || "";
    const stock = d?.stock ?? "";
    const inStock = d?.in_stock ?? "";
    const permalink = d?.permalink || d?.url || "";

    if (summaryEl) {
      const parts = [
        title && `标题：${title}`,
        sku && `SKU：${sku}`,
        price && `价格：${price}`,
        stock !== "" && stock !== null ? `库存：${stock}` : "",
        typeof inStock === "boolean" ? (inStock ? "有货" : "无货") : "",
      ].filter(Boolean);
      summaryEl.textContent = parts.length ? parts.join(" · ") : "加载成功";
    }

    if (openBtn) {
      const u = safeExternalUrl(permalink);
      if (u) {
        openBtn.classList.remove("hidden");
        openBtn.dataset.openUrl = u;
      } else {
        openBtn.classList.add("hidden");
        openBtn.dataset.openUrl = "";
      }
    }

    const mainImage = d?.image || d?.main_image || "";
    const gallery = Array.isArray(d?.gallery) ? d.gallery : Array.isArray(d?.images) ? d.images : [];
    const allImgs = [mainImage, ...gallery].filter(Boolean);

    const hero = mainImage
      ? `
          <button type="button" data-view-image="${escapeHtml(safeImgUrl(mainImage))}" class="w-full sm:w-[220px] aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <img src="${escapeHtml(safeImgUrl(mainImage))}" alt="main" loading="lazy" class="w-full h-full object-cover" />
          </button>
        `
      : `<div class="w-full sm:w-[220px] aspect-square rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">无主图</div>`;

    const quick = renderKvGrid([
      { label: "id", value: d?.id },
      { label: "sku", value: d?.sku },
      { label: "type", value: d?.type },
      { label: "category", value: d?.category },
      { label: "price", value: d?.price },
      { label: "regular_price", value: d?.regular_price },
      { label: "sale_price", value: d?.sale_price },
      { label: "stock", value: d?.stock },
      { label: "stock_status", value: d?.stock_status },
      { label: "in_stock", value: d?.in_stock },
      { label: "permalink", value: d?.permalink },
      { label: "weight", value: d?.weight },
    ]);

    const full = renderObjectSection(d, "");

    detailEl.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          ${hero}
          <div class="flex-1 min-w-0">
            <div class="text-base font-black text-slate-900 break-words">${escapeHtml(String(title || "-"))}</div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              ${
                sku
                  ? `<span class="inline-flex items-center px-2 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700">SKU: ${escapeHtml(
                      String(sku),
                    )}${renderCopyBtn(sku, "复制 SKU")}</span>`
                  : ""
              }
              ${
                d?.id
                  ? `<span class="inline-flex items-center px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">ID: ${escapeHtml(
                      String(d.id),
                    )}${renderCopyBtn(d.id, "复制 ID")}</span>`
                  : ""
              }
            </div>
            <div class="mt-3">${quick}</div>
          </div>
        </div>
        ${allImgs.length ? `<div><div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">images</div>${renderImageStrip(allImgs)}</div>` : ""}
        <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div class="text-sm font-black text-slate-900">全部字段</div>
            <button type="button" data-eg-toggle="all-fields" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
              <i class="fas fa-angle-down mr-1"></i>展开/收起
            </button>
          </div>
          <div data-eg-panel="all-fields" class="p-4">${full}</div>
        </div>
      </div>
    `;

    try {
      const btn = detailEl.querySelector("[data-eg-toggle='all-fields']");
      const panel = detailEl.querySelector("[data-eg-panel='all-fields']");
      if (btn && panel) {
        btn.addEventListener("click", () => {
          panel.classList.toggle("hidden");
        });
      }
    } catch {
      // ignore
    }
  }

  function setupElegateBrowserPanel() {
    const root = stage;
    const qInput = root.querySelector("#ali-egb-q");
    const pageInput = root.querySelector("#ali-egb-page");
    const sizeInput = root.querySelector("#ali-egb-size");
    const pageGo = root.querySelector("#ali-egb-page-go");
    const pageInfo = root.querySelector("#ali-egb-page-info");
    const loadBtn = root.querySelector("#ali-egb-load");
    const prevBtn = root.querySelector("#ali-egb-prev");
    const nextBtn = root.querySelector("#ali-egb-next");
    const summary = root.querySelector("#ali-egb-summary");
    const tbody = root.querySelector("#ali-egb-tbody");

    const listWrap = root.querySelector("#ali-egb-list-wrap");
    const detailWrap = root.querySelector("#ali-egb-detail-wrap");
    const detailBack = root.querySelector("#ali-egb-detail-back");
    const detailTitle = root.querySelector("#ali-egb-detail-title");
    const detailSummary = root.querySelector("#ali-egb-detail-summary");
    const detailBody = root.querySelector("#ali-egb-detail-body");
    const detailOpenLink = root.querySelector("#ali-egb-detail-open-link");

    if (!pageInput || !sizeInput || !loadBtn || !tbody || !detailWrap || !detailBody) return;

    let page = Math.max(1, Number(pageInput.value || 1) || 1);
    let size = Math.max(1, Math.min(100, Number(sizeInput.value || 12) || 12));
    let lastList = [];
    let selectedSku = "";

    const setSummary = (text) => {
      if (summary) summary.textContent = text || "-";
    };

    const setPageInfo = (text) => {
      if (pageInfo) pageInfo.textContent = text || "-";
    };

    const renderList = (list) => {
      const q = String(qInput?.value || "").trim().toLowerCase();
      const filtered = q
        ? (list || []).filter((it) => {
            const sku = String(it?.sku ?? it?.id ?? "").toLowerCase();
            const title = String(it?.title ?? it?.name ?? "").toLowerCase();
            return sku.includes(q) || title.includes(q);
          })
        : list || [];

      const rows = (filtered || []).map((it) => {
        const sku = String(it?.sku ?? it?.id ?? "").trim();
        const title = String(it?.title ?? it?.name ?? "").trim();
        const price = String(it?.sale_price ?? it?.price ?? "").trim();
        const stock = it?.stock ?? "";
        const inStock = it?.in_stock;
        const status = String(it?.stock_status ?? it?.status ?? it?.state ?? "").trim();
        const permalink = String(it?.permalink ?? it?.url ?? "").trim();
        const openUrl = safeExternalUrl(permalink);
        const img = safeImgUrl(String(it?.image ?? it?.main_image ?? ""));
        const badge = typeof inStock === "boolean"
          ? `<span class="px-2 py-1 rounded-lg text-[11px] font-bold ${inStock ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-200 text-slate-600"}">${inStock ? "IN STOCK" : "OUT"}</span>`
          : status
            ? `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700">${escapeHtml(status)}</span>`
            : "";

        return `
          <tr class="border-t border-slate-100 hover:bg-slate-50/60 transition ${selectedSku && sku === selectedSku ? "bg-accent/5" : ""}">
            <td class="px-5 py-3">
              ${
                img
                  ? `<button type="button" ${openUrl ? `data-open-url="${escapeHtml(openUrl)}"` : `data-view-image="${escapeHtml(img)}"`} class="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src="${escapeHtml(img)}" alt="img" loading="lazy" class="w-full h-full object-cover" />
                    </button>`
                  : `<div class="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400">-</div>`
              }
            </td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-800">
              <div class="inline-flex items-center">
                <span>${escapeHtml(sku || "-")}</span>
                ${sku ? renderCopyBtn(sku, "复制 SKU") : ""}
              </div>
            </td>
            <td class="px-5 py-3 text-xs text-slate-700">
              ${
                openUrl
                  ? `<button type="button" data-open-url="${escapeHtml(openUrl)}" class="text-left text-slate-800 hover:text-accent hover:underline line-clamp-2">${escapeHtml(
                      title || "-",
                    )}</button>`
                  : escapeHtml(title || "-")
              }
            </td>
            <td class="px-5 py-3 text-xs text-slate-700">${price ? `<span class="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">$${escapeHtml(price)}</span>` : "-"}</td>
            <td class="px-5 py-3 text-xs text-slate-700">${stock !== "" && stock !== null ? escapeHtml(String(stock)) : "-"}</td>
            <td class="px-5 py-3 text-xs text-slate-700">${badge || "-"}</td>
            <td class="px-5 py-3 text-right">
              ${sku ? `<button type="button" data-egb-detail="1" data-sku="${escapeHtml(sku)}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"><i class="fas fa-eye mr-1"></i>详情</button>` : ""}
            </td>
          </tr>
        `;
      });

      tbody.innerHTML =
        rows.join("") ||
        `<tr class="border-t border-slate-100"><td colspan="7" class="px-5 py-10 text-center text-xs text-slate-400">暂无数据</td></tr>`;
    };

    const load = async () => {
      page = Math.max(1, Number(pageInput.value || page) || 1);
      size = Math.max(1, Math.min(100, Number(sizeInput.value || size) || 12));
      pageInput.value = String(page);
      sizeInput.value = String(size);

      loadBtn.disabled = true;
      setSummary("加载中...");
      setPageInfo(`第 ${page} 页 · 每页 ${size} 条`);
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-xs text-slate-400"><i class="fas fa-circle-notch fa-spin mr-2"></i>加载中...</td></tr>`;
      try {
        const res = await postAuthedJson("/api/alibaba_tool/elegate/products_list", { page, per_page: size });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          setSummary(res?.msg || "加载失败");
          setPageInfo("-");
          tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-xs text-slate-400">加载失败</td></tr>`;
          return;
        }
        lastList = res?.data?.list || [];
        renderList(lastList);
        setSummary(`第 ${page} 页 · 本页 ${lastList.length} 条 · 每页 ${size} 条`);
        setPageInfo(`第 ${page} 页 · 本页 ${lastList.length} 条 · 每页 ${size} 条`);
      } catch {
        setSummary("网络异常，加载失败。");
        setPageInfo("-");
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-xs text-slate-400">网络异常</td></tr>`;
      } finally {
        loadBtn.disabled = false;
      }
    };

    const closeModal = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      if (modalBody) modalBody.innerHTML = "";
      if (modalTitle) modalTitle.textContent = "商品详情";
      if (modalSummary) modalSummary.textContent = "-";
      if (modalOpenLink) {
        modalOpenLink.classList.add("hidden");
        modalOpenLink.dataset.openUrl = "";
      }
    };

    const openModal = () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    };

    const loadDetail = async (sku) => {
      const s = String(sku || "").trim();
      if (!s) return;
      selectedSku = s;
      renderList(lastList);

      if (listWrap) {
        listWrap.classList.add("hidden");
        listWrap.hidden = true;
      }
      detailWrap.classList.remove("hidden");
      detailWrap.hidden = false;
      if (detailTitle) detailTitle.textContent = s;
      if (detailSummary) detailSummary.textContent = `加载中：${s} ...`;
      if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400"><i class="fas fa-circle-notch fa-spin mr-2"></i>加载详情中...</div>`;
      if (detailOpenLink) {
        detailOpenLink.classList.add("hidden");
        detailOpenLink.dataset.openUrl = "";
      }
      try {
        const res = await postAuthedJson("/api/alibaba_tool/elegate/product_get", { sku: s });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          if (detailSummary) detailSummary.textContent = res?.msg || "加载失败";
          if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400">加载失败</div>`;
          return;
        }
        renderElegateDetail(res?.data || {}, detailBody, detailSummary, detailOpenLink);
      } catch {
        if (detailSummary) detailSummary.textContent = "网络异常，加载失败。";
        if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400">网络异常</div>`;
      }
    };

    loadBtn.addEventListener("click", load);
    if (prevBtn) prevBtn.addEventListener("click", () => { page = Math.max(1, page - 1); pageInput.value = String(page); load(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { page += 1; pageInput.value = String(page); load(); });
    if (qInput) qInput.addEventListener("input", () => renderList(lastList));
    pageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") load(); });
    sizeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") load(); });
    pageGo?.addEventListener("click", () => load());

    tbody.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-egb-detail='1']");
      if (!btn) return;
      const sku = btn.dataset.sku;
      loadDetail(sku);
    });

    const backToList = () => {
      detailWrap.classList.add("hidden");
      detailWrap.hidden = true;
      if (detailBody) detailBody.innerHTML = "";
      if (detailTitle) detailTitle.textContent = "商品详情";
      if (detailSummary) detailSummary.textContent = "-";
      if (detailOpenLink) {
        detailOpenLink.classList.add("hidden");
        detailOpenLink.dataset.openUrl = "";
      }
      if (listWrap) {
        listWrap.classList.remove("hidden");
        listWrap.hidden = false;
      }
      try {
        sessionStorage.removeItem("topm:aliApDetailPid");
      } catch {
        // ignore
      }
    };
    detailBack?.addEventListener("click", backToList);

    load();
  }

  function setupOpenApiPanel() {
    const root = stage;
    const prodId = root.querySelector("#ali-prod-id");
    const prodCountry = root.querySelector("#ali-prod-country");
    const prodFetch = root.querySelector("#ali-prod-fetch");
    const prodView = root.querySelector("#ali-prod-view");
    const prodSummary = root.querySelector("#ali-prod-summary");
    if (!prodFetch || !prodId || !prodCountry) return;

    (async () => {
      try {
        const cfg = await ensureConfigLoaded();
        if (prodCountry && !prodCountry.value) prodCountry.value = String(cfg?.ALI_COUNTRY_DEFAULT || "MX");
        if (prodId && !prodId.value && state.lastProductId) prodId.value = state.lastProductId;
      } catch {
        // ignore
      }
    })();

    prodFetch.addEventListener("click", async () => {
      prodFetch.disabled = true;
      const original = prodFetch.textContent;
      prodFetch.textContent = "获取中...";
      if (prodSummary) prodSummary.textContent = "获取中...";
      if (prodView) prodView.innerHTML = "";
      try {
        const pidText = String(prodId.value || "").trim();
        if (pidText) state.lastProductId = pidText;
        const res = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", {
          product_id: prodId.value,
          country: prodCountry.value,
        });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          if (prodSummary) prodSummary.textContent = res?.msg || "获取失败";
          return;
        }
        const resp = res?.data || {};
        // product_data is usually at result.result_data
        let productData = null;
        if (resp?.result?.result_data && typeof resp.result.result_data === "object") productData = resp.result.result_data;
        else if (resp?.result_data && typeof resp.result_data === "object") productData = resp.result_data;
        else productData = null;

        state.lastProductData = productData;

        const p = productData || {};
        const title = p?.title || "";
        const status = p?.status || "";
        const category = p?.category || p?.category_id || "";
        const supplier = p?.supplier || "";
        const currency = p?.currency || "";
        const price = p?.wholesale_trade?.price || p?.price || "";
        const minOrder = p?.min_order_quantity || "";
        const modeId = p?.mode_id || "";
        const productId = p?.product_id || p?.id || "";
        const detailUrl = p?.detail_url || "";
        const imgs = Array.isArray(p?.images) ? p.images : [];
        const mainImage = p?.main_image || (imgs.length ? imgs[0] : "");
        const skus = Array.isArray(p?.skus) ? p.skus : [];

        if (prodSummary) {
          const parts = [title && `标题：${title}`, productId && `ID：${productId}`, status && `状态：${status}`].filter(Boolean);
          prodSummary.textContent = parts.length ? parts.join(" · ") : "获取成功";
        }

        if (prodView) {
          const imgsToShow = [mainImage, ...imgs].filter(Boolean);
          const skuRows = skus
            .slice(0, 20)
            .map((s) => {
              const skuId = s?.sku_id || "-";
              const attrs = Array.isArray(s?.sku_attr_list)
                ? s.sku_attr_list.map((a) => `${a?.attr_name_desc || ""}:${a?.attr_value_desc || ""}`).filter(Boolean).join(" / ")
                : "";
              const ladder = Array.isArray(s?.ladder_price) ? s.ladder_price : [];
              const inv = ladder?.length ? ladder[ladder.length - 1]?.max_quantity ?? "" : "";
              const cost = ladder?.length ? ladder[ladder.length - 1]?.price ?? "" : "";
              const img = s?.image || "";
              return `
                <tr class="border-t border-slate-100">
                  <td class="py-2 pr-3 text-xs font-semibold text-slate-800">${escapeHtml(String(skuId))}</td>
                  <td class="py-2 pr-3 text-xs text-slate-600">${escapeHtml(attrs || "-")}</td>
                  <td class="py-2 pr-3 text-xs text-slate-600">${escapeHtml(String(inv || "-"))}</td>
                  <td class="py-2 pr-3 text-xs text-slate-600">${escapeHtml(String(cost || "-"))}</td>
                  <td class="py-2 text-xs text-slate-600">${img ? `<button type="button" data-view-image="${escapeHtml(safeImgUrl(img))}" class="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white"><img src="${escapeHtml(safeImgUrl(img))}" alt="sku" loading="lazy" class="w-full h-full object-cover" /></button>` : "-"}</td>
                </tr>
              `;
            })
            .join("");

          prodView.innerHTML = `
            <div class="space-y-4">
              <div class="flex flex-col lg:flex-row lg:items-start gap-4">
                <div class="w-full lg:w-[220px] flex-shrink-0">
                  ${
                    mainImage
                      ? `<button type="button" data-open-url="${escapeHtml(safeImgUrl(mainImage))}" class="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white">
                          <img src="${escapeHtml(safeImgUrl(mainImage))}" alt="main" loading="lazy" class="w-full h-full object-cover" />
                        </button>`
                      : `<div class="w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">无主图</div>`
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-base font-black text-slate-900 break-words">${escapeHtml(title || "-")}</div>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    ${status ? `<span class="px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold">${escapeHtml(status)}</span>` : ""}
                    ${currency ? `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">${escapeHtml(currency)}</span>` : ""}
                    ${price ? `<span class="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">price: ${escapeHtml(String(price))}</span>` : ""}
                    ${minOrder ? `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">MOQ: ${escapeHtml(String(minOrder))}</span>` : ""}
                  </div>
                  <div class="mt-3">
                    ${renderKvGrid([
                      { label: "product_id", value: productId },
                      { label: "category", value: category },
                      { label: "supplier", value: supplier },
                      { label: "mode_id", value: modeId },
                      { label: "detail_url", value: detailUrl },
                    ])}
                  </div>
                </div>
              </div>

              ${imgsToShow.length ? `<div><div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">images</div>${renderImageStrip(imgsToShow)}</div>` : ""}

              <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div class="text-sm font-black text-slate-900">SKU 列表</div>
                  <div class="text-xs text-slate-400">最多展示 20 条</div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left">
                    <thead class="bg-slate-50/70 text-[11px] text-slate-400">
                      <tr>
                        <th class="py-2 px-4 font-bold">sku_id</th>
                        <th class="py-2 px-4 font-bold">属性</th>
                        <th class="py-2 px-4 font-bold">max_qty</th>
                        <th class="py-2 px-4 font-bold">price</th>
                        <th class="py-2 px-4 font-bold">图片</th>
                      </tr>
                    </thead>
                    <tbody class="px-4">
                      ${skuRows || `<tr class="border-t border-slate-100"><td colspan="5" class="px-4 py-4 text-xs text-slate-400 text-center">无 SKU 数据</td></tr>`}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `;
        }

      } catch {
        if (prodSummary) prodSummary.textContent = "网络异常，请稍后重试。";
      } finally {
        prodFetch.disabled = false;
        prodFetch.textContent = original || "获取";
      }
    });
  }

  function renderAlibabaProductDetail(productData, bodyEl, summaryEl, openBtn, opts) {
    const p = productData || {};
    const options = opts && typeof opts === "object" ? opts : {};
    const title = p?.title || "";
    const status = p?.status || "";
    const category = p?.category || p?.category_id || "";
    const supplier = p?.supplier || "";
    const currency = p?.currency || "";
    const price = p?.wholesale_trade?.price || p?.price || "";
    const minOrder = p?.min_order_quantity || "";
    const modeId = p?.mode_id || "";
    const productId = p?.product_id || p?.id || "";
    const detailUrl = p?.detail_url || "";
    const imgs = Array.isArray(p?.images) ? p.images : [];
    const mainImage = p?.main_image || (imgs.length ? imgs[0] : "");
    const skus = Array.isArray(p?.skus) ? p.skus : [];
    const descHtml = String(p?.description || "").trim();
    const countryDefault = String(options.country || "MX").trim() || "MX";
    const multiplierDefault = String(options.price_multiplier || "21").trim() || "21";

    if (summaryEl) {
      const parts = [title && `标题：${title}`, productId && `ID：${productId}`, status && `状态：${status}`].filter(Boolean);
      summaryEl.textContent = parts.length ? parts.join(" · ") : "加载成功";
    }

    if (openBtn) {
      const u = safeExternalUrl(detailUrl);
      if (u) {
        openBtn.classList.remove("hidden");
        openBtn.dataset.openUrl = u;
      } else {
        openBtn.classList.add("hidden");
        openBtn.dataset.openUrl = "";
      }
    }

    const imgsToShow = [mainImage, ...imgs].filter(Boolean);
    const skuRowsRaw = skus.slice(0, 300).map((s) => {
      const skuId =
        s?.sku_id ??
        s?.skuId ??
        s?.sku_id_str ??
        s?.skuIdStr ??
        s?.sku_id_string ??
        s?.skuIdString ??
        "-";
      const pid = s?.product_id ?? s?.productId ?? p?.product_id ?? p?.id ?? "-";
      const combo = pid && skuId && skuId !== "-" ? `${pid}_${skuId}` : pid || skuId || "-";
      const attrs = Array.isArray(s?.sku_attr_list)
        ? s.sku_attr_list.map((a) => `${a?.attr_name_desc || ""}:${a?.attr_value_desc || ""}`).filter(Boolean).join(" / ")
        : "";
      const ladder = Array.isArray(s?.ladder_price) ? s.ladder_price : [];
      const inv = ladder?.length ? ladder[ladder.length - 1]?.max_quantity ?? "" : "";
      const cost = ladder?.length ? ladder[ladder.length - 1]?.price ?? "" : "";
      const img = s?.image || "";
      return { skuId, combo, attrs, inv, cost, img };
    });

    const skuRows = skuRowsRaw
      .slice(0, 30)
      .map(
        (s) => `
          <tr class="border-t border-slate-100">
            <td class="py-2 px-4 text-xs font-semibold text-slate-800">${escapeHtml(String(s.skuId))}</td>
            <td class="py-2 px-4 text-xs text-slate-600">${escapeHtml(s.combo)}</td>
            <td class="py-2 px-4 text-xs text-slate-600">${escapeHtml(s.attrs || "-")}</td>
            <td class="py-2 px-4 text-xs text-slate-600">${escapeHtml(String(s.inv || "-"))}</td>
            <td class="py-2 px-4 text-xs text-slate-600">${escapeHtml(String(s.cost || "-"))}</td>
            <td class="py-2 px-4 text-xs text-slate-600">${s.img ? `<button type="button" data-view-image="${escapeHtml(safeImgUrl(s.img))}" class="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white"><img src="${escapeHtml(safeImgUrl(s.img))}" alt="sku" loading="lazy" class="w-full h-full object-cover" /></button>` : "-"}</td>
          </tr>
        `,
      )
      .join("");

    if (!bodyEl) return;

    // Keep 商品描述 only once at the bottom; mask any *description* fields inside "全部字段".
    const allFieldsObj = (() => {
      const mask = (val) => {
        if (!val || typeof val !== "object") return val;
        if (Array.isArray(val)) return val.map(mask);
        const out = {};
        for (const [k, v] of Object.entries(val)) {
          if (String(k || "").toLowerCase().includes("description")) {
            out[k] = "[商品描述见页面底部]";
          } else {
            out[k] = mask(v);
          }
        }
        return out;
      };
      if (!p || typeof p !== "object") return p;
      const copy = { ...p };
      delete copy.description;
      return mask(copy);
    })();

    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-start gap-4">
          <div class="w-full lg:w-[240px] flex-shrink-0">
            ${
              mainImage
                ? `<button type="button" data-view-image="${escapeHtml(safeImgUrl(mainImage))}" class="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white">
                    <img src="${escapeHtml(safeImgUrl(mainImage))}" alt="main" loading="lazy" class="w-full h-full object-cover" />
                  </button>`
                : `<div class="w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">无主图</div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-base font-black text-slate-900 break-words">${escapeHtml(title || "-")}</div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              ${status ? `<span class="px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold">${escapeHtml(status)}</span>` : ""}
              ${currency ? `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">${escapeHtml(currency)}</span>` : ""}
              ${price ? `<span class="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">price: ${escapeHtml(String(price))}</span>` : ""}
              ${minOrder ? `<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">MOQ: ${escapeHtml(String(minOrder))}</span>` : ""}
            </div>
            <div class="mt-3">
              ${renderKvGrid([
                { label: "product_id", value: productId },
                { label: "category", value: category },
                { label: "supplier", value: supplier },
                { label: "mode_id", value: modeId },
                { label: "detail_url", value: detailUrl },
              ])}
            </div>
            ${
              skuRowsRaw.length
                ? `<div class="mt-3 space-y-2">
                    <div class="text-xs font-black text-slate-900 flex items-center gap-2">
                      <i class="fas fa-tags text-accent"></i> SKU组合（product_id_sku_id）
                    </div>
                    <div class="flex flex-wrap gap-2">
                      ${skuRowsRaw
                        .map(
                          (s) => `
                            <span class="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1">
                              ${escapeHtml(s.combo || "-")}
                              ${s.combo ? renderCopyBtn(s.combo, "复制组合") : ""}
                            </span>
                          `,
                        )
                        .join("")}
                    </div>
                  </div>`
                : ""
            }
          </div>
        </div>

        ${imgsToShow.length ? `<div><div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">images</div>${renderImageStrip(imgsToShow)}</div>` : ""}

        <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div class="text-sm font-black text-slate-900">SKU 列表</div>
            <div class="text-xs text-slate-400">最多展示 30 条</div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50/70 text-[11px] text-slate-400">
                <tr>
                  <th class="py-2 px-4 font-bold">sku_id</th>
                  <th class="py-2 px-4 font-bold">组合(product_id_sku_id)</th>
                  <th class="py-2 px-4 font-bold">属性</th>
                  <th class="py-2 px-4 font-bold">max_qty</th>
                  <th class="py-2 px-4 font-bold">price</th>
                  <th class="py-2 px-4 font-bold">图片</th>
                </tr>
              </thead>
              <tbody>
                ${skuRows || `<tr class="border-t border-slate-100"><td colspan="6" class="px-4 py-6 text-xs text-slate-400 text-center">无 SKU 数据</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div class="text-sm font-black text-slate-900">全部字段</div>
          </div>
          <div data-ap-panel="all-fields" class="p-4">${renderObjectSection(allFieldsObj, "")}</div>
        </div>

        ${descHtml ? renderRichHtml(descHtml) : ""}
      </div>
    `;

  }

  function setupAlibabaProductsPanel() {
    const root = stage;
    const qInput = root.querySelector("#ali-ap-q");
    const pageInput = root.querySelector("#ali-ap-page");
    const sizeInput = root.querySelector("#ali-ap-size");
    const pageGo = root.querySelector("#ali-ap-page-go");
    const pageInfo = root.querySelector("#ali-ap-page-info");
    const countryInput = root.querySelector("#ali-ap-country");
    const loadBtn = root.querySelector("#ali-ap-load");
    const selectAll = root.querySelector("#ali-ap-select-all");
    const batchOpen = root.querySelector("#ali-ap-batch-open");
    const batchPanel = root.querySelector("#ali-ap-batch-panel");
    const batchClose = root.querySelector("#ali-ap-batch-close");
    const batchCount = root.querySelector("#ali-ap-batch-count");
    const batchSummary = root.querySelector("#ali-ap-batch-summary");
    const batchView = root.querySelector("#ali-ap-batch-view");
    const batchRun = root.querySelector("#ali-ap-batch-run");
    const batchCountry = root.querySelector("#ali-ap-batch-country");
    const batchMult = root.querySelector("#ali-ap-batch-multiplier");
    const batchPlatTikTok = root.querySelector("#ali-ap-batch-plat-tiktok");
    const batchPlatShein = root.querySelector("#ali-ap-batch-plat-shein");
    const batchPlatTemu = root.querySelector("#ali-ap-batch-plat-temu");
    const prevBtn = root.querySelector("#ali-ap-prev");
    const nextBtn = root.querySelector("#ali-ap-next");
    const summary = root.querySelector("#ali-ap-summary");
    const tbody = root.querySelector("#ali-ap-tbody");

    const listWrap = root.querySelector("#ali-ap-list-wrap");
    const detailWrap = root.querySelector("#ali-ap-detail-wrap");
    const detailBack = root.querySelector("#ali-ap-detail-back");
    const detailTitle = root.querySelector("#ali-ap-detail-title");
    const detailSummary = root.querySelector("#ali-ap-detail-summary");
    const detailBody = root.querySelector("#ali-ap-detail-body");
    const detailOpenLink = root.querySelector("#ali-ap-detail-open-link");

    if (!pageInput || !sizeInput || !loadBtn || !tbody || !detailWrap || !detailBody || !countryInput) return;

    let page = Math.max(1, Number(pageInput.value || 1) || 1);
    let size = Math.max(1, Math.min(300, Number(sizeInput.value || 20) || 20));
    let lastList = [];
    const selectedIds = new Set();
    let activePushPid = "";
    const pushStates = {};

    const setPushState = (pid, patch) => {
      const key = String(pid || "");
      pushStates[key] = { ...(pushStates[key] || {}), ...(patch || {}) };
    };

    const renderPushResultHtml = (data) => {
      const ok = !!data?.ok;
      const details = data?.details || {};
      const header = `
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl text-[11px] font-black ${ok ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}">
            <i class="fas ${ok ? "fa-circle-check" : "fa-circle-xmark"} mr-1"></i>${ok ? "SUCCESS" : "FAILED"}
          </span>
          <span class="text-xs text-slate-500">product_id: ${escapeHtml(String(data?.product_id || "-"))}</span>
          <span class="text-xs text-slate-500">country: ${escapeHtml(String(data?.country || "-"))}</span>
        </div>
      `;

      const platCards = ["tiktok", "shein", "temu"]
        .filter((k) => details[k])
        .map((k) => {
          const r = details[k] || {};
          const ok2 = !!r.ok;
          const err = r.error ? `<div class="text-xs text-rose-700 mt-1">${escapeHtml(String(r.error))}</div>` : "";
          const rows = Array.isArray(r.results)
            ? r.results
                .slice(0, 20)
                .map((it) => {
                  const sn = it?.goods_sn ?? "-";
                  const sc = it?.status_code ?? "-";
                  const txt = String(it?.resp_text ?? "").slice(0, 260);
                  return `
                    <tr class="border-t border-slate-100">
                      <td class="py-2 pr-3 text-xs font-semibold text-slate-800">${escapeHtml(String(sn))}</td>
                      <td class="py-2 pr-3 text-xs text-slate-600">${escapeHtml(String(sc))}</td>
                      <td class="py-2 text-xs text-slate-600 break-all">${escapeHtml(txt || "-")}</td>
                    </tr>
                  `;
                })
                .join("")
            : "";

          const icon =
            k === "tiktok"
              ? '<i class="fab fa-tiktok text-slate-900 mr-1"></i>'
              : k === "shein"
                ? '<i class="fas fa-shirt text-rose-600 mr-1"></i>'
                : '<i class="fas fa-bag-shopping text-orange-600 mr-1"></i>';

          return `
            <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div class="text-sm font-black text-slate-900">${icon}${escapeHtml(k.toUpperCase())}</div>
                <span class="px-2.5 py-1 rounded-xl text-[11px] font-black ${ok2 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}">
                  ${ok2 ? "OK" : "FAIL"}
                </span>
              </div>
              <div class="p-4">
                ${err || ""}
                <div class="overflow-x-auto mt-2">
                  <table class="w-full text-left">
                    <thead class="text-[11px] text-slate-400 bg-slate-50/60">
                      <tr>
                        <th class="py-2 pr-3 font-bold">goods_sn</th>
                        <th class="py-2 pr-3 font-bold">status</th>
                        <th class="py-2 font-bold">response</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows || `<tr class="border-t border-slate-100"><td colspan="3" class="py-6 text-center text-xs text-slate-400">无结果</td></tr>`}
                    </tbody>
                  </table>
                </div>
                ${Array.isArray(r.results) && r.results.length > 20 ? `<div class="text-[11px] text-slate-400 mt-2">... 仅展示前 20 条</div>` : ""}
              </div>
            </div>
          `;
        })
        .join("");

      return `<div class="space-y-3">${header}${platCards || `<div class="text-xs text-slate-400">暂无结果</div>`}</div>`;
    };

    (async () => {
      try {
        const cfg = await ensureConfigLoaded();
        if (countryInput && !countryInput.value) countryInput.value = String(cfg?.ALI_COUNTRY_DEFAULT || "MX");
        if (batchCountry && !batchCountry.value) batchCountry.value = String(cfg?.ALI_COUNTRY_DEFAULT || "MX");
        if (batchMult && !batchMult.value) batchMult.value = String(cfg?.ALI_PRICE_MULTIPLIER || "21");
      } catch {
        // ignore
      }
    })();

    const setSummary = (text) => {
      if (summary) summary.textContent = text || "-";
    };

    const setPageInfo = (text) => {
      if (pageInfo) pageInfo.textContent = text || "-";
    };

    const extractSkuCombos = (item) => {
      const itemPid = String(item?.product_id ?? item?.id ?? "").trim();
      const mainImg = safeImgUrl(String(item?.main_image ?? item?.image ?? ""));
      const pickArray = (arr) => (Array.isArray(arr) ? arr : null);
      const skuList =
        pickArray(item?.skus) ||
        pickArray(item?.sku_list) ||
      pickArray(item?.skuList) ||
      pickArray(item?.skuInfos) ||
      pickArray(item?.sku_info) ||
      pickArray(item?.skuInfo) ||
      pickArray(item?.sku_detail?.list) ||
      pickArray(item?.skuDetail?.list) ||
      null;

      const combos = [];
      if (skuList) {
        for (const s of skuList) {
          const pid = String(s?.product_id ?? s?.productId ?? itemPid).trim();
          const sid = String(
            s?.sku_id ??
              s?.skuId ??
              s?.sku_id_str ??
              s?.skuIdStr ??
              s?.sku_id_string ??
              s?.skuIdString ??
              ""
          ).trim();
          const label = pid && sid ? `${pid}_${sid}` : pid || sid || "-";
          const thumb =
            safeImgUrl(String(s?.sku_main_image ?? s?.main_image ?? s?.image ?? s?.img ?? "")) ||
            mainImg ||
            "";
          combos.push({ label, thumb });
        }
      }
      if (!combos.length) {
        const pid = itemPid;
        const sid = String(item?.sku_id ?? item?.skuId ?? "-1").trim() || "-1";
        const label = pid ? `${pid}_${sid}` : sid;
        combos.push({ label, thumb: mainImg || "" });
      }
      return combos;
    };

    const renderRows = (list) => {
      const q = String(qInput?.value || "").trim().toLowerCase();
      const filtered = q
        ? (list || []).filter((it) => {
            const pid = String(it?.product_id ?? it?.id ?? "").toLowerCase();
            const title = String(it?.title ?? it?.name ?? "").toLowerCase();
            const sku = String(it?.sku ?? it?.mode_id ?? "").toLowerCase();
            const supplier = String(it?.supplier ?? it?.supplier_name ?? it?.supplierName ?? "").toLowerCase();
            const combo = `${String(it?.product_id ?? it?.id ?? "").toLowerCase()}_${String(it?.sku_id ?? it?.skuId ?? "-1").toLowerCase()}`;
            return pid.includes(q) || title.includes(q) || sku.includes(q) || supplier.includes(q) || combo.includes(q);
          })
        : list || [];

      const rows = (filtered || []).map((it) => {
        const pid = it?.product_id ?? it?.id ?? "";
        const rowPid = String(pid || "").trim();
        const selected = rowPid && selectedIds.has(rowPid);
        const title = String(it?.title ?? it?.name ?? "").trim();
        const status = String(it?.status ?? it?.state ?? it?.product_status ?? "").trim();
        const supplier = String(it?.supplier ?? it?.supplier_name ?? it?.supplierName ?? "").trim();
        const merchantSku = String(it?.sku ?? it?.mode_id ?? "").trim();
        const moq = it?.moq ?? "";
        const maxQty = it?.max_qty ?? it?.maxQty ?? "";
        const price = String(it?.price ?? "").trim();
        const currency = String(it?.currency ?? "").trim();
        const img = safeImgUrl(String(it?.main_image ?? it?.image ?? ""));
        const detailUrl = String(it?.detail_url ?? it?.permalink ?? it?.url ?? "").trim();
        const openUrl = safeExternalUrl(detailUrl);
        const priceText = price ? `${currency ? `${currency} ` : ""}${price}` : "";
        const statusBadge = (() => {
          if (!status) return "-";
          const isOnline = String(status).trim().toUpperCase() === "PRODUCT_ONLINE";
          return `<span class="px-2 py-1 rounded-lg border text-[11px] font-black ${
            isOnline ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-rose-500/10 text-rose-700 border-rose-200"
          }">${escapeHtml(status)}</span>`;
        })();
        const skuCombos = extractSkuCombos(it);
        const combosHtml = (() => {
          if (skuCombos.length === 1) {
            const c = skuCombos[0];
            const copy = c.label ? renderCopyBtn(c.label, "复制组合") : "";
            return `
              <div class="inline-flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200">
                <div class="text-[11px] font-semibold text-slate-700">${escapeHtml(c.label || "-")}</div>
                ${copy}
              </div>
            `;
          }
          return skuCombos
            .map((c) => {
              const thumb = c.thumb
                ? `<img src="${escapeHtml(c.thumb)}" alt="combo" loading="lazy" class="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white" />`
                : `<div class="w-9 h-9 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-center">-</div>`;
              const copy = c.label ? renderCopyBtn(c.label, "复制组合") : "";
              return `
                <div class="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  ${thumb}
                  <div class="min-w-0">
                    <div class="text-[11px] font-semibold text-slate-700 truncate max-w-[180px]">${escapeHtml(c.label || "-")}</div>
                  </div>
                  ${copy}
                </div>
              `;
            })
            .join("");
        })();

        const isActivePush = rowPid && activePushPid === rowPid;
        const pushState = rowPid ? pushStates[rowPid] || {} : {};
        const pushSummary = pushState.summary || "-";
        const pushRunning = !!pushState.running;
        const pushCountry = String(pushState.country || countryInput?.value || "MX");
        const pushMult = String(pushState.multiplier || "21");
        const checked = (k) => {
          const p = pushState.platforms;
          if (!Array.isArray(p) || !p.length) return true;
          return p.includes(k);
        };

        const pushPanel = isActivePush
          ? `
            <tr class="border-t border-slate-100 bg-slate-50/30">
              <td colspan="9" class="px-5 py-4">
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="text-sm font-black text-slate-900 flex items-center gap-2">
                      <i class="fas fa-rocket text-accent"></i>推送上品（${escapeHtml(rowPid)}）
                    </div>
                    <button type="button" data-ap-push-close="1" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                      <i class="fas fa-xmark mr-1"></i>收起
                    </button>
                  </div>
                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input data-ap-push-plat="tiktok" type="checkbox" class="w-4 h-4" ${checked("tiktok") ? "checked" : ""} />
                      <span><i class="fab fa-tiktok text-slate-900 mr-1"></i>TikTok</span>
                    </label>
                    <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input data-ap-push-plat="shein" type="checkbox" class="w-4 h-4" ${checked("shein") ? "checked" : ""} />
                      <span><i class="fas fa-shirt text-rose-600 mr-1"></i>Shein</span>
                    </label>
                    <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input data-ap-push-plat="temu" type="checkbox" class="w-4 h-4" ${checked("temu") ? "checked" : ""} />
                      <span><i class="fas fa-bag-shopping text-orange-600 mr-1"></i>TEMU</span>
                    </label>
                    <div class="ml-auto flex flex-wrap items-center gap-2">
                      <input data-ap-push-country class="w-[90px] px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" value="${escapeHtml(pushCountry)}" />
                      <input data-ap-push-multiplier class="w-[110px] px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" value="${escapeHtml(pushMult)}" />
                      <button data-ap-push-run="1" type="button" class="px-4 py-2 rounded-xl ${pushRunning ? "bg-slate-300 text-slate-600" : "bg-slate-900 text-white hover:bg-slate-800"} text-xs font-semibold" ${pushRunning ? "disabled" : ""}>
                        <i class="fas ${pushRunning ? "fa-circle-notch fa-spin" : "fa-cloud-arrow-up"} mr-1"></i>${pushRunning ? "推送中..." : "推送"}
                      </button>
                    </div>
                  </div>
                  <div class="mt-3 text-xs text-slate-500">${escapeHtml(pushSummary)}</div>
                  <div class="mt-3" data-ap-push-view>${pushState.viewHtml || ""}</div>
                </div>
              </td>
            </tr>
          `
          : "";
        return `
          <tr class="border-t border-slate-100 hover:bg-slate-50/60 transition">
            <td class="px-5 py-3">
              ${rowPid ? `<input type="checkbox" data-ap-select="1" data-pid="${escapeHtml(rowPid)}" class="w-4 h-4" ${selected ? "checked" : ""} />` : ""}
            </td>
            <td class="px-5 py-3">
              ${
                img
                  ? `<button type="button" ${openUrl ? `data-open-url="${escapeHtml(openUrl)}"` : `data-view-image="${escapeHtml(img)}"`} class="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src="${escapeHtml(img)}" alt="img" loading="lazy" class="w-full h-full object-cover" />
                    </button>`
                  : `<div class="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400">-</div>`
              }
            </td>
            <td class="px-5 py-3">
              ${
                openUrl
                  ? `<button type="button" data-open-url="${escapeHtml(openUrl)}" class="block text-left text-xs font-semibold text-slate-800 hover:text-accent hover:underline line-clamp-1 max-w-[420px]">${escapeHtml(
                      title || "-",
                    )}</button>`
                  : `<div class="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[420px]">${escapeHtml(title || "-")}</div>`
              }
              <div class="mt-2 flex flex-wrap gap-2" data-combo-list="1">
                ${combosHtml}
                ${
                  merchantSku
                    ? `<span class="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">
                         商家SKU: ${escapeHtml(merchantSku)}
                         ${renderCopyBtn(merchantSku, "复制商家SKU")}
                       </span>`
                    : ""
                }
              </div>
            </td>
            <td class="px-5 py-3 text-xs text-slate-700">${supplier ? escapeHtml(supplier) : "-"}</td>
            <td class="px-5 py-3 text-xs text-slate-700">
              ${priceText ? `<span class="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">${escapeHtml(priceText)}</span>` : "-"}
            </td>
            <td class="px-5 py-3 text-xs text-slate-700">${maxQty !== "" && maxQty !== null ? escapeHtml(String(maxQty)) : "-"}</td>
            <td class="px-5 py-3 text-xs text-slate-600">${statusBadge}</td>
            <td class="px-5 py-3 text-right">
              <div class="inline-flex items-center gap-2">
                ${
                  rowPid
                    ? `<button type="button" data-ap-push-open="1" data-pid="${escapeHtml(rowPid)}" class="px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90">
                         <i class="fas fa-rocket mr-1"></i>推送
                       </button>`
                    : ""
                }
                ${
                  pid
                    ? `<button type="button" data-ap-detail="1" data-pid="${escapeHtml(String(pid))}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"><i class="fas fa-eye mr-1"></i>详情</button>`
                    : ""
                }
              </div>
            </td>
          </tr>
          ${pushPanel}
        `;
      });

      tbody.innerHTML =
        rows.join("") ||
        `<tr class="border-t border-slate-100"><td colspan="9" class="px-5 py-10 text-center text-xs text-slate-400">暂无数据</td></tr>`;
    };

    const syncBatchCount = () => {
      const n = selectedIds.size;
      if (batchCount) batchCount.textContent = n ? `已选 ${n} 个` : "未选择";
      if (selectAll) {
        const visibleIds = (lastList || []).map((x) => String(x?.product_id ?? x?.id ?? "").trim()).filter(Boolean);
        const allSelected = visibleIds.length && visibleIds.every((id) => selectedIds.has(id));
        selectAll.checked = Boolean(allSelected);
        selectAll.indeterminate = Boolean(visibleIds.length && !allSelected && visibleIds.some((id) => selectedIds.has(id)));
      }
    };

    const setBatchSummary = (t) => {
      if (batchSummary) batchSummary.textContent = t || "-";
    };

    const openBatchPanel = () => {
      if (!batchPanel) return;
      batchPanel.classList.remove("hidden");
      batchPanel.hidden = false;
      setBatchSummary("准备就绪");
      if (batchView) batchView.innerHTML = "";
      syncBatchCount();
    };

    const closeBatchPanel = () => {
      if (!batchPanel) return;
      batchPanel.classList.add("hidden");
      batchPanel.hidden = true;
      if (batchView) batchView.innerHTML = "";
      setBatchSummary("-");
    };

    batchOpen?.addEventListener("click", () => {
      openBatchPanel();
    });
    batchClose?.addEventListener("click", closeBatchPanel);

    selectAll?.addEventListener("change", () => {
      const visibleIds = (lastList || []).map((x) => String(x?.product_id ?? x?.id ?? "").trim()).filter(Boolean);
      if (!visibleIds.length) return;
      if (selectAll.checked) visibleIds.forEach((id) => selectedIds.add(id));
      else visibleIds.forEach((id) => selectedIds.delete(id));
      syncBatchCount();
      renderRows(lastList);
    });

    tbody.addEventListener("change", (e) => {
      const cb = e.target?.closest?.("input[data-ap-select='1']");
      if (!cb) return;
      const pid = String(cb.dataset.pid || "").trim();
      if (!pid) return;
      if (cb.checked) selectedIds.add(pid);
      else selectedIds.delete(pid);
      syncBatchCount();
    });

    batchRun?.addEventListener("click", async () => {
      const ids = Array.from(selectedIds);
      if (!ids.length) {
        setBatchSummary("请先在列表勾选要推送的商品");
        return;
      }
      const platforms = [];
      if (batchPlatTikTok?.checked) platforms.push("tiktok");
      if (batchPlatShein?.checked) platforms.push("shein");
      if (batchPlatTemu?.checked) platforms.push("temu");
      if (!platforms.length) {
        setBatchSummary("请至少选择一个平台");
        return;
      }
      if (batchRun) batchRun.disabled = true;
      const original = batchRun?.innerHTML;
      if (batchRun) batchRun.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>推送中...';
      if (batchView) batchView.innerHTML = "";
      setBatchSummary(`开始推送：0 / ${ids.length}`);

      const results = [];
      for (let i = 0; i < ids.length; i += 1) {
        const pid = ids[i];
        setBatchSummary(`推送中：${i + 1} / ${ids.length}（${pid}）`);
        try {
          const descRes = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", { product_id: pid, country: batchCountry?.value || countryInput.value });
          if (String(descRes?.code) === "2") return;
          if (String(descRes?.code) !== "0") {
            results.push({ pid, ok: false, msg: descRes?.msg || "拉取详情失败" });
            continue;
          }
          const resp = descRes?.data || {};
          const productData =
            resp?.result?.result_data && typeof resp.result.result_data === "object"
              ? resp.result.result_data
              : resp?.result_data && typeof resp.result_data === "object"
                ? resp.result_data
                : resp?.data && typeof resp.data === "object"
                  ? resp.data
                  : null;
          if (!productData) {
            results.push({ pid, ok: false, msg: "未拿到 product_data" });
            continue;
          }
          const pushRes = await postAuthedJson("/api/alibaba_tool/product_push", {
            product_data: productData,
            country: batchCountry?.value || countryInput.value,
            price_multiplier: batchMult?.value || "21",
            platforms,
          });
          if (String(pushRes?.code) === "2") return;
          if (String(pushRes?.code) !== "0") {
            results.push({ pid, ok: false, msg: pushRes?.msg || "推送失败" });
            continue;
          }
          results.push({ pid, ok: true, data: pushRes?.data || {} });
        } catch {
          results.push({ pid, ok: false, msg: "网络异常" });
        }
      }

      const okCount = results.filter((r) => r.ok).length;
      setBatchSummary(`完成：成功 ${okCount} / ${results.length}`);
      if (batchView) {
        const rows = results
          .map((r) => {
            const badge = r.ok
              ? `<span class="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] font-bold">OK</span>`
              : `<span class="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-700 text-[11px] font-bold">FAIL</span>`;
            return `<tr class="border-t border-slate-100">
              <td class="py-2 pr-3 text-xs font-semibold text-slate-800">${escapeHtml(String(r.pid))}${renderCopyBtn(r.pid, "复制 ID")}</td>
              <td class="py-2 pr-3">${badge}</td>
              <td class="py-2 text-xs text-slate-600 break-all">${escapeHtml(String(r.ok ? (r.data?.msg || "ok") : r.msg || ""))}</td>
            </tr>`;
          })
          .join("");
        batchView.innerHTML = `
          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">批量推送结果</div>
            <div class="p-4 overflow-x-auto">
              <table class="w-full text-left">
                <thead class="text-[11px] text-slate-400 bg-slate-50/60">
                  <tr>
                    <th class="py-2 pr-3 font-bold">product_id</th>
                    <th class="py-2 pr-3 font-bold">status</th>
                    <th class="py-2 font-bold">message</th>
                  </tr>
                </thead>
                <tbody>${rows || `<tr class="border-t border-slate-100"><td colspan="3" class="py-6 text-center text-xs text-slate-400">无结果</td></tr>`}</tbody>
              </table>
            </div>
          </div>
        `;
      }

      if (batchRun) batchRun.disabled = false;
      if (batchRun) batchRun.innerHTML = original || '<i class="fas fa-cloud-arrow-up mr-1"></i>开始推送';
    });

  const load = async () => {
    page = Math.max(1, Number(pageInput.value || page) || 1);
    size = Math.max(1, Math.min(300, Number(sizeInput.value || size) || 20));
    pageInput.value = String(page);
    sizeInput.value = String(size);
    const keyword = String(qInput?.value || "").trim();

    loadBtn.disabled = true;
    setSummary("加载中...");
    setPageInfo(`第 ${page} 页 · 每页 ${size} 条`);
    tbody.innerHTML = `<tr><td colspan="9" class="px-5 py-10 text-center text-xs text-slate-400"><i class="fas fa-circle-notch fa-spin mr-2"></i>加载中...</td></tr>`;
    try {
      // 若输入 product_id，则优先直接查该商品（不受分页限制）。
      if (keyword) {
        const desc = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", {
          product_id: keyword,
          country: countryInput.value,
        });
        if (String(desc?.code) === "2") return;
        if (String(desc?.code) !== "0") {
          setSummary(desc?.msg || "查询失败");
          setPageInfo("按 ID 查询失败");
          renderRows([]);
          return;
        }
        const productData =
          desc?.data?.result?.result_data ||
          desc?.data?.result_data ||
          desc?.data?.data ||
          desc?.data ||
          {};
        const pid = productData?.product_id || productData?.id || keyword;
        const normalized = { ...productData, product_id: pid, id: pid };
        lastList = [normalized];
        renderRows(lastList);
        syncBatchCount();
        setSummary(`按 product_id=${keyword} 查询 · 共 1 条`);
        setPageInfo("单品搜索");
        return;
      }

      const res = await postAuthedJson("/api/alibaba_tool/alibaba/products_list", { page, size, country: countryInput.value });
      if (String(res?.code) === "2") return;
      if (String(res?.code) !== "0") {
        setSummary(res?.msg || "加载失败");
        setPageInfo("-");
          tbody.innerHTML = `<tr><td colspan="9" class="px-5 py-10 text-center text-xs text-slate-400">加载失败</td></tr>`;
          return;
        }
        lastList = res?.data?.list || [];
        renderRows(lastList);
        syncBatchCount();
        setSummary(`第 ${page} 页 · 本页 ${lastList.length} 条 · 每页 ${size} 条`);
        setPageInfo(`第 ${page} 页 · 本页 ${lastList.length} 条 · 每页 ${size} 条`);
      } catch {
        setSummary("网络异常，加载失败。");
        setPageInfo("-");
        tbody.innerHTML = `<tr><td colspan="9" class="px-5 py-10 text-center text-xs text-slate-400">网络异常</td></tr>`;
      } finally {
        loadBtn.disabled = false;
      }
    };

    const showDetail = () => {
      if (listWrap) {
        listWrap.classList.add("hidden");
        listWrap.hidden = true;
      }
      detailWrap.classList.remove("hidden");
      detailWrap.hidden = false;
    };
    const backToList = () => {
      detailWrap.classList.add("hidden");
      detailWrap.hidden = true;
      if (detailBody) detailBody.innerHTML = "";
      if (detailTitle) detailTitle.textContent = "商品详情";
      if (detailSummary) detailSummary.textContent = "-";
      if (detailOpenLink) {
        detailOpenLink.classList.add("hidden");
        detailOpenLink.dataset.openUrl = "";
      }
      if (listWrap) {
        listWrap.classList.remove("hidden");
        listWrap.hidden = false;
      }
    };
    detailBack?.addEventListener("click", backToList);

    const loadDetail = async (pid) => {
      const p = String(pid || "").trim();
      if (!p) return;
      showDetail();
      if (detailTitle) detailTitle.textContent = p;
      if (detailSummary) detailSummary.textContent = `加载中：${p} ...`;
      if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400"><i class="fas fa-circle-notch fa-spin mr-2"></i>加载详情中...</div>`;
      if (detailOpenLink) {
        detailOpenLink.classList.add("hidden");
        detailOpenLink.dataset.openUrl = "";
      }
      try { sessionStorage.setItem("topm:aliApDetailPid", p); } catch {}
      try {
        const res = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", { product_id: p, country: countryInput.value });
        if (String(res?.code) === "2") return;
        if (String(res?.code) !== "0") {
          if (detailSummary) detailSummary.textContent = res?.msg || "加载失败";
          if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400">加载失败</div>`;
          return;
        }
        const resp = res?.data || {};
        const productData =
          resp?.result?.result_data && typeof resp.result.result_data === "object"
            ? resp.result.result_data
            : resp?.result_data && typeof resp.result_data === "object"
              ? resp.result_data
              : resp?.data && typeof resp.data === "object"
                ? resp.data
                : null;

        // Provide product_data for "产品上传" tool card.
        state.lastProductId = String(p);
        state.lastProductData = productData && typeof productData === "object" ? productData : null;

        renderAlibabaProductDetail(productData || {}, detailBody, detailSummary, detailOpenLink, { country: countryInput.value, price_multiplier: "21" });
      } catch {
        if (detailSummary) detailSummary.textContent = "网络异常，加载失败。";
        if (detailBody) detailBody.innerHTML = `<div class="text-xs text-slate-400">网络异常</div>`;
      }
    };

    loadBtn.addEventListener("click", load);
    if (prevBtn) prevBtn.addEventListener("click", () => { page = Math.max(1, page - 1); pageInput.value = String(page); load(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { page += 1; pageInput.value = String(page); load(); });
    if (qInput) {
      qInput.addEventListener("input", () => renderRows(lastList));
      qInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          load();
        }
      });
    }
    pageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") load(); });
    sizeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") load(); });
    pageGo?.addEventListener("click", () => load());

    tbody.addEventListener("click", (e) => {
      const closeBtn = e.target?.closest?.("button[data-ap-push-close='1']");
      if (closeBtn) {
        activePushPid = "";
        renderRows(lastList);
        return;
      }

      const pushBtn = e.target?.closest?.("button[data-ap-push-open='1']");
      if (pushBtn) {
        const pid = String(pushBtn.dataset.pid || "").trim();
        if (!pid) return;
        activePushPid = activePushPid === pid ? "" : pid;
        if (activePushPid && !pushStates[pid]) {
          setPushState(pid, { country: countryInput.value, multiplier: "21", platforms: ["tiktok"], summary: "-", viewHtml: "", running: false });
        }
        renderRows(lastList);
        return;
      }

      const runBtn = e.target?.closest?.("button[data-ap-push-run='1']");
      if (runBtn) {
        const pid = String(activePushPid || "").trim();
        if (!pid) return;
        const row = runBtn.closest("tr");
        const container = row?.querySelector?.("[data-ap-push-view]")?.closest?.("td") || row;
        const countryEl = container?.querySelector?.("[data-ap-push-country]");
        const multEl = container?.querySelector?.("[data-ap-push-multiplier]");
        const platEls = Array.from(container?.querySelectorAll?.("[data-ap-push-plat]") || []);
        const platforms = platEls.filter((el) => el.checked).map((el) => String(el.dataset.apPushPlat || "").trim()).filter(Boolean);
        if (!platforms.length) {
          setPushState(pid, { summary: "请至少选择一个平台" });
          renderRows(lastList);
          return;
        }

        (async () => {
          setPushState(pid, { running: true, summary: "准备 product_data..." });
          renderRows(lastList);
          try {
            const descRes = await postAuthedJson("/api/alibaba_tool/alibaba/product_description", { product_id: pid, country: countryEl?.value || countryInput.value });
            if (String(descRes?.code) === "2") return;
            if (String(descRes?.code) !== "0") {
              setPushState(pid, { running: false, summary: descRes?.msg || "拉取详情失败" });
              renderRows(lastList);
              return;
            }
            const resp = descRes?.data || {};
            const productData =
              resp?.result?.result_data && typeof resp.result.result_data === "object"
                ? resp.result.result_data
                : resp?.result_data && typeof resp.result_data === "object"
                  ? resp.result_data
                  : resp?.data && typeof resp.data === "object"
                    ? resp.data
                    : null;
            if (!productData) {
              setPushState(pid, { running: false, summary: "未拿到 product_data" });
              renderRows(lastList);
              return;
            }

            setPushState(pid, { summary: "推送中..." });
            renderRows(lastList);
            const pushRes = await postAuthedJson("/api/alibaba_tool/product_push", {
              product_data: productData,
              country: countryEl?.value || countryInput.value,
              price_multiplier: multEl?.value || "21",
              platforms,
            });
            if (String(pushRes?.code) === "2") return;
            if (String(pushRes?.code) !== "0") {
              setPushState(pid, { running: false, summary: pushRes?.msg || "推送失败", viewHtml: "" });
              renderRows(lastList);
              return;
            }
            setPushState(pid, {
              running: false,
              summary: "推送完成",
              viewHtml: renderPushResultHtml(pushRes?.data || {}),
              country: countryEl?.value || countryInput.value,
              multiplier: multEl?.value || "21",
              platforms,
            });
            renderRows(lastList);
          } catch {
            setPushState(pid, { running: false, summary: "网络异常，请稍后重试" });
            renderRows(lastList);
          }
        })();
        return;
      }

      const btn = e.target?.closest?.("button[data-ap-detail='1']");
      if (!btn) return;
      loadDetail(btn.dataset.pid);
    });

    // Always start in列表视图
    backToList();
    load();
  }

  function openTool(toolId) {
    const m = meta[toolId];
    if (m) {
      stageTitle.textContent = "";
      stageDesc.textContent = "";
      try {
        const heroTitle = document.getElementById("ali-hero-title");
        const heroDesc = document.getElementById("ali-hero-desc");
        if (heroTitle) heroTitle.textContent = `Alibaba 工具 - ${m.title || ""}`;
        if (heroDesc) heroDesc.textContent = m.desc || "";
      } catch {
        // ignore
      }
    }
    enterFocusMode(toolId);
    setActiveCard(toolId);
    renderTemplate(toolId);
    try {
      localStorage.setItem("topm:lastAliTool", String(toolId || ""));
    } catch {
      // ignore
    }
    if (toolId === "config") setupConfigPanel();
    if (toolId === "url-extract") setupUrlExtractPanel();
    if (toolId === "url-push") setupUrlPushPanel();
    if (toolId === "elegate-browser") setupElegateBrowserPanel();
    if (toolId === "alibaba-products") setupAlibabaProductsPanel();
    if (toolId === "openapi") setupOpenApiPanel();

    // bring the stage into view for mobile
    try {
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // ignore
    }
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      openTool(btn.dataset.aliToolCard);
    });
  });

  if (backBtn) backBtn.addEventListener("click", exitFocusMode);
  if (configBtn) configBtn.addEventListener("click", () => openTool("config"));
  // Stage is hidden by default; it is shown only after picking a tool.
  try {
    const savedTool = localStorage.getItem("topm:lastAliTool") || "";
    const inAlibabaView = routeFromHash() === "alibaba";
    if (inAlibabaView && savedTool && templates[savedTool]) {
      openTool(savedTool);
      return;
    }
  } catch {
    // ignore
  }
  exitFocusMode();
}
