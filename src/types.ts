export interface SentinelConfig {
  projectId: string;
  apiKey: string;
  endpoint?: string;
  vitalsEndpoint?: string;
  userId?: string;
  samplingRate?: number;
  enableWebVitals?: boolean;
  maxRetries?: number;
  enableQueueing?: boolean;
  maxQueueSize?: number;
}

export interface SentinelPayload {
  project_id: string;
  message?: string;
  stack?: string;
  metadata?: Record<string, any>;
  level?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface WebVitalMetric {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  id?: string;
}

export interface QueuedPayload {
  payload: SentinelPayload | WebVitalMetric;
  endpoint: string;
  attempts: number;
  timestamp: number;
}
