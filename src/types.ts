export interface SentinelConfig {
  projectId: string;
  endpoint?: string;
  sessionReplay?: boolean;
  userId?: string;
}

export interface SentinelPayload {
  project_id: string;
  message?: string;
  stack?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}
