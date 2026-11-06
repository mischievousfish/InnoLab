import std/[asyncdispatch, base64, httpclient, json, strutils, strformat, times, uri]

const defaultPocketBaseUrl = "http://127.0.0.1:8090"

type PocketBaseClient* = object
  baseUrl*: string
  token*: string

proc newPocketBaseClient*(baseUrl = defaultPocketBaseUrl, token = ""): PocketBaseClient =
  result.baseUrl = baseUrl.strip(chars={'/'})
  result.token = token

proc list*(client: PocketBaseClient, collection: string, filter = ""): Future[JsonNode] {.async.} =
  let http = newAsyncHttpClient()
  var headers = newHttpHeaders()
  if client.token.len > 0:
    headers["Authorization"] = client.token
  var url = &"{client.baseUrl}/api/collections/{collection}/records?perPage=500"
  if filter.len > 0:
    url.add("&filter=" & encodeUrl(filter))
  let response = await http.getContent(url, headers)
  http.close()
  result = parseJson(response)

proc create*(client: PocketBaseClient, collection: string, body: JsonNode): Future[JsonNode] {.async.} =
  let http = newAsyncHttpClient()
  var headers = newHttpHeaders({"Content-Type": "application/json"})
  if client.token.len > 0:
    headers["Authorization"] = client.token
  let url = &"{client.baseUrl}/api/collections/{collection}/records"
  let response = await http.postContent(url, $body, headers)
  http.close()
  result = parseJson(response)

proc createWithFiles*(client: PocketBaseClient, collection: string, body, files: JsonNode): Future[JsonNode] {.async.} =
  let boundary = "----InnoLab" & $int(epochTime() * 1_000_000)
  var multipart = ""
  for key, value in body:
    let fieldValue = if value.kind == JString: value.getStr() else: $value
    multipart.add(&"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{fieldValue}\r\n")
  for file in files.getElems():
    let field = file{"field"}.getStr()
    let filename = file{"name"}.getStr().replace("\"", "").replace("\r", "").replace("\n", "")
    let contentType = file{"contentType"}.getStr("application/octet-stream")
    let content = decode(file{"base64"}.getStr())
    multipart.add(&"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{filename}\"\r\nContent-Type: {contentType}\r\n\r\n")
    multipart.add(content)
    multipart.add("\r\n")
  multipart.add(&"--{boundary}--\r\n")

  let http = newAsyncHttpClient()
  var headers = newHttpHeaders({"Content-Type": &"multipart/form-data; boundary={boundary}"})
  if client.token.len > 0:
    headers["Authorization"] = client.token
  let url = &"{client.baseUrl}/api/collections/{collection}/records"
  let response = await http.postContent(url, multipart, headers)
  http.close()
  result = parseJson(response)
