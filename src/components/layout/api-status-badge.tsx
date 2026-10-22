"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { frappeClient } from "@/lib/api/frappe-client";
import { FrappeHealthCheckResponse } from "@/lib/types/frappe";

export function ApiStatusBadge() {
  const [status, setStatus] = useState<FrappeHealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await frappeClient.checkHealth();
      setStatus(res);
    } catch {
      setStatus({
        connected: false,
        url: "error",
        authenticated: false,
        error: "Failed to fetch status",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 45000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500">
        <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
        <span>Linking...</span>
      </div>
    );
  }

  if (status?.connected && status.authenticated) {
    return (
      <div
        onClick={checkConnection}
        title={`Frappe Connected: ${status.url} (${status.latencyMs}ms)`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 cursor-pointer hover:bg-emerald-100/70 transition-all select-none"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="font-medium">Frappe Linked</span>
        {status.latencyMs && (
          <span className="text-[10px] text-emerald-600/80">
            {status.latencyMs}ms
          </span>
        )}
      </div>
    );
  }

  if (status?.connected && !status.authenticated) {
    return (
      <div
        onClick={checkConnection}
        title="Frappe server reached, but API Key / Secret is invalid or unauthorized"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 cursor-pointer hover:bg-amber-100/70 transition-all select-none"
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-medium">Auth Needed</span>
      </div>
    );
  }

  return (
    <div
      onClick={checkConnection}
      title={status?.error || "Could not reach Frappe Cloud"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-700 cursor-pointer hover:bg-rose-100/70 transition-all select-none"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      <span className="font-medium">Disconnected</span>
      <RefreshCw className="w-2.5 h-2.5 ml-0.5 text-rose-500" />
    </div>
  );
}
