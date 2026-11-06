import std/[asynchttpserver, asyncdispatch, json, os, strutils]
import ./admin_pocketbase
import ./admin_operations

let pocketBaseUrl = getEnv("POCKETBASE_URL", "http://127.0.0.1:8090").strip(chars={'/'})

proc respondJson(req: Request, status: HttpCode, payload: JsonNode) {.async.} =
  await req.respond(status, $payload, newHttpHeaders({"Content-Type": "application/json"}))

proc handleAdminRequest*(req: Request): Future[bool] {.async.} =
  if not req.url.path.startsWith("/api/admin/"):
    return false

  try:
    let body = parseJson(req.body)
    let adminUser = await authenticateAdminUser(pocketBaseUrl, body{"authToken"}.getStr())
    let client = await connectSuperuser(pocketBaseUrl)
    var result: JsonNode
    case req.url.path
    of "/api/admin/console":
      result = await getConsoleData(client)
    of "/api/admin/user":
      result = await updateUser(client, body, adminUser)
    of "/api/admin/project-review":
      result = await reviewProject(client, body)
    of "/api/admin/judge-token":
      result = await issueJudgeToken(client, body)
    of "/api/admin/backup":
      result = await createBackupAction(client)
    of "/api/admin/export":
      result = await exportBundle(client)
    of "/api/admin/reset":
      result = await resetBusinessData(client, body)
    else:
      await respondJson(req, Http404, %*{"message": "Admin endpoint không tồn tại."})
      return true
    await respondJson(req, Http200, result)
  except CatchableError as error:
    let message = error.msg
    let status = if message.startsWith("ADMIN_FORBIDDEN") or message.contains("HTTP 403"): Http403
      elif message.startsWith("ADMIN_CONFIG"): Http503
      else: Http400
    await respondJson(req, status, %*{"message": message})
  return true
