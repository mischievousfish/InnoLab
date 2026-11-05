import { fetchRoadmapTasks, saveRoadmapTask } from "../services/wails.js";

const stages = [
  { id: "survey", number: 1, title: "Khảo sát tài liệu & Đặt vấn đề" },
  { id: "hypothesis", number: 2, title: "Giả thuyết & Thiết kế giải pháp" },
  { id: "prototype", number: 3, title: "Chế tạo nguyên mẫu" },
  { id: "analysis", number: 4, title: "Thu thập & Phân tích dữ liệu" },
  { id: "report", number: 5, title: "Viết báo cáo & Hoàn thiện" }
];

export function renderRoadmap(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Project Roadmap</p><h1>Lộ trình nghiên cứu</h1></div>
      <button class="button button-primary" id="new-task" type="button">+ Công việc mới</button>
    </section>
    <div class="roadmap-board" id="roadmap-board"></div>
    <div class="modal-backdrop" id="task-modal" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-heading"><h2 id="modal-title">Thêm công việc</h2><button class="icon-button" id="close-modal" type="button" aria-label="Đóng">×</button></div>
        <form id="task-form">
          <label>Tiêu đề công việc<input name="title" required maxlength="120" /></label>
          <label>Giai đoạn<select name="stage">${stages.map((stage) => `<option value="${stage.id}">${stage.number}. ${stage.title}</option>`).join("")}</select></label>
          <div class="form-grid">
            <label>Mức ưu tiên<select name="priority"><option value="low">Thấp</option><option value="medium" selected>Trung bình</option><option value="high">Cao</option></select></label>
            <label>Hạn hoàn thành<input name="deadline" type="date" /></label>
          </div>
          <label>Thành viên phụ trách<input name="assignee" maxlength="80" /></label>
          <p id="task-status" class="status" role="status"></p>
          <div class="modal-actions"><button class="button button-secondary" id="cancel-modal" type="button">Hủy</button><button class="button button-primary" type="submit">Lưu công việc</button></div>
        </form>
      </section>
    </div>
  `;

  let tasks = [];
  const board = container.querySelector("#roadmap-board");
  const modal = container.querySelector("#task-modal");
  const form = container.querySelector("#task-form");

  const priorityLabels = { low: "Thấp", medium: "Trung bình", high: "Cao" };
  const escapeHtml = (value = "") => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const formatDeadline = (value) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`)) : "Chưa có hạn";

  function renderBoard() {
    board.innerHTML = stages.map((stage) => {
      const stageTasks = tasks.filter((task) => task.stage === stage.id);
      return `<section class="roadmap-column">
        <header><span>${stage.number}</span><h2>${stage.title}</h2><strong>${stageTasks.length}</strong></header>
        <div class="task-list">${stageTasks.length ? stageTasks.map((task) => `<article class="task-card">
          <div class="task-top"><span class="priority priority-${task.priority}">${priorityLabels[task.priority]}</span><time>${escapeHtml(formatDeadline(task.deadline))}</time></div>
          <h3>${escapeHtml(task.title)}</h3>
          <div class="assignee"><span>${escapeHtml((task.assignee || "Chưa phân công").slice(0, 1).toUpperCase())}</span><p>${escapeHtml(task.assignee || "Chưa phân công")}</p></div>
        </article>`).join("") : `<p class="empty-state">Chưa có công việc</p>`}</div>
      </section>`;
    }).join("");
  }

  async function loadTasks() {
    try { tasks = await fetchRoadmapTasks("default-project"); }
    catch { tasks = []; }
    renderBoard();
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    form.elements.title.focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    form.reset();
    container.querySelector("#task-status").textContent = "";
  }

  container.querySelector("#new-task").addEventListener("click", openModal);
  container.querySelector("#close-modal").addEventListener("click", closeModal);
  container.querySelector("#cancel-modal").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  container.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const task = { id: crypto.randomUUID(), projectId: "default-project", title: data.get("title"), stage: data.get("stage"), priority: data.get("priority"), deadline: data.get("deadline") || null, assignee: data.get("assignee").trim() };
    const status = container.querySelector("#task-status");
    status.className = "status";
    try {
      await saveRoadmapTask(task);
      tasks = [...tasks, task];
      renderBoard();
      closeModal();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Không thể lưu công việc.";
      status.className = "status error";
    }
  });

  loadTasks();
}
