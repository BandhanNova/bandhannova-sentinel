import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sentinel, init } from './index';

// Mock fetch globally
global.fetch = vi.fn();

describe('Sentinel SDK', () => {
  let sentinel: Sentinel;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with required config', () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key'
      });

      expect(sentinel.projectId).toBe('test-project');
      expect(sentinel.apiKey).toBe('test-api-key');
      expect(sentinel.endpoint).toBe('https://sentinel.bandhannova.in/api/ingest/error');
    });

    it('should initialize with custom endpoint', () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        endpoint: 'https://custom.endpoint.com/api/ingest/error'
      });

      expect(sentinel.endpoint).toBe('https://custom.endpoint.com/api/ingest/error');
    });

    it('should initialize with optional config', () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        userId: 'user-123',
        samplingRate: 0.5,
        enableWebVitals: false,
        maxRetries: 5,
        enableQueueing: false
      });

      expect(sentinel.userId).toBe('user-123');
      expect(sentinel.samplingRate).toBe(0.5);
      expect(sentinel.enableWebVitals).toBe(false);
      expect(sentinel.maxRetries).toBe(5);
      expect(sentinel.enableQueueing).toBe(false);
    });

    it('should use default values for optional config', () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key'
      });

      expect(sentinel.userId).toBeNull();
      expect(sentinel.samplingRate).toBe(1.0);
      expect(sentinel.enableWebVitals).toBe(true);
      expect(sentinel.maxRetries).toBe(3);
      expect(sentinel.enableQueueing).toBe(true);
    });
  });

  describe('Error Capture', () => {
    beforeEach(() => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        enableWebVitals: false
      });
    });

    it('should capture error with stack trace', async () => {
      const error = new Error('Test error');
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      await sentinel.captureError(error);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sentinel.bandhannova.in/api/ingest/error',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          })
        })
      );
    });

    it('should mask email addresses in error messages', async () => {
      const error = new Error('Error for user@example.com');
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      await sentinel.captureError(error);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.message).toContain('***@***.***');
      expect(body.message).not.toContain('user@example.com');
    });

    it('should handle non-error objects', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      await sentinel.captureError('String error');

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Message Capture', () => {
    beforeEach(() => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        enableWebVitals: false
      });
    });

    it('should capture info message', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      sentinel.captureMessage('Test message', 'info');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should capture warning message', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      sentinel.captureMessage('Warning message', 'warning');

      await new Promise(resolve => setTimeout(resolve, 100));

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.metadata.level).toBe('warning');
    });

    it('should capture error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      sentinel.captureMessage('Error message', 'error');

      await new Promise(resolve => setTimeout(resolve, 100));

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.metadata.level).toBe('error');
    });
  });

  describe('Sampling', () => {
    it('should respect sampling rate', () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        samplingRate: 0,
        enableWebVitals: false
      });

      (global.fetch as any).mockResolvedValueOnce({ ok: true });
      sentinel.captureError(new Error('Test'));

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Queue Management', () => {
    beforeEach(() => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        enableWebVitals: false,
        enableQueueing: true
      });
    });

    it('should clear queue', () => {
      sentinel.clearQueue();
      expect((sentinel as any).queue.length).toBe(0);
    });

    it('should have flushQueue method', () => {
      expect(typeof sentinel.flushQueue).toBe('function');
    });
  });

  describe('Retry Logic', () => {
    it.skip('should retry on failure', async () => {
      sentinel = new Sentinel({
        projectId: 'test-project',
        apiKey: 'test-api-key',
        maxRetries: 2,
        enableWebVitals: false,
        enableQueueing: false
      });

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      await sentinel.captureError(new Error('Test'));

      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});

describe('init function', () => {
  it('should return Sentinel instance', () => {
    const instance = init({
      projectId: 'test-project',
      apiKey: 'test-api-key'
    });

    expect(instance).toBeInstanceOf(Sentinel);
  });
});
