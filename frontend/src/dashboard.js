import "./style.css";
import "./styles/avant_garde.css";
import { clearSession, getAuthenticatedUser } from "./services/auth_controller.js";
import { initCreativeInteractions } from "./services/creative_interactions.js";
import { renderDataVault } from "./views/dataVault.js";
import { renderRoadmap } from "./views/roadmap.js";
import { renderInventory } from "./views/inventory.js";
import { renderResearchAssistant } from "./views/researchAssistant.js";
import { renderProjectExporter } from "./views/projectExporter.js";
import { renderReferences } from "./views/references.js";
import { renderVariableSuggester } from "./views/variableSuggester.js";
import { renderProjectOverview } from "./views/projectOverview.js";
import { renderHardwareLab } from "./views/hardwareLab.js";

const app = document.querySelector("#app");

async function startDashboard() {
  const user = await getAuthenticatedUser();
  if (!user) {
    window.location.replace(new URL("./index.html?auth=required", window.location.href));
    return;
  }

  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><span>IL</span><strong>InnoLab</strong></div>
      <nav aria-label="Điều hướng chính">
        <button class="nav-item" data-view="overview" type="button"><span>00</span>Tổng quan</button>
        <button class="nav-item" data-view="vault" type="button"><span>01</span>Data Vault</button>
        <button class="nav-item" data-view="roadmap" type="button"><span>02</span>Roadmap</button>
        <button class="nav-item" data-view="inventory" type="button"><span>03</span>Vật tư & Ngân sách</button>
        <button class="nav-item" data-view="assistant" type="button"><span>04</span>Trợ lý nghiên cứu</button>
        <button class="nav-item" data-view="exporter" type="button"><span>05</span>Xuất báo cáo</button>
        <button class="nav-item" data-view="references" type="button"><span>06</span>Thư viện tài liệu</button>
        <button class="nav-item" data-view="variables" type="button"><span>07</span>Kiểm tra biến số</button>
        <button class="nav-item" data-view="hardware" type="button"><span>08</span>Hardware Lab</button>
        ${String(user.role || "").toLowerCase() === "admin" ? '<button class="nav-item admin-entry" id="admin-entry" type="button"><span>09</span>Admin Control</button>' : ""}
      </nav>
      <button class="sound-toggle dashboard-sound" type="button" data-sound-toggle aria-pressed="false">SOUND: OFF</button>
      <button class="nav-item logout-item" id="sign-out" type="button"><span>↗</span>Đăng xuất</button>
      <p class="workspace-label">${escapeHtml(user.email || user.name || "RESEARCH WORKSPACE")}</p>
    </aside>
    <main id="content"></main>
  `;

  const content = app.querySelector("#content");
  const navItems = [...app.querySelectorAll(".nav-item[data-view]")];
  initCreativeInteractions(app);

  function showView(view) {
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
    if (view === "overview") renderProjectOverview(content);
    else if (view === "roadmap") renderRoadmap(content);
    else if (view === "inventory") renderInventory(content);
    else if (view === "assistant") renderResearchAssistant(content);
    else if (view === "exporter") renderProjectExporter(content);
    else if (view === "references") renderReferences(content);
    else if (view === "variables") renderVariableSuggester(content);
    else if (view === "hardware") renderHardwareLab(content);
    else renderDataVault(content);
    const marks = { overview: "LAB_LOGBOOK_V1.0", vault: "DATA_VAULT", roadmap: "RESEARCH_SEQUENCE", inventory: "MATERIAL_INDEX", assistant: "RISK_PROTOCOL", exporter: "DOSSIER_EXPORT", references: "SOURCE_REGISTER", variables: "VARIABLE_MATRIX", hardware: "HARDWARE_LAB" };
    content.querySelector(".module-heading")?.setAttribute("data-watermark", marks[view] || "INNOLAB_RESEARCH");
    initCreativeInteractions(content);
    history.replaceState(null, "", `#${view}`);
  }

  navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
  app.querySelector("#sign-out").addEventListener("click", () => {
    clearSession();
    window.location.replace(new URL("./index.html", window.location.href));
  });
  app.querySelector("#admin-entry")?.addEventListener("click", () => {
    window.location.assign(new URL("./admin.html", window.location.href));
  });
  const views = ["overview", "vault", "roadmap", "inventory", "assistant", "exporter", "references", "variables", "hardware"];
  const initialView = views.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
  showView(initialView);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

startDashboard().catch(() => {
  clearSession();
  window.location.replace(new URL("./index.html?auth=required", window.location.href));
});