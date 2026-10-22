"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  AlertCircle as AlertSquare,
  Calendar,
  FileCheck2,
  IndianRupee,
  PhoneCall,
  Landmark,
  FileText,
  BarChart3,
  Trophy,
  Briefcase,
  FileSpreadsheet,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers
} from "lucide-react";
import { SMARTUP_NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  AlertSquare,
  Calendar,
  FileCheck2,
  IndianRupee,
  PhoneCall,
  Landmark,
  FileText,
  BarChart3,
  Trophy,
  Briefcase,
  FileSpreadsheet,
  Activity,
};

export function AppSidebar() {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    Students: true,
  });

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-slate-200/90 bg-white/95 backdrop-blur-md flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto select-none shadow-[1px_0_4px_rgba(0,0,0,0.01)]">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 group">
            {/* 3D Purple Logo Icon */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-500/30 border-t border-purple-400/50">
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                SMART UP
              </span>
              <span className="text-[10px] font-semibold text-purple-600">Online ERP</span>
            </div>
          </Link>

          <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {SMARTUP_NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.iconName] || Layers;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openSubMenus[item.title];

            const isMainActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <div key={item.title} className="space-y-0.5">
                {hasChildren ? (
                  <button
                    onClick={() => toggleSubMenu(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                      isMainActive
                        ? "bg-gradient-to-b from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/25 border-t border-purple-400/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isMainActive ? "text-white" : "text-slate-400 group-hover:text-purple-600"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        isOpen ? "rotate-180" : "",
                        isMainActive ? "text-white/80" : "text-slate-400"
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                      isMainActive
                        ? "bg-gradient-to-b from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/25 border-t border-purple-400/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isMainActive ? "text-white" : "text-slate-400 group-hover:text-purple-600"
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                )}

                {/* Submenu items if opened */}
                {hasChildren && isOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                            isChildActive
                              ? "bg-purple-100 text-purple-900 font-bold"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          )}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User/System Tag */}
      <div className="p-3 m-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Frappe Cloud</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
            LIVE
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">smartupedu.frappe.cloud</div>
      </div>
    </aside>
  );
}
