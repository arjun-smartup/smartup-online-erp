"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { 
  LogOut, 
  Search, 
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import { AuthUser } from "@/lib/types/auth";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRestrictedNotice, setShowRestrictedNotice] = useState(false);

  const isAuthPage = pathname === "/login";

  useEffect(() => {
    const accessQuery = searchParams.get("access");
    if (accessQuery === "restricted_fees" || accessQuery === "restricted_settings") {
      setShowRestrictedNotice(true);
    }
  }, [searchParams]);

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
        setAuthUser(data.user || null);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.replace("/login");
      });
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
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

  const isDirector = authUser?.primaryRole === "Director";
  const userInitials = authUser?.fullName
    ? authUser.fullName.charAt(0).toUpperCase()
    : (authUser?.email ? authUser.email.charAt(0).toUpperCase() : "U");

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 relative">
      {/* Ambient 3D Depth Lighting Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(147,51,234,0.06),transparent_70%)] z-0" />

      {/* Persistent App Sidebar with Active User Role */}
      <AppSidebar user={authUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Top Navbar Header with 3D Glass & Specular Underline */}
        <header className="h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_-1px_0_rgba(255,255,255,0.8)]">
          
          {/* Global Search Bar with 3D Inset Well */}
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, batches, admissions..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/70 border border-slate-200/90 rounded-xl shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Right Header HUD */}
          <div className="flex items-center gap-3">
            {/* User Profile Badge with 3D Avatar and Role Indicator */}
            <div className="flex items-center gap-2.5 text-xs">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md border-t ${
                  isDirector 
                    ? "bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25 border-purple-300/40" 
                    : "bg-gradient-to-b from-blue-500 via-indigo-600 to-indigo-700 shadow-indigo-500/25 border-indigo-300/40"
                }`}
              >
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-900 leading-tight">
                  {authUser?.fullName || authUser?.email || "User"}
                </div>
                {isDirector ? (
                  <div className="flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200/80 px-1.5 py-0.2 rounded-md mt-0.5 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>Director</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md mt-0.5 shadow-2xs">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    <span>Sales Counselor</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 ml-1 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 flex items-center justify-center"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-rose-600 rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>

          </div>
        </header>

        {/* Access Restriction Notification Banner */}
        {showRestrictedNotice && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between text-amber-900 text-xs shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold">Access Restricted:</span> The Fees & Collections financial module requires Director role permissions. You have been redirected to the Students module.
              </div>
            </div>
            <button
              onClick={() => setShowRestrictedNotice(false)}
              className="text-amber-500 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
