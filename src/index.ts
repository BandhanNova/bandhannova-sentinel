import { SentinelConfig, SentinelPayload } from "./types";

export class Sentinel {
  public projectId: string;
  public endpoint: string;
  public sessionReplay: boolean;
  public userId: string | null;

  constructor(config: SentinelConfig) {
    this.projectId = config.projectId;
    this.endpoint = config.endpoint || "https://sentinel.bandhannova.in/api/ingest";
    this.sessionReplay = config.sessionReplay || false;
    this.userId = config.userId || null;
    
    this.init();
  }

  private init() {
    // Simple Auto Detection of Runtime Environment
    if (typeof window !== "undefined") {
      // Browser Runtime
      window.addEventListener("error", (event) => {
        this.captureError(event.error || new Error(event.message));
      });
      window.addEventListener("unhandledrejection", (event) => {
        this.captureError(event.reason);
      });
      this.captureWebVitals();
    } else if (typeof process !== "undefined") {
      // Node.js Runtime
      process.on("uncaughtException", (err) => {
        this.captureError(err);
      });
      process.on("unhandledRejection", (reason) => {
        this.captureError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    }

    if (this.sessionReplay && typeof window !== "undefined") {
      console.log("[Sentinel SDK] Session replay is enabled (placeholder).");
    }

    console.log("[Sentinel SDK] Initialized successfully.");
  }

  private captureWebVitals() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    const sendMetric = (metric: any) => {
      // Avoid fetch fail on network errors blocking app
      const vitalsEndpoint = this.endpoint.replace('/ingest', '/vitals');
      fetch(vitalsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: this.projectId, ...metric })
      }).catch(e => console.error("[Sentinel SDK] Failed to relay vital:", e));
    };

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) sendMetric({ name: 'LCP', value: entry.startTime });
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            // @ts-ignore
            sendMetric({ name: 'FID', value: entry.processingStart - entry.startTime });
        }
      }).observe({ type: 'first-input', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // @ts-ignore
          if (!entry.hadRecentInput) sendMetric({ name: 'CLS', value: entry.value });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error("[Sentinel SDK] Failed to observe web vitals", e);
    }
  }

  public captureError(err: Error | unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    
    // Auto-masking sensitive data (Simple Regex for PII like Emails)
    let maskedMessage = errorObj.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***@***.***");

    const metadata: Record<string, any> = {};
    if (typeof window !== "undefined") {
      metadata.url = window.location.href;
      metadata.userAgent = navigator.userAgent;
    } else if (typeof process !== "undefined") {
      metadata.runtime = `Node.js ${process.version}`;
      metadata.pid = process.pid;
    }
    if (this.userId) {
      metadata.userId = this.userId;
    }

    const payload: SentinelPayload = {
      project_id: this.projectId,
      message: maskedMessage,
      stack: errorObj.stack || "",
      metadata
    };

    this.sendPayload(payload);
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    const metadata: Record<string, any> = { level };
    if (this.userId) {
      metadata.userId = this.userId;
    }
    
    const payload: SentinelPayload = {
      project_id: this.projectId,
      message: message,
      stack: "",
      metadata
    };
    
    this.sendPayload(payload);
  }

  private sendPayload(payload: SentinelPayload) {
    // Only fetch if available
    if (typeof fetch !== "undefined") {
      fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(e => console.error("[Sentinel SDK] Failed to relay payload:", e));
    } else {
        // Fallback for older Node.js (though fetch is available in Node 18+)
        console.warn("[Sentinel SDK] 'fetch' is not available in this environment.");
    }
  }
}

// Ensure it can be called as Sentinel.init() for global CDN compatibility
export function init(config: SentinelConfig): Sentinel {
  return new Sentinel(config);
}

// Default export for generic use cases
export default Sentinel;
