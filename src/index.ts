import { SentinelConfig, SentinelPayload, WebVitalMetric, QueuedPayload } from "./types";

export class Sentinel {
  public projectId: string;
  public apiKey: string;
  public endpoint: string;
  public vitalsEndpoint: string;
  public userId: string | null;
  public samplingRate: number;
  public enableWebVitals: boolean;
  public maxRetries: number;
  public enableQueueing: boolean;
  public maxQueueSize: number;
  
  private queue: QueuedPayload[] = [];
  private isProcessingQueue: boolean = false;
  private readonly STORAGE_KEY = 'sentinel_queue';

  constructor(config: SentinelConfig) {
    this.projectId = config.projectId;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://sentinel.bandhannova.in/api/ingest/error";
    this.vitalsEndpoint = config.vitalsEndpoint || this.deriveVitalsEndpoint(this.endpoint);
    this.userId = config.userId || null;
    this.samplingRate = config.samplingRate ?? 1.0;
    this.enableWebVitals = config.enableWebVitals ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.enableQueueing = config.enableQueueing ?? true;
    this.maxQueueSize = config.maxQueueSize ?? 100;
    
    this.init();
  }

  private deriveVitalsEndpoint(errorEndpoint: string): string {
    // Validate endpoint is a valid URL
    try {
      new URL(errorEndpoint);
    } catch (e) {
      console.error("[Sentinel SDK] Invalid endpoint URL:", errorEndpoint);
      return errorEndpoint; // Return as-is, will fail later with clear error
    }

    // If custom endpoint is provided, derive vitals endpoint from it
    // Replace /ingest/error with /api/vitals or append /api/vitals
    if (errorEndpoint.includes('/ingest/error')) {
      return errorEndpoint.replace('/ingest/error', '/api/vitals');
    }
    // If it's a custom endpoint without the standard path, append /api/vitals
    const baseUrl = errorEndpoint.replace(/\/[^/]*$/, '');
    return `${baseUrl}/api/vitals`;
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.document !== "undefined";
  }

  private init() {
    // Load queue from storage if available
    if (this.enableQueueing && this.isBrowser()) {
      this.loadQueue();
      // Process queue on page load
      this.processQueue();
      // Process queue when coming back online
      window.addEventListener('online', () => this.processQueue());
    }

    // Auto Detection of Runtime Environment
    if (this.isBrowser()) {
      // Browser Runtime
      window.addEventListener("error", (event) => {
        this.captureError(event.error || new Error(event.message));
      });
      window.addEventListener("unhandledrejection", (event) => {
        this.captureError(event.reason);
      });
      if (this.enableWebVitals) {
        this.captureWebVitals();
      }
    } else if (typeof process !== "undefined" && process.versions && process.versions.node) {
      // Node.js Runtime (check for process.versions.node to avoid SSR false positives)
      process.on("uncaughtException", (err) => {
        this.captureError(err);
      });
      process.on("unhandledRejection", (reason) => {
        this.captureError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    }

    console.log("[Sentinel SDK] Initialized successfully.");
  }

  private shouldSample(): boolean {
    return Math.random() < this.samplingRate;
  }

  private captureWebVitals() {
    if (!this.isBrowser() || !("PerformanceObserver" in window)) return;

    const sendMetric = (metric: WebVitalMetric) => {
      if (!this.shouldSample()) return;
      
      const payload = {
        project_id: this.projectId,
        ...metric,
        timestamp: new Date().toISOString()
      };
      
      this.sendWithRetry(this.vitalsEndpoint, payload);
    };

    try {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const lcpEntry = entry as PerformanceEntry & { startTime: number; loadTime?: number };
          sendMetric({ name: 'LCP', value: lcpEntry.startTime });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
          sendMetric({ name: 'FID', value: fidEntry.processingStart - fidEntry.startTime });
        }
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const clsEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!clsEntry.hadRecentInput) {
            sendMetric({ name: 'CLS', value: clsEntry.value });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // First Contentful Paint (FCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fcpEntry = entry as PerformanceEntry & { startTime: number };
          sendMetric({ name: 'FCP', value: fcpEntry.startTime });
        }
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.error("[Sentinel SDK] Failed to observe web vitals", e);
    }
  }

  public async captureError(err: Error | unknown) {
    if (!this.shouldSample()) return;

    const errorObj = err instanceof Error ? err : new Error(String(err));

    // Auto-masking sensitive data (Simple Regex for PII like Emails)
    let maskedMessage = errorObj.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***@***.***");

    const metadata: Record<string, any> = {};
    if (this.isBrowser()) {
      metadata.url = window.location.href;
      metadata.userAgent = navigator.userAgent;
    } else if (typeof process !== "undefined" && process.versions && process.versions.node) {
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
      metadata,
      timestamp: new Date().toISOString()
    };

    await this.sendWithRetry(this.endpoint, payload);
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.shouldSample()) return;
    
    const metadata: Record<string, any> = { level };
    if (this.userId) {
      metadata.userId = this.userId;
    }
    
    const payload: SentinelPayload = {
      project_id: this.projectId,
      message: message,
      stack: "",
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.sendWithRetry(this.endpoint, payload);
  }

  private async sendWithRetry(endpoint: string, payload: SentinelPayload | WebVitalMetric, attempt: number = 0): Promise<void> {
    if (typeof fetch !== "undefined") {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.sendWithRetry(endpoint, payload, attempt + 1);
        } else {
          // Max retries reached, queue if enabled
          if (this.enableQueueing) {
            this.addToQueue(payload, endpoint);
          } else {
            console.error("[Sentinel SDK] Failed to send payload after retries:", error);
          }
        }
      }
    } else {
      console.warn("[Sentinel SDK] 'fetch' is not available in this environment.");
    }
  }

  private addToQueue(payload: SentinelPayload | WebVitalMetric, endpoint: string): void {
    // Check queue size limit before adding
    if (this.queue.length >= this.maxQueueSize) {
      // Remove oldest item if queue is full
      this.queue.shift();
      console.warn(`[Sentinel SDK] Queue full (${this.maxQueueSize}), removed oldest item`);
    }
    
    const queuedItem: QueuedPayload = {
      payload,
      endpoint,
      attempts: 0,
      timestamp: Date.now()
    };
    
    this.queue.push(queuedItem);
    this.saveQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        await this.sendWithRetry(item.endpoint, item.payload, item.attempts);
      } catch (error) {
        // If still failing, re-add to queue with incremented attempts
        if (item.attempts < this.maxRetries) {
          item.attempts++;
          this.queue.push(item);
        } else {
          console.error("[Sentinel SDK] Queue item failed after max retries:", error);
        }
      }
    }
    
    this.saveQueue();
    this.isProcessingQueue = false;
  }

  private saveQueue(): void {
    if (this.isBrowser() && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
      } catch (e) {
        console.error("[Sentinel SDK] Failed to save queue to localStorage:", e);
      }
    }
  }

  private loadQueue(): void {
    if (this.isBrowser() && window.localStorage) {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          this.queue = JSON.parse(saved);
        }
      } catch (e) {
        console.error("[Sentinel SDK] Failed to load queue from localStorage:", e);
      }
    }
  }

  public flushQueue(): void {
    this.processQueue();
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

// Ensure it can be called as Sentinel.init() for global CDN compatibility
export function init(config: SentinelConfig): Sentinel {
  return new Sentinel(config);
}

// Default export for generic use cases
export default Sentinel;
