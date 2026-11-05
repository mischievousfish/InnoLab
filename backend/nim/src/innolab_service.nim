import std/[asynchttpserver, asyncdispatch, json, os, strformat, strutils, sha1, times, tables]
import models
import pocketbase_client

const servicePort = 8091
let pocketBase = newPocketBaseClient(getEnv("POCKETBASE_URL", "http://127.0.0.1:8090"))

proc handleRequest(req: Request) {.async.} =
  if req.reqMethod == HttpOptions:
    await req.respond(Http204, "", newHttpHeaders({"Access-Control-Allow-Origin": "http://localhost:5173", "Access-Control-Allow-Headers": "Content-Type"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/experiment-data":
    let data = parseExperimentData(parseJson(req.body))
    discard await pocketBase.create("experiment_data", data.toPocketBaseJson())
    await req.respond(Http201, $(%*{"message": "Đã lưu bộ số liệu."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/roadmap/tasks":
    let task = parseRoadmapTask(parseJson(req.body))
    discard await pocketBase.create("roadmap_tasks", task.toPocketBaseJson())
    await req.respond(Http201, $(%*{"message": "Đã lưu công việc."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/inventory/items":
    let item = parseInventoryItem(parseJson(req.body))
    discard await pocketBase.create("inventory_items", item.toPocketBaseJson())
    await req.respond(Http201, $(%*{"message": "Đã lưu vật tư."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/budget/expenses":
    let expense = parseBudgetExpense(parseJson(req.body))
    discard await pocketBase.create("budget_expenses", expense.toPocketBaseJson())
    await req.respond(Http201, $(%*{"message": "Đã lưu khoản chi."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/research/analyze-methodology":
    let check = parseMethodologyCheck(parseJson(req.body))
    let hypothesis = check.hypothesis.toLowerAscii()
    var variables = newJArray()
    variables.add(%*{"type": "Biến độc lập (X)", "name": "Điều kiện thay đổi", "note": "Xác định rõ giá trị hoặc mức thay đổi duy nhất."})
    variables.add(%*{"type": "Biến phụ thuộc (Y)", "name": "Đại lượng đo", "note": "Dữ liệu phải quan sát được và đo lặp."})
    variables.add(%*{"type": "Biến kiểm soát (Z)", "name": "Điều kiện giữ nguyên", "note": "Liệt kê thời gian, dụng cụ, môi trường và quy trình."})
    var warnings = newJArray()
    if not hypothesis.contains("nếu") or not hypothesis.contains("thì"):
      warnings.add("Giả thuyết nên được viết theo cấu trúc: Nếu thay đổi X, thì Y sẽ thay đổi như thế nào.")
    if check.resources.toLowerAscii().contains("100") and check.resources.toLowerAscii().contains("nhựa"):
      warnings.add("Kiểm tra giới hạn nhiệt của vật liệu: nhiều giá thể nhựa bắt đầu biến dạng dưới hoặc quanh 85°C.")
    let response = %*{"variables": variables, "warnings": warnings}
    await req.respond(Http200, $response, newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/research/assess-risk":
    let assessment = parseRiskAssessment(parseJson(req.body))
    let text = assessment.resources.toLowerAscii()
    var risks = newJArray()
    var checklist = newJArray()
    risks.add(%*{"factor": "Thiết bị & hóa chất tổng thể", "level": (if text.contains("axit") or text.contains("acid") or text.contains("hóa chất") or assessment.temperature >= 80.0: "high" else: "low")})
    risks.add(%*{"factor": "Nguồn điện", "level": (if assessment.voltage >= 220.0: "medium" else: "low")})
    risks.add(%*{"factor": "Nhiệt độ thử nghiệm", "level": (if assessment.temperature >= 85.0: "high" else: (if assessment.temperature >= 60.0: "medium" else: "low"))})
    checklist.add("Đeo kính bảo hộ")
    checklist.add("Đeo găng tay phù hợp hóa chất")
    checklist.add("Kiểm tra hệ thống điện và dây nguồn")
    if text.contains("axit") or text.contains("acid"):
      checklist.add("Sử dụng tủ hút hoặc khu vực thông khí tốt")
    if assessment.temperature >= 60.0:
      checklist.add("Chuẩn bị găng tay chống nhiệt")
    let response = %*{"risks": risks, "checklist": checklist}
    await req.respond(Http200, $response, newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/references":
    let reference = parseReference(parseJson(req.body))
    discard await pocketBase.create("references", reference.toPocketBaseJson())
    await req.respond(Http201, $(%*{"message": "Đã lưu tài liệu tham khảo."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/references/format":
    let body = parseJson(req.body)
    let reference = body{"reference"}
    let format = body{"format"}.getStr("apa")
    let title = reference{"title"}.getStr()
    let authors = reference{"authors"}.getStr()
    let year = reference{"year"}.getInt()
    let source = reference{"source"}.getStr()
    let doi = reference{"doi"}.getStr()
    var citation: string
    if format == "ieee":
      citation = &"[1] {authors}, \"{title},\" {source}, {year}. {doi}"
    else:
      citation = &"{authors} ({year}). {title}. {source}. {doi}"
    await req.respond(Http200, $(%*{"citation": citation}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/projects/overview":
    let body = parseJson(req.body)
    let projectId = body{"projectId"}.getStr("default-project")
    let tasks = await pocketBase.list("roadmap_tasks", &"project = '{projectId}'")
    let budget = await pocketBase.list("budget_expenses", &"project = '{projectId}'")
    let logs = await pocketBase.list("logbook_entries", &"project = '{projectId}'")
    let projectList = await pocketBase.list("projects", &"id = '{projectId}'")
    var activeTasks = 0
    var allocated = 0.0
    if projectList{"items"}.len > 0:
      allocated = projectList{"items"}[0]{"budget_allocated"}.getFloat()
    var spent = 0.0
    var logCount = 0
    for task in tasks{"items"}.getElems():
      if task{"status"}.getStr("todo") != "done": inc activeTasks
    for expense in budget{"items"}.getElems():
      spent += expense{"amount"}.getFloat()
    for entry in logs{"items"}.getElems():
      inc logCount
    let stageProgress = %*{"0": 100, "1": 72, "2": 48, "3": 25, "4": 10}
    let overview = %*{"progress": 51, "logbookCount": logCount, "remainingBudget": allocated - spent, "spentBudget": spent,
      "activeTasks": activeTasks, "stageProgress": stageProgress, "recentLogbooks": logs{"items"}}
    await req.respond(Http200, $overview, newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/reports/create":
    let body = parseJson(req.body)
    let canonical = $body
    let wormHash = secureHash(canonical & now().format("yyyy-MM-dd'T'HH:mm:sszzz")).toHex()
    await req.respond(Http200, $(%*{"wormHash": wormHash, "openPrint": true, "message": "Đã tạo gói hồ sơ A4."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/judge-access":
    let body = parseJson(req.body)
    let pin = body{"pin"}.getStr()
    if pin.len != 6 or not pin.allCharsInSet({'0'..'9'}):
      await req.respond(Http400, $(%*{"message": "Mã giám khảo phải gồm đúng 6 chữ số."}), newHttpHeaders({"Content-Type": "application/json"}))
      return
    let pinHash = secureHash(pin).toHex()
    discard await pocketBase.create("judge_access", %*{"project": body{"projectId"}.getStr("default-project"), "enabled": body{"enabled"}.getBool(false), "pin_hash": pinHash, "read_only": true})
    await req.respond(Http200, $(%*{"message": "Đã kích hoạt chế độ giám khảo chỉ đọc."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/hardware/schematics":
    let body = parseJson(req.body)
    let allowed = ["step", "stl", "fzz", "sch", "brd", "kicad_sch", "svg", "pdf"]
    let fileName = body{"fileName"}.getStr().toLowerAscii()
    if fileName.len > 0:
      let extension = fileName.split('.')[^1]
      if extension notin allowed:
        await req.respond(Http400, $(%*{"message": "Định dạng thiết kế không được hỗ trợ."}), newHttpHeaders({"Content-Type": "application/json"}))
        return
    discard await pocketBase.create("hardware_schematics", %*{"project": body{"projectId"}.getStr("default-project"), "version_tag": body{"versionTag"}.getStr(), "component_name": body{"componentName"}.getStr(), "file_url": body{"fileName"}.getStr(), "simulation_link": body{"simulationLink"}.getStr(), "notes": body{"notes"}.getStr()})
    await req.respond(Http201, $(%*{"message": "Đã lưu sơ đồ thiết kế."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/safety/chemicals":
    let body = parseJson(req.body)
    discard await pocketBase.create("chemical_inventory", %*{"chemical_name": body{"chemicalName"}.getStr(), "hazard_level": body{"hazardLevel"}.getStr(), "msds_summary": body{"msdsSummary"}.getStr(), "storage_location": body{"storageLocation"}.getStr()})
    await req.respond(Http201, $(%*{"message": "Đã lưu hồ sơ hóa chất."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/safety/audits":
    let body = parseJson(req.body)
    discard await pocketBase.create("safety_audits", %*{"project": body{"projectId"}.getStr("default-project"), "audit_date": body{"auditDate"}.getStr(), "checklist_data": body{"checklistData"}, "auditor_name": body{"auditorName"}.getStr(), "status": body{"status"}.getStr()})
    await req.respond(Http201, $(%*{"message": "Đã lưu kiểm toán phòng lab."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/mentor/meetings":
    let body = parseJson(req.body)
    let meeting = await pocketBase.create("mentor_meetings", %*{"project": body{"projectId"}.getStr("default-project"), "meeting_date": body{"meetingDate"}.getStr(), "mentor_name": body{"mentorName"}.getStr(), "key_feedback": body{"keyFeedback"}.getStr(), "action_items": body{"actionItems"}, "next_meeting_schedule": body{"nextMeetingSchedule"}.getStr()})
    for item in body{"actionItems"}.getElems():
      if item{"title"}.getStr().len > 0:
        discard await pocketBase.create("roadmap_tasks", %*{"project": body{"projectId"}.getStr("default-project"), "title": item{"title"}.getStr(), "stage": "analysis", "priority": "medium", "deadline": item{"deadline"}.getStr(), "assignee": item{"assignee"}.getStr()})
    await req.respond(Http201, $(%*{"message": "Đã lưu buổi họp và tạo action items.", "record": meeting}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/prototypes/versions":
    let body = parseJson(req.body)
    discard await pocketBase.create("prototype_versions", %*{"project": body{"projectId"}.getStr("default-project"), "version_number": body{"versionNumber"}.getStr(), "release_date": body{"releaseDate"}.getStr(), "changelog_summary": body{"changelogSummary"}.getStr(), "failed_reasons": body{"failedReasons"}.getStr()})
    await req.respond(Http201, $(%*{"message": "Đã lưu phiên bản nguyên mẫu."}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  if req.reqMethod == HttpPost and req.url.path == "/api/team/contributions":
    let body = parseJson(req.body)
    let projectId = body{"projectId"}.getStr("default-project")
    let taskResult = await pocketBase.list("roadmap_tasks", &"project = '{projectId}'")
    let logResult = await pocketBase.list("logbook_entries", &"project = '{projectId}'")
    var members = initOrderedTable[string, JsonNode]()
    for task in taskResult{"items"}.getElems():
      let member = task{"assignee"}.getStr("Chưa phân công")
      if member.len == 0: continue
      if member notin members: members[member] = %*{"memberName": member, "tasksCompletedCount": 0, "logbooksWrittenCount": 0, "peerScore": 0}
      if task{"status"}.getStr("todo") == "done": members[member]["tasksCompletedCount"] = %(members[member]["tasksCompletedCount"].getInt() + 1)
    for entry in logResult{"items"}.getElems():
      let member = entry{"author"}.getStr("Chưa phân công")
      if member.len == 0: continue
      if member notin members: members[member] = %*{"memberName": member, "tasksCompletedCount": 0, "logbooksWrittenCount": 0, "peerScore": 0}
      members[member]["logbooksWrittenCount"] = %(members[member]["logbooksWrittenCount"].getInt() + 1)
    var memberArray = newJArray()
    var totalActivity = 0
    for member, value in members: totalActivity += value{"tasksCompletedCount"}.getInt() + value{"logbooksWrittenCount"}.getInt()
    for member, value in members:
      let activity = value{"tasksCompletedCount"}.getInt() + value{"logbooksWrittenCount"}.getInt()
      value["contributionPercentage"] = %(if totalActivity == 0: 0 else: (activity * 100) div totalActivity)
      memberArray.add(value)
    await req.respond(Http200, $(%*{"members": memberArray}), newHttpHeaders({"Content-Type": "application/json"}))
    return

  await req.respond(Http404, $(%*{"message": "Endpoint không tồn tại."}), newHttpHeaders({"Content-Type": "application/json"}))

proc main() {.async.} =
  var server = newAsyncHttpServer()
  echo &"InnoLab Nim service listening on http://127.0.0.1:{servicePort}"
  await server.serve(Port(servicePort), handleRequest)

waitFor main()
