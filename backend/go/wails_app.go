package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// App exposes typed methods to the Wails JavaScript runtime.
type App struct {
	ctx context.Context
}

func NewApp() *App { return &App{} }

func (app *App) startup(ctx context.Context) { app.ctx = ctx }

func (app *App) nimServiceURL() string {
	if value := os.Getenv("INNOLAB_NIM_URL"); value != "" {
		return value
	}
	return "http://127.0.0.1:8091"
}

func (app *App) postToNim(path string, payload interface{}) (map[string]interface{}, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 15 * time.Second}
	request, err := http.NewRequestWithContext(app.ctx, http.MethodPost, app.nimServiceURL()+path, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("Nim service unavailable: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode >= 300 {
		return nil, fmt.Errorf("Nim service returned %s: %s", response.Status, string(responseBody))
	}

	result := map[string]interface{}{}
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (app *App) SaveExperimentData(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/experiment-data", payload)
}

func (app *App) SaveRoadmapTask(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/roadmap/tasks", payload)
}

func (app *App) GetRoadmapTasks(projectID string) ([]interface{}, error) {
	return []interface{}{}, nil
}

func (app *App) SaveInventoryItem(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/inventory/items", payload)
}

func (app *App) SaveBudgetExpense(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/budget/expenses", payload)
}

func (app *App) AnalyzeMethodology(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/research/analyze-methodology", payload)
}

func (app *App) AssessRisk(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/research/assess-risk", payload)
}

func (app *App) CreateProjectExport(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/reports/create", payload)
}

func (app *App) EnableJudgeAccess(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/judge-access", payload)
}

func (app *App) SaveReference(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/references", payload)
}

func (app *App) FormatReference(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/references/format", payload)
}

func (app *App) GetProjectOverview(projectID string) (map[string]interface{}, error) {
	return app.postToNim("/api/projects/overview", map[string]interface{}{"projectId": projectID})
}

func (app *App) SaveSchematic(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/hardware/schematics", payload)
}

func (app *App) SaveChemical(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/safety/chemicals", payload)
}

func (app *App) SaveSafetyAudit(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/safety/audits", payload)
}

func (app *App) SaveMentorMeeting(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/mentor/meetings", payload)
}

func (app *App) SavePrototypeVersion(payload interface{}) (map[string]interface{}, error) {
	return app.postToNim("/api/prototypes/versions", payload)
}

func (app *App) GetTeamContributions(projectID string) (map[string]interface{}, error) {
	return app.postToNim("/api/team/contributions", map[string]interface{}{"projectId": projectID})
}

func (app *App) GetHardwareData(projectID string) (map[string]interface{}, error) {
	return app.postToNim("/api/hardware/data", map[string]interface{}{"projectId": projectID})
}
