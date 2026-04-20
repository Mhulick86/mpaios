const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("auth-form");
const passwordInput = document.getElementById("password");
const errorEl = document.getElementById("auth-error");

let mode = "login";

function setMode(next) {
  mode = next;
  const login = next === "login";
  tabLogin.setAttribute("aria-selected", String(login));
  tabSignup.setAttribute("aria-selected", String(!login));
  tabLogin.classList.toggle("tab-active", login);
  tabSignup.classList.toggle("tab-active", !login);
  submitBtn.textContent = login ? "Log in" : "Create account";
  passwordInput.autocomplete = login ? "current-password" : "new-password";
  hideError();
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
function hideError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

tabLogin.addEventListener("click", () => setMode("login"));
tabSignup.addEventListener("click", () => setMode("signup"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  if (!email || !password) return showError("Email and password required.");
  if (mode === "signup" && password.length < 8) {
    return showError("Password must be at least 8 characters.");
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span>${mode === "login" ? "Logging in…" : "Creating…"}`;

  try {
    const res = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? `${res.status} ${res.statusText}`);
    }
    window.location.href = "/";
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = mode === "login" ? "Log in" : "Create account";
  }
});

setMode("login");

fetch("/api/auth/me", { credentials: "include" })
  .then((r) => r.json())
  .then((d) => {
    if (d.authenticated) window.location.href = "/";
  })
  .catch(() => {});
