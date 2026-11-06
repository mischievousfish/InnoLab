import std/[asyncdispatch, httpclient, json, os, strformat, strutils, uri]

type AdminPocketBase* = object
  baseUrl*: string
  token*: string

proc requestJson*(baseUrl, path: string, httpMethod: HttpMethod, payload: JsonNode, token = ""): Future[JsonNode] {.async.} =
  let http = newAsyncHttpClient()
  var headers = newHttpHeaders()
  if token.len > 0:
    headers["Authorization"] = token
  var body = ""
  if payload.kind != JNull:
    headers["Content-Type"] = "application/json"
    body = $payload
  let response = await http.request(baseUrl & path, httpMethod = httpMethod, body = body, headers = headers)
  let responseText = await response.body
  let statusCode = int(response.code)
  http.close()
  if statusCode >= 400:
    raise newException(ValueError, &"PocketBase HTTP {statusCode}: {responseText}")
  if responseText.len == 0:
    return newJObject()
  try:
    result = parseJson(responseText)
  except JsonParsingError:
    result = %*{"raw": responseText}

proc authenticateAdminUser*(baseUrl, userToken: string): Future[JsonNode] {.async.} =
  if userToken.len == 0:
    raise newException(ValueError, "ADMIN_FORBIDDEN: Thiếu phiên đăng nhập.")
  let collection = getEnv("POCKETBASE_AUTH_COLLECTION", "users")
  let response = await requestJson(baseUrl, &"/api/collections/{encodeUrl(collection)}/auth-refresh", HttpPost, newJNull(), userToken)
  let record = response{"record"}
  if record{"role"}.getStr().toLowerAscii() != "admin" or record{"status"}.getStr().toLowerAscii() == "banned":
    raise newException(ValueError, "ADMIN_FORBIDDEN: Tài khoản không có quyền admin.")
  return record

proc connectSuperuser*(baseUrl: string): Future[AdminPocketBase] {.async.} =
  let identity = getEnv("POCKETBASE_SUPERUSER_EMAIL")
  let password = getEnv("POCKETBASE_SUPERUSER_PASSWORD")
  if identity.len == 0 or password.len == 0:
    raise newException(ValueError, "ADMIN_CONFIG: Cần cấu hình POCKETBASE_SUPERUSER_EMAIL và POCKETBASE_SUPERUSER_PASSWORD trên backend.")
  let auth = await requestJson(baseUrl, "/api/collections/_superusers/auth-with-password", HttpPost, %*{"identity": identity, "password": password})
  result = AdminPocketBase(baseUrl: baseUrl, token: auth{"token"}.getStr())
  if result.token.len == 0:
    raise newException(ValueError, "ADMIN_CONFIG: PocketBase không trả superuser token.")

proc listRecords*(client: AdminPocketBase, collection: string): Future[JsonNode] {.async.} =
  var items = newJArray()
  var page = 1
  var totalPages = 1
  while page <= totalPages:
    let path = &"/api/collections/{encodeUrl(collection)}/records?perPage=500&page={page}&sort=-created"
    let response = await requestJson(client.baseUrl, path, HttpGet, newJNull(), client.token)
    for item in response{"items"}.getElems():
      items.add(item)
    totalPages = response{"totalPages"}.getInt(1)
    inc page
  result = %*{"items": items, "totalItems": items.len}

proc listCollections*(client: AdminPocketBase): Future[JsonNode] {.async.} =
  var items = newJArray()
  var page = 1
  var totalPages = 1
  while page <= totalPages:
    let path = &"/api/collections?perPage=500&page={page}"
    let response = await requestJson(client.baseUrl, path, HttpGet, newJNull(), client.token)
    for item in response{"items"}.getElems():
      items.add(item)
    totalPages = response{"totalPages"}.getInt(1)
    inc page
  result = %*{"items": items}

proc createRecord*(client: AdminPocketBase, collection: string, payload: JsonNode): Future[JsonNode] {.async.} =
  result = await requestJson(client.baseUrl, &"/api/collections/{encodeUrl(collection)}/records", HttpPost, payload, client.token)

proc updateRecord*(client: AdminPocketBase, collection, recordId: string, payload: JsonNode): Future[JsonNode] {.async.} =
  result = await requestJson(client.baseUrl, &"/api/collections/{encodeUrl(collection)}/records/{encodeUrl(recordId)}", HttpPatch, payload, client.token)

proc deleteRecord*(client: AdminPocketBase, collection, recordId: string): Future[JsonNode] {.async.} =
  result = await requestJson(client.baseUrl, &"/api/collections/{encodeUrl(collection)}/records/{encodeUrl(recordId)}", HttpDelete, newJNull(), client.token)

proc createBackup*(client: AdminPocketBase): Future[JsonNode] {.async.} =
  result = await requestJson(client.baseUrl, "/api/backups", HttpPost, newJObject(), client.token)
