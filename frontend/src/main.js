import "./style.css";
import { renderDataVault } from "./views/dataVault.js";
import { renderRoadmap } from "./views/roadmap.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <aside class="sidebar">
    <div class="brand"><span>IL</span><strong>InnoLab</strong></div>
    <nav aria-label="Điều hướng chính">
      <button class="nav-item" data-view="vault" type="button"><span>01</span>Data Vault</button>
      <button class="nav-item" data-view="roadmap" type="button"><span>02</span>Roadmap</button>
    </nav>
    <p class="workspace-label">LOCAL WORKSPACE</p>
  </aside>
  <main id="content"></main>
`;

const content = app.querySelector("#content");
const navItems = [...app.querySelectorAll(".nav-item")];

function showView(view) {
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  if (view === "roadmap") renderRoadmap(content);
  else renderDataVault(content);
  history.replaceState(null, "", `#${view}`);
}

navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
showView(location.hash === "#roadmap" ? "roadmap" : "vault");
