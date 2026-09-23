import React, { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SafetyBanner } from "./SafetyBanner";
import { useSafetyAlerts } from "@/hooks/useSafetyAlerts";
import { useBootstrapSelection } from "@/hooks/useBootstrapSelection";
import { ChatDrawer } from "@/components/copilot/ChatDrawer";
import { CopilotLauncher } from "@/components/copilot/CopilotLauncher";
import { DemoModeBadge } from "@/components/demo/DemoModeBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Single global WebSocket subscription for safety-alerts -- mounted once here.
  useSafetyAlerts();
  useBootstrapSelection();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <SafetyBanner />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
        </main>
      </div>
      <CopilotLauncher />
      <ChatDrawer />
      <DemoModeBadge />
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-8 w-1/3" />
      <LoadingSkeleton className="h-40 w-full" />
      <LoadingSkeleton className="h-64 w-full" />
    </div>
  );
}
