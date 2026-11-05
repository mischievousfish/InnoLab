import std/[asyncdispatch, httpclient, json, strutils, strformat, uri]

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
