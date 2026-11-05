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
