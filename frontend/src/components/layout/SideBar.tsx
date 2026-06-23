"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, X, ChevronDown } from "lucide-react";

import { adminPanelLinks } from "@/config/links";
import { useSession } from "@/lib/use-session";

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

export default function SideBar({ collapsed, mobileOpen, setMobileOpen }: Props) {
  const pathname = usePathname();
  const user = useSession();

  const links = adminPanelLinks.filter((l) =>
    l.roles.includes(user.role as any)
  );

  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    const activeSections = links
      .filter((s) => s.items?.some((i: any) => pathname.startsWith(i.origin)))
      .map((s) => s.origin);
    setOpenSections(activeSections);
  }, [pathname]);

  function toggleSection(origin: string) {
    setOpenSections((prev) =>
      prev.includes(origin)
        ? prev.filter((o) => o !== origin)
        : [...prev, origin]
    );
  }

  const base = "flex items-center h-11 rounded-xl px-3 transition";
  const active = "bg-primary/10 text-primary font-medium";
  const inactive = "text-gray-600 hover:bg-gray-100";

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ✅ Fixed: no dynamic Tailwind classes — use explicit conditionals */}
      <aside
        className={`
          fixed lg:static z-50 h-full bg-white border-r border-gray-200
          flex flex-col transition-all duration-300
          ${collapsed ? "lg:w-20" : "lg:w-[300px]"}
          w-[300px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/assets/restro_logo.jpg" className="h-8 w-8 shrink-0" alt="Logo" />
            {!collapsed && (
              <span className="font-semibold truncate">Restaurant MS</span>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SCROLLABLE NAV */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">

          {/* DASHBOARD */}
          <Link
            href="/dashboard"
            className={`${base} ${
              pathname === "/dashboard" ? active : inactive
            } ${collapsed ? "justify-center px-0" : "gap-3"}`}
          >
            <HomeIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </Link>

          {/* LINKS */}
          {links.map((section, i) => {
            const Icon = section.icon;
            const hasChildren = (section.items?.length ?? 0) > 0;
            const isActive = pathname.startsWith(section.origin);
            const isOpen = openSections.includes(section.origin);

            return (
              <div key={i} className="space-y-1">
                {!hasChildren ? (
                  <Link
                    href={section.origin}
                    className={`${base} ${isActive ? active : inactive} ${
                      collapsed ? "justify-center px-0" : "gap-3"
                    }`}
                    title={collapsed ? section.title : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{section.title}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => !collapsed && toggleSection(section.origin)}
                      title={collapsed ? section.title : undefined}
                      className={`w-full ${base} ${isActive ? active : inactive} ${
                        collapsed ? "justify-center px-0" : "gap-3"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{section.title}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {!collapsed && isOpen && (
                      <div className="space-y-1">
                        {section.items?.map((item: any, idx: number) => {
                          const subActive = pathname.startsWith(item.origin);
                          return (
                            <Link
                              key={idx}
                              href={item.origin}
                              className={`ml-8 flex items-center gap-2 py-2 text-sm rounded-lg transition ${
                                subActive
                                  ? "text-primary font-medium"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  subActive ? "bg-primary" : "bg-gray-300"
                                }`}
                              />
                              {item.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}