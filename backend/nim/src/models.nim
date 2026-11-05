import std/json

## Domain payloads exchanged between Wails, Nim and PocketBase.
type
  ExperimentPoint* = object
    x*: float
    y*: float

  ExperimentData* = object
    projectId*: string
    xLabel*: string
    yLabel*: string
    points*: seq[ExperimentPoint]
    recordedAt*: string

  RoadmapTask* = object
    id*: string
    projectId*: string
    title*: string
    stage*: string
    priority*: string
    deadline*: string
    assignee*: string

proc parseExperimentData*(body: JsonNode): ExperimentData =
  result.projectId = body{"projectId"}.getStr("default-project")
  result.xLabel = body{"xLabel"}.getStr("X")
  result.yLabel = body{"yLabel"}.getStr("Y")
  result.recordedAt = body{"recordedAt"}.getStr()
  for item in body{"points"}.getElems():
    result.points.add ExperimentPoint(x: item{"x"}.getFloat(), y: item{"y"}.getFloat())

proc toPocketBaseJson*(data: ExperimentData): JsonNode =
  var points = newJArray()
  for point in data.points:
    points.add(%*{"x": point.x, "y": point.y})
  %*{
    "project": data.projectId,
    "x_label": data.xLabel,
    "y_label": data.yLabel,
    "points": points,
    "recorded_at": data.recordedAt
  }

proc parseRoadmapTask*(body: JsonNode): RoadmapTask =
  result.id = body{"id"}.getStr()
  result.projectId = body{"projectId"}.getStr("default-project")
  result.title = body{"title"}.getStr()
  result.stage = body{"stage"}.getStr()
  result.priority = body{"priority"}.getStr()
  result.deadline = body{"deadline"}.getStr()
  result.assignee = body{"assignee"}.getStr()

proc toPocketBaseJson*(task: RoadmapTask): JsonNode =
  %*{
    "project": task.projectId,
    "title": task.title,
    "stage": task.stage,
    "priority": task.priority,
    "deadline": task.deadline,
    "assignee": task.assignee
  }
