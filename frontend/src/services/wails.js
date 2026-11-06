const getNativeApp = () => globalThis.window?.go?.main?.App;

export async function saveExperimentData(payload) {
  const app = getNativeApp();
  if (app?.SaveExperimentData) {
    return app.SaveExperimentData(payload);
  }

  throw new Error("Wails binding unavailable: App.SaveExperimentData");
}

export async function saveRoadmapTask(payload) {
  const app = getNativeApp();
  if (app?.SaveRoadmapTask) {
    return app.SaveRoadmapTask(payload);
  }
  throw new Error("Wails binding unavailable: App.SaveRoadmapTask");
}

export async function fetchRoadmapTasks(projectId) {
  const app = getNativeApp();
  if (app?.GetRoadmapTasks) {
    return app.GetRoadmapTasks(projectId);
  }
  return [];
}

export async function saveInventoryItem(payload) {
  const app = getNativeApp();
  if (app?.SaveInventoryItem) {
    return app.SaveInventoryItem(payload);
  }
  throw new Error("Wails binding unavailable: App.SaveInventoryItem");
}

export async function saveBudgetExpense(payload) {
  const app = getNativeApp();
  if (app?.SaveBudgetExpense) {
    return app.SaveBudgetExpense(payload);
  }
  throw new Error("Wails binding unavailable: App.SaveBudgetExpense");
}

export async function analyzeMethodology(payload) {
  const app = getNativeApp();
  if (app?.AnalyzeMethodology) return app.AnalyzeMethodology(payload);
  throw new Error("Wails binding unavailable: App.AnalyzeMethodology");
}

export async function assessRisk(payload) {
  const app = getNativeApp();
  if (app?.AssessRisk) return app.AssessRisk(payload);
  throw new Error("Wails binding unavailable: App.AssessRisk");
}

export async function createProjectExport(payload) {
  const app = getNativeApp();
  if (app?.CreateProjectExport) return app.CreateProjectExport(payload);
  throw new Error("Wails binding unavailable: App.CreateProjectExport");
}

export async function enableJudgeAccess(payload) {
  const app = getNativeApp();
  if (app?.EnableJudgeAccess) return app.EnableJudgeAccess(payload);
  throw new Error("Wails binding unavailable: App.EnableJudgeAccess");
}

export async function saveReference(payload) {
  const app = getNativeApp();
  if (app?.SaveReference) return app.SaveReference(payload);
  throw new Error("Wails binding unavailable: App.SaveReference");
}

export async function formatReference(payload) {
  const app = getNativeApp();
  if (app?.FormatReference) return app.FormatReference(payload);
  throw new Error("Wails binding unavailable: App.FormatReference");
}

export async function getProjectOverview(projectId) {
  const app = getNativeApp();
  if (app?.GetProjectOverview) return app.GetProjectOverview(projectId);
  throw new Error("Wails binding unavailable: App.GetProjectOverview");
}

function requireNative(methodName) {
  const app = getNativeApp();
  if (!app?.[methodName]) throw new Error(`Wails binding unavailable: App.${methodName}`);
  return app;
}

export async function saveSchematic(payload) { return requireNative("SaveSchematic")["SaveSchematic"](payload); }
export async function saveChemical(payload) { return requireNative("SaveChemical")["SaveChemical"](payload); }
export async function saveSafetyAudit(payload) { return requireNative("SaveSafetyAudit")["SaveSafetyAudit"](payload); }
export async function saveMentorMeeting(payload) { return requireNative("SaveMentorMeeting")["SaveMentorMeeting"](payload); }
export async function savePrototypeVersion(payload) { return requireNative("SavePrototypeVersion")["SavePrototypeVersion"](payload); }
export async function getTeamContributions(projectId) { return requireNative("GetTeamContributions")["GetTeamContributions"](projectId); }
export async function getHardwareData(projectId) { return requireNative("GetHardwareData")["GetHardwareData"](projectId); }
