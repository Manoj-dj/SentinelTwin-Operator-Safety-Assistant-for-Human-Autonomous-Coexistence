/**
 * Types mirroring the actual FastAPI/Pydantic backend contracts, read
 * directly from app/schemas/*.py and app/routers/*.py. Field names are kept
 * in the backend's snake_case on purpose (see README: "do not randomly mix
 * casing") -- UI components read snake_case fields directly from these
 * types, and any view-model reshaping happens in dedicated normalizer
 * functions colocated with each api module, never ad hoc in components.
 */

// ---------------------------------------------------------------------------
// Enums (mirrors app/models/enums.py exactly)
// ---------------------------------------------------------------------------

export type MachineType = "EXCAVATOR" | "LOADER" | "DOZER" | "GRADER";

export type TruckState =
  | "NORMAL"
  | "EXCEPTION"
  | "RECOVERY"
  | "TRANSITIONING"
  | "STOPPED"
  | "SUSPENDED"
  | "OFFLINE";

export type CommunicationStatus = "OK" | "DEGRADED" | "LOST";

export type SeatbeltStatus = "FASTENED" | "UNFASTENED";

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type IncidentType =
  | "SEATBELT_VIOLATION"
  | "PROXIMITY_WARNING"
  | "STATE_TRANSITION_RISK"
  | "RECOVERY_APPROACH_RISK"
  | "COMMUNICATION_DEGRADED"
  | "VISIBILITY_HAZARD"
  | "FATIGUE_RISK"
  | "EXCESSIVE_IDLING"
  | "UNUSUAL_OPERATION_PATTERN"
  | "PREDICTED_MACHINE_FAILURE"
  | "TASK_DELAY_RISK";

export type AckStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type TrainingResourceType =
  | "VIDEO"
  | "PDF_MANUAL"
  | "SOP"
  | "CHECKLIST"
  | "QUIZ"
  | "SIMULATION_GUIDE";

export type TrainingProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type WeatherCondition = "CLEAR" | "RAIN" | "DUST" | "FOG" | "NIGHT";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ConnectivityStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

export type MachineStatus = "ACTIVE" | "IDLE" | "MAINTENANCE" | "OFFLINE";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const SAFETY_DISCLAIMER =
  "SentinelTwin is a decision-support prototype. It does not replace approved " +
  "site procedures, certified autonomous safety systems, or operator training. " +
  "It does not control or override any autonomous vehicle.";

// ---------------------------------------------------------------------------
// Operators / Machines / Trucks
// ---------------------------------------------------------------------------

export interface OperatorOut {
  id: string;
  employee_code: string;
  name: string;
  role: string;
  experience_years: number;
  experience_score: number;
  certification_level: string;
  created_at: string;
  updated_at: string;
}

