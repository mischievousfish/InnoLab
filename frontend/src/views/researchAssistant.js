import { analyzeMethodology, assessRisk } from "../services/wails.js";

export function renderResearchAssistant(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Research Quality</p><h1>AI Methodology Assistant</h1></div>
    </section>
    <div class="tab-bar" role="tablist" aria-label="Công cụ phản biện nghiên cứu">
      <button class="tab-button active" data-tab="methodology" type="button" role="tab">Phản biện phương pháp</button>
      <button class="tab-button" data-tab="risk" type="button" role="tab">Ma trận rủi ro</button>
    </div>

    <section class="assistant-layout tab-panel" id="methodology-panel">
      <form class="panel methodology-form" id="methodology-form">
        <div class="panel-heading"><div><h2>Thông tin nghiên cứu</h2><p>Mô tả nội dung để hệ thống kiểm tra cấu trúc biến số.</p></div></div>
        <div class="form-body">
          <label>Tên đề tài<input name="title" required placeholder="Ví dụ: Ảnh hưởng nhiệt độ đến tốc độ phản ứng"></label>
          <label>Giả thuyết nghiên cứu<textarea name="hypothesis" rows="5" required placeholder="Nếu..., thì..."></textarea></label>
          <label>Thiết bị, hóa chất và điều kiện thử nghiệm<textarea name="resources" rows="4" placeholder="Nhiệt độ, dung dịch, giá thể nhựa..."></textarea></label>
          <button class="button button-primary" type="submit">Phân tích phương pháp</button>
        </div>
      </form>
      <section class="panel reviewer-output" aria-live="polite">
        <div class="panel-heading"><div><h2>Phản biện phương pháp</h2><p>Gợi ý dựa trên quy tắc logic cục bộ.</p></div></div>
        <div id="methodology-result" class="review-body"><p class="empty-state">Nhập thông tin bên trái để bắt đầu phân tích.</p></div>
      </section>
    </section>

    <section class="assistant-layout tab-panel" id="risk-panel" hidden>
      <form class="panel methodology-form" id="risk-form">
        <div class="panel-heading"><div><h2>Đánh giá nguy cơ</h2><p>Khai báo thiết bị và hóa chất trước thí nghiệm.</p></div></div>
        <div class="form-body">
          <label>Danh sách hóa chất / thiết bị<textarea name="resources" rows="6" required placeholder="Axit loãng, nhiệt kế, nguồn điện 100°C, kính bảo hộ..."></textarea></label>
          <label>Nhiệt độ thử nghiệm (°C)<input name="temperature" type="number" step="1" placeholder="Ví dụ: 100"></label>
          <label>Điện áp thiết bị (V)<input name="voltage" type="number" step="1" placeholder="Ví dụ: 220"></label>
          <button class="button button-primary" type="submit">Đánh giá rủi ro</button>
        </div>
      </form>
      <section class="panel reviewer-output">
        <div class="panel-heading"><div><h2>Ma trận rủi ro</h2><p><span class="risk-dot risk-low"></span>Thấp <span class="risk-dot risk-medium"></span>Trung bình <span class="risk-dot risk-high"></span>Cao</p></div></div>
        <div id="risk-result" class="review-body"><p class="empty-state">Chưa có đánh giá rủi ro.</p></div>
      </section>
    </section>
  `;

  container.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      container.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("active", item === button));
      container.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = panel.id !== `${button.dataset.tab}-panel`; });
    });
  });

  container.querySelector("#methodology-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { projectId: "default-project", title: form.get("title"), hypothesis: form.get("hypothesis"), resources: form.get("resources") };
    const output = container.querySelector("#methodology-result");
    output.innerHTML = '<p class="review-loading">Đang phân tích...</p>';
    try {
      const result = await analyzeMethodology(payload);
      output.innerHTML = renderMethodology(result);
    } catch (error) {
      output.innerHTML = `<p class="status error">${error instanceof Error ? error.message : "Không thể phân tích phương pháp."}</p>`;
    }
  });

  container.querySelector("#risk-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { projectId: "default-project", resources: form.get("resources"), temperature: Number(form.get("temperature") || 0), voltage: Number(form.get("voltage") || 0) };
    const output = container.querySelector("#risk-result");
    output.innerHTML = '<p class="review-loading">Đang đánh giá...</p>';
    try {
      const result = await assessRisk(payload);
      output.innerHTML = renderRisk(result);
      bindSafetyChecklist(container.querySelector("#risk-result"));
    } catch (error) {
      output.innerHTML = `<p class="status error">${error instanceof Error ? error.message : "Không thể đánh giá rủi ro."}</p>`;
    }
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderMethodology(result) {
  const variables = result.variables || [];
  const warnings = result.warnings || [];
  return `<div class="variable-grid">
    ${variables.map((item) => `<article class="variable-card"><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.note)}</p></article>`).join("")}
  </div>
  <div class="warning-list"><h3>Cảnh báo logic</h3>${warnings.length ? warnings.map((warning) => `<div class="logic-warning"><span>!</span><p>${escapeHtml(warning)}</p></div>`).join("") : '<p>Không phát hiện cảnh báo logic theo quy tắc hiện tại.</p>'}</div>`;
}

function bindSafetyChecklist(output) {
  const button = output.querySelector("#start-experiment");
  const preflight = output.querySelector("#preflight-all");
  const items = [...output.querySelectorAll('[name="safety"]')];
  const update = () => { button.disabled = !items.every((item) => item.checked) || !preflight.checked; };
  [...items, preflight].forEach((input) => input.addEventListener("change", update));
}

function renderRisk(result) {
  const risks = result.risks || [];
  const checklist = result.checklist || [];
  return `<div class="risk-table"><div class="risk-table-head"><span>Yếu tố</span><span>Mức rủi ro</span></div>
    ${risks.map((risk) => `<div class="risk-row"><strong>${escapeHtml(risk.factor)}</strong><span class="risk-badge risk-${risk.level}">${risk.level === "high" ? "Cao" : risk.level === "medium" ? "Trung bình" : "Thấp"}</span></div>`).join("")}
  </div>
  <label class="preflight"><input type="checkbox" id="preflight-all"><span>Tôi xác nhận đã hoàn tất checklist bên dưới.</span></label>
  <div class="safety-checklist">${checklist.map((item) => `<label><input type="checkbox" name="safety"><span>${escapeHtml(item)}</span></label>`).join("")}</div>
  <button class="button button-primary" id="start-experiment" type="button" disabled>Tiến hành thí nghiệm</button>`;
}
