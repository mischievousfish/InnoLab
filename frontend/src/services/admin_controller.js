import { getAuthenticatedUser, getStoredSession } from "./auth_controller.js";

function nativeAdminMethod(name) {
  const app = window.go?.main?.App;
  if (!app?.[name]) throw new Error(`Wails admin binding chưa sẵn sàng: ${name}`);
  return app[name].bind(app);
}

export async function requireAdminSession() {
  const user = await getAuthenticatedUser();
  const session = getStoredSession();
  if (!user || !session?.token || String(user.role || "").toLowerCase() !== "admin") return null;
  return { token: session.token, user };
}

export function getAdminConsole(authToken) {
  return nativeAdminMethod("AdminGetConsole")({ authToken });
}

export function updateAdminUser(authToken, userId, changes) {
  return nativeAdminMethod("AdminUpdateUser")({ authToken, userId, ...changes });
}

export function reviewAdminProject(authToken, projectId, status) {
  return nativeAdminMethod("AdminReviewProject")({ authToken, projectId, status });
}

export function issueJudgeAccess(authToken, projectId) {
  return nativeAdminMethod("AdminIssueJudgeToken")({ authToken, projectId });
}

export function createAdminBackup(authToken) {
  return nativeAdminMethod("AdminCreateBackup")({ authToken });
}

export function exportAdminBundle(authToken) {
  return nativeAdminMethod("AdminExportBundle")({ authToken });
}

export function resetAdminData(authToken, confirmation) {
  return nativeAdminMethod("AdminResetSystem")({ authToken, confirmation });
}