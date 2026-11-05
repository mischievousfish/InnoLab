import Chart from "chart.js/auto";
import { saveExperimentData } from "../services/wails.js";

export function renderDataVault(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Data Vault</p><h1>Biểu đồ thí nghiệm</h1></div>
      <div class="actions">
        <button class="button button-secondary" id="export-csv" type="button">Xuất CSV</button>
        <button class="button button-primary" id="save-data" type="button">Lưu dữ liệu</button>
      </div>
    </section>
    <div class="vault-grid">
      <section class="panel data-panel">
        <div class="panel-heading"><div><h2>Số liệu thô</h2><p>Nhập cặp giá trị X/Y cho lần đo hiện tại.</p></div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th><label for="x-label">Biến X</label></th><th><label for="y-label">Biến Y</label></th><th></th></tr></thead>
            <tbody id="data-rows"></tbody>
          </table>
        </div>
        <button class="text-button" id="add-row" type="button">+ Thêm hàng</button>
        <div class="variable-names">
          <label>Đơn vị / nhãn X<input id="x-label" value="X" /></label>
          <label>Đơn vị / nhãn Y<input id="y-label" value="Y" /></label>
        </div>
      </section>
      <section class="panel chart-panel">
        <div class="panel-heading"><h2>Xu hướng</h2><span id="point-count" class="count">0 điểm</span></div>
        <div class="chart-wrap"><canvas id="experiment-chart"></canvas></div>
      </section>
    </div>
    <div id="vault-status" class="status" role="status"></div>
  `;

  const rows = container.querySelector("#data-rows");
  const chartCanvas = container.querySelector("#experiment-chart");
  const xLabel = container.querySelector("#x-label");
  const yLabel = container.querySelector("#y-label");
  let nextId = 1;

  const chart = new Chart(chartCanvas, {
    type: "line",
    data: { datasets: [{ label: "Y", data: [], borderColor: "#315c4b", backgroundColor: "rgba(49,92,75,.12)", tension: .2, pointRadius: 3 }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, scales: { x: { type: "linear", title: { display: true, text: "X" } }, y: { title: { display: true, text: "Y" } } }, plugins: { legend: { display: false } } }
  });

  function getPoints() {
    return [...rows.querySelectorAll("tr")].map((row) => ({
      x: Number.parseFloat(row.querySelector("[data-x]").value),
      y: Number.parseFloat(row.querySelector("[data-y]").value)
    })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  }

  function updateChart() {
    chart.data.datasets[0].data = getPoints();
    chart.data.datasets[0].label = yLabel.value.trim() || "Y";
    chart.options.scales.x.title.text = xLabel.value.trim() || "X";
    chart.options.scales.y.title.text = yLabel.value.trim() || "Y";
    chart.update();
    container.querySelector("#point-count").textContent = `${getPoints().length} điểm`;
  }

  function removeRow(button) {
    button.closest("tr").remove();
    [...rows.children].forEach((row, index) => row.querySelector(".row-index").textContent = index + 1);
    updateChart();
  }

  function addRow(x = "", y = "") {
    const id = nextId++;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="row-index">${rows.children.length + 1}</td>
      <td><input id="x-${id}" type="number" step="any" data-x aria-label="Giá trị X" value="${x}"></td>
      <td><input id="y-${id}" type="number" step="any" data-y aria-label="Giá trị Y" value="${y}"></td>
      <td><button class="icon-button remove-row" type="button" aria-label="Xóa hàng">×</button></td>`;
    rows.append(tr);
    tr.querySelector(".remove-row").addEventListener("click", () => removeRow(tr.querySelector(".remove-row")));
    tr.querySelectorAll("input").forEach((input) => input.addEventListener("input", updateChart));
    updateChart();
  }

  container.querySelector("#add-row").addEventListener("click", () => addRow());
  xLabel.addEventListener("input", updateChart);
  yLabel.addEventListener("input", updateChart);

  container.querySelector("#export-csv").addEventListener("click", () => {
    const xName = xLabel.value.trim() || "X";
    const yName = yLabel.value.trim() || "Y";
    const csv = [
      `${xName},${yName}`,
      ...getPoints().map(({ x, y }) => `${x},${y}`)
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `innolab-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector("#save-data").addEventListener("click", async () => {
    const status = container.querySelector("#vault-status");
    status.className = "status";
    try {
      const result = await saveExperimentData({
        xLabel: xLabel.value.trim() || "X",
        yLabel: yLabel.value.trim() || "Y",
        points: getPoints(),
        recordedAt: new Date().toISOString()
      });
      status.textContent = result?.message || "Đã lưu bộ số liệu.";
      status.className = "status success";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Không thể lưu dữ liệu.";
      status.className = "status error";
    }
  });

  addRow();
  addRow();
}
