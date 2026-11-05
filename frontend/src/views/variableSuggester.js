import { analyzeMethodology } from "../services/wails.js";

export function renderVariableSuggester(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Methodology Lab</p><h1>Kiểm tra giả thuyết & biến số</h1></div>
      <span class="module-badge">Trình phân tích logic</span>
    </section>
    <div class="assistant-layout">
      <form class="panel methodology-form" id="variable-form">
        <div class="panel-heading"><div><h2>Đề tài và giả thuyết</h2><p>Đề xuất cấu trúc biến dựa trên nội dung mô tả.</p></div></div>
        <div class="form-body">
          <label>Tên đề tài<input name="title" required placeholder="Ví dụ: Ảnh hưởng nhiệt độ đến độ tan..."></label>
          <label>Giả thuyết nghiên cứu<textarea name="hypothesis" rows="7" required placeholder="Nếu..., thì..."></textarea></label>
          <label>Điều kiện thí nghiệm<textarea name="resources" rows="5" placeholder="Nhiệt độ, vật liệu, thiết bị, giới hạn an toàn..."></textarea></label>
          <button class="button button-primary" type="submit">Phân tích biến số</button>
        </div>
      </form>
      <section class="panel reviewer-output">
        <div class="panel-heading"><div><h2>Cấu trúc thí nghiệm</h2><p>Xác nhận $X$, $Y$ và $Z$ trước khi thu thập dữ liệu.</p></div></div>
        <div id="variable-result" class="review-body"><p class="empty-state">Kết quả phân tích sẽ xuất hiện tại đây.</p></div>
      </section>
    </div>`;

  container.querySelector("#variable-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { projectId: "default-project", title: form.get("title"), hypothesis: form.get("hypothesis"), resources: form.get("resources") };
    const output = container.querySelector("#variable-result");
    output.innerHTML = '<p class="review-loading">Đang phân tích cấu trúc thí nghiệm...</p>';
    try {
      const result = await analyzeMethodology(payload);
      output.innerHTML = renderVariableResult(result);
    } catch (error) {
      output.innerHTML = `<p class="status error">${error instanceof Error ? error.message : "Không thể phân tích giả thuyết."}</p>`;
    }
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderVariableResult(result) {
  const variables = result.variables || [];
  const warnings = result.warnings || [];
  return `<div class="variable-grid">
    ${variables.map((variable) => `<article class="variable-card"><span>${escapeHtml(variable.type)}</span><strong>${escapeHtml(variable.name)}</strong><p>${escapeHtml(variable.note)}</p></article>`).join("")}
  </div><div class="warning-list"><h3>Logic Validator</h3>${warnings.length ? warnings.map((warning) => `<div class="logic-warning"><span>!</span><p>${escapeHtml(warning)}</p></div>`).join("") : '<p class="logic-ok">Không phát hiện mâu thuẫn logic trong mô tả hiện tại.</p>'}</div>`;
}
