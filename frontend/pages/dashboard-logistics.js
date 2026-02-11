import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupMerchantsLogistics() {
  const refreshBtn = document.getElementById("logistics-refresh");
  const availableWrap = document.getElementById("logistics-available");
  const labelInput = document.getElementById("logistics-label");
  const optionsEl = document.getElementById("logistics-options");
  const bindPanel = document.getElementById("logistics-bind-panel");
  const bindDisabledHint = document.getElementById("logistics-bind-disabled-hint");
  const bindBtn = document.getElementById("logistics-bind");
  const tbody = document.getElementById("logistics-tbody");
  const summary = document.getElementById("logistics-summary");
  const rawPre = document.getElementById("logistics-raw");
  const bindRaw = document.getElementById("logistics-bind-raw");

  if (!refreshBtn || !availableWrap || !labelInput || !bindBtn || !tbody) return;

  let lastAvailable = [];
  let bindableSet = new Set();
  let selectedName = "";
  let binding = false;
  let bindEnabled = false;

  const setSummary = (text) => {
    if (!summary) return;
    summary.textContent = text || "-";
  };

  const setBindEnabled = (enabled) => {
    bindEnabled = Boolean(enabled);
    if (labelInput) labelInput.disabled = !bindEnabled;
    if (bindPanel) {
      bindPanel.classList.toggle("opacity-60", !bindEnabled);
      bindPanel.classList.toggle("grayscale", !bindEnabled);
      bindPanel.classList.toggle("select-none", !bindEnabled);
    }
    if (bindDisabledHint) bindDisabledHint.classList.toggle("hidden", bindEnabled);
    if (!bindEnabled) {
      selectedName = "";
      if (labelInput) labelInput.value = "";
    }
  };

  setBindEnabled(false);

  const syncSelected = () => {
    const v = String(labelInput.value ?? "").trim();
    selectedName = bindEnabled && bindableSet.has(v) ? v : "";
    if (!binding) bindBtn.disabled = !bindEnabled || !selectedName;
  };

  const renderAvailable = () => {
    availableWrap.innerHTML = "";
    const list = Array.isArray(lastAvailable) ? lastAvailable : [];
    if (!list.length) {
      setBindEnabled(false);
      availableWrap.innerHTML = '<div class="text-[11px] text-slate-400">暂无可绑定物流</div>';
      if (optionsEl) optionsEl.innerHTML = "";
      syncSelected();
      return;
    }
    setBindEnabled(true);

    if (optionsEl) {
      optionsEl.innerHTML = "";
      for (const name of list) {
        const opt = document.createElement("option");
        opt.value = String(name);
        optionsEl.appendChild(opt);
      }
    }

    const slice = list.slice(0, 120);
    for (const name of slice) {
      const b = document.createElement("button");
      b.type = "button";
      const active = String(name) === selectedName;
      b.className = [
        "px-3 py-1.5 rounded-2xl border text-xs font-semibold flex items-center gap-2",
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
      ].join(" ");
      b.innerHTML = `<i class="fas fa-tag text-slate-400"></i><span class="truncate max-w-[220px]">${escapeHtml(name)}</span>`;
      b.addEventListener("click", () => {
        labelInput.value = String(name);
        syncSelected();
        labelInput.focus();
      });
      availableWrap.appendChild(b);
    }
    if (list.length > slice.length) {
      const tip = document.createElement("div");
      tip.className = "text-[11px] text-slate-400";
      tip.textContent = `仅展示前 ${slice.length} 个（共 ${list.length} 个），可在输入框搜索选择`;
      availableWrap.appendChild(tip);
    }
    syncSelected();
  };

  const renderBound = (list) => {
    tbody.innerHTML = "";
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="px-4 py-6 text-center text-[11px] text-slate-400">暂无已绑定物流</td></tr>';
      return;
    }
    for (const it of rows) {
      const id = it?.id ?? it?.logistics_id ?? "";
      const name = it?.label_name ?? it?.name ?? "";
      const tr = document.createElement("tr");
      tr.className = "border-t border-slate-100";
      tr.innerHTML = `
        <td class="px-4 py-3 font-mono text-xs text-slate-600">${escapeHtml(id)}</td>
        <td class="px-4 py-3">
          <div class="text-sm font-semibold text-slate-800">${escapeHtml(name)}</div>
        </td>
        <td class="px-4 py-3">
          <button data-act="unbind" data-id="${escapeHtml(id)}" class="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-100">
            <i class="fas fa-link-slash mr-1"></i>解绑
          </button>
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
      const res = await postAuthedJson("/api/merchants_logistics/lists", {});
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setSummary(res?.msg || "加载失败");
        renderBound([]);
        lastAvailable = [];
        renderAvailable();
        return;
      }
      const data = res?.data || {};
      const bound = Array.isArray(data?.list) ? data.list : [];
      // docs: logisticsArr: "未绑定物流名称" 的集合，可能是 object 或 array
      const arr = data?.logisticsArr;
      let available = [];
      if (Array.isArray(arr)) available = arr.map((x) => String(x));
      else if (arr && typeof arr === "object") available = Object.keys(arr);
      lastAvailable = available.map((x) => String(x).trim()).filter(Boolean);
      bindableSet = new Set(lastAvailable);
      renderAvailable();
      renderBound(bound);
      setSummary(`已绑定 ${bound.length} 个 · 可绑定 ${lastAvailable.length} 个`);
    } catch {
      setSummary("网络异常，请稍后重试");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = original;
    }
  };

  const bind = async () => {
    const name = String(labelInput.value ?? "").trim();
    if (!name) return;
    if (!bindEnabled) return;
    if (!bindableSet.has(name)) {
      setSummary("请先从“可绑定物流”中选择物流后再绑定");
      syncSelected();
      return;
    }
    const original = bindBtn.innerHTML;
    binding = true;
    bindBtn.disabled = true;
    bindBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>绑定中...';
    try {
      const res = await postAuthedJson("/api/merchants_logistics/insert", { label_name: name });
      setPre(bindRaw, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") return;
      labelInput.value = "";
      selectedName = "";
      await load();
    } catch {
      // ignore
    } finally {
      binding = false;
      bindBtn.disabled = false;
      bindBtn.innerHTML = original;
      syncSelected();
    }
  };

  const unbind = async (id) => {
    const v = String(id ?? "").trim();
    if (!v) return;
    const btn = tbody.querySelector(`button[data-act='unbind'][data-id='${CSS.escape(v)}']`);
    const original = btn?.innerHTML || "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>解绑中...';
    }
    try {
      const res = await postAuthedJson("/api/merchants_logistics/delete", { id: v });
      setPre(rawPre, res);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
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

  refreshBtn.addEventListener("click", load);
  bindBtn.addEventListener("click", bind);
  labelInput.addEventListener("input", syncSelected);
  labelInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") bind();
  });
  tbody.addEventListener("click", (e) => {
    const b = e.target?.closest?.("button[data-act='unbind']");
    if (!b) return;
    const id = b.dataset.id;
    unbind(id);
  });

  load();
}
