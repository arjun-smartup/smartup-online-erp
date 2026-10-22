import React from "react";
import { cn } from "@/lib/utils/cn";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  isPositive,
  subtitle,
  icon,
  accentColor = "indigo",
  className,
}: StatsCardProps) {
  const accentGlow = {
    indigo: "group-hover:border-indigo-500/40 from-indigo-500/10",
    emerald: "group-hover:border-emerald-500/40 from-emerald-500/10",
    amber: "group-hover:border-amber-500/40 from-amber-500/10",
    rose: "group-hover:border-rose-500/40 from-rose-500/10",
    cyan: "group-hover:border-cyan-500/40 from-cyan-500/10",
  };

  const iconBg = {
    indigo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div
      className={cn(
        "group relative p-5 rounded-2xl glass-panel glass-card-hover border border-slate-800/80 bg-gradient-to-b to-transparent transition-all",
        accentGlow[accentColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>
        {icon ? (
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner",
              iconBg[accentColor]
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>

      {(change || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md",
                isPositive
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
