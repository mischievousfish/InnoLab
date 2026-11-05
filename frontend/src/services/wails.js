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
