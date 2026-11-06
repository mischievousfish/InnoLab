import {
  saveSchematic, saveChemical, saveSafetyAudit, saveMentorMeeting,
  savePrototypeVersion, getTeamContributions, getHardwareData
} from "../services/wails.js";

const tabs = [
  ["schematics", "Sơ đồ & CAD"], ["safety", "MSDS & Kiểm toán"], ["mentor", "Mentor Log"],
  ["prototype", "Phiên bản mẫu"], ["team", "Đóng góp nhóm"]
];

export function renderHardwareLab(container) {
  container.innerHTML = `
    <section class="module-heading"><div><p class="eyebrow">Engineering Lab</p><h1>Hardware & Team Operations</h1></div></section>
    <div class="hardware-tabs" role="tablist">${tabs.map(([id, label], index) => `<button class="hardware-tab ${index === 0 ? "active" : ""}" data-tab="${id}" role="tab" type="button">${label}</button>`).join("")}</div>
    <section class="hardware-panel" data-panel="schematics">${schematicsMarkup()}</section>
    <section class="hardware-panel" data-panel="safety" hidden>${safetyMarkup()}</section>
    <section class="hardware-panel" data-panel="mentor" hidden>${mentorMarkup()}</section>
    <section class="hardware-panel" data-panel="prototype" hidden>${prototypeMarkup()}</section>
    <section class="hardware-panel" data-panel="team" hidden>${teamMarkup()}</section>`;

  container.querySelectorAll(".hardware-tab").forEach((tab) => tab.addEventListener("click", () => {
    container.querySelectorAll(".hardware-tab").forEach((item) => item.classList.toggle("active", item === tab));
    container.querySelectorAll(".hardware-panel").forEach((panel) => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
  }));

  bindSchematic(container);
  bindSafety(container);
  bindMentor(container);
  bindPrototype(container);
  bindTeam(container);
  loadHardwareData(container);
}

function schematicsMarkup() {
  return `<div class="hardware-toolbar"><p>Lưu trữ và liên kết bản vẽ theo từng phiên bản phần cứng.</p><button class="button button-primary" data-open="schematic-modal" type="button">+ Thêm bản thiết kế</button></div>
  <div class="hardware-grid" id="schematic-grid"><p class="empty-panel">Chưa có sơ đồ mạch được ghi nhận.</p></div>
  ${modal("schematic-modal", "Thêm sơ đồ / CAD", `<div class="hardware-form" data-form="schematic-form">
    <label>Tên linh kiện / module<input name="componentName" required></label><div class="form-grid"><label>Phiên bản<input name="versionTag" required placeholder="v1.0"></label><label>Loại file<select name="kind"><option value="schematic">Sơ đồ mạch</option><option value="cad">Bản CAD</option></select></label></div>
    <label>Đường dẫn mô phỏng<input name="simulationLink" type="url" placeholder="https://wokwi.com/"></label><label>File thiết kế<input name="file" type="file" accept=".step,.stl,.fzz,.sch,.brd,.kicad_sch,.svg,.pdf"></label>
    <label>Ghi chú / pinout<textarea name="notes" rows="5"></textarea></label><button class="button button-primary" type="submit">Lưu thiết kế</button></div>`)} `;
}

function safetyMarkup() {
  return `<div class="hardware-toolbar"><div class="mini-tabs"><button class="mini-tab active" data-safety-tab="msds" type="button">MSDS hóa chất</button><button class="mini-tab" data-safety-tab="audit" type="button">Kiểm toán phòng lab</button></div><button class="button button-primary" data-open="chemical-modal" type="button">+ Thêm hóa chất</button></div>
  <div class="mini-panel" data-mini="msds"><div class="chemical-list" id="chemical-list"><p class="empty-panel">Chưa có hồ sơ hóa chất.</p></div></div>
  <div class="mini-panel" data-mini="audit" hidden><div class="hardware-toolbar"><p>Nhật ký kiểm tra điều kiện an toàn trước thí nghiệm.</p><button class="button button-secondary" data-open="audit-modal" type="button">+ Ghi kiểm toán</button></div><div id="audit-list" class="audit-list"><p class="empty-panel">Chưa có lần kiểm toán.</p></div></div>
  ${modal("chemical-modal", "Hồ sơ MSDS", `<div class="hardware-form" data-form="chemical-form"><label>Tên hóa chất / linh kiện nguy hiểm<input name="chemicalName" required></label><label>Mức nguy hiểm<select name="hazardLevel"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Tóm tắt MSDS<textarea name="msdsSummary" rows="6" required></textarea></label><label>Vị trí lưu trữ<input name="storageLocation" required></label><button class="button button-primary" type="submit">Lưu hồ sơ</button></div>`)}
  ${modal("audit-modal", "Kiểm toán phòng lab", `<div class="hardware-form" data-form="audit-form"><div class="form-grid"><label>Ngày kiểm tra<input name="auditDate" type="date" required></label><label>Người kiểm toán<input name="auditorName" required></label></div><label>Trạng thái<select name="status"><option>Passed</option><option>Requires Action</option><option>Failed</option></select></label><div class="safety-check-grid"><label><input type="checkbox" name="check" value="Kính bảo hộ">Kính bảo hộ</label><label><input type="checkbox" name="check" value="Van khí">Kiểm tra van khí</label><label><input type="checkbox" name="check" value="Cách điện">Kiểm tra cách điện</label><label><input type="checkbox" name="check" value="Tủ hút">Kiểm tra tủ hút</label></div><button class="button button-primary" type="submit">Lưu nhật ký</button></div>`)} `;
}

function mentorMarkup() {
  return `<div class="hardware-toolbar"><p>Ghi lại góp ý mentor và chuyển thành công việc thực tế.</p><button class="button button-primary" data-open="mentor-modal" type="button">+ Thêm buổi họp</button></div><div class="mentor-timeline" id="mentor-timeline"><p class="empty-panel">Chưa có buổi họp mentor.</p></div>
  ${modal("mentor-modal", "Nhật ký buổi họp mentor", `<div class="hardware-form" data-form="mentor-form"><div class="form-grid"><label>Ngày họp<input name="meetingDate" type="date" required></label><label>Tên mentor<input name="mentorName" required></label></div><label>Góp ý quan trọng<textarea name="keyFeedback" rows="5" required></textarea></label><label>Action item<input name="actionTitle" placeholder="Nội dung công việc cần làm"></label><div class="form-grid"><label>Người phụ trách<input name="assignee"></label><label>Hạn hoàn thành<input name="deadline" type="date"></label></div><label>Lịch họp tiếp theo<input name="nextMeeting" type="date"></label><button class="button button-primary" type="submit">Lưu và tạo công việc</button></div>`)} `;
}

function prototypeMarkup() {
  return `<div class="hardware-toolbar"><p>Changelog phiên bản nguyên mẫu, lỗi đã khắc phục và hình ảnh bàn giao.</p><button class="button button-primary" data-open="prototype-modal" type="button">+ Thêm phiên bản</button></div><div class="prototype-timeline" id="prototype-timeline"><p class="empty-panel">Chưa có phiên bản nguyên mẫu.</p></div>
  ${modal("prototype-modal", "Phiên bản nguyên mẫu mới", `<div class="hardware-form" data-form="prototype-form"><div class="form-grid"><label>Phiên bản<input name="versionNumber" required placeholder="v2.0-RC"></label><label>Ngày hoàn thiện<input name="releaseDate" type="date" required></label></div><label>Mô tả thay đổi<textarea name="changelogSummary" rows="5" required></textarea></label><label>Lỗi / nguyên nhân phiên bản trước<textarea name="failedReasons" rows="4"></textarea></label><label>Ảnh nguyên mẫu<input name="images" type="file" accept="image/*" multiple></label><button class="button button-primary" type="submit">Lưu phiên bản</button></div>`)} `;
}

function teamMarkup() {
  return `<div class="hardware-toolbar"><p>Thống kê được tổng hợp từ task và logbook theo thời gian thực.</p><button class="button button-team" id="refresh-team" type="button">Tải lại thống kê</button></div><div class="team-table panel"><table><thead><tr><th>Thành viên</th><th>Task hoàn thành</th><th>Logbook</th><th>Peer score</th><th>Đóng góp</th></tr></thead><tbody id="team-rows"><tr><td colspan="5" class="empty-table">Chưa có dữ liệu thành viên.</td></tr></tbody></table></div>`;
}

function modal(id, title, body) {
  return `<div class="modal-backdrop" id="${id}" hidden><section class="modal resource-modal"><div class="modal-heading"><h2>${title}</h2><button class="icon-button" data-close-modal="${id}" type="button" aria-label="Đóng">×</button></div>${body}</section></div>`;
}

const esc = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function bindHardwareModals(container) {
  container.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
    container.querySelector(`#${button.dataset.open}`).hidden = false; document.body.classList.add("modal-open");
  }));
  container.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => {
    container.querySelector(`#${button.dataset.closeModal}`).hidden = true; document.body.classList.remove("modal-open");
  }));
}

