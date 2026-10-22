import { OnlineDivision } from "../types/online-erp";

export const ONLINE_DIVISIONS: { id: OnlineDivision; label: string; timezone: string; defaultCurrency: string }[] = [
  {
    id: "SmartUp Online Kerala",
    label: "Kerala Virtual Campus",
    timezone: "Asia/Kolkata (IST)",
    defaultCurrency: "INR",
  },
  {
    id: "SmartUp GCC Online",
    label: "GCC Virtual Campus (UAE/Oman/Saudi)",
    timezone: "Asia/Dubai (GST)",
    defaultCurrency: "AED",
  },
  {
    id: "SmartUp Crash Course",
    label: "Crash Course & FastTrack",
    timezone: "Asia/Kolkata (IST)",
    defaultCurrency: "INR",
  },
  {
    id: "SmartUp Foundation",
    label: "Junior Foundation (Grade 8-10)",
    timezone: "Asia/Kolkata (IST)",
    defaultCurrency: "INR",
  },
];

export const SUPPORTED_TIMEZONES = [
  { code: "IST", label: "India (IST, UTC+5:30)", offset: "+05:30", iana: "Asia/Kolkata" },
  { code: "GST", label: "UAE / Oman (GST, UTC+4:00)", offset: "+04:00", iana: "Asia/Dubai" },
  { code: "AST", label: "Saudi / Qatar (AST, UTC+3:00)", offset: "+03:00", iana: "Asia/Riyadh" },
];
