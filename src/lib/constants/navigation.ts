import React from "react";
import { UserPermissions } from "../types/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  description?: string;
  children?: { title: string; href: string }[];
  requiredPermission?: keyof UserPermissions;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Clean, functional navigation items for active SmartUp ERP modules
export const SMARTUP_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    iconName: "LayoutDashboard",
  },
  {
    title: "Students",
    href: "/students",
    iconName: "GraduationCap",
    children: [
      { title: "All Students Directory", href: "/students" },
      { title: "Admit New Student", href: "/students/new" },
    ],
  },
  {
    title: "Fees & Collections",
    href: "/fees",
    iconName: "IndianRupee",
    requiredPermission: "canViewFees",
  },
  {
    title: "Frappe Cloud Status",
    href: "/settings/frappe-status",
    iconName: "Activity",
    requiredPermission: "canViewSystemStatus",
  },
];
