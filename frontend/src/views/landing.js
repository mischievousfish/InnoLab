import landingMarkup from "./landing.html?raw";
import authModalMarkup from "./auth_modal.html?raw";
import "../styles/landing.css";
import { getAuthenticatedUser, signIn, signUp } from "../services/auth_controller.js";
import { initCreativeInteractions } from "../services/creative_interactions.js";

export async function renderLanding(container) {
  container.innerHTML = `${landingMarkup}${authModalMarkup}`;
  initCreativeInteractions(container);
  const authenticatedUser = await getAuthenticatedUser();
  if (authenticatedUser) {
    window.location.replace(new URL("./dashboard.html", window.location.href));
    return;
  }

  const modal = container.querySelector("[data-auth-modal]");
  const form = container.querySelector("[data-auth-form]");
  const nameField = container.querySelector("[data-auth-name-field]");
  const nameInput = form.elements.name;
  const passwordInput = form.elements.password;
  const confirmField = container.querySelector("[data-auth-confirm-field]");
  const confirmInput = form.elements.passwordConfirm;
  const submitButton = container.querySelector("[data-auth-submit]");
  const errorMessage = container.querySelector("[data-auth-error]");
  let mode = "login";

  const setMode = (nextMode) => {
    mode = nextMode;
    const registering = mode === "register";
    nameField.hidden = !registering;
    nameInput.required = registering;
    confirmField.hidden = !registering;
    confirmInput.required = registering;
    passwordInput.autocomplete = registering ? "new-password" : "current-password";
    submitButton.innerHTML = registering ? 'Tạo tài khoản <span aria-hidden="true">↗</span>' : 'Đăng nhập <span aria-hidden="true">↗</span>';
    container.querySelectorAll("[data-auth-mode]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.authMode === mode));
    });
    errorMessage.textContent = "";
    container.querySelector("#auth-title").textContent = registering ? "Tạo không gian của bạn" : "Chào mừng trở lại";
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("auth-open");
  };

  container.querySelectorAll("[data-open-auth]").forEach((button) => button.addEventListener("click", () => {
    setMode(button.dataset.openAuth);
    modal.hidden = false;
    document.body.classList.add("auth-open");
    requestAnimationFrame(() => form.elements.email.focus());
  }));
  container.querySelectorAll("[data-close-auth]").forEach((button) => button.addEventListener("click", closeModal));
  container.querySelectorAll("[data-auth-mode]").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.authMode)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = mode === "register" ? "Đang tạo tài khoản..." : "Đang xác thực...";
    try {
      const values = new FormData(form);
      if (mode === "register") {
        const password = values.get("password");
        if (password !== values.get("passwordConfirm")) throw new Error("Mật khẩu xác nhận chưa khớp.");
        await signUp({ name: values.get("name"), email: values.get("email"), password, passwordConfirm: values.get("passwordConfirm") });
      } else {
        await signIn(values.get("email"), values.get("password"));
      }
      window.location.assign(new URL("./dashboard.html", window.location.href));
    } catch (error) {
      errorMessage.textContent = error instanceof Error ? error.message : "Không thể xác thực tài khoản.";
      submitButton.innerHTML = mode === "register" ? 'Tạo tài khoản <span aria-hidden="true">↗</span>' : 'Đăng nhập <span aria-hidden="true">↗</span>';
      submitButton.disabled = false;
    }
  });
}