export interface MachineOut {
  id: string;
  machine_code: string;
  machine_type: MachineType;
  name: string;
  site_zone: string;
  status: MachineStatus;
  assigned_operator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutonomousTruckOut {
  id: string;
  truck_code: string;
  state: TruckState;
  active_mission: boolean;
  mission_type: string | null;
  communication_status: CommunicationStatus;
  safe_to_approach_confirmed: boolean;
  nearby_condition_change: boolean;
  recovery_personnel_active: boolean;
  gps_x: number;
  gps_y: number;
  speed_kmh: number;
  heading_deg: number;
  last_state_change_at: string;
  created_at: string;
  updated_at: string;
}

export interface TruckStateEventOut {
  id: string;
  truck_id: string;
  previous_state: string;
  new_state: string;
  reason: string | null;
  communication_status: string;
  active_mission: boolean;
  created_at: string;
}

export interface DigitalTwinTruckView {
  truck: AutonomousTruckOut;
  recent_events: TruckStateEventOut[];
  safety_note: string;
}

export interface NearbyTruckItem {
  truck_id: string;
  truck_code: string;
  state: TruckState;
  distance_m: number | null;
  safety_note: string;
  telemetry_timestamp: string;
}

export interface NearbyTrucksResponse {
  operator_id: string;
  nearby_trucks: NearbyTruckItem[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Dashboard / System
// ---------------------------------------------------------------------------

export interface DashboardTaskSummary {
  id: string;
  title: string;
  task_type: string;
  site_zone: string;
  start_time: string;
  expected_duration_min: number;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface DashboardNearestTruck {
  id: string;
  truck_code: string;
  state: TruckState;
  safe_to_approach_confirmed: boolean;
  safety_note: string;
}

export interface DashboardFatigue {
  fatigue_score: number;
  fatigue_level: RiskLevel;
  break_due: boolean;
  message: string;
}

export interface DashboardEfficiencySummary {
  machine_efficiency_percentage: number;
  idle_percentage: number;
  fuel_efficiency: number;
  grade: "A" | "B" | "C" | "D";
  trend: "IMPROVING" | "DECLINING" | "STABLE";
  insight: string;
}

export interface DashboardFailureRisk {
  failure_risk_score: number;
  risk_level: RiskLevel;
}

export interface DashboardTrainingRecommendation {
  resource_id: string;
  title: string;
  reason: string;
  priority: string;
}

export interface OperatorDashboard {
  operator_id: string;
  operator_name: string;
  active_shift: { id: string; start_time: string; shift_type: string } | null;
  tasks_today: DashboardTaskSummary[];
  current_machine: { id: string; machine_code: string; name: string } | null;
  nearest_truck: DashboardNearestTruck | null;
  active_safety_alerts: IncidentOut[];
  fatigue: DashboardFatigue | null;
  efficiency_summary: DashboardEfficiencySummary | null;
  failure_risk: DashboardFailureRisk | null;
  recommended_training: DashboardTrainingRecommendation[];
  quick_actions: string[];
  disclaimer: string;
}

export interface SystemSummary {
  operators: number;
  machines: number;
  autonomous_trucks: number;
  open_incidents: number;
  telemetry_records: number;
  trucks_by_state: Record<string, number>;
  ml_models_available: Record<string, boolean>;
  gemini_configured: boolean;
  disclaimer: string;
}

export interface DemoScenarioMeta {
  name: string;
  title: string;
  description: string;
  expected_outcome: string;
}

export interface DemoScenariosResponse {
  scenarios: DemoScenarioMeta[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface TaskOut {
  id: string;
  title: string;
  task_type: string;
  machine_id: string;
  operator_id: string;
  priority: TaskPriority;
  site_zone: string;
  start_time: string;
  expected_duration_min: number;
  load_cycles_planned: number;
  weather_condition: WeatherCondition | string;
  visibility_score: number;
  queue_wait_minutes: number;
  status: TaskStatus;
  predicted_completion_time: string | null;
  delay_reason: string | null;
  actual_duration_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTodayItem {
  task: TaskOut;
  truck_arrival_window_min: number | null;
  expected_wait_min: number | null;
  predicted_completion_min: number | null;
  delay_risk: string;
  delay_reason: string | null;
  weather_visibility_note: string | null;
  summary_text: string;
}

export interface TasksTodayResponse {
  operator_id: string;
  tasks: TaskTodayItem[];
}

export interface TaskDurationPrediction {
  task_id: string;
  predicted_duration_min: number;
  confidence_range_min: [number, number];
  delay_risk: string;
  primary_reasons: string[];
  truck_arrival_impact_min: number | null;
  model_source: string;
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export interface TelemetryIn {
  operator_id?: string | null;
  machine_id: string;
  machine_type?: string;
  engine_hours?: number;
  engine_running?: boolean;
  machine_speed_kmh?: number;
  fuel_used_l?: number;
  fuel_rate_lph?: number;
  load_cycles?: number;
  planned_load_cycles?: number;
  idling_time_min?: number;
  active_engine_time_min?: number;
  seatbelt_status?: SeatbeltStatus;
  engine_temperature_c?: number;
  coolant_temperature_c?: number;
  oil_pressure_kpa?: number;
  hydraulic_temperature_c?: number;
  vibration_rms?: number;
  fault_code_count?: number;
  harsh_braking_count?: number;
  harsh_acceleration_count?: number;
  gps_x?: number;
  gps_y?: number;
  weather_condition?: WeatherCondition | string;
  visibility_score?: number;
  site_congestion_level?: number;
  shift_id?: string | null;
  time_since_shift_start_min?: number;
  break_minutes_today?: number;
  self_reported_fatigue?: number | null;
  nearest_truck_id?: string | null;
  truck_distance_m?: number | null;
  truck_speed_kmh?: number | null;
  truck_heading_deg?: number | null;
  truck_state?: TruckState | string | null;
  active_mission?: boolean;
  mission_type?: string | null;
  communication_status?: CommunicationStatus | string;
  safe_to_approach_confirmed?: boolean;
  nearby_condition_change?: boolean;
  recovery_personnel_active?: boolean;
  truck_gps_x?: number | null;
  truck_gps_y?: number | null;
}

export interface TelemetryOut extends Required<Omit<TelemetryIn, "operator_id" | "shift_id" | "self_reported_fatigue" | "nearest_truck_id" | "truck_distance_m" | "truck_speed_kmh" | "truck_heading_deg" | "truck_state" | "mission_type" | "truck_gps_x" | "truck_gps_y">> {
  operator_id: string | null;
  shift_id: string | null;
  self_reported_fatigue: number | null;
  nearest_truck_id: string | null;
  truck_distance_m: number | null;
  truck_speed_kmh: number | null;
  truck_heading_deg: number | null;
  truck_state: string | null;
  mission_type: string | null;
  truck_gps_x: number | null;
  truck_gps_y: number | null;
  id: string;
  timestamp: string;
  state_transition_risk_score: number;
  collision_interaction_risk_score: number;
  fatigue_score: number;
  machine_efficiency_percentage: number;
  idle_percentage: number;
  fuel_efficiency: number;
  anomaly_label: "NORMAL" | "ANOMALY" | string;
  anomaly_score: number;
  failure_risk_score: number;
  task_duration_actual_min: number | null;
  safety_alert_triggered: boolean;
  incident_type: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Safety / Collision
// ---------------------------------------------------------------------------

export interface TransitionRiskRequest {
  machine_id?: string | null;
  operator_id?: string | null;
  truck_id: string;
  distance_m: number;
  visibility_score?: number;
  seatbelt_status?: SeatbeltStatus;
  fatigue_score?: number | null;
}

export interface SafetyEvaluationRequest {
  machine_id: string;
  operator_id: string;
  truck_id?: string | null;
  seatbelt_status?: SeatbeltStatus;
  engine_running?: boolean;
  machine_moving?: boolean;
  distance_to_truck_m?: number | null;
  visibility_score?: number;
  fatigue_score?: number | null;
}

export interface RiskEvaluationResult {
  risk_score: number;
  risk_level: RiskLevel | string;
  truck_id: string | null;
  truck_state: string | null;
  active_mission: boolean | null;
  nearby_condition_change: boolean | null;
  distance_m: number | null;
  contributing_factors: string[];
  recommended_action: string;
  auto_incident_created: boolean;
  incident_id: string | null;
  disclaimer: string;
}

export interface CollisionEvaluationRequest {
  machine_id: string;
  operator_id?: string | null;
  truck_id: string;
  distance_m: number;
  machine_speed_kmh?: number;
  truck_speed_kmh?: number;
  closing?: boolean;
  visibility_score?: number;
  site_congestion_level?: number;
  blind_spot?: boolean;
  fatigue_score?: number | null;
  seatbelt_status?: SeatbeltStatus;
}

export interface CollisionEvaluationResult {
  collision_risk_score: number;
  severity: RiskLevel | string;
  time_to_proximity_sec: number | null;
  factors: string[];
  recommended_action: string;
  auto_incident_created: boolean;
  incident_id: string | null;
  disclaimer: string;
}

export interface OperatorSafetySummary {
  operator_id: string;
  open_incidents: number;
  highest_open_severity: string | null;
  recent_incident_types: string[];
  current_risk_level: string | null;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export interface IncidentOut {
  id: string;
  timestamp: string;
  machine_id: string | null;
  operator_id: string | null;
  truck_id: string | null;
  incident_type: IncidentType;
  severity: Severity;
  risk_score: number;
  context: Record<string, unknown>;
  state_before: string | null;
  state_after: string | null;
  recommended_action: string;
  ack_status: AckStatus;
  acknowledged_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface IncidentListResponse {
  items: IncidentOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface IncidentAcknowledgeRequest {
  notes?: string | null;
  resolved?: boolean;
}

// ---------------------------------------------------------------------------
// Edge
// ---------------------------------------------------------------------------

export interface EdgeTelemetryEvent {
  machine_id: string;
  operator_id?: string | null;
  connectivity_status?: ConnectivityStatus;
  seatbelt_status?: SeatbeltStatus;
  engine_running?: boolean;
  machine_moving?: boolean;
  truck_id?: string | null;
  truck_distance_m?: number | null;
  truck_state?: string | null;
  active_mission?: boolean;
  nearby_condition_change?: boolean;
  safe_to_approach_confirmed?: boolean;
  communication_status?: string;
  continuous_work_hours?: number | null;
  hours_since_last_break?: number | null;
  engine_temperature_c?: number | null;
  oil_pressure_kpa?: number | null;
  coolant_temperature_c?: number | null;
  hydraulic_temperature_c?: number | null;
  vibration_rms?: number | null;
  fault_code_count?: number | null;
  visibility_score?: number;
}

export interface EdgeAlert {
  alert_type: string;
  severity: string;
  message: string;
}

export interface EdgeEvaluationResult {
  connectivity_status: ConnectivityStatus;
  alerts: EdgeAlert[];
  processed_locally: boolean;
  synced_to_backend: boolean;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Analytics / ML
// ---------------------------------------------------------------------------

export interface EfficiencyResult {
  entity_id: string;
  entity_type: "machine" | "operator";
  productive_time_min: number;
  machine_efficiency_percentage: number;
  idle_percentage: number;
  fuel_efficiency: number;
  cycle_efficiency: number;
  baseline_comparison_pct: number;
  trend: "IMPROVING" | "DECLINING" | "STABLE";
  grade: "A" | "B" | "C" | "D";
  insight: string;
}

export interface BehaviorAnalysisResult {
  operator_id: string;
  anomaly_events_last_7d: number;
  patterns_detected: string[];
  recommended_training: string[];
  disclaimer: string;
}

export interface AnomalyScoreRequest {
  machine_id: string;
  fuel_used_per_hour: number;
  load_cycles_per_hour: number;
  idle_minutes_per_hour: number;
  idle_percentage: number;
  engine_temperature_c: number;
  hydraulic_temperature_c: number;
  vibration_rms: number;
  harsh_braking_count: number;
  harsh_acceleration_count: number;
  seatbelt_violations_count: number;
  time_since_shift_started_min: number;
  operator_fatigue_score: number;
  visibility_score: number;
  distance_to_nearest_truck_m: number | null;
  safety_risk_score: number;
}

export interface AnomalyScoreResult {
  machine_id: string;
  anomaly_label: "NORMAL" | "ANOMALY" | string;
  anomaly_score: number;
  contributing_factors: string[];
  recommended_action: string;
  model_source: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Fatigue / Breaks
// ---------------------------------------------------------------------------

export interface FatigueEvaluationRequest {
  operator_id: string;
  continuous_work_hours: number;
  hours_since_last_break: number;
  harsh_event_count?: number;
  productivity_decline_pct?: number;
  is_night_shift?: boolean;
  self_reported_fatigue?: number | null;
  recent_high_risk_alerts?: number;
}

export interface FatigueEvaluationResult {
  operator_id: string;
  fatigue_score: number;
  fatigue_level: RiskLevel | string;
  contributing_factors: string[];
  recommended_break_minutes: number;
  break_due: boolean;
  manager_escalation: boolean;
  message: string;
  disclaimer: string;
}

export interface BreakCreateRequest {
  shift_id: string;
  operator_id: string;
  break_type?: string;
  duration_min?: number | null;
}

export interface BreakOut {
  id: string;
  shift_id: string;
  operator_id: string;
  start_time: string;
  end_time: string | null;
  duration_min: number | null;
  break_type: string;
  created_at: string;
}

export interface BreaksTodayResponse {
  operator_id: string;
  breaks: BreakOut[];
  total_break_minutes_today: number;
}

// ---------------------------------------------------------------------------
// Machine health / maintenance
// ---------------------------------------------------------------------------

export interface MachineHealthInput {
  machine_id: string;
  engine_hours: number;
  engine_temperature_c: number;
  oil_pressure_kpa: number;
  coolant_temperature_c: number;
  hydraulic_temperature_c: number;
  vibration_rms: number;
  fault_code_count: number;
  fuel_consumption_change_pct?: number;
  maintenance_overdue_days?: number;
  recent_anomaly_count?: number;
}

export interface MachineHealthResult {
  machine_id: string;
  failure_risk_score: number;
  risk_level: RiskLevel | string;
  likely_subsystem: string;
  contributing_factors: string[];
  recommended_action: string;
  maintenance_priority: string;
  model_source: string;
  disclaimer: string;
}

export interface MaintenanceRecommendationOut {
  id: string;
  machine_id: string;
  health_record_id: string | null;
  priority: string;
  subsystem: string;
  recommendation: string;
  status: string;
  created_at: string;
}

export interface MaintenanceRecommendationsResponse {
  items: MaintenanceRecommendationOut[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Training / Knowledge base
// ---------------------------------------------------------------------------

export interface TrainingResourceOut {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: TrainingResourceType;
  url: string;
  estimated_duration_min: number;
  skill_tags: string[];
  machine_type_relevance: string[];
  is_required: boolean;
  created_at: string;
}

export interface TrainingResourcesResponse {
  items: TrainingResourceOut[];
}

export interface TrainingRecommendation {
  resource: TrainingResourceOut;
  reason: string;
  priority: string;
}

export interface TrainingRecommendationsResponse {
  operator_id: string;
  recommendations: TrainingRecommendation[];
}

export interface TrainingProgressUpdateRequest {
  operator_id: string;
  status?: TrainingProgressStatus | string;
  quiz_score?: number | null;
}

export interface TrainingProgressOut {
  id: string;
  operator_id: string;
  resource_id: string;
  status: string;
  quiz_score: number | null;
  completed_at: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgressResponse {
  operator_id: string;
  progress: TrainingProgressOut[];
}

export interface KnowledgeBaseSearchResultItem {
  document: { id: string; title: string; content: string; category: string };
  relevance_score: number;
  snippet: string;
}

export interface KnowledgeBaseSearchResponse {
  query: string;
  results: KnowledgeBaseSearchResultItem[];
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatQueryRequest {
  operator_id: string;
  machine_id?: string | null;
  truck_id?: string | null;
  message: string;
  conversation_id?: string | null;
}

export interface ChatSource {
  type: string;
  id: string;
  title: string;
}

export interface ChatQueryResponse {
  conversation_id: string;
  answer: string;
  sources: ChatSource[];
  metrics_referenced: Record<string, unknown>;
  warnings: string[];
  used_gemini: boolean;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export type DemoScenarioName =
  | "normal_loading_cycle"
  | "seatbelt_violation"
  | "state_transition_risk"
  | "fatigue_break_alert"
  | "machine_health_risk"
  | "low_visibility_collision_risk";

export interface ScenarioResult {
  scenario_name: string;
  description: string;
  steps: Array<Record<string, unknown>>;
  resulting_incidents: Array<Record<string, unknown>>;
  final_risk_summary: Record<string, unknown>;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// WebSocket payloads (server -> client, best-effort typed; validated at
// runtime in api/websocket.ts since the backend does not version these)
// ---------------------------------------------------------------------------

export interface TelemetryUpdateEvent {
  event: "telemetry_update";
  machine_id: string;
  operator_id: string | null;
  safety_alert_triggered: boolean;
  state_transition_risk_score: number;
  failure_risk_score: number;
  anomaly_label: string;
}

export interface SimulationScenarioEvent {
  event: "simulation_scenario";
  scenario_name: string;
  timestamp: string;
  final_risk_summary: Record<string, unknown>;
  incident_count: number;
}

export type WebSocketServerEvent = TelemetryUpdateEvent | SimulationScenarioEvent;
