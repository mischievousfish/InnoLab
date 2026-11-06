import adminMarkup from "./admin.html?raw";
import { clearSession } from "../services/auth_controller.js";
import { initCreativeInteractions } from "../services/creative_interactions.js";
import {
  createAdminBackup, exportAdminBundle, getAdminConsole, issueJudgeAccess,
  requireAdminSession, resetAdminData, reviewAdminProject, updateAdminUser
} from "../services/admin_controller.js";

const roles = ["Admin", "Student", "Mentor", "Judge"];
const resetPhrase = "RESET INNOLAB";

export async function renderAdmin(container) {
  const session = await requireAdminSession();
  if (!session) {
    window.location.replace(new URL("./index.html?auth=admin-required", window.location.href));
    return;
  }

  container.innerHTML = adminMarkup;
  initCreativeInteractions(container);
  const status = container.querySelector("[data-admin-status]");
  let data = { users: [], projects: [], audits: [], system: {} };
  const showStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  async function loadConsole() {
    showStatus("Đang đồng bộ dữ liệu quản trị…");
    try {
      data = await getAdminConsole(session.token);
      renderConsole(container, data, session.user.id);
      showStatus(`Đã đồng bộ lúc ${new Intl.DateTimeFormat("vi-VN", { timeStyle: "medium" }).format(new Date())}.`);
    } catch (error) {
      showStatus(messageOf(error), true);
      container.querySelectorAll("[data-admin-panel]").forEach((panel) => {
        const target = panel.querySelector("[data-user-rows], [data-audit-rows], [data-project-rows]");
        if (target) target.innerHTML = `<p class="admin-empty admin-error">${escapeHtml(messageOf(error))}</p>`;
      });
    }
  }

  container.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.addEventListener("click", () => {
    container.querySelectorAll("[data-admin-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    container.querySelectorAll("[data-admin-panel]").forEach((panel) => { panel.hidden = panel.dataset.adminPanel !== tab.dataset.adminTab; });
  }));

  container.querySelector("[data-admin-refresh]").addEventListener("click", loadConsole);
  container.querySelector("[data-admin-signout]").addEventListener("click", () => {
    clearSession();
    window.location.replace(new URL("./index.html", window.location.href));
  });
  container.querySelector("[data-user-search]").addEventListener("input", (event) => renderUsers(container, data.users, event.target.value, session.user.id));

  container.querySelector("[data-user-rows]").addEventListener("change", async (event) => {
    if (!event.target.matches("[data-user-role]")) return;
    try {
      await updateAdminUser(session.token, event.target.dataset.userId, { role: event.target.value });
      showStatus("Đã cập nhật vai trò tài khoản.");
      await loadConsole();
    } catch (error) { showStatus(messageOf(error), true); await loadConsole(); }
  });
  container.querySelector("[data-user-rows]").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-toggle-ban]");
    if (!button) return;
    try {
      await updateAdminUser(session.token, button.dataset.userId, { status: button.dataset.nextStatus });
      showStatus("Đã cập nhật trạng thái tài khoản.");
      await loadConsole();
    } catch (error) { showStatus(messageOf(error), true); }
  });

  container.querySelector("[data-project-rows]").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-project-action]");
    if (!button) return;
    try {
      await reviewAdminProject(session.token, button.dataset.projectId, button.dataset.projectAction);
      showStatus(button.dataset.projectAction === "approved" ? "Đề tài đã được phê duyệt." : "Đã gửi yêu cầu chỉnh sửa.");
      await loadConsole();
    } catch (error) { showStatus(messageOf(error), true); }
  });

  container.querySelector("[data-issue-token]").addEventListener("click", async () => {
    const projectId = container.querySelector("[data-judge-project]").value;
    if (!projectId) { showStatus("Chọn đề tài trước khi cấp mã.", true); return; }
    try {
      const result = await issueJudgeAccess(session.token, projectId);
      const output = container.querySelector("[data-issued-token]");
      output.innerHTML = `READ ONLY TOKEN <code>${escapeHtml(result.token)}</code><button class="admin-copy" type="button" data-copy-token>Sao chép</button>`;
      output.hidden = false;
      output.querySelector("[data-copy-token]").addEventListener("click", async () => {
        await navigator.clipboard.writeText(result.token);
        showStatus("Đã sao chép mã. Mã chỉ được hiển thị trong phiên này.");
      });
      showStatus("Đã cấp mã read-only; hãy lưu lại vì mã chỉ hiển thị một lần.");
    } catch (error) { showStatus(messageOf(error), true); }
  });

  container.querySelector("[data-create-backup]").addEventListener("click", async () => {
    try {
      const result = await createAdminBackup(session.token);
      showStatus(result.message || `Backup hoàn tất: ${result.backupName || "đã lưu trong PocketBase"}.`);
    } catch (error) { showStatus(messageOf(error), true); }
  });
  container.querySelector("[data-export-bundle]").addEventListener("click", async () => {
    try {
      const result = await exportAdminBundle(session.token);
      downloadJSON(result.bundle, result.fileName || "innolab-project-bundle.json");
      showStatus("Đã xuất JSON bundle từ dữ liệu thực.");
    } catch (error) { showStatus(messageOf(error), true); }
  });

  const resetDialog = container.querySelector("[data-reset-dialog]");
  container.querySelector("[data-open-reset]").addEventListener("click", () => { resetDialog.hidden = false; document.body.classList.add("admin-reset-open"); });
  container.querySelectorAll("[data-cancel-reset]").forEach((button) => button.addEventListener("click", closeReset));
  container.querySelector("[data-reset-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const confirmation = new FormData(event.currentTarget).get("confirmation");
    if (confirmation !== resetPhrase) { showStatus(`Cụm xác nhận phải là ${resetPhrase}.`, true); return; }
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await resetAdminData(session.token, confirmation);
      closeReset();
      showStatus(result.message || "Đã backup và reset dữ liệu nghiệp vụ.");
      await loadConsole();
    } catch (error) { showStatus(messageOf(error), true); }
    finally { submit.disabled = false; }
  });

  function closeReset() {
    resetDialog.hidden = true;
    document.body.classList.remove("admin-reset-open");
    container.querySelector("[data-reset-form]").reset();
  }

  await loadConsole();
}

