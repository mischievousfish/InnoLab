import { getProjectOverview } from "../services/wails.js";

export async function renderProjectOverview(container) {
  container.innerHTML = `
    <section class="module-heading"><div><p class="eyebrow">Project Control</p><h1>Tổng quan dự án</h1></div><span class="module-badge" id="overview-status">Đang đồng bộ</span></section>
    <div class="metric-grid">
      <article class="metric-card"><span>Tiến độ</span><strong id="metric-progress">—</strong><div class="progress-track"><div id="metric-progress-bar"></div></div></article>
      <article class="metric-card"><span>Nhật ký thí nghiệm</span><strong id="metric-logbooks">—</strong><small>Số mục đã ghi nhận</small></article>
      <article class="metric-card"><span>Ngân sách còn lại</span><strong id="metric-budget">—</strong><small id="metric-budget-detail"></small></article>
      <article class="metric-card"><span>Task đang thực hiện</span><strong id="metric-tasks">—</strong><small>Công việc đang mở</small></article>
    </div>
    <div class="overview-layout">
      <section class="panel stage-panel"><div class="panel-heading"><div><h2>Hành trình NCKH</h2><p>5 giai đoạn của dự án.</p></div></div><div id="stage-progress" class="stage-progress"></div></section>
      <section class="panel recent-panel"><div class="panel-heading"><div><h2>Hoạt động gần đây</h2><p>Nhật ký Labbook mới nhất.</p></div></div><div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Trạng thái</th></tr></thead><tbody id="recent-logbooks"><tr><td colspan="3" class="empty-table">Chưa có dữ liệu hoạt động</td></tr></tbody></table></div></section>
    </div>`;

  const stages = ["Khảo sát", "Giả thuyết", "Thử nghiệm", "Phân tích", "Báo cáo"];
  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
  try {
    const overview = await getProjectOverview("default-project");
    container.querySelector("#metric-progress").textContent = `${overview.progress || 0}%`;
    container.querySelector("#metric-progress-bar").style.width = `${overview.progress || 0}%`;
    container.querySelector("#metric-logbooks").textContent = overview.logbookCount ?? 0;
    container.querySelector("#metric-budget").textContent = formatCurrency(overview.remainingBudget);
    container.querySelector("#metric-budget-detail").textContent = `Đã chi ${formatCurrency(overview.spentBudget)}`;
    container.querySelector("#metric-tasks").textContent = overview.activeTasks ?? 0;
    container.querySelector("#overview-status").textContent = "Đã đồng bộ";
    renderStages(container.querySelector("#stage-progress"), overview.stageProgress || {}, stages);
    renderRecent(container.querySelector("#recent-logbooks"), overview.recentLogbooks || []);
  } catch (error) {
    container.querySelector("#overview-status").textContent = "Ngoại tuyến";
    renderStages(container.querySelector("#stage-progress"), {}, stages);
  }
}

function renderStages(container, stageProgress, stages) {
  container.innerHTML = stages.map((name, index) => {
    const value = Number(stageProgress[index] || 0);
    return `<div class="stage-row"><div><span>${String(index + 1).padStart(2, "0")}</span><strong>${name}</strong><em>${value}%</em></div><div class="stage-track"><span style="width:${value}%"></span></div></div>`;
  }).join("");
}

function renderRecent(container, entries) {
  if (!entries.length) return;
  container.innerHTML = entries.map((entry) => `<tr><td>${entry.date || "—"}</td><td><strong>${escapeHtml(entry.title)}</strong></td><td><span class="overview-status-badge">${escapeHtml(entry.status || "Đã ghi")}</span></td></tr>`).join("");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
