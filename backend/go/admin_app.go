package main

import (
	cryptorand "crypto/rand"
	"fmt"
	"math/big"
)

func (app *App) adminPost(path string, payload map[string]interface{}) (map[string]interface{}, error) {
	return app.postToNim(path, payload)
}

func (app *App) AdminGetConsole(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/console", payload)
}

func (app *App) AdminUpdateUser(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/user", payload)
}

func (app *App) AdminReviewProject(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/project-review", payload)
}

func (app *App) AdminIssueJudgeToken(payload map[string]interface{}) (map[string]interface{}, error) {
	value, err := cryptorand.Int(cryptorand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return nil, fmt.Errorf("could not generate judge token: %w", err)
	}
	token := fmt.Sprintf("%06d", value.Int64())
	request := make(map[string]interface{}, len(payload)+1)
	for key, value := range payload {
		request[key] = value
	}
	request["judgeToken"] = token
	result, err := app.adminPost("/api/admin/judge-token", request)
	if err != nil {
		return nil, err
	}
	result["token"] = token
	return result, nil
}

func (app *App) AdminCreateBackup(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/backup", payload)
}

func (app *App) AdminExportBundle(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/export", payload)
}

func (app *App) AdminResetSystem(payload map[string]interface{}) (map[string]interface{}, error) {
	return app.adminPost("/api/admin/reset", payload)
}