function bindSchematic(container) {
  bindHardwareModals(container);
  container.querySelector('[data-form="schematic-form"]').addEventListener("submit", async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const file = data.get("file");
    const payload = { projectId: "default-project", componentName: data.get("componentName"), versionTag: data.get("versionTag"), kind: data.get("kind"), simulationLink: data.get("simulationLink") || "", notes: data.get("notes"), fileName: file instanceof File ? file.name : "" };
    const extension = payload.fileName.split(".").pop()?.toLowerCase();
    if (payload.fileName && !["step", "stl", "fzz", "sch", "brd", "svg", "pdf"].includes(extension)) { alert("Định dạng file thiết kế không được hỗ trợ."); return; }
    if (file instanceof File && file.size > 25 * 1024 * 1024) { alert("File thiết kế vượt quá giới hạn 25 MB."); return; }
    if (file instanceof File) { payload.fileData = await fileToBase64(file); payload.fileType = file.type || "application/octet-stream"; }
    await saveSchematic(payload);
    await loadHardwareData(container);
    container.querySelector("#schematic-modal").hidden = true;
  });
}

function bindSafety(container) {
  container.querySelectorAll(".mini-tab").forEach((tab) => tab.addEventListener("click", () => {
    container.querySelectorAll(".mini-tab").forEach((item) => item.classList.toggle("active", item === tab));
    container.querySelectorAll(".mini-panel").forEach((panel) => { panel.hidden = panel.dataset.mini !== tab.dataset.safetyTab; });
  }));
  container.querySelector('[data-form="chemical-form"]').addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); await saveChemical(Object.fromEntries(data.entries())); await loadHardwareData(container); container.querySelector("#chemical-modal").hidden = true; });
  container.querySelector('[data-form="audit-form"]').addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const payload = { projectId: "default-project", auditDate: data.get("auditDate"), auditorName: data.get("auditorName"), status: data.get("status"), checklistData: data.getAll("check") }; await saveSafetyAudit(payload); await loadHardwareData(container); container.querySelector("#audit-modal").hidden = true; });
}

