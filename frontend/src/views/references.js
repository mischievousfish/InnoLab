import { saveReference, formatReference } from "../services/wails.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

export function renderReferences(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Research Library</p><h1>Thư viện tài liệu</h1></div>
      <button class="button button-primary" id="add-reference" type="button">+ Thêm tài liệu tham khảo</button>
    </section>
    <section class="panel reference-panel">
      <div class="reference-toolbar">
        <input id="reference-search" type="search" placeholder="Tìm tiêu đề, tác giả hoặc DOI...">
        <div class="segmented" aria-label="Định dạng trích dẫn"><button class="segment active" data-format="apa" type="button">APA</button><button class="segment" data-format="ieee" type="button">IEEE</button></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Tài liệu</th><th>Tác giả</th><th>Năm</th><th>DOI / Link</th><th>Trích dẫn</th></tr></thead>
        <tbody id="reference-rows"><tr><td colspan="5" class="empty-table">Chưa có tài liệu tham khảo</td></tr></tbody>
      </table></div>
      <p id="reference-status" class="status" role="status"></p>
    </section>
    <div class="modal-backdrop" id="reference-modal" hidden>
      <section class="modal resource-modal" role="dialog" aria-modal="true" aria-labelledby="reference-modal-title">
        <div class="modal-heading"><h2 id="reference-modal-title">Thêm tài liệu tham khảo</h2><button class="icon-button" data-close-reference type="button" aria-label="Đóng">×</button></div>
        <form id="reference-form">
          <label>Tiêu đề tài liệu<input name="title" required maxlength="240"></label>
          <label>Danh sách tác giả<input name="authors" required placeholder="Nguyen Van A, Tran Thi B"></label>
          <div class="form-grid"><label>Năm xuất bản<input name="year" type="number" min="1500" max="2100" required></label><label>DOI / Link<input name="doi" placeholder="https://doi.org/..."></label></div>
          <label>Tạp chí hoặc nguồn xuất bản<input name="source"></label>
          <div class="modal-actions"><button class="button button-secondary" data-close-reference type="button">Hủy</button><button class="button button-primary" type="submit">Lưu tài liệu</button></div>
        </form>
      </section>
    </div>`;

  let references = [];
  let citationFormat = "apa";
  const rows = container.querySelector("#reference-rows");
  const modal = container.querySelector("#reference-modal");

  function renderRows() {
    const query = container.querySelector("#reference-search").value.trim().toLowerCase();
    const filtered = references.filter((item) => `${item.title} ${item.authors} ${item.doi}`.toLowerCase().includes(query));
    if (!filtered.length) {
      rows.innerHTML = `<tr><td colspan="5" class="empty-table">${references.length ? "Không tìm thấy tài liệu phù hợp" : "Chưa có tài liệu tham khảo"}</td></tr>`;
      return;
    }
    rows.innerHTML = filtered.map((item) => `<tr>
      <td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.source || "Nguồn chưa cập nhật")}</small></td>
      <td>${escapeHtml(item.authors)}</td><td>${escapeHtml(item.year)}</td>
      <td>${item.doi ? `<a href="${escapeHtml(item.doi)}" target="_blank" rel="noopener">${escapeHtml(item.doi)}</a>` : "—"}</td>
      <td><button class="button button-secondary copy-citation" data-id="${escapeHtml(item.id)}" type="button">Sao chép ${citationFormat.toUpperCase()}</button></td>
    </tr>`).join("");
  }

  container.querySelector("#add-reference").addEventListener("click", () => { modal.hidden = false; document.body.classList.add("modal-open"); });
  container.querySelectorAll("[data-close-reference]").forEach((button) => button.addEventListener("click", () => { modal.hidden = true; document.body.classList.remove("modal-open"); }));
  container.querySelector("#reference-search").addEventListener("input", renderRows);
  container.querySelectorAll(".segment").forEach((button) => button.addEventListener("click", () => {
    citationFormat = button.dataset.format;
    container.querySelectorAll(".segment").forEach((item) => item.classList.toggle("active", item === button));
    renderRows();
  }));

  container.querySelector("#reference-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reference = { id: crypto.randomUUID(), projectId: "default-project", title: form.get("title"), authors: form.get("authors"), year: Number(form.get("year")), doi: form.get("doi"), source: form.get("source") };
    const status = container.querySelector("#reference-status");
    try {
      await saveReference(reference);
      references.push(reference);
      renderRows();
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      event.currentTarget.reset();
      status.className = "status success";
      status.textContent = "Đã lưu tài liệu tham khảo.";
    } catch (error) {
      status.className = "status error";
      status.textContent = error instanceof Error ? error.message : "Không thể lưu tài liệu.";
    }
  });

  rows.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-citation");
    if (!button) return;
    const reference = references.find((item) => item.id === button.dataset.id);
    try {
      const result = await formatReference({ reference, format: citationFormat });
      await navigator.clipboard.writeText(result.citation || fallbackCitation(reference, citationFormat));
      const status = container.querySelector("#reference-status");
      status.className = "status success";
      status.textContent = `Đã sao chép định dạng ${citationFormat.toUpperCase()}.`;
    } catch (error) {
      const status = container.querySelector("#reference-status");
      status.className = "status error";
      status.textContent = error instanceof Error ? error.message : "Không thể sao chép trích dẫn.";
    }
  });
}

function fallbackCitation(reference, format) {
  return format === "ieee"
    ? `[1] ${reference.authors}, "${reference.title}," ${reference.source || ""}, ${reference.year}. ${reference.doi || ""}`
    : `${reference.authors} (${reference.year}). ${reference.title}. ${reference.source || ""}. ${reference.doi || ""}`;
}
