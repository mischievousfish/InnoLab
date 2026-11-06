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

## Cổng xác thực

`index.html` là landing page và cổng đăng nhập/đăng ký. Dashboard được phát hành riêng tại `dashboard.html`; entrypoint này kiểm tra session PocketBase trước khi render các view nội bộ.

Mặc định xác thực qua PocketBase tại `http://127.0.0.1:8090` và auth collection `users`. Có thể cấu hình lúc build frontend bằng `VITE_POCKETBASE_URL` và `VITE_POCKETBASE_AUTH_COLLECTION`. Collection cần bật xác thực bằng mật khẩu và có trường `name` để đăng ký.

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

## Admin Control Center

Trang quản trị được build độc lập tại `frontend/admin.html`; chỉ hiện lối vào với session có `users.role = "admin"`. Nim xác minh lại user token trước mọi thao tác, sau đó mới đăng nhập PocketBase superuser ở backend. Không đặt thông tin superuser trong biến `VITE_*` hoặc frontend.

Các biến môi trường backend cần cấu hình trong môi trường chạy Nim:

- `POCKETBASE_SUPERUSER_EMAIL` và `POCKETBASE_SUPERUSER_PASSWORD`: tài khoản superuser PocketBase.
- `POCKETBASE_DATA_DIR`: thư mục dữ liệu PocketBase cần đo dung lượng.
- `POCKETBASE_AUTH_COLLECTION`: auth collection; mặc định `users`.

Admin API yêu cầu `users.role` (`Admin`, `Student`, `Mentor`, `Judge`), `users.status` (`active`, `banned`), `projects.status` (`pending`, `approved`, `changes_requested`) và `logbook_entries.integrity_hash`. Hash kiểm toán dùng SHA-1 trên JSON canonical, bỏ qua `integrity_hash` và `updated`; record không có baseline được hiển thị `UNVERIFIED`, không suy đoán tính toàn vẹn.

Reset tạo backup qua PocketBase trước, giữ nguyên collection schema và mọi auth records, rồi xóa records trong các base collections. Cấu hình API rule và phân quyền PocketBase vẫn cần giới hạn truy cập theo `role`; UI gate không thay thế kiểm soát quyền phía server.
