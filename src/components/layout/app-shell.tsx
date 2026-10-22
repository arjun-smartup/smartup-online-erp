"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { 
  LogOut, 
  Search, 
  User,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthPage = pathname === "/login";

  useEffect(() => {
    if (isAuthPage) {
      setIsAuthenticated(false);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unauthenticated");
      })
      .then((data) => {
        setUserEmail(data.user?.email || "User");
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.replace("/login");
      });
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  // Login page renders without shell
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Prevent flash of unauthenticated dashboard content
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 relative">
      {/* Ambient 3D Depth Lighting Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(147,51,234,0.06),transparent_70%)] z-0" />

      {/* Persistent App Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Top Navbar Header with 3D Glass & Specular Underline */}
        <header className="h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_-1px_0_rgba(255,255,255,0.8)]">
          
          {/* Global Search Bar with 3D Inset Well */}
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, batches, fees..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/70 border border-slate-200/90 rounded-xl shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Right Header HUD */}
          <div className="flex items-center gap-3">
            {/* User Profile Badge with 3D Avatar */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/25 border-t border-purple-300/40">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-900 leading-tight">
                  {userEmail || "Administrator"}
                </div>
                <div className="text-[10px] text-purple-600 font-semibold">Administrator</div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-600 p-1.5 ml-1 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
