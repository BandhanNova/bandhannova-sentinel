interface SentinelConfig {
    projectId: string;
    endpoint?: string;
    sessionReplay?: boolean;
    userId?: string;
}

declare class Sentinel {
    projectId: string;
    endpoint: string;
    sessionReplay: boolean;
    userId: string | null;
    constructor(config: SentinelConfig);
    private init;
    private captureWebVitals;
    captureError(err: Error | unknown): void;
    captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
    private sendPayload;
}
declare function init(config: SentinelConfig): Sentinel;

export { Sentinel, Sentinel as default, init };
