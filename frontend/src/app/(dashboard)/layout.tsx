"use client";

import { useState } from "react";
import SideBar from "@/components/layout/SideBar";
import TopBar from "@/components/layout/TopBar";
import { NotificationsProvider } from "@/providers/NotificationsContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NotificationsProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SideBar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onMobileMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
}