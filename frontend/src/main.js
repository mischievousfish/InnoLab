import "./style.css";
import "./styles/avant_garde.css";
import { renderLanding } from "./views/landing.js";

const app = document.querySelector("#app");

renderLanding(app).catch((error) => {
  app.innerHTML = `<main class="gate-failure"><h1>Không thể mở InnoLab</h1><p>${error instanceof Error ? error.message : "Vui lòng tải lại trang."}</p></main>`;
});
