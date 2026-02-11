function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text ?? "-");
}

function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  if (visible) el.classList.remove("hidden");
  else el.classList.add("hidden");
}

function setError(message) {
  const el = document.getElementById("order-item-error");
  if (!el) return;
  if (!message) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.classList.remove("hidden");
  el.textContent = message;
}

export function initOrderItemPage() {
  setVisible("order-item-loading", true);

  try {
    const params = new URLSearchParams(window.location.search);
    const img = String(params.get("img") ?? "").trim();
    const url = String(params.get("url") ?? "").trim();
    const name = String(params.get("name") ?? "").trim();
    const sku = String(params.get("sku") ?? "").trim();
    const qty = String(params.get("qty") ?? "").trim();
    const orderSn = String(params.get("order_sn") ?? "").trim();

    if (!name && !img && !sku && !qty && !orderSn) {
      setError("缺少商品信息参数。");
      return;
    }

    setText("order-item-name", name || "-");
    setText("order-item-sku", sku || "-");
    setText("order-item-qty", qty || "-");
    setText("order-item-order-sn", orderSn || "-");

    const imgEl = document.getElementById("order-item-img");
    const imgLink = document.getElementById("order-item-img-link");
    const openLink = document.getElementById("order-item-open-link");
    const primaryLink = url || img || "#";

    if (imgEl) imgEl.src = img || "";
    if (imgLink) imgLink.href = primaryLink;
    if (openLink) openLink.href = primaryLink;

    document.title = name ? `${name} - TopM` : "商品明细 - TopM";
  } finally {
    setVisible("order-item-loading", false);
  }
}
