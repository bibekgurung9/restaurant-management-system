"use client";

import React, { useContext } from "react";
import { Menu, ChevronDownIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { SessionContext } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { adminLogout } from "@/server-actions/auth.actions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";

// ✅ Map route prefixes → display titles
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/menu": "Menu",
  "/tables": "Tables",
  "/orders": "Orders",
  "/billings": "Billings",
  "/customers": "Customers",
  "/sales": "Sales",
  "/settings": "Settings",
  "/inventory": "Inventory",
};

function getTitle(pathname: string): string {
  const match = Object.entries(ROUTE_TITLES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  if (match) return match[1];
  // Fallback: capitalize first path segment
  const segment = pathname.split("/")[1];
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard";
}

type Props = {
  onToggleSidebar: () => void;
  onMobileMenu: () => void;
};

export default function TopBar({ onToggleSidebar, onMobileMenu }: Props) {
  const user = useContext(SessionContext);
  const pathname = usePathname();
  const { replace } = useRouter();

  async function logout() {
    await adminLogout();
    toast.success("Logged out");
    replace("/auth/login");
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenu}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-xl hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold">{getTitle(pathname)}</span>
      </div>

      {/* RIGHT */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.logo} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {/* ✅ Show user name on desktop */}
            {user?.name && (
              <span className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate">
                {user.name}
              </span>
            )}
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">

          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="flex flex-col items-start">
              <div>{user?.name}</div>

              {user?.email && (
                <div className="text-xs text-gray-500 font-normal">
                  {user.email}
                </div>
              )}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={logout}>
            Logout
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}