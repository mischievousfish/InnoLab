# InnoLab Dashboard

Dashboard quản lý nghiên cứu STEM theo mô hình offline-first, dùng Nim cho business logic, PocketBase cho dữ liệu cục bộ và Wails cho native shell.

## Khởi chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Các màn hình hiện có:

- `Data Vault & Experiment Chart`: nhập dữ liệu X/Y, Chart.js trực tiếp, xuất CSV và gửi IPC lưu dữ liệu.
- `Project Roadmap`: Kanban theo 5 giai đoạn NCKH và modal tạo công việc.

## Chạy Nim service

```bash
cd backend/nim
nimble run innolab_service
```

Service mặc định nghe tại `http://127.0.0.1:8091` và kết nối PocketBase tại `http://127.0.0.1:8090`. Có thể ghi đè bằng biến môi trường `POCKETBASE_URL`.

Wails bridge nằm tại `backend/go/wails_app.go`, có các binding:

- `SaveExperimentData(payload)`
- `SaveRoadmapTask(payload)`
- `GetRoadmapTasks(projectId)`

## Hợp đồng dữ liệu

PocketBase cần hai collection trước khi lưu thực tế:

- `experiment_data`: `project` (relation/text), `x_label` (text), `y_label` (text), `points` (JSON), `recorded_at` (date/text).
- `roadmap_tasks`: `project` (relation/text), `title` (text), `stage` (text), `priority` (select), `deadline` (date), `assignee` (text).

Trong môi trường Wails, giữ `frontend/src/services/wails.js` làm điểm gọi duy nhất; Go/Wails chuyển payload sang Nim service, Nim validate và ghi PocketBase.