function renderSchematic(container, item) {
  const component = item.component_name ?? item.componentName ?? "";
  const version = item.version_tag ?? item.versionTag ?? "";
  const notes = item.notes ?? "";
  const fileUrl = item.fileDownloadUrl ?? "";
  const simulation = safeExternalUrl(item.simulation_link ?? item.simulationLink ?? "");
  appendRecord(container.querySelector("#schematic-grid"), `<article class="hardware-card"><span class="hardware-icon">HARDWARE</span><h2>${esc(component)}</h2><small>${esc(version)}</small><details class="pinout-details"><summary>Chi tiết chân cắm</summary><p>${esc(notes || "Chưa có pinout được ghi chú.")}</p></details><div class="hardware-actions">${fileUrl ? `<a class="button button-primary" href="${esc(fileUrl)}" target="_blank" rel="noopener">Xem sơ đồ mạch</a>` : `<span class="button button-secondary is-disabled">Chưa có file</span>`}${simulation ? `<a class="button button-primary" href="${esc(simulation)}" target="_blank" rel="noopener">Mở mô phỏng</a>` : ""}</div></article>`);
}

function renderChemical(container, item) {
  const name = item.chemical_name ?? item.chemicalName ?? "";
  const level = item.hazard_level ?? item.hazardLevel ?? "Low";
  const summary = item.msds_summary ?? item.msdsSummary ?? "";
  const location = item.storage_location ?? item.storageLocation ?? "";
  appendRecord(container.querySelector("#chemical-list"), `<article class="chemical-card hazard-${esc(level.toLowerCase())}"><div><h2>${esc(name)}</h2><span>${esc(level)}</span></div><p>${esc(summary)}</p><small>${esc(location)}</small></article>`);
}

function renderAudit(container, audit) {
  const checks = audit.checklist_data ?? audit.checklistData ?? [];
  appendRecord(container.querySelector("#audit-list"), `<article class="audit-card"><span class="audit-status">${esc(audit.status)}</span><strong>${esc(audit.audit_date ?? audit.auditDate)}</strong><p>Người kiểm toán: ${esc(audit.auditor_name ?? audit.auditorName)}</p><small>${checks.length} mục đã hoàn thành</small></article>`);
}

function appendRecord(list, markup) {
  list.querySelector(".empty-panel")?.remove();
  list.insertAdjacentHTML("beforeend", markup);
}

