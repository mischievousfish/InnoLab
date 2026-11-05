import std/[asynchttpserver, asyncdispatch, json, os, strformat]
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

  await req.respond(Http404, $(%*{"message": "Endpoint không tồn tại."}), newHttpHeaders({"Content-Type": "application/json"}))

proc main() {.async.} =
  var server = newAsyncHttpServer()
  echo &"InnoLab Nim service listening on http://127.0.0.1:{servicePort}"
  await server.serve(Port(servicePort), handleRequest)

waitFor main()
