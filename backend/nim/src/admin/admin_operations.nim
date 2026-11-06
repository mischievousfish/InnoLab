import std/[asyncdispatch, json, os, sha1, strformat, strutils, tables, times]
import ./admin_pocketbase

const exportCollections = ["projects", "roadmap_tasks", "tasks", "logbook_entries", "experiment_data", "inventory_items", "budget_expenses", "references", "hardware_schematics", "chemical_inventory", "safety_audits", "mentor_meetings", "prototype_versions", "team_contributions", "judge_access"]

proc storageInfo(): JsonNode =
  let dataDir = getEnv("POCKETBASE_DATA_DIR")
  var bytes = 0'i64
  var fileCount = 0
  let available = dataDir.len > 0 and dirExists(dataDir)
  if available:
    for path in walkDirRec(dataDir):
      if fileExists(path):
        bytes += getFileInfo(path).size
        inc fileCount
  %*{"available": available, "path": dataDir, "bytes": bytes, "fileCount": fileCount}

proc annotateIntegrity(items: JsonNode) =
  for item in items.getElems():
    let storedHash = item{"integrity_hash"}.getStr()
    var canonical = newJObject()
    for key, value in item:
      if key notin ["integrity_hash", "updated", "integrity_status", "computed_hash"]:
        canonical[key] = value
    let computedHash = secureHash($canonical).toHex().toLowerAscii()
    let state = if storedHash.len == 0: "unverified" elif storedHash.toLowerAscii() == computedHash: "verified" else: "mismatch"
    item["integrity_status"] = %state
    item["computed_hash"] = %computedHash
    item["stored_hash"] = %(if storedHash.len == 0: "" else: storedHash)

proc getConsoleData*(client: AdminPocketBase): Future[JsonNode] {.async.} =
  let users = await client.listRecords(getEnv("POCKETBASE_AUTH_COLLECTION", "users"))
  let projects = await client.listRecords("projects")
  let logs = await client.listRecords("logbook_entries")
  annotateIntegrity(logs["items"])
  result = %*{"users": users["items"], "projects": projects["items"], "audits": logs["items"], "system": storageInfo()}

proc updateUser*(client: AdminPocketBase, body, adminUser: JsonNode): Future[JsonNode] {.async.} =
  let userId = body{"userId"}.getStr()
  if userId.len == 0: raise newException(ValueError, "Thiếu userId.")
  if userId == adminUser{"id"}.getStr():
    raise newException(ValueError, "Không thể thay đổi vai trò hoặc trạng thái của phiên admin hiện tại.")
  var changes = newJObject()
  if body.hasKey("role"):
    let role = body{"role"}.getStr()
    if role notin ["Admin", "Student", "Mentor", "Judge"]:
      raise newException(ValueError, "Vai trò không hợp lệ.")
    changes["role"] = %role
  if body.hasKey("status"):
    let status = body{"status"}.getStr()
    if status notin ["active", "banned"]:
      raise newException(ValueError, "Trạng thái tài khoản không hợp lệ.")
    changes["status"] = %status
  if changes.len == 0: raise newException(ValueError, "Không có thay đổi để lưu.")
  let users = await client.listRecords(getEnv("POCKETBASE_AUTH_COLLECTION", "users"))
  var target = newJObject()
  for user in users["items"].getElems():
    if user{"id"}.getStr() == userId: target = user
  let targetIsAdmin = target{"role"}.getStr().toLowerAscii() == "admin"
  let demotingAdmin = targetIsAdmin and changes.hasKey("role") and changes["role"].getStr() != "Admin"
  let banningAdmin = targetIsAdmin and changes.hasKey("status") and changes["status"].getStr() == "banned"
  if demotingAdmin or banningAdmin:
    var activeAdmins = 0
    for user in users["items"].getElems():
      if user{"role"}.getStr().toLowerAscii() == "admin" and user{"status"}.getStr().toLowerAscii() != "banned":
        inc activeAdmins
    if activeAdmins <= 1:
      raise newException(ValueError, "Không thể vô hiệu hóa tài khoản admin cuối cùng.")
  result = await client.updateRecord(getEnv("POCKETBASE_AUTH_COLLECTION", "users"), userId, changes)

proc reviewProject*(client: AdminPocketBase, body: JsonNode): Future[JsonNode] {.async.} =
  let projectId = body{"projectId"}.getStr()
  let status = body{"status"}.getStr()
  if projectId.len == 0: raise newException(ValueError, "Thiếu projectId.")
  if status notin ["approved", "changes_requested"]:
    raise newException(ValueError, "Trạng thái duyệt không hợp lệ.")
  result = await client.updateRecord("projects", projectId, %*{"status": status})

proc issueJudgeToken*(client: AdminPocketBase, body: JsonNode): Future[JsonNode] {.async.} =
  let projectId = body{"projectId"}.getStr()
  let token = body{"judgeToken"}.getStr()
  if projectId.len == 0 or token.len != 6 or not token.allCharsInSet({'0'..'9'}):
    raise newException(ValueError, "Thiếu projectId hoặc mã token không hợp lệ.")
  let tokenHash = secureHash(token).toHex()
  result = await client.createRecord("judge_access", %*{"project": projectId, "enabled": true, "read_only": true, "pin_hash": tokenHash})

proc createBackupAction*(client: AdminPocketBase): Future[JsonNode] {.async.} =
  let response = await client.createBackup()
  result = %*{"message": "PocketBase backup đã được tạo.", "backup": response, "backupName": response{"key"}.getStr(response{"name"}.getStr())}

proc exportBundle*(client: AdminPocketBase): Future[JsonNode] {.async.} =
  var collections = newJObject()
  for collection in exportCollections:
    try:
      let records = await client.listRecords(collection)
      collections[collection] = records["items"]
    except CatchableError as error:
      if not error.msg.contains("HTTP 404"):
        raise
  let bundle = %*{"generatedAt": now().utc().format("yyyy-MM-dd'T'HH:mm:ss'Z'"), "collections": collections}
  result = %*{"bundle": bundle, "fileName": "innolab-admin-bundle-" & now().utc().format("yyyyMMdd-HHmmss") & ".json"}

proc resetBusinessData*(client: AdminPocketBase, body: JsonNode): Future[JsonNode] {.async.} =
  if body{"confirmation"}.getStr() != "RESET INNOLAB":
    raise newException(ValueError, "Cụm xác nhận reset không chính xác.")

  let collectionResponse = await client.listCollections()
  let authCollection = getEnv("POCKETBASE_AUTH_COLLECTION", "users")
  var recordsByCollection = initOrderedTable[string, seq[string]]()
  for collection in collectionResponse{"items"}.getElems():
    let name = collection{"name"}.getStr()
    let kind = collection{"type"}.getStr()
    if kind != "base" or name in [authCollection, "_superusers"]: continue
    let records = await client.listRecords(name)
    var ids: seq[string] = @[]
    for record in records{"items"}.getElems(): ids.add(record{"id"}.getStr())
    recordsByCollection[name] = ids

  let backup = await client.createBackup()
  var deleted = 0
  for collection, ids in recordsByCollection:
    for recordId in ids:
      discard await client.deleteRecord(collection, recordId)
      inc deleted
  result = %*{"message": "Đã backup và reset dữ liệu nghiệp vụ; schema và tài khoản auth được giữ lại.", "backup": backup, "deletedRecords": deleted}