function bindMentor(container) {
  container.querySelector('[data-form="mentor-form"]').addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const title = data.get("actionTitle"); const payload = { projectId: "default-project", meetingDate: data.get("meetingDate"), mentorName: data.get("mentorName"), keyFeedback: data.get("keyFeedback"), nextMeetingSchedule: data.get("nextMeeting"), actionItems: title ? [{ title, assignee: data.get("assignee"), deadline: data.get("deadline") }] : [] }; await saveMentorMeeting(payload); await loadHardwareData(container); container.querySelector("#mentor-modal").hidden = true; });
}
function bindPrototype(container) {
  container.querySelector('[data-form="prototype-form"]').addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const images = [...data.getAll("images")].filter((file) => file instanceof File && file.size > 0); if (images.some((file) => file.size > 10 * 1024 * 1024)) { alert("Mỗi ảnh không được vượt quá 10 MB."); return; } const payload = { projectId: "default-project", versionNumber: data.get("versionNumber"), releaseDate: data.get("releaseDate"), changelogSummary: data.get("changelogSummary"), failedReasons: data.get("failedReasons"), images: await Promise.all(images.map(async (file) => ({ name: file.name, contentType: file.type || "application/octet-stream", base64: await fileToBase64(file) }))) }; await savePrototypeVersion(payload); await loadHardwareData(container); container.querySelector("#prototype-modal").hidden = true; });
}
async function bindTeam(container) {
  const refresh = async () => { try { const result = await getTeamContributions("default-project"); renderTeam(container, result.members || []); } catch { renderTeam(container, []); } };
  container.querySelector("#refresh-team").addEventListener("click", refresh);
  await refresh();
}
function renderTeam(container, members) { container.querySelector("#team-rows").innerHTML = members.length ? members.map((member) => { const contribution = Math.max(0, Math.min(100, Number(member.contributionPercentage) || 0)); return `<tr><td><strong>${esc(member.memberName)}</strong></td><td>${member.tasksCompletedCount || 0}</td><td>${member.logbooksWrittenCount || 0}</td><td>${member.peerScore || 0}/10</td><td><div class="contribution-track"><span style="width:${contribution}%"></span></div><small>${contribution}%</small></td></tr>`; }).join("") : '<tr><td colspan="5" class="empty-table">Chưa có dữ liệu thành viên.</td></tr>'; }

async function loadHardwareData(container) {
  try {
    const data = await getHardwareData("default-project");
    const schematicGrid = container.querySelector("#schematic-grid");
    const chemicalList = container.querySelector("#chemical-list");
    const auditList = container.querySelector("#audit-list");
    const mentorTimeline = container.querySelector("#mentor-timeline");
    const prototypeTimeline = container.querySelector("#prototype-timeline");
    schematicGrid.innerHTML = ""; chemicalList.innerHTML = ""; auditList.innerHTML = ""; mentorTimeline.innerHTML = ""; prototypeTimeline.innerHTML = "";
    (data.schematics || []).forEach((item) => renderSchematic(container, item));
    (data.chemicals || []).forEach((item) => renderChemical(container, item));
    (data.audits || []).sort((a, b) => String(b.audit_date).localeCompare(String(a.audit_date))).forEach((item) => renderAudit(container, item));
    (data.meetings || []).sort((a, b) => String(b.meeting_date).localeCompare(String(a.meeting_date))).forEach((item) => renderMentor(container, item));
    (data.versions || []).sort((a, b) => String(b.release_date).localeCompare(String(a.release_date))).forEach((item, index) => renderPrototype(container, item, index === 0));
    for (const [element, message] of [[schematicGrid, "Chưa có sơ đồ mạch được ghi nhận."], [chemicalList, "Chưa có hồ sơ hóa chất."], [auditList, "Chưa có lần kiểm toán."], [mentorTimeline, "Chưa có buổi họp mentor."], [prototypeTimeline, "Chưa có phiên bản nguyên mẫu."]]) {
      if (!element.children.length) element.innerHTML = `<p class="empty-panel">${message}</p>`;
    }
  } catch (error) {
    console.error("Không thể tải dữ liệu Hardware Lab", error);
  }
}

function renderMentor(container, item) {
  const actions = item.action_items ?? [];
  const actionMarkup = actions.map((action) => `<li>${esc(action.title)}${action.assignee ? ` · ${esc(action.assignee)}` : ""}${action.deadline ? ` · ${esc(action.deadline)}` : ""}</li>`).join("");
  appendRecord(container.querySelector("#mentor-timeline"), `<article class="mentor-card"><time>${esc(item.meeting_date)}</time><div><h2>${esc(item.mentor_name)}</h2><p>${esc(item.key_feedback)}</p>${actionMarkup ? `<ul class="mentor-actions">${actionMarkup}</ul>` : ""}${item.next_meeting_schedule ? `<small>Lịch tiếp theo: ${esc(item.next_meeting_schedule)}</small>` : ""}</div></article>`);
}

function renderPrototype(container, item, current) {
  const urls = item.imageUrls ?? [];
  const images = urls.map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="Nguyên mẫu ${esc(item.version_number)}"></a>`).join("");
  appendRecord(container.querySelector("#prototype-timeline"), `<article class="prototype-card ${current ? "current" : ""}">${current ? '<span class="active-version">Current</span>' : '<span class="archived-version">Archived</span>'}<h2>${esc(item.version_number)}</h2><time>${esc(item.release_date)}</time><p>${esc(item.changelog_summary)}</p><small>${esc(item.failed_reasons || "Không ghi nhận lỗi trước đó.")}</small>${images ? `<div class="prototype-images">${images}</div>` : ""}</article>`);
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