function renderConsole(container, result, currentUserId) {
  renderUsers(container, result.users || [], "", currentUserId);
  renderAudits(container, result.audits || []);
  renderProjects(container, result.projects || []);
  renderSystem(container, result.system || {});
  initCreativeInteractions(container);
  container.querySelector('[data-stat="users"]').textContent = String(result.users?.length ?? 0);
  container.querySelector('[data-stat="pending"]').textContent = String((result.projects || []).filter((project) => project.status === "pending").length);
  container.querySelector('[data-stat="verified"]').textContent = String((result.audits || []).filter((entry) => entry.integrity_status === "verified").length);
}

function renderUsers(container, users, search = container.querySelector("[data-user-search]").value, currentUserId = "") {
  const query = search.trim().toLowerCase();
  const filtered = users.filter((user) => `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(query));
  const rows = container.querySelector("[data-user-rows]");
  rows.innerHTML = filtered.length ? filtered.map((user) => {
    const role = roles.find((item) => item.toLowerCase() === String(user.role || "").toLowerCase()) || "";
    const accountStatus = String(user.status || "unknown").toLowerCase();
    const banned = accountStatus === "banned";
    const statusLabel = accountStatus === "active" ? "ACTIVE" : banned ? "BANNED" : "UNKNOWN";
    const isCurrentUser = user.id === currentUserId;
    const disabled = isCurrentUser || !["active", "banned"].includes(accountStatus);
    return `<tr><td><strong>${escapeHtml(user.name || "Chưa đặt tên")}</strong><small>${escapeHtml(user.id)}</small></td><td>${escapeHtml(user.email || "—")}</td><td><select data-user-role data-user-id="${escapeHtml(user.id)}" aria-label="Vai trò của ${escapeHtml(user.email || user.id)}" ${isCurrentUser ? "disabled" : ""}><option value="">Chưa gán</option>${roles.map((item) => `<option value="${item}" ${item === role ? "selected" : ""}>${item}</option>`).join("")}</select></td><td><span class="admin-state ${banned ? "is-banned" : accountStatus === "active" ? "is-active" : "is-unknown"}">${statusLabel}</span></td><td><button class="admin-button ${banned ? "admin-button-quiet" : "admin-button-danger"}" type="button" data-toggle-ban data-user-id="${escapeHtml(user.id)}" data-next-status="${banned ? "active" : "banned"}" ${disabled ? "disabled" : ""}>${isCurrentUser ? "Phiên hiện tại" : banned ? "Mở khóa" : accountStatus === "active" ? "Khóa" : "Chưa cấu hình"}</button></td></tr>`;
  }).join("") : '<tr><td colspan="5" class="admin-empty">Không có tài khoản phù hợp.</td></tr>';
}

function renderAudits(container, entries) {
  const list = container.querySelector("[data-audit-rows]");
  list.innerHTML = entries.length ? entries.map((entry) => {
    const integrity = entry.integrity_status || "unverified";
    const title = entry.title || entry.id;
    const hash = entry.stored_hash || entry.integrity_hash || "Chưa lưu baseline hash";
    return `<article class="audit-entry audit-${escapeHtml(integrity)}"><div class="audit-entry-mark">${integrity === "verified" ? "✓" : "!"}</div><div class="audit-entry-main"><div class="audit-entry-meta"><time>${escapeHtml(entry.created || "Không có timestamp")}</time><span>${escapeHtml(integrity.toUpperCase())}</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(entry.author || entry.user || "Không rõ tác giả")} · ${escapeHtml(entry.project || "Không gắn đề tài")}</p><code>${escapeHtml(hash)}</code>${entry.integrity_status === "mismatch" ? `<small>Computed: ${escapeHtml(entry.computed_hash || "—")}</small>` : ""}</div></article>`;
  }).join("") : '<p class="admin-empty">Không có logbook entry trong PocketBase.</p>';
}

function renderProjects(container, projects) {
  const pending = projects.filter((project) => String(project.status || "").toLowerCase() === "pending");
  container.querySelector("[data-project-count]").textContent = `${pending.length} QUEUED`;
  const picker = container.querySelector("[data-judge-project]");
  picker.innerHTML = `<option value="">Chọn đề tài</option>${projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.title || project.name || project.id)}</option>`).join("")}`;
  const list = container.querySelector("[data-project-rows]");
  list.innerHTML = pending.length ? pending.map((project) => {
    const members = Array.isArray(project.members) ? project.members : [];
    const memberText = members.map((member) => typeof member === "string" ? member : member.name || member.email || member.id).filter(Boolean).join(", ") || "Chưa có danh sách thành viên";
    return `<article class="project-review" data-tilt><div class="project-review-index">${escapeHtml(project.id.slice(0, 6).toUpperCase())}</div><div class="project-review-content"><div class="project-review-meta"><span>PENDING REVIEW</span><time>${escapeHtml(project.created || "")}</time></div><h3>${escapeHtml(project.title || project.name || "Chưa đặt tên")}</h3><p>${escapeHtml(project.summary || project.abstract || "Chưa có tóm tắt đề tài.")}</p><small>THÀNH VIÊN · ${escapeHtml(memberText)}</small></div><div class="project-review-actions"><button class="admin-button admin-button-primary" type="button" data-project-action="approved" data-project-id="${escapeHtml(project.id)}">Phê duyệt xuất bản</button><button class="admin-button admin-button-quiet" type="button" data-project-action="changes_requested" data-project-id="${escapeHtml(project.id)}">Yêu cầu chỉnh sửa</button></div></article>`;
  }).join("") : '<p class="admin-empty">Không có đề tài nào đang chờ duyệt.</p>';
}

function renderSystem(container, system) {
  container.querySelector("[data-stat=storage]").textContent = system.available ? formatBytes(system.bytes) : "N/A";
  container.querySelector("[data-stat=storage-detail]").textContent = system.available ? `${system.fileCount} tệp` : "POCKETBASE_DATA_DIR chưa sẵn sàng";
  container.querySelector("[data-storage-path]").textContent = system.path || "Chưa cấu hình POCKETBASE_DATA_DIR";
  container.querySelector("[data-storage-files]").textContent = system.available ? `${system.fileCount} tệp trong thư mục dữ liệu` : "Không đọc được thư mục dữ liệu cục bộ.";
  container.querySelector("[data-storage-size]").textContent = system.available ? formatBytes(system.bytes) : "N/A";
  container.querySelector("[data-system-state]").textContent = system.available ? "LOCAL STORE ONLINE" : "LOCAL STORE UNAVAILABLE";
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes < 0) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function downloadJSON(bundle, fileName) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function messageOf(error) {
  return error instanceof Error ? error.message : "Không thể hoàn thành thao tác quản trị.";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}