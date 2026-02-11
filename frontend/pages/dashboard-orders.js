import { postAuthedFormData, postAuthedJson } from "../js/apiClient.js";
import { clearAuth, getAuth } from "../js/auth.js";
import { ensureImageViewer, ensureJsonString, escapeHtml, extractFirstUrl, formatUnixTimeMaybe, getOrderGoodsUrl, isAlibabaUser, isImageFile, mapAlibabaOrderStatus, mapOrderStatus, mapPayStatus, mapReviewBadge, mapReviewStatusText, mapShippingStatus, mapThirdOrderStatus, normalizeImgUrl, onSaleToggleIcon, openExternalUrl, parseJsonObject, renderCopyBtn, renderGoodsTable, renderGoodsTableInto, renderOrdersTable, renderTemuGoodsTableInto, resolveTopmAssetUrl, routeFromHash, safeExternalUrl, setActiveNav, setOrdersError, setPre, setTableLoading, setupRoutes, showConfirmPopover, showOnlyView, statusBadge, wsStatusBadge } from "./dashboard-shared.js";

export function setupOrdersList(authUser) {
  const keywordsInput = document.getElementById("orders-keywords");
  const mergeSel = document.getElementById("orders-merge");
  const compositeSel = document.getElementById("orders-composite-status");
  const alibabaStatusInput = document.getElementById("orders-alibaba-status");
  const sizeSel = document.getElementById("orders-size");
  const refreshBtn = document.getElementById("orders-refresh");
  const exportSettlementBtn = document.getElementById("orders-export-settlement");
  const exportPickingBtn = document.getElementById("orders-export-picking");
  const printAllPdfBtn = document.getElementById("orders-print-all-pdf");
  const alibabaAllPayBtn = document.getElementById("orders-alibaba-all-pay");
  const exportAliPushFailedBtn = document.getElementById("orders-export-ali-push-failed");
  const selectAllCheckbox = document.getElementById("orders-select-all");
  const prevBtn = document.getElementById("orders-prev");
  const nextBtn = document.getElementById("orders-next");
  const summaryEl = document.getElementById("orders-summary");
  const pageEl = document.getElementById("orders-page");
  const pageInput = document.getElementById("orders-page-input");
  const pageGo = document.getElementById("orders-page-go");
  const aliTh = document.getElementById("orders-ali-th");

  if (!refreshBtn || !prevBtn || !nextBtn || !sizeSel) return;

  const showAliColumn = String(authUser ?? "").trim().toLowerCase() === "alibaba";
  if (aliTh) {
    if (showAliColumn) aliTh.classList.remove("hidden");
    else aliTh.classList.add("hidden");
  }
  if (alibabaAllPayBtn) {
    if (showAliColumn) alibabaAllPayBtn.classList.remove("hidden");
    else alibabaAllPayBtn.classList.add("hidden");
  }
  if (exportAliPushFailedBtn) {
    exportAliPushFailedBtn.classList.add("hidden");
  }

  let page = 1;
  let total = 0;
  const selectedOrderSns = new Set();
  const tableColSpan = (showAliColumn ? 10 : 9) + 1;
  if (exportSettlementBtn) {
    exportSettlementBtn.disabled = true;
    exportSettlementBtn.title = "请先勾选订单后导出结算";
  }
  if (exportPickingBtn) {
    exportPickingBtn.disabled = true;
    exportPickingBtn.title = "请先勾选订单后导出拣货单";
  }
  if (printAllPdfBtn) {
    printAllPdfBtn.disabled = true;
    printAllPdfBtn.title = "请先勾选订单后合并面单";
  }
  if (alibabaAllPayBtn) {
    alibabaAllPayBtn.disabled = true;
    alibabaAllPayBtn.title = "请先勾选订单后发起阿里合并支付";
  }
  if (exportAliPushFailedBtn) {
    exportAliPushFailedBtn.disabled = false;
  }

  const modal = document.getElementById("orders-detail-modal");
  const modalOverlay = document.getElementById("orders-detail-modal-overlay");
  const modalClose = document.getElementById("orders-detail-modal-close");
  const modalHeader = document.getElementById("orders-detail-modal-header");
  const modalTitle = document.getElementById("orders-detail-modal-title");
  const modalSubtitle = document.getElementById("orders-detail-modal-subtitle");
  const modalAliHeader = document.getElementById("orders-detail-modal-ali-header");
  const modalTradeId = document.getElementById("orders-detail-modal-trade-id");
  const modalTradeStatus = document.getElementById("orders-detail-modal-trade-status");
  const modalTradeDate = document.getElementById("orders-detail-modal-trade-date");
  const modalFooter = document.getElementById("orders-detail-modal-footer");
  const modalBody = document.getElementById("orders-detail-modal-body");
  const modalError = document.getElementById("orders-detail-modal-error");
  const modalMeta = document.getElementById("orders-detail-modal-meta");

  const setModalError = (message) => {
    if (!modalError) return;
    if (!message) {
      modalError.classList.add("hidden");
      modalError.textContent = "";
      return;
    }
    modalError.classList.remove("hidden");
    modalError.textContent = message;
  };

  const resetModalHeader = () => {
    if (modalHeader) {
      modalHeader.className =
        "px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center";
    }
    if (modalTitle) modalTitle.classList.remove("hidden");
    if (modalSubtitle) modalSubtitle.classList.remove("hidden");
    if (modalAliHeader) modalAliHeader.classList.add("hidden");
    if (modalClose) {
      modalClose.className = "p-2 hover:bg-slate-100 rounded-full transition-colors";
    }
    if (modalFooter) {
      modalFooter.classList.add("hidden");
      modalFooter.innerHTML = "";
    }
  };

  const applyAlibabaHeader = (data) => {
    if (modalHeader) {
      modalHeader.className =
        "px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center";
    }
    if (modalTitle) modalTitle.classList.add("hidden");
    if (modalSubtitle) modalSubtitle.classList.add("hidden");
    if (modalAliHeader) modalAliHeader.classList.remove("hidden");

    const tradeId = String(data?.trade_id ?? data?.tradeId ?? data?.id ?? "-");
    const rawStatus = String(data?.trade_status ?? data?.alibaba_order_status ?? "").trim();
    const status = rawStatus.toLowerCase();
    const formatDate = String(data?.format_date ?? data?.formatDate ?? data?.date ?? "").trim();

    if (modalTradeId) modalTradeId.textContent = tradeId || "-";
    if (modalTradeDate) modalTradeDate.textContent = formatDate || "-";
    if (modalTradeStatus) {
      const badgeBase = "px-2 py-0.5 rounded text-xs font-bold uppercase";
      if (status === "unpay" || status === "unpaid") {
        modalTradeStatus.className = `${badgeBase} bg-amber-400 text-amber-900`;
        modalTradeStatus.textContent = "待支付";
      } else if (status) {
        modalTradeStatus.className = `${badgeBase} bg-emerald-400 text-emerald-900`;
        modalTradeStatus.textContent = rawStatus;
      } else {
        modalTradeStatus.className = `${badgeBase} bg-white/20 text-white`;
        modalTradeStatus.textContent = "-";
      }
    }
    if (modalClose) {
      modalClose.className = "p-2 hover:bg-white/20 rounded-full transition-colors";
    }
  };

  const applyOrderHeader = (data) => {
    if (modalHeader) {
      modalHeader.className =
        "px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center";
    }
    if (modalAliHeader) modalAliHeader.classList.add("hidden");
    if (modalTitle) {
      modalTitle.className = "text-base font-bold text-white truncate";
      modalTitle.textContent = "订单详情";
    }
    if (modalSubtitle) {
      modalSubtitle.className = "text-xs text-white/80 mt-0.5 truncate";
      const sn = String(data?.order_sn ?? data?.orderSn ?? "-");
      const created = String(data?.add_time ?? data?.formated_add_time ?? data?.created_at ?? "-");
      modalSubtitle.textContent = `订单号：${sn} · ${created}`;
    }
    if (modalClose) {
      modalClose.className = "p-2 hover:bg-white/20 rounded-full transition-colors";
    }
    if (modalFooter) {
      modalFooter.innerHTML = `
        <button
          type="button"
          class="px-6 py-3 bg-white text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
          data-modal-close="1"
        >
          关闭
        </button>
      `;
      modalFooter.classList.remove("hidden");
    }
  };

  const openModal = (title, subtitle) => {
    if (!modal) return;
    resetModalHeader();
    if (modalTitle) modalTitle.textContent = title || "订单详情";
    if (modalSubtitle) modalSubtitle.textContent = subtitle || "-";
    if (modalBody) modalBody.innerHTML = '<div class="text-xs text-slate-400">加载中...</div>';
    setModalError("");
    if (modalMeta) {
      modalMeta.classList.add("hidden");
      modalMeta.innerHTML = "";
    }
    modal.classList.remove("hidden");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    setModalError("");
    if (modalMeta) {
      modalMeta.classList.add("hidden");
      modalMeta.innerHTML = "";
    }
    if (modalBody) modalBody.innerHTML = "";
    resetModalHeader();
  };

  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalFooter) {
    modalFooter.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-modal-close]");
      if (!btn) return;
      closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal();
  });

  const rowLabel = (label) => `<div class="text-[11px] text-slate-400">${escapeHtml(label)}</div>`;
  const rowValue = (value) => `<div class="text-xs text-slate-800 font-medium break-words">${value}</div>`;

  const kv = (label, valueHtml) => `
    <div class="min-w-0">
      ${rowLabel(label)}
      ${rowValue(valueHtml)}
    </div>
  `;

  const section = (title, innerHtml) => `
    <div class="bg-white border border-slate-100 rounded-xl p-4">
      <div class="text-xs font-bold text-slate-700 mb-3">${escapeHtml(title)}</div>
      ${innerHtml}
    </div>
  `;

  const renderUnknown = (data) => section("数据", `<div class="text-xs text-slate-500">无法解析结构。</div>`);

  const renderOrderInfo = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return renderUnknown(data);

    const moneyMXN = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "-";
      return `${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    };

    const orderSn = String(data.order_sn ?? data.orderSn ?? "-");
    const orderId = String(data.order_id ?? data.orderId ?? "-");
    const invoiceNo = String(data.invoice_no ?? data.shipping_invoice_no ?? "-");
    const os = mapOrderStatus(data.order_status);
    const ps = mapPayStatus(data.pay_status);
    const ss = mapShippingStatus(data.shipping_status);

    const goodsList = Array.isArray(data.goods_list) ? data.goods_list : Array.isArray(data.goods) ? data.goods : [];
    const productsHtml =
      goodsList.length === 0
        ? `<div class="text-xs text-slate-400">无商品明细</div>`
        : goodsList
            .slice(0, 80)
            .map((g) => {
              const name = String(g.goods_name ?? g.name ?? "-");
              const sku = String(g.goods_sn ?? g.sku ?? "-");
              const qty = Number(g.goods_number ?? g.qty ?? g.number ?? 0) || 0;
              const unitPrice = Number(g.goods_price ?? g.price ?? 0) || 0;
              const img = String(g.goods_image ?? g.goods_thumb ?? g.img ?? "");
              const url = safeExternalUrl(g.url);
              const openAttr = url ? `data-open-url="${escapeHtml(url)}" title="打开链接"` : "";

              const nameHtml = url
                ? `<button type="button" ${openAttr} class="text-left text-slate-800 font-medium leading-tight line-clamp-2 hover:text-accent">${escapeHtml(
                    name,
                  )}</button>`
                : `<div class="text-slate-800 font-medium leading-tight line-clamp-2">${escapeHtml(name)}</div>`;

              return `
                <div class="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                  <div class="relative w-full sm:w-24 h-24 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <img
                      src="${escapeHtml(img || "https://via.placeholder.com/150?text=No+Image")}"
                      alt="${escapeHtml(name)}"
                      class="w-full h-full object-contain p-1"
                      onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Image';"
                    />
                  </div>
                  <div class="flex-1 space-y-1">
                    <div class="text-xs text-blue-600 font-medium">${escapeHtml(sku)}</div>
                    <h4 class="text-slate-800 font-medium leading-tight line-clamp-2">${nameHtml}</h4>
                    <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>数量: <strong>${qty}</strong></span>
                      <span>单价: <strong>${unitPrice ? moneyMXN(unitPrice) : "-"}</strong></span>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("");

    const goodsAmount = Number(data.goods_amount ?? data.formated_goods_amount ?? 0);
    const operationFeeRaw =
      data.operation_fee ??
      data.op_fee ??
      data.service_fee ??
      data.handling_fee ??
      data.formated_operation_fee ??
      data.formated_service_fee ??
      data.formated_handling_fee ??
      0;
    const operationFee = Number(operationFeeRaw);
    const orderAmount = Number(data.order_amount ?? data.formated_order_amount ?? 0);
    const payAmount = Number(data.surplus ?? data.formated_surplus ?? data.paid_amount ?? 0);

    const labelPdfUrl = safeExternalUrl(
      data.filePath ??
        data.file_path ??
        data.label_pdf_url ??
        data.shipping_label_url ??
        data.waybill_pdf_url ??
        data.waybill_url ??
        data.remark ??
        data.remark_url ??
        data.pdf_url ??
        data.order_pdf ??
        data.order_pdf_url ??
        data.pdf ??
        data.attachment_url ??
        "",
    );
    const pdfBtn = labelPdfUrl
      ? `<a
          href="${escapeHtml(labelPdfUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
        >
          <i class="far fa-file-lines"></i>
          <span>查看面单 PDF</span>
          <i class="fas fa-arrow-up-right-from-square text-[12px]"></i>
        </a>`
      : `<div class="text-xs text-slate-400">无相关附件</div>`;

    return `
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div class="flex items-center gap-2 text-slate-500 mb-2 text-sm">
          <i class="far fa-file-lines"></i> <span>订单信息</span>
        </div>
        <div class="space-y-1">
          <div class="text-sm font-bold text-slate-800">订单号：<span class="font-mono">${escapeHtml(orderSn)}</span></div>
          <div class="text-xs text-slate-500">订单ID：${escapeHtml(orderId)} · 物流单号：${escapeHtml(invoiceNo)}</div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          ${statusBadge(os.name, os.cls)}
          ${statusBadge(ss.name, ss.cls)}
          ${statusBadge(ps.name, ps.cls)}
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">产品明细</h3>
        <div class="space-y-4">${productsHtml}</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 text-left">相关文件</h3>
            ${pdfBtn}
          </div>
          <div class="pt-2">
            <p class="text-xs text-slate-400">提示：如需修改订单信息请联系管理员或在上游平台操作。</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">商品小计</span>
            <span class="font-medium text-slate-800">${Number.isFinite(goodsAmount) ? moneyMXN(goodsAmount) : "-"}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">操作费</span>
            <span class="font-medium text-slate-800">${Number.isFinite(operationFee) ? moneyMXN(operationFee) : "-"}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">订单金额</span>
            <span class="font-medium text-slate-800">${Number.isFinite(orderAmount) ? moneyMXN(orderAmount) : "-"}</span>
          </div>
          <div class="flex justify-between items-end pt-3 border-t border-dashed border-slate-200">
            <span class="text-slate-800 font-bold">支付金额</span>
            <div class="text-right">
              <span class="text-2xl font-black text-blue-600">${Number.isFinite(payAmount) ? moneyMXN(payAmount).replace(" MXN", "") : "-"}</span>
              <div class="text-[11px] text-slate-400 mt-0.5">MXN</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderAlibabaInfo = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return renderUnknown(data);

    const moneyMXN = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "-";
      return `${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    };

    const buyer = String(data.buyer_full_name ?? data.buyer_name ?? data.buyerNick ?? data.buyer ?? "-");
    const seller = String(data.seller_full_name ?? data.seller_name ?? data.seller ?? "-");
    const remarkUrl = safeExternalUrl(data.remark ?? data.remark_url ?? "");

    const products = Array.isArray(data.order_products)
      ? data.order_products
      : Array.isArray(data.products)
        ? data.products
        : [];

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const productsHtml =
      products.length === 0
        ? `<div class="text-xs text-slate-400">无产品明细</div>`
        : products
            .slice(0, 80)
            .map((p) => {
              const model = String(p.model_number ?? p.modelNumber ?? p.sku ?? "-");
              const name = String(p.name ?? p.product_name ?? p.productName ?? "-");
              const img = String(p.product_image ?? p.image ?? p.img ?? "");
              const qty = toNum(p.quantity ?? p.qty ?? 0);
              const unit = String(p.unit ?? "");
              const unitPriceAmt = toNum(p.unit_price?.amount ?? p.unit_price_amount ?? p.price ?? 0);

              const qtyText = unit ? `${qty} ${escapeHtml(unit)}` : String(qty);
              const priceText = unitPriceAmt ? moneyMXN(unitPriceAmt) : "-";

              return `
                <div class="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                  <div class="relative w-full sm:w-24 h-24 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <img
                      src="${escapeHtml(img || "https://via.placeholder.com/150?text=No+Image")}"
                      alt="${escapeHtml(name)}"
                      class="w-full h-full object-contain p-1"
                      onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Image';"
                    />
                  </div>
                  <div class="flex-1 space-y-1">
                    <div class="text-xs text-blue-600 font-medium">${escapeHtml(model)}</div>
                    <h4 class="text-slate-800 font-medium leading-tight line-clamp-2">${escapeHtml(name)}</h4>
                    <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>数量: <strong>${qtyText}</strong></span>
                      <span>单价: <strong>${priceText}</strong></span>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("");

    const productSubtotal = toNum(data.product_total_amount ?? data.product_subtotal ?? 0);
    const shipAmt = toNum(data.shipment_fee?.amount ?? data.shipping_fee?.amount ?? data.shipment_fee_amount ?? 0);
    const totalAmt = toNum(data.total_amount ?? 0);

    const fileBtn = remarkUrl
      ? `<a
          href="${escapeHtml(remarkUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
        >
          <i class="far fa-file-lines"></i>
          <span>查看订单 PDF 附件</span>
          <i class="fas fa-arrow-up-right-from-square text-[12px]"></i>
        </a>`
      : `<div class="text-xs text-slate-400">无相关附件</div>`;

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div class="flex items-center gap-2 text-slate-500 mb-2 text-sm">
            <i class="far fa-user"></i> <span>买家信息</span>
          </div>
          <div class="font-bold text-slate-800">${escapeHtml(buyer)}</div>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div class="flex items-center gap-2 text-slate-500 mb-2 text-sm">
            <i class="fas fa-box"></i> <span>卖家信息</span>
          </div>
          <div class="font-bold text-slate-800">${escapeHtml(seller)}</div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">产品明细</h3>
        <div class="space-y-4">${productsHtml}</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 text-left">相关文件</h3>
            ${fileBtn}
          </div>
          <div class="pt-2">
            <p class="text-xs text-slate-400">注意：请在规定时间内完成支付以确保库存充足。</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">商品小计 (MXN)</span>
            <span class="font-medium text-slate-800">${productSubtotal ? moneyMXN(productSubtotal) : "-"}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">运费 (MXN)</span>
            <span class="font-medium text-slate-800">${shipAmt ? moneyMXN(shipAmt) : "-"}</span>
          </div>
          <div class="flex justify-between items-end pt-3 border-t border-dashed border-slate-200">
            <span class="text-slate-800 font-bold">最终总计</span>
            <div class="text-right">
              <span class="text-xs text-slate-400 block mb-0.5">MXN</span>
              <span class="text-2xl font-black text-blue-600">${totalAmt ? moneyMXN(totalAmt).replace(" MXN", "") : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const fetchAndShowDetail = async (endpoint, payload, title, subtitle) => {
    openModal(title, subtitle);
    if (!modalBody) return;
    try {
      const res = await postAuthedJson(endpoint, payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setModalError(res?.msg || "加载失败");
        modalBody.innerHTML = section("请求失败", `<div class="text-xs text-rose-600">${escapeHtml(res?.msg || "加载失败")}</div>`);
        return;
      }
      const data = res?.data ?? res;
      if (endpoint === "/api/orders/alibabaInfo") {
        applyAlibabaHeader(data);
        modalBody.innerHTML = renderAlibabaInfo(data);
        if (modalFooter) {
          const payUrl = safeExternalUrl(data?.pay_url ?? data?.alibaba_pay_url ?? "");
          const rawStatus = String(data?.trade_status ?? data?.alibaba_order_status ?? "").trim().toLowerCase();
          const canPay = (rawStatus === "unpay" || rawStatus === "unpaid") && Boolean(payUrl);
          const payBtn = payUrl
            ? `<a
                href="${escapeHtml(payUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 ${
                  canPay
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200"
                    : "bg-slate-300 text-white cursor-not-allowed"
                } font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                ${canPay ? "" : 'tabindex="-1" aria-disabled="true"'}
              >
                <i class="far fa-credit-card"></i>
                立即前往支付
                <i class="fas fa-chevron-right"></i>
              </a>`
            : "";

          modalFooter.innerHTML = `
            ${payBtn}
            <button
              type="button"
              class="px-6 py-3 bg-white text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
              data-modal-close="1"
            >
              稍后处理
            </button>
          `;
          modalFooter.classList.remove("hidden");
        }
      } else if (endpoint === "/api/orders/info") {
        applyOrderHeader(data);
        modalBody.innerHTML = renderOrderInfo(data);
      } else {
        resetModalHeader();
        modalBody.innerHTML = renderUnknown(data);
      }
    } catch {
      setModalError("网络异常，请稍后重试。");
      if (modalBody) modalBody.innerHTML = "";
    }
  };

  const aliPayUrlCache = new Map();
  const fetchAlibabaPayUrl = async (payload) => {
    const key = String(payload?.ali_order_sn ?? payload?.alibaba_order_sn ?? payload?.alibaba_order_no ?? "").trim();
    if (key && aliPayUrlCache.has(key)) return aliPayUrlCache.get(key) || "";

    const res = await postAuthedJson("/api/orders/alibabaInfo", payload);
    if (String(res?.code) === "2") {
      clearAuth();
      window.location.href = "./login.html";
      return "";
    }
    if (String(res?.code) !== "0") return "";

    const data = res?.data ?? {};
    const payUrl = safeExternalUrl(data?.pay_url ?? data?.alibaba_pay_url ?? "");
    if (key) aliPayUrlCache.set(key, payUrl || "");
    return payUrl || "";
  };

  const readSize = () => {
    let v = Number(sizeSel.value || 15);
    if (!Number.isFinite(v) || v <= 0) v = 15;
    v = Math.floor(v);
    v = Math.max(1, Math.min(200, v));
    sizeSel.value = String(v);
    return v;
  };

  const tbody = document.getElementById("orders-tbody");
  if (tbody) {
    tbody.addEventListener("change", (e) => {
      const cb = e.target?.closest?.("input.order-select[type='checkbox']");
      if (!cb) return;
      const sn = String(cb.dataset.orderSn ?? "").trim();
      if (!sn) return;
      if (cb.checked) selectedOrderSns.add(sn);
      else selectedOrderSns.delete(sn);
      syncSelectAllState();
      setPager();
    });

    tbody.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.(".sku-copy");
      if (btn) {
        const sku = btn.dataset.sku || "";
        if (!sku) return;
        const originalHtml = btn.innerHTML;
        const originalTitle = btn.getAttribute("title") || "";
        const ok = await copyToClipboard(sku);

        if (ok) {
          btn.classList.add("text-emerald-600");
          btn.setAttribute("title", "已复制");
          btn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            btn.classList.remove("text-emerald-600");
            btn.setAttribute("title", originalTitle);
            btn.innerHTML = originalHtml;
          }, 900);
          return;
        }

        btn.classList.add("text-rose-600");
        btn.setAttribute("title", "复制失败");
        btn.innerHTML = '<i class="fas fa-triangle-exclamation"></i>';
        setTimeout(() => {
          btn.classList.remove("text-rose-600");
          btn.setAttribute("title", originalTitle);
          btn.innerHTML = originalHtml;
        }, 1200);
        return;
      }

      const orderInfoBtn = e.target?.closest?.(".order-info-btn");
      if (orderInfoBtn) {
        const orderId = String(orderInfoBtn.dataset.orderId ?? "").trim();
        const orderSn = String(orderInfoBtn.dataset.orderSn ?? "").trim();
        const payload = {};
        if (orderId) payload.order_id = orderId;
        if (orderSn) payload.order_sn = orderSn;
        await fetchAndShowDetail("/api/orders/info", payload, "订单详情", `订单号：${orderSn || "-"}`);
        return;
      }

      const aliInfoBtn = e.target?.closest?.(".ali-order-info-btn");
      if (aliInfoBtn) {
        const orderId = String(aliInfoBtn.dataset.orderId ?? "").trim();
        const orderSn = String(aliInfoBtn.dataset.orderSn ?? "").trim();
        const aliOrderSn = String(aliInfoBtn.dataset.aliOrderSn ?? "").trim();
        const payload = {};
        if (orderId) payload.order_id = orderId;
        if (orderSn) payload.order_sn = orderSn;
        if (aliOrderSn) payload.ali_order_sn = aliOrderSn;
        await fetchAndShowDetail(
          "/api/orders/alibabaInfo",
          payload,
          "阿里巴巴订单详情",
          `阿里订单号：${aliOrderSn || "-"} · 订单号：${orderSn || "-"}`,
        );
        return;
      }

      const invoiceViewBtn = e.target?.closest?.(".invoice-view-btn");
      if (invoiceViewBtn) {
        const pending = invoiceViewBtn.dataset.pending === "1";
        if (pending) return;
        invoiceViewBtn.dataset.pending = "1";
        const originalHtml = invoiceViewBtn.innerHTML;
        invoiceViewBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>获取中...';
        try {
          const orderId = String(invoiceViewBtn.dataset.orderId ?? "").trim();
          const orderSn = String(invoiceViewBtn.dataset.orderSn ?? "").trim();
          const payload = {};
          if (orderId) payload.order_id = orderId;
          if (orderSn) payload.order_sn = orderSn;
          const res = await postAuthedJson("/api/orders/invoiceView", payload);
          if (String(res?.code) === "2") {
            clearAuth();
            window.location.href = "./login.html";
            return;
          }
          if (String(res?.code) !== "0") {
            setOrdersError(res?.msg || "获取面单失败");
            return;
          }

          const data = res?.data ?? {};
          const url =
            (typeof data === "string" ? safeExternalUrl(data) : "") ||
            safeExternalUrl(
              data?.url ??
                data?.download_url ??
                data?.file_url ??
                data?.filePath ??
                data?.file_path ??
                data?.pdf_url ??
                data?.label_pdf_url ??
                data?.shipping_label_url ??
                data?.waybill_pdf_url ??
                data?.waybill_url ??
                data?.link ??
                data?.path ??
                "",
            ) ||
            extractFirstUrl(res?.msg) ||
            extractFirstUrl(JSON.stringify(data));

          if (!url) {
            setOrdersError("获取成功，但未返回面单链接");
            return;
          }

          openExternalUrl(url);
        } catch {
          setOrdersError("网络异常，请稍后重试。");
        } finally {
          invoiceViewBtn.dataset.pending = "0";
          invoiceViewBtn.innerHTML = originalHtml;
        }
        return;
      }

      const aliPayLink = e.target?.closest?.(".ali-pay-link");
      if (aliPayLink) {
        e.preventDefault?.();
        const pending = aliPayLink.dataset.pending === "1";
        if (pending) return;
        aliPayLink.dataset.pending = "1";
        try {
          const orderId = String(aliPayLink.dataset.orderId ?? "").trim();
          const orderSn = String(aliPayLink.dataset.orderSn ?? "").trim();
          const aliOrderSn = String(aliPayLink.dataset.aliOrderSn ?? "").trim();
          const payload = {};
          if (orderId) payload.order_id = orderId;
          if (orderSn) payload.order_sn = orderSn;
          if (aliOrderSn) payload.ali_order_sn = aliOrderSn;

          const payUrl = await fetchAlibabaPayUrl(payload);
          if (!payUrl) return;
          aliPayLink.setAttribute("href", payUrl);
          openExternalUrl(payUrl);
        } finally {
          aliPayLink.dataset.pending = "0";
        }
      }
    });
  }

  const setPager = () => {
    const size = readSize();
    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / size));
    if (page > totalPages) page = totalPages;
    if (pageEl) pageEl.textContent = `${page} / ${totalPages}`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    if (summaryEl) {
      const selected = selectedOrderSns.size;
      summaryEl.textContent =
        selected > 0 ? `共 ${Number(total) || 0} 单 · 每页 ${size} 单 · 已选 ${selected} 单` : `共 ${Number(total) || 0} 单 · 每页 ${size} 单`;
    }
    if (exportSettlementBtn) {
      exportSettlementBtn.disabled = selectedOrderSns.size === 0;
      exportSettlementBtn.title =
        selectedOrderSns.size === 0 ? "请先勾选订单后导出结算" : `导出结算（已选 ${selectedOrderSns.size} 单）`;
    }
    if (exportPickingBtn) {
      exportPickingBtn.disabled = selectedOrderSns.size === 0;
      exportPickingBtn.title =
        selectedOrderSns.size === 0 ? "请先勾选订单后导出拣货单" : `导出拣货单（已选 ${selectedOrderSns.size} 单）`;
    }
    if (printAllPdfBtn) {
      printAllPdfBtn.disabled = selectedOrderSns.size === 0;
      printAllPdfBtn.title =
        selectedOrderSns.size === 0 ? "请先勾选订单后合并面单" : `合并面单（已选 ${selectedOrderSns.size} 单）`;
    }
    if (alibabaAllPayBtn) {
      alibabaAllPayBtn.disabled = selectedOrderSns.size === 0;
      alibabaAllPayBtn.title =
        selectedOrderSns.size === 0 ? "请先勾选订单后发起阿里合并支付" : `阿里合并支付（已选 ${selectedOrderSns.size} 单）`;
    }
  };

  const syncSelectAllState = () => {
    if (!selectAllCheckbox) return;
    const tbody = document.getElementById("orders-tbody");
    if (!tbody) return;
    const boxes = Array.from(tbody.querySelectorAll('input.order-select[type="checkbox"]:not(:disabled)'));
    if (boxes.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      return;
    }
    const checkedCount = boxes.filter((b) => b.checked).length;
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === boxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
  };

  const load = async () => {
    setOrdersError("");
    refreshBtn.disabled = true;
    refreshBtn.textContent = "加载中...";
    setTableLoading("orders-tbody", tableColSpan, { showSpinner: true });

    const size = readSize();
    const keywords = String(keywordsInput?.value ?? "").trim();
    const merge = String(mergeSel?.value ?? "0").trim();
    const compositeStatus = String(compositeSel?.value ?? "").trim();
    const alibabaStatus = String(alibabaStatusInput?.value ?? "").trim();

    const payload = { page, size };
    if (keywords) payload.keywords = keywords;
    if (merge) payload.merge = Number(merge);
    if (compositeStatus) payload.composite_status = Number(compositeStatus);
    if (alibabaStatus) payload.alibaba_status = alibabaStatus;

    try {
      const res = await postAuthedJson("/api/orders/lists", payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setOrdersError(res?.msg || "加载失败");
        renderOrdersTable([], { showAliColumn, selectedOrderSns });
        total = 0;
        syncSelectAllState();
        setPager();
        return;
      }

      const data = res?.data || {};
      total = Number(data?.num ?? 0) || 0;
      renderOrdersTable(data?.list || [], { showAliColumn, selectedOrderSns });
      syncSelectAllState();
      setPager();
    } catch {
      setOrdersError("网络异常，请稍后重试。");
      renderOrdersTable([], { showAliColumn, selectedOrderSns });
      total = 0;
      syncSelectAllState();
      setPager();
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "搜索";
    }
  };

  const exportSettlement = async () => {
    if (!exportSettlementBtn) return;
    setOrdersError("");
    const sns = Array.from(selectedOrderSns).map((v) => String(v ?? "").trim()).filter(Boolean);
    if (sns.length === 0) {
      setOrdersError("请先勾选要导出的订单。");
      setPager();
      return;
    }
    const originalHtml = exportSettlementBtn.innerHTML || "导出结算";
    exportSettlementBtn.disabled = true;
    exportSettlementBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>导出中...';
    const payload = { order_sn: sns.join(",") };

    try {
      const res = await postAuthedJson("/api/orders/export_settlement", payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setOrdersError(res?.msg || "导出失败");
        return;
      }

      const data = res?.data ?? {};
      const url =
        (typeof data === "string" ? safeExternalUrl(data) : "") ||
        safeExternalUrl(data?.url ?? data?.download_url ?? data?.file_url ?? data?.file ?? data?.path ?? data?.link ?? "") ||
        extractFirstUrl(res?.msg) ||
        extractFirstUrl(JSON.stringify(data));

      if (!url) {
        setOrdersError("导出成功，但未返回下载链接");
        return;
      }

      openExternalUrl(url);
    } catch {
      setOrdersError("网络异常，请稍后重试。");
    } finally {
      exportSettlementBtn.disabled = false;
      exportSettlementBtn.innerHTML = originalHtml;
      setPager();
    }
  };

  const exportPicking = async () => {
    if (!exportPickingBtn) return;
    setOrdersError("");
    const sns = Array.from(selectedOrderSns).map((v) => String(v ?? "").trim()).filter(Boolean);
    if (sns.length === 0) {
      setOrdersError("请先勾选要导出的订单。");
      setPager();
      return;
    }
    const originalHtml = exportPickingBtn.innerHTML || "拣货单导出";
    exportPickingBtn.disabled = true;
    exportPickingBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>导出中...';
    const payload = { order_sn: sns.join(",") };

    try {
      const res = await postAuthedJson("/api/orders/export_picking", payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setOrdersError(res?.msg || "导出失败");
        return;
      }

      const data = res?.data ?? {};
      const url =
        (typeof data === "string" ? safeExternalUrl(data) : "") ||
        safeExternalUrl(data?.url ?? data?.download_url ?? data?.file_url ?? data?.file ?? data?.path ?? data?.link ?? "") ||
        extractFirstUrl(res?.msg) ||
        extractFirstUrl(JSON.stringify(data));

      if (!url) {
        setOrdersError("导出成功，但未返回下载链接");
        return;
      }

      openExternalUrl(url);
    } catch {
      setOrdersError("网络异常，请稍后重试。");
    } finally {
      exportPickingBtn.disabled = false;
      exportPickingBtn.innerHTML = originalHtml;
      setPager();
    }
  };

  const printAllPdf = async () => {
    if (!printAllPdfBtn) return;
    setOrdersError("");
    const sns = Array.from(selectedOrderSns).map((v) => String(v ?? "").trim()).filter(Boolean);
    if (sns.length === 0) {
      setOrdersError("请先勾选要合并面单的订单。");
      setPager();
      return;
    }
    const originalHtml = printAllPdfBtn.innerHTML || "合并面单";
    printAllPdfBtn.disabled = true;
    printAllPdfBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>处理中...';
    const payload = { order_sn: sns.join(",") };

    try {
      const res = await postAuthedJson("/api/orders/print_all_pdf", payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setOrdersError(res?.msg || "操作失败");
        return;
      }

      const data = res?.data ?? {};
      const url =
        (typeof data === "string" ? safeExternalUrl(data) : "") ||
        safeExternalUrl(data?.url ?? data?.download_url ?? data?.file_url ?? data?.file ?? data?.path ?? data?.link ?? "") ||
        extractFirstUrl(res?.msg) ||
        extractFirstUrl(JSON.stringify(data));

      if (!url) {
        setOrdersError("操作成功，但未返回面单下载链接");
        return;
      }

      openExternalUrl(url);
    } catch {
      setOrdersError("网络异常，请稍后重试。");
    } finally {
      printAllPdfBtn.disabled = false;
      printAllPdfBtn.innerHTML = originalHtml;
      setPager();
    }
  };

  const alibabaAllPay = async () => {
    if (!alibabaAllPayBtn) return;
    setOrdersError("");
    const sns = Array.from(selectedOrderSns).map((v) => String(v ?? "").trim()).filter(Boolean);
    if (sns.length === 0) {
      setOrdersError("请先勾选要合并支付的订单。");
      setPager();
      return;
    }
    const originalHtml = alibabaAllPayBtn.innerHTML || "阿里合并支付";
    alibabaAllPayBtn.disabled = true;
    alibabaAllPayBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>处理中...';
    const payload = { order_sn: sns.join(",") };

    try {
      const res = await postAuthedJson("/api/orders/alibaba_all_pay", payload);
      if (String(res?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(res?.code) !== "0") {
        setOrdersError(res?.msg || "操作失败");
        return;
      }

      const data = res?.data ?? {};
      const url =
        (typeof data === "string" ? safeExternalUrl(data) : "") ||
        safeExternalUrl(data?.pay_url ?? data?.alibaba_pay_url ?? data?.url ?? data?.download_url ?? data?.link ?? "") ||
        extractFirstUrl(res?.msg) ||
        extractFirstUrl(JSON.stringify(data));

      if (!url) {
        setOrdersError("操作成功，但未返回支付链接");
        return;
      }

      openExternalUrl(url);
    } catch {
      setOrdersError("网络异常，请稍后重试。");
    } finally {
      alibabaAllPayBtn.disabled = false;
      alibabaAllPayBtn.innerHTML = originalHtml;
      setPager();
    }
  };

  const exportAliPushFailedSettlement = async () => {
    if (!exportAliPushFailedBtn) return;
    setOrdersError("");
    if (!showAliColumn) return;

    const originalHtml = exportAliPushFailedBtn.innerHTML || "导出推送失败订单";
    exportAliPushFailedBtn.disabled = true;
    exportAliPushFailedBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>筛选中 0/500';

    const keywords = String(keywordsInput?.value ?? "").trim();
    const compositeStatus = String(compositeSel?.value ?? "").trim();

    const pageSize = 200;
    const targetScan = 500;
    const snSet = new Set();
    let scanned = 0;

    const buildListPayload = (p) => {
      const payload = { page: p, size: pageSize };
      if (keywords) payload.keywords = keywords;
      if (compositeStatus) payload.composite_status = Number(compositeStatus);
      return payload;
    };

    try {
      let p = 1;
      let totalPages = 1;

      while (p <= totalPages && scanned < targetScan) {
        exportAliPushFailedBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1"></i>筛选中 ${Math.min(
          scanned,
          targetScan,
        )}/${targetScan}`;
        const res = await postAuthedJson("/api/orders/lists", buildListPayload(p));
        if (String(res?.code) === "2") {
          clearAuth();
          window.location.href = "./login.html";
          return;
        }
        if (String(res?.code) !== "0") {
          setOrdersError(res?.msg || "筛选失败");
          return;
        }

        const data = res?.data || {};
        const num = Number(data?.num ?? 0) || 0;
        totalPages = Math.max(1, Math.ceil(num / pageSize));
        const list = Array.isArray(data?.list) ? data.list : [];

        const remaining = Math.max(0, targetScan - scanned);
        const slice = remaining > 0 ? list.slice(0, remaining) : [];
        scanned += slice.length;

        slice.forEach((o) => {
          const orderSn = String(o?.order_sn ?? "").trim();
          if (!orderSn) return;
          // "未推送成功" 以接口返回的阿里订单编号字段为空值为准；
          // 如果字段本身不存在，则不纳入“推送失败”范围。
          const aliRaw = (() => {
            if (!o || typeof o !== "object") return undefined;
            if (Object.prototype.hasOwnProperty.call(o, "ali_order_sn")) return o.ali_order_sn;
            if (Object.prototype.hasOwnProperty.call(o, "alibaba_order_sn")) return o.alibaba_order_sn;
            if (Object.prototype.hasOwnProperty.call(o, "alibaba_order_no")) return o.alibaba_order_no;
            return undefined;
          })();
          if (aliRaw === undefined) return;
          const aliText = aliRaw == null ? "" : String(aliRaw).trim();
          const pushFailed = aliText === "";
          if (!pushFailed) return;
          snSet.add(orderSn);
        });

        exportAliPushFailedBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1"></i>筛选中 ${Math.min(
          scanned,
          targetScan,
        )}/${targetScan} · 匹配 ${snSet.size}`;
        p += 1;
      }

      const sns = Array.from(snSet);
      if (sns.length === 0) {
        setOrdersError("未找到：阿里订单编号未推送成功的订单。");
        return;
      }

      exportAliPushFailedBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i>导出中...';

      const exportRes = await postAuthedJson("/api/orders/export_settlement", { order_sn: sns.join(",") });
      if (String(exportRes?.code) === "2") {
        clearAuth();
        window.location.href = "./login.html";
        return;
      }
      if (String(exportRes?.code) !== "0") {
        setOrdersError(exportRes?.msg || "导出失败");
        return;
      }

      const exportData = exportRes?.data ?? {};
      const url =
        (typeof exportData === "string" ? safeExternalUrl(exportData) : "") ||
        safeExternalUrl(
          exportData?.url ??
            exportData?.download_url ??
            exportData?.file_url ??
            exportData?.file ??
            exportData?.path ??
            exportData?.link ??
            "",
        ) ||
        extractFirstUrl(exportRes?.msg) ||
        extractFirstUrl(JSON.stringify(exportData));

      if (!url) {
        setOrdersError("导出成功，但未返回下载链接");
        return;
      }

      openExternalUrl(url);
    } catch {
      setOrdersError("网络异常，请稍后重试。");
    } finally {
      exportAliPushFailedBtn.disabled = false;
      exportAliPushFailedBtn.innerHTML = originalHtml;
      setPager();
    }
  };

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", () => {
      const tbody = document.getElementById("orders-tbody");
      if (!tbody) return;
      const boxes = Array.from(tbody.querySelectorAll('input.order-select[type="checkbox"]'));
      const checked = Boolean(selectAllCheckbox.checked);
      boxes.forEach((b) => {
        if (b.disabled) return;
        b.checked = checked;
        const sn = String(b.dataset.orderSn ?? "").trim();
        if (!sn) return;
        if (checked) selectedOrderSns.add(sn);
        else selectedOrderSns.delete(sn);
      });
      syncSelectAllState();
      setPager();
    });
  }

  refreshBtn.addEventListener("click", () => load());
  if (exportSettlementBtn) exportSettlementBtn.addEventListener("click", exportSettlement);
  if (exportPickingBtn) exportPickingBtn.addEventListener("click", exportPicking);
  if (printAllPdfBtn) printAllPdfBtn.addEventListener("click", printAllPdf);
  if (alibabaAllPayBtn) alibabaAllPayBtn.addEventListener("click", alibabaAllPay);
  if (exportAliPushFailedBtn) exportAliPushFailedBtn.addEventListener("click", exportAliPushFailedSettlement);
  sizeSel.addEventListener("change", () => {
    page = 1;
    load();
  });
  sizeSel.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    page = 1;
    load();
  });
  prevBtn.addEventListener("click", () => {
    page = Math.max(1, page - 1);
    load();
  });
  nextBtn.addEventListener("click", () => {
    page += 1;
    load();
  });
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

  load();
}
