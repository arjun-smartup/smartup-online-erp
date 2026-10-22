"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Key,
  Database,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { frappeClient } from "@/lib/api/frappe-client";
import { FrappeHealthCheckResponse } from "@/lib/types/frappe";

export default function FrappeStatusPage() {
  const [health, setHealth] = useState<FrappeHealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await frappeClient.checkHealth();
      setHealth(res);
    } catch (err: any) {
      setHealth({
        connected: false,
        url: "error",
        authenticated: false,
        error: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testFetchStudents = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const students = await frappeClient.getList("Company", {
        fields: ["name"],
        limit_page_length: 5,
      });
      setTestResult({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to query Company DocType",
      });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Frappe Cloud Integration Status
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Connection health and authentication diagnostics for smartupedu.frappe.cloud
            </p>
          </div>

          {/* Health Overview Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Connection State
                </span>
                <div className="flex items-center gap-2 pt-1">
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                  ) : health?.connected && health.authenticated ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}

                  <h3 className="text-base font-bold text-slate-900">
                    {loading
                      ? "Testing Connection..."
                      : health?.connected && health.authenticated
                      ? "Connected & Authenticated"
                      : "Connection Error"}
                  </h3>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={runHealthCheck}
                isLoading={loading}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Re-Test
              </Button>
            </div>

            {/* Diagnostic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] text-slate-400">URL</p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">
                  {health?.url || "Not configured"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] text-slate-400">Latency</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : "—"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] text-slate-400">Auth</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {health?.authenticated ? "Valid Token" : "Unverified"}
                </p>
              </div>
            </div>
          </div>

          {/* Test Live Query Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Test Safe Read-Only Query
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Query Frappe Company DocType through server proxy
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={testFetchStudents}
              isLoading={testLoading}
            >
              Run Test Query
            </Button>

            {testResult && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge variant={testResult.success ? "success" : "danger"} size="sm">
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <pre className="text-slate-700 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
    </div>
  );
}
