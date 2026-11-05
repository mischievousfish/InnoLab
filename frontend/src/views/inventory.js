import { saveInventoryItem, saveBudgetExpense } from "../services/wails.js";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
}).format(value);

export function renderInventory(container) {
  container.innerHTML = `
    <section class="module-heading">
      <div><p class="eyebrow">Resources & Finance</p><h1>Vật tư & Ngân sách</h1></div>
      <button class="button button-primary" id="add-inventory" type="button">+ Thêm vật tư mới</button>
    </section>

    <section class="inventory-section">
      <div class="section-heading"><div><h2>Kho vật tư</h2><p>Trạng thái tồn kho và vị trí lưu trữ trong phòng lab.</p></div><span class="count" id="inventory-count">0 vật tư</span></div>
      <div class="panel inventory-table-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tên vật tư</th><th>Số lượng</th><th>Đơn vị</th><th>Vị trí</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody id="inventory-rows"><tr><td colspan="6" class="empty-table">Chưa có vật tư được ghi nhận</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="budget-section">
      <div class="budget-summary">
        <article class="summary-card summary-total"><span>Ngân sách cấp</span><strong id="allocated-budget">0 ₫</strong><button class="text-button" id="edit-budget" type="button">Thiết lập ngân sách</button></article>
        <article class="summary-card"><span>Đã chi</span><strong id="spent-budget">0 ₫</strong></article>
        <article class="summary-card"><span>Còn lại</span><strong id="remaining-budget">0 ₫</strong></article>
      </div>
      <div class="section-heading"><div><h2>Khoản chi</h2><p>Các giao dịch mua nguyên vật liệu và hóa đơn đính kèm.</p></div><button class="button button-secondary" id="add-expense" type="button">+ Ghi nhận chi phí</button></div>
      <div class="panel expense-table-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Mô tả</th><th>Số tiền</th><th>Ngày mua</th><th>Hóa đơn</th><th></th></tr></thead>
            <tbody id="expense-rows"><tr><td colspan="5" class="empty-table">Chưa có khoản chi</td></tr></tbody>
          </table>
        </div>
      </div>
      <p id="inventory-status" class="status" role="status"></p>
    </section>

    <div class="modal-backdrop" id="inventory-modal" hidden>
      <section class="modal resource-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title">
        <div class="modal-heading"><h2 id="inventory-modal-title">Thêm vật tư mới</h2><button class="icon-button" data-close-modal type="button" aria-label="Đóng">×</button></div>
        <form id="inventory-form">
          <label>Tên vật tư<input name="name" required maxlength="120"></label>
          <div class="form-grid"><label>Số lượng<input name="quantity" type="number" min="0" step="0.01" required></label><label>Đơn vị<input name="unit" required maxlength="30" placeholder="bộ, ml, g..."></label></div>
          <div class="form-grid"><label>Vị trí lưu trữ<input name="location" required maxlength="80" placeholder="Kệ A - ngăn 2"></label><label>Mức cảnh báo<input name="minimumQuantity" type="number" min="0" step="0.01" required value="5"></label></div>
          <div class="modal-actions"><button class="button button-secondary" data-close-modal type="button">Hủy</button><button class="button button-primary" type="submit">Lưu vật tư</button></div>
        </form>
      </section>
    </div>

    <div class="modal-backdrop" id="expense-modal" hidden>
      <section class="modal resource-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div class="modal-heading"><h2 id="expense-modal-title">Ghi nhận chi phí</h2><button class="icon-button" data-close-modal type="button" aria-label="Đóng">×</button></div>
        <form id="expense-form">
          <label>Mô tả khoản chi<input name="description" required maxlength="120"></label>
          <div class="form-grid"><label>Số tiền (VND)<input name="amount" type="number" min="0" step="1000" required></label><label>Ngày mua<input name="date" type="date" required></label></div>
          <label>Hóa đơn đính kèm<input name="invoice" type="file" accept="image/*,.pdf"></label>
          <div class="modal-actions"><button class="button button-secondary" data-close-modal type="button">Hủy</button><button class="button button-primary" type="submit">Lưu khoản chi</button></div>
        </form>
      </section>
    </div>

    <div class="modal-backdrop" id="budget-modal" hidden>
      <section class="modal compact-modal" role="dialog" aria-labelledby="budget-modal-title">
        <div class="modal-heading"><h2 id="budget-modal-title">Ngân sách dự án</h2><button class="icon-button" data-close-modal type="button" aria-label="Đóng">×</button></div>
        <form id="budget-form"><label>Ngân sách cấp (VND)<input name="allocated" type="number" min="0" step="1000" required></label><div class="modal-actions"><button class="button button-secondary" data-close-modal type="button">Hủy</button><button class="button button-primary" type="submit">Lưu ngân sách</button></div></form>
      </section>
    </div>
  `;

  let inventory = [];
  let expenses = [];
  let allocatedBudget = 0;
  const inventoryRows = container.querySelector("#inventory-rows");
  const expenseRows = container.querySelector("#expense-rows");
  const status = container.querySelector("#inventory-status");

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function renderInventoryRows() {
    container.querySelector("#inventory-count").textContent = `${inventory.length} vật tư`;
    if (!inventory.length) {
      inventoryRows.innerHTML = '<tr><td colspan="6" class="empty-table">Chưa có vật tư được ghi nhận</td></tr>';
      return;
    }
    inventoryRows.innerHTML = inventory.map((item) => {
      const isLow = Number(item.quantity) <= Number(item.minimumQuantity);
      return `<tr class="${isLow ? "low-stock-row" : ""}">
        <td><strong>${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.unit)}</td><td>${escapeHtml(item.location)}</td>
        <td><span class="stock-status ${isLow ? "stock-low" : "stock-ok"}">${isLow ? "Sắp cạn kiệt" : "Đủ số lượng"}</span></td>
        <td><button class="icon-button remove-inventory" data-id="${escapeHtml(item.id)}" type="button" aria-label="Xóa vật tư">×</button></td>
      </tr>`;
    }).join("");
  }

  function renderBudget() {
    const spent = expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const remaining = allocatedBudget - spent;
    container.querySelector("#allocated-budget").textContent = formatCurrency(allocatedBudget);
    container.querySelector("#spent-budget").textContent = formatCurrency(spent);
    container.querySelector("#remaining-budget").textContent = formatCurrency(remaining);
    container.querySelector("#remaining-budget").classList.toggle("negative", remaining < 0);
    if (!expenses.length) {
      expenseRows.innerHTML = '<tr><td colspan="5" class="empty-table">Chưa có khoản chi</td></tr>';
      return;
    }
    expenseRows.innerHTML = expenses.map((expense) => `<tr>
      <td><strong>${escapeHtml(expense.description)}</strong></td><td>${formatCurrency(expense.amount)}</td>
      <td>${escapeHtml(expense.date)}</td><td>${escapeHtml(expense.invoiceName || "Không đính kèm")}</td>
      <td><button class="icon-button remove-expense" data-id="${escapeHtml(expense.id)}" type="button" aria-label="Xóa khoản chi">×</button></td>
    </tr>`).join("");
  }

  function openModal(id) {
    container.querySelector(id).hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    status.textContent = "";
  }

  container.querySelector("#add-inventory").addEventListener("click", () => openModal("#inventory-modal"));
  container.querySelector("#add-expense").addEventListener("click", () => openModal("#expense-modal"));
  container.querySelector("#edit-budget").addEventListener("click", () => {
    container.querySelector('[name="allocated"]').value = allocatedBudget || "";
    openModal("#budget-modal");
  });
  container.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));

  container.querySelector("#inventory-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { id: crypto.randomUUID(), projectId: "default-project", name: form.get("name"), quantity: Number(form.get("quantity")), unit: form.get("unit"), location: form.get("location"), minimumQuantity: Number(form.get("minimumQuantity")) };
    status.className = "status";
    try {
      await saveInventoryItem(item);
      inventory.push(item);
      renderInventoryRows();
      closeModal(container.querySelector("#inventory-modal"));
      event.currentTarget.reset();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Không thể lưu vật tư.";
      status.className = "status error";
    }
  });

  container.querySelector("#expense-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const invoice = form.get("invoice");
    const expense = { id: crypto.randomUUID(), projectId: "default-project", description: form.get("description"), amount: Number(form.get("amount")), date: form.get("date"), invoiceName: invoice instanceof File && invoice.name ? invoice.name : "" };
    try {
      await saveBudgetExpense(expense);
      expenses.push(expense);
      renderBudget();
      closeModal(container.querySelector("#expense-modal"));
      event.currentTarget.reset();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Không thể lưu khoản chi.";
      status.className = "status error";
    }
  });

  container.querySelector("#budget-form").addEventListener("submit", (event) => {
    event.preventDefault();
    allocatedBudget = Number(new FormData(event.currentTarget).get("allocated") || 0);
    renderBudget();
    closeModal(container.querySelector("#budget-modal"));
  });

  container.addEventListener("click", (event) => {
    const inventoryButton = event.target.closest(".remove-inventory");
    const expenseButton = event.target.closest(".remove-expense");
    if (inventoryButton) { inventory = inventory.filter((item) => item.id !== inventoryButton.dataset.id); renderInventoryRows(); }
    if (expenseButton) { expenses = expenses.filter((expense) => expense.id !== expenseButton.dataset.id); renderBudget(); }
  });

  renderInventoryRows();
  renderBudget();
}
