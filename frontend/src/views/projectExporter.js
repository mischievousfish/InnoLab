import { createProjectExport, enableJudgeAccess } from "../services/wails.js";

export function renderProjectExporter(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Submission Package</p><h1>Xuất hồ sơ NCKH</h1></div>
      <button class="button button-primary" id="generate-export" type="button">Xuất hồ sơ</button>
    </section>
    <div class="export-layout">
      <aside class="panel export-options">
        <div class="panel-heading"><div><h2>Nội dung đóng gói</h2><p>Chọn các thành phần xuất ra A4.</p></div></div>
        <div class="option-list" id="export-sections">
          <label><input type="checkbox" value="logbook" checked><span>Nhật ký thí nghiệm</span></label>
          <label><input type="checkbox" value="dataVault" checked><span>Biểu đồ Data Vault</span></label>
          <label><input type="checkbox" value="budget" checked><span>Bảng chi tiêu ngân sách</span></label>
          <label><input type="checkbox" value="references"><span>Danh mục tài liệu tham khảo</span></label>
        </div>
        <section class="judge-access">
          <div><h2>Chế độ giám khảo</h2><p>Cho phép xem hồ sơ ở dạng chỉ đọc.</p></div>
          <label class="switch-label"><input id="judge-toggle" type="checkbox" role="switch"><span class="switch-track"></span><span>Public Judge Access</span></label>
          <div id="judge-code-wrap" hidden><span>Mã truy cập 6 chữ số</span><strong id="judge-code">------</strong><button class="button button-secondary" id="generate-code" type="button">Tạo mã mới</button></div>
          <p id="export-status" class="status" role="status"></p>
        </section>
      </aside>
      <section class="a4-preview" aria-label="Xem trước trang A4">
        <article class="a4-page" id="report-preview">
          <div class="report-cover-mark">INNOLAB / SCIENCE PROJECT</div>
          <div class="report-cover">
            <p>HỒ SƠ NGHIÊN CỨU KHOA HỌC</p>
            <h2>Dự án nghiên cứu STEM</h2>
            <div class="cover-rule"></div>
            <p class="report-meta">Nhóm nghiên cứu sinh viên<br><span id="preview-date"></span></p>
          </div>
          <footer><span>WORM verification</span><strong id="worm-hash">SHA256: chờ khóa dữ liệu</strong></footer>
        </article>
      </section>
    </div>
  `;

  container.querySelector("#preview-date").textContent = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date());
  const judgeToggle = container.querySelector("#judge-toggle");
  const codeWrap = container.querySelector("#judge-code-wrap");
  judgeToggle.addEventListener("change", () => { codeWrap.hidden = !judgeToggle.checked; if (!judgeToggle.checked) container.querySelector("#judge-code").textContent = "------"; });
  container.querySelector("#generate-code").addEventListener("click", () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    container.querySelector("#judge-code").textContent = code;
  });

  container.querySelector("#generate-export").addEventListener("click", async () => {
    const status = container.querySelector("#export-status");
    const sections = [...container.querySelectorAll("#export-sections input:checked")].map((input) => input.value);
    const payload = { projectId: "default-project", title: "Dự án nghiên cứu STEM", sections, generatedAt: new Date().toISOString(), judgeEnabled: judgeToggle.checked, judgeCode: judgeToggle.checked ? container.querySelector("#judge-code").textContent : "" };
    status.className = "status";
    try {
      const result = await createProjectExport(payload);
      container.querySelector("#worm-hash").textContent = `SHA256: ${result.wormHash || "đang xác minh"}`;
      status.textContent = "Đã tạo gói hồ sơ. Chọn In / Lưu PDF trong hộp thoại máy in.";
      status.className = "status success";
      if (result.openPrint) window.print();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Không thể tạo hồ sơ.";
      status.className = "status error";
    }
  });

  container.querySelector("#generate-code").addEventListener("click", async () => {
    const status = container.querySelector("#export-status");
    const code = container.querySelector("#judge-code").textContent;
    if (!/^\d{6}$/.test(code)) return;
    try { await enableJudgeAccess({ projectId: "default-project", enabled: true, pin: code }); }
    catch (error) { status.textContent = error instanceof Error ? error.message : "Không thể kích hoạt mã giám khảo."; status.className = "status error"; }
  });
}
