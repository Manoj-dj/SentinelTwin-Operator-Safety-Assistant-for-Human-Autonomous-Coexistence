/** Centralized React Query key factory -- avoids ad hoc key arrays scattered across components. */
export const queryKeys = {
  systemSummary: () => ["system", "summary"] as const,
  demoScenarios: () => ["system", "demo-scenarios"] as const,

  operators: (page: number) => ["operators", page] as const,
  operator: (id: string) => ["operators", id] as const,

  machines: (page: number) => ["machines", page] as const,
  machine: (id: string) => ["machines", id] as const,

  trucks: (page: number) => ["trucks", page] as const,
  truck: (id: string) => ["trucks", id] as const,

  dashboard: (operatorId: string) => ["dashboard", operatorId] as const,

  tasks: (filters: Record<string, unknown>) => ["tasks", filters] as const,
  tasksToday: (operatorId: string) => ["tasks", "today", operatorId] as const,
  taskPrediction: (taskId: string) => ["tasks", "predict", taskId] as const,

  digitalTwinTruck: (truckId: string) => ["digital-twin", "truck", truckId] as const,
  nearbyTrucks: (operatorId: string) => ["digital-twin", "nearby", operatorId] as const,

  incidents: (filters: Record<string, unknown>) => ["incidents", filters] as const,
  incidentsForOperator: (operatorId: string) => ["incidents", "operator", operatorId] as const,
  incident: (id: string) => ["incidents", id] as const,

  machineEfficiency: (machineId: string) => ["analytics", "efficiency", "machine", machineId] as const,
  operatorEfficiency: (operatorId: string) => ["analytics", "efficiency", "operator", operatorId] as const,
  operatorBehavior: (operatorId: string) => ["analytics", "behavior", operatorId] as const,

  operatorFatigue: (operatorId: string) => ["fatigue", operatorId] as const,
  breaksToday: (operatorId: string) => ["breaks", "today", operatorId] as const,

  machineHealthRisk: (machineId: string) => ["health", "risk", machineId] as const,
  maintenanceRecommendations: (machineId?: string) => ["maintenance", machineId ?? "all"] as const,

  trainingResources: (category?: string) => ["training", "resources", category ?? "all"] as const,
  trainingResource: (id: string) => ["training", "resources", "detail", id] as const,
  trainingRecommendations: (operatorId: string) => ["training", "recommendations", operatorId] as const,
  trainingProgress: (operatorId: string) => ["training", "progress", operatorId] as const,

  knowledgeBaseSearch: (query: string) => ["knowledge-base", "search", query] as const,

  operatorSafetySummary: (operatorId: string) => ["safety", "summary", operatorId] as const,
};
