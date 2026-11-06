import "./style.css";
import "./styles/avant_garde.css";
import "./styles/admin_avant_garde.css";
import { renderAdmin } from "./views/admin.js";

const root = document.querySelector("#admin-app");
renderAdmin(root).catch((error) => {
  root.innerHTML = `<main class="admin-failure"><h1>Admin Control Center unavailable</h1><p>${error instanceof Error ? error.message : "Không thể xác thực quyền quản trị."}</p><a href="./">Quay lại InnoLab</a></main>`;
});