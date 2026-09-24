import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LiveSafetyPage = lazy(() => import("@/pages/LiveSafetyPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const IncidentsPage = lazy(() => import("@/pages/IncidentsPage"));
const TrainingPage = lazy(() => import("@/pages/TrainingPage"));
const TrainingResourcePage = lazy(() => import("@/pages/TrainingResourcePage"));
const MachineHealthPage = lazy(() => import("@/pages/MachineHealthPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path={ROUTES.dashboard} element={<DashboardPage />} />
      <Route path={ROUTES.liveSafety} element={<LiveSafetyPage />} />
      <Route path={ROUTES.tasks} element={<TasksPage />} />
      <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
      <Route path={ROUTES.incidents} element={<IncidentsPage />} />
      <Route path={ROUTES.training} element={<TrainingPage />} />
      <Route path="/training/resource/:resourceId" element={<TrainingResourcePage />} />
      <Route path={ROUTES.machineHealth} element={<MachineHealthPage />} />
      <Route path={ROUTES.chat} element={<ChatPage />} />
      <Route path={ROUTES.settings} element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
