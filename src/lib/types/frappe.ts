/**
 * Common Frappe Cloud REST API Types
 */

export interface FrappeResponse<T> {
  data: T;
  message?: string;
}

export interface FrappeListResponse<T> {
  data: T[];
}

export type FrappeFilterOperator =
  | "="
  | "!="
  | "like"
  | "not like"
  | "in"
  | "not in"
  | ">"
  | "<"
  | ">="
  | "<="
  | "Between";

export type FrappeFilter = [string, FrappeFilterOperator, string | number | boolean | Array<string | number>];

export interface FrappeQueryParams {
  fields?: string[];
  filters?: FrappeFilter[];
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}

export interface FrappeHealthCheckResponse {
  connected: boolean;
  url: string;
  authenticated: boolean;
  serverTime?: string;
  version?: string;
  latencyMs?: number;
  error?: string;
}
