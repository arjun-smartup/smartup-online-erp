"use client";

import React, { useState, useEffect } from "react";
import { Globe, Clock, Search, Bell } from "lucide-react";
import { ONLINE_DIVISIONS, SUPPORTED_TIMEZONES } from "@/lib/constants/divisions";
import { ApiStatusBadge } from "./api-status-badge";

export function AppNavbar() {
  const [selectedDivision, setSelectedDivision] = useState(ONLINE_DIVISIONS[0].id);
  const [selectedTz, setSelectedTz] = useState(SUPPORTED_TIMEZONES[0].code);
  const [currentTime, setCurrentTime] = useState("");
  const [user, setUser] = useState<{ email: string; fullName: string } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const activeTz = SUPPORTED_TIMEZONES.find((t) => t.code === selectedTz);
      if (activeTz) {
        try {
          const formatted = new Intl.DateTimeFormat("en-US", {
            timeZone: activeTz.iana,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }).format(new Date());
          setCurrentTime(formatted);
        } catch {
          setCurrentTime(new Date().toLocaleTimeString());
        }
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [selectedTz]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-4">
      {/* Left: Division Campus Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value as any)}
            className="bg-transparent text-slate-800 font-medium outline-none cursor-pointer text-xs"
          >
            {ONLINE_DIVISIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedTz}
            onChange={(e) => setSelectedTz(e.target.value)}
            className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer text-xs"
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz.code} value={tz.code}>
                {tz.code}
              </option>
            ))}
          </select>
          <span className="font-mono text-slate-900">{currentTime}</span>
        </div>
      </div>

      {/* Right: API Health Status & Profile */}
      <div className="flex items-center gap-3">
        <ApiStatusBadge />

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            {user?.email ? user.email.slice(0, 1).toUpperCase() : "U"}
          </div>
          <span className="text-xs text-slate-700 font-medium hidden md:inline truncate max-w-[140px]">
            {user?.email || "Signed In"}
          </span>
        </div>
      </div>
    </header>
  );
}
