import { FrappeHealthCheckResponse, FrappeListResponse, FrappeQueryParams, FrappeResponse } from "../types/frappe";

/**
 * Frontend client for interacting with Frappe Cloud via the Next.js secure proxy.
 */
class FrappeClient {
  private basePath = "/api/proxy";

  /**
   * Fetch a single document by DocType and name
   */
  async getDoc<T = any>(doctype: string, name: string): Promise<T> {
    const res = await fetch(`${this.basePath}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch ${doctype}/${name} (Status ${res.status})`);
    }

    const json: FrappeResponse<T> = await res.json();
    return json.data;
  }

  /**
   * Fetch a list of documents with filters, pagination, and fields
   */
  async getList<T = any>(doctype: string, params: FrappeQueryParams = {}): Promise<T[]> {
    const query = new URLSearchParams();

    if (params.fields && params.fields.length > 0) {
      query.set("fields", JSON.stringify(params.fields));
    }

    if (params.filters && params.filters.length > 0) {
      query.set("filters", JSON.stringify(params.filters));
    }

    if (params.limit_page_length !== undefined) {
      query.set("limit_page_length", params.limit_page_length.toString());
    }

    if (params.limit_start !== undefined) {
      query.set("limit_start", params.limit_start.toString());
    }

    if (params.order_by) {
      query.set("order_by", params.order_by);
    }

    const queryString = query.toString();
    const url = `${this.basePath}/resource/${encodeURIComponent(doctype)}${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch list for ${doctype} (Status ${res.status})`);
    }

    const json: FrappeListResponse<T> = await res.json();
    return json.data || [];
  }

  /**
   * Call a whitelisted Frappe Python backend method
   */
  async callMethod<T = any>(methodName: string, args: Record<string, any> = {}): Promise<T> {
    const res = await fetch(`${this.basePath}/method/${methodName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Method call to ${methodName} failed (Status ${res.status})`);
    }

    const json = await res.json();
    return json.message !== undefined ? json.message : json.data;
  }

  /**
   * Check connection status with Frappe Cloud
   */
  async checkHealth(): Promise<FrappeHealthCheckResponse> {
    try {
      const res = await fetch("/api/frappe/health", { cache: "no-store" });
      return await res.json();
    } catch (err: any) {
      return {
        connected: false,
        url: "unknown",
        authenticated: false,
        error: err?.message || "Failed to query health endpoint",
      };
    }
  }
}

export const frappeClient = new FrappeClient();
