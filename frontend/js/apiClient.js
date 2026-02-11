import { API_BASE } from "./config.js";
import { getAuth } from "./auth.js";

let pendingRequests = 0;

function emitLoading() {
  if (typeof window === "undefined" || !window?.dispatchEvent) return;
  try {
    window.dispatchEvent(new CustomEvent("topm:loading", { detail: { pending: pendingRequests } }));
  } catch {
    // ignore
  }
}

async function withLoading(fn) {
  pendingRequests += 1;
  emitLoading();
  try {
    return await fn();
  } finally {
    pendingRequests = Math.max(0, pendingRequests - 1);
    emitLoading();
  }
}

export async function postJson(path, body) {
  return withLoading(async () => {
    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }

    let text = "";
    try {
      text = await resp.text();
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { code: "1", msg: "Server did not return JSON.", data: { raw: text } };
    }
  });
}

export async function postUrlEncoded(path, body) {
  const params = new URLSearchParams();
  Object.entries(body || {}).forEach(([key, val]) => {
    if (val == null) return;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
      params.set(key, JSON.stringify(val));
      return;
    }
    params.set(key, String(val));
  });

  return withLoading(async () => {
    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
      });
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }

    let text = "";
    try {
      text = await resp.text();
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { code: "1", msg: "Server did not return JSON.", data: { raw: text } };
    }
  });
}

export async function postAuthedJson(path, body) {
  const auth = getAuth();
  if (!auth?.user || !auth?.token) {
    return { code: "2", msg: "not logged in", data: {} };
  }

  return postJson(path, { user: auth.user, token: auth.token, ...(body || {}) });
}

export async function postAuthedFormData(path, formData) {
  const auth = getAuth();
  if (!auth?.user || !auth?.token) {
    return { code: "2", msg: "not logged in", data: {} };
  }

  formData.append("user", auth.user);
  formData.append("token", auth.token);

  return withLoading(async () => {
    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }

    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      return { code: "1", msg: "Server did not return JSON.", data: { raw: text } };
    }
  });
}

export async function postAuthedUrlEncoded(path, body) {
  const auth = getAuth();
  if (!auth?.user || !auth?.token) {
    return { code: "2", msg: "not logged in", data: {} };
  }

  const params = new URLSearchParams();
  params.set("user", auth.user);
  params.set("token", auth.token);
  Object.entries(body || {}).forEach(([key, val]) => {
    if (val == null) return;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
      params.set(key, JSON.stringify(val));
      return;
    }
    params.set(key, String(val));
  });

  return withLoading(async () => {
    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
      });
    } catch (e) {
      return { code: "1", msg: "Network error, unable to reach server.", data: { error: String(e) } };
    }

    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      return { code: "1", msg: "Server did not return JSON.", data: { raw: text } };
    }
  });
}
