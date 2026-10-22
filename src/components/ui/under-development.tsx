"use client";

import React from "react";
import Link from "next/link";
import { Hammer, Clock, ArrowLeft, Server, Activity } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { AppSidebar } from "../layout/app-sidebar";
import { AppNavbar } from "../layout/app-navbar";

interface UnderDevelopmentProps {
  moduleName: string;
  description: string;
  targetDocType?: string;
}

export function UnderDevelopmentView({
  moduleName,
  description,
  targetDocType,
}: UnderDevelopmentProps) {
  return (
    <div className="p-4 lg:p-8 flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 my-auto">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
        <Hammer className="w-6 h-6" />
      </div>

          <div className="space-y-1.5">
            <Badge variant="warning" size="md">
              <Clock className="w-3 h-3 mr-1" />
              Under Development
            </Badge>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {moduleName}
            </h1>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              {description} All hardcoded mock data has been removed. This module will integrate with live Frappe DocTypes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 w-full text-left font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Backend Server:</span>
              <span className="text-slate-800 font-medium">smartupedu.frappe.cloud</span>
            </div>
            {targetDocType && (
              <div className="flex justify-between">
                <span className="text-slate-400">Target DocType:</span>
                <span className="text-slate-800 font-medium">{targetDocType}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Data Status:</span>
              <span className="text-emerald-600 font-medium">Clean / Zero Hardcoded Records</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Return to Dashboard
              </Button>
            </Link>

            <Link href="/settings/frappe-status">
              <Button variant="secondary" size="sm">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                API Health
              </Button>
            </Link>
          </div>
    </div>
  );
}
