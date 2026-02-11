import { postUrlEncoded } from "../js/apiClient.js";
import { getAuth, setAuth } from "../js/auth.js";

const REMEMBER_KEY = "topm_login_remember";

function getRemembered() {
  const raw = localStorage.getItem(REMEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setRemembered(credentials) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(credentials));
}

function clearRemembered() {
  localStorage.removeItem(REMEMBER_KEY);
}

function setError(message) {
  const el = document.getElementById("login-error");
  if (!el) return;
  if (!message) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.style.display = "block";
  el.textContent = message;
}

export function initLoginPage() {
  const existing = getAuth();
  if (existing?.token) {
    window.location.href = "./dashboard.html";
    return;
  }

  const form = document.getElementById("login-form");
  const btn = document.getElementById("login-submit");
  const userInput = document.getElementById("login-user");
  const passInput = document.getElementById("login-pass");
  const rememberInput = document.getElementById("login-remember");

  if (!form || !btn || !userInput || !passInput) return;

  const remembered = getRemembered();
  if (remembered?.user) userInput.value = remembered.user;
  if (remembered?.pass) passInput.value = remembered.pass;
  if (rememberInput && remembered?.enabled) rememberInput.checked = true;

  if (rememberInput) {
    rememberInput.addEventListener("change", () => {
      if (!rememberInput.checked) clearRemembered();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");

    const user = userInput.value.trim();
    const pass = passInput.value;
    if (!user || !pass) {
      setError("请输入账号和密码。");
      return;
    }

    btn.disabled = true;
    btn.textContent = "登录中...";
    try {
      const payload = await postUrlEncoded("/api/login", { user, pass });
      if (String(payload?.code) !== "0" || !payload?.data?.token) {
        setError(payload?.msg || "登录失败，请检查账号密码。");
        return;
      }

      setAuth({
        user,
        token: payload.data.token,
        expire: payload.data.expire,
        time: payload.data.time,
      });

      if (rememberInput?.checked) {
        setRemembered({ enabled: true, user, pass });
      } else {
        clearRemembered();
      }

      window.location.href = "./dashboard.html";
    } catch {
      setError("网络异常，请稍后重试。");
    } finally {
      btn.disabled = false;
      btn.textContent = "登录";
    }
  });
}
