# @bandhannova/sentinel-js

![npm version](https://badge.fury.io/js/%40bandhannova%2Fsentinel-js.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js Version](https://img.shields.io/node/v/%40bandhannova%2Fsentinel-js.svg)

The official JavaScript & TypeScript SDK for **BandhanNova Sentinel** APM and Error Monitoring.

Sentinel is a lightweight, AI-powered observability and error-tracking platform. This SDK seamlessly captures unhandled exceptions, unhandled promise rejections, and Core Web Vitals across **Browser** and **Node.js** environments.

## Features

- ✅ **Automatic Error Capture** - Unhandled exceptions and promise rejections
- ✅ **Core Web Vitals** - LCP, FID, CLS, FCP tracking
- ✅ **API Key Authentication** - Secure data ingestion
- ✅ **Retry Logic** - Exponential backoff for network failures
- ✅ **Offline Support** - Request queueing with localStorage persistence
- ✅ **Sampling** - Reduce data volume with configurable sampling rate
- ✅ **PII Masking** - Automatic email masking in error messages
- ✅ **User Context** - Track user sessions with userId
- ✅ **Multi-Runtime** - Works in Browser and Node.js
- ✅ **TypeScript** - Full type definitions included

## Installation

Using NPM:
```bash
npm install @bandhannova/sentinel-js
```

Using Yarn:
```bash
yarn add @bandhannova/sentinel-js
```

Using pnpm:
```bash
pnpm add @bandhannova/sentinel-js
```

## Quick Start

The SDK automatically detects your runtime environment. You only need one integration code for Browser or Node.js.

### ES Modules (Frontend or Node.js)

```javascript
import { Sentinel } from '@bandhannova/sentinel-js';

const sentinel = new Sentinel({
  projectId: 'your_project_id_here',
  apiKey: 'your_api_key_here'
});

// That's it! Sentinel is now tracking errors and vitals.
```

### CommonJS (Legacy Node.js)

```javascript
const { Sentinel } = require('@bandhannova/sentinel-js');

const sentinel = new Sentinel({
  projectId: 'your_project_id_here',
  apiKey: 'your_api_key_here'
});
```

### HTML `<script>` CDN

You can inject the SDK directly via CDN in your HTML `<head>`:

```html
<script src="https://unpkg.com/@bandhannova/sentinel-js/dist/index.global.js"></script>
<script>
  Sentinel.init({
    projectId: 'your_project_id_here',
    apiKey: 'your_api_key_here'
  });
</script>
```

## Configuration Options

| Option            | Type       | Required | Default | Description |
|-------------------|------------|----------|---------|-------------|
| `projectId`       | `string`   | **Yes**  | - | Your Sentinel Project ID (found in Dashboard settings). |
| `apiKey`          | `string`   | **Yes**  | - | Your Sentinel API Key (found in Dashboard settings). |
| `endpoint`        | `string`   | No       | `https://sentinel.bandhannova.in/api/ingest/error` | Custom Error Ingest URL. |
| `vitalsEndpoint`  | `string`   | No       | Auto-derived from endpoint | Custom Web Vitals Ingest URL. |
| `userId`          | `string`   | No       | `null` | Unique Identifier for the active user session. |
| `samplingRate`    | `number`   | No       | `1.0` | Sampling rate (0.0 to 1.0). Use to reduce data volume. |
| `enableWebVitals` | `boolean`  | No       | `true` | Enable/disable Core Web Vitals tracking. |
| `maxRetries`      | `number`   | No       | `3` | Maximum retry attempts for failed requests. |
| `enableQueueing`  | `boolean`  | No       | `true` | Enable offline queueing with localStorage persistence. |
| `maxQueueSize`    | `number`   | No       | `100` | Maximum number of items to store in the offline queue. |

## Manual Reporting

If you want to manually report a caught exception or an arbitrary message:

### Capture Errors
```javascript
try {
  throw new Error("Payment failed!");
} catch (error) {
  sentinel.captureError(error);
}
```

### Capture Messages
```javascript
sentinel.captureMessage("User completed checkout", "info");
// Available levels: 'info', 'warning', 'error'
```

## Queue Management

When queueing is enabled, failed requests are stored in localStorage and retried when the connection is restored.

```javascript
// Manually flush the queue
sentinel.flushQueue();

// Clear all queued items
sentinel.clearQueue();
```

## Advanced Configuration

### High-Traffic Applications

For high-traffic applications, use sampling to reduce costs:

```javascript
const sentinel = new Sentinel({
  projectId: 'your_project_id',
  apiKey: 'your_api_key',
  samplingRate: 0.1 // Capture only 10% of errors
});
```

### Custom Endpoint

If you're self-hosting Sentinel:

```javascript
const sentinel = new Sentinel({
  projectId: 'your_project_id',
  apiKey: 'your_api_key',
  endpoint: 'https://your-sentinel-instance.com/api/ingest/error'
});
```

The Web Vitals endpoint is automatically derived from the error endpoint. If you need a custom vitals endpoint:

```javascript
const sentinel = new Sentinel({
  projectId: 'your_project_id',
  apiKey: 'your_api_key',
  endpoint: 'https://your-sentinel-instance.com/api/ingest/error',
  vitalsEndpoint: 'https://your-sentinel-instance.com/api/vitals'
});
```

## Security

- API keys are sent via the `X-API-Key` header
- Email addresses in error messages are automatically masked
- All data is transmitted over HTTPS
- No sensitive data is stored in the SDK

## License

MIT © BandhanNova Platforms
