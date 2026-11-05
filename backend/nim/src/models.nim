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

  InventoryItem* = object
    id*: string
    projectId*: string
    name*: string
    quantity*: float
    unit*: string
    location*: string
    minimumQuantity*: float

  BudgetExpense* = object
    id*: string
    projectId*: string
    description*: string
    amount*: float
    date*: string
    invoiceName*: string

  MethodologyCheck* = object
    projectId*: string
    title*: string
    hypothesis*: string
    resources*: string

  RiskAssessment* = object
    projectId*: string
    resources*: string
    temperature*: float
    voltage*: float

  Reference* = object
    id*: string
    projectId*: string
    title*: string
    authors*: string
    year*: int
    doi*: string
    source*: string

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

proc parseInventoryItem*(body: JsonNode): InventoryItem =
  result.id = body{"id"}.getStr()
  result.projectId = body{"projectId"}.getStr("default-project")
  result.name = body{"name"}.getStr()
  result.quantity = body{"quantity"}.getFloat()
  result.unit = body{"unit"}.getStr()
  result.location = body{"location"}.getStr()
  result.minimumQuantity = body{"minimumQuantity"}.getFloat()

proc toPocketBaseJson*(item: InventoryItem): JsonNode =
  %*{
    "project": item.projectId,
    "name": item.name,
    "quantity": item.quantity,
    "unit": item.unit,
    "location": item.location,
    "minimum_quantity": item.minimumQuantity
  }

proc parseBudgetExpense*(body: JsonNode): BudgetExpense =
  result.id = body{"id"}.getStr()
  result.projectId = body{"projectId"}.getStr("default-project")
  result.description = body{"description"}.getStr()
  result.amount = body{"amount"}.getFloat()
  result.date = body{"date"}.getStr()
  result.invoiceName = body{"invoiceName"}.getStr()

proc toPocketBaseJson*(expense: BudgetExpense): JsonNode =
  %*{
    "project": expense.projectId,
    "description": expense.description,
    "amount": expense.amount,
    "purchase_date": expense.date,
    "invoice_name": expense.invoiceName
  }

proc parseMethodologyCheck*(body: JsonNode): MethodologyCheck =
  result.projectId = body{"projectId"}.getStr("default-project")
  result.title = body{"title"}.getStr()
  result.hypothesis = body{"hypothesis"}.getStr()
  result.resources = body{"resources"}.getStr()

proc parseRiskAssessment*(body: JsonNode): RiskAssessment =
  result.projectId = body{"projectId"}.getStr("default-project")
  result.resources = body{"resources"}.getStr()
  result.temperature = body{"temperature"}.getFloat()
  result.voltage = body{"voltage"}.getFloat()

proc parseReference*(body: JsonNode): Reference =
  result.id = body{"id"}.getStr()
  result.projectId = body{"projectId"}.getStr("default-project")
  result.title = body{"title"}.getStr()
  result.authors = body{"authors"}.getStr()
  result.year = body{"year"}.getInt()
  result.doi = body{"doi"}.getStr()
  result.source = body{"source"}.getStr()

proc toPocketBaseJson*(reference: Reference): JsonNode =
  %*{"project": reference.projectId, "title": reference.title, "authors": reference.authors,
      "year": reference.year, "doi": reference.doi, "source": reference.source}
