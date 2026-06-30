# @bandhannova/sentinel-js

The official JavaScript & TypeScript SDK for **BandhanNova Sentinel** APM and Error Monitoring.

Sentinel is a lightweight, AI-powered observability and error-tracking platform. This SDK seamlessly captures unhandled exceptions, unhandled promise rejections, and Core Web Vitals across **Browser** and **Node.js** environments.

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
  // endpoint: 'https://sentinel.bandhannova.in/api/ingest' (Optional, auto-defaults to Sentinel Cloud)
});

// That's it! Sentinel is now tracking errors and vitals.
```

### CommonJS (Legacy Node.js)

```javascript
const { Sentinel } = require('@bandhannova/sentinel-js');

const sentinel = new Sentinel({
  projectId: 'your_project_id_here'
});
```

### HTML `<script>` CDN

You can inject the SDK directly via CDN in your HTML `<head>`:

```html
<script src="https://unpkg.com/@bandhannova/sentinel-js/dist/index.global.js"></script>
<script>
  Sentinel.init({
    projectId: 'your_project_id_here'
  });
</script>
```

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
```

## Configuration Options

| Option          | Type      | Required | Description                                                         |
|-----------------|-----------|----------|---------------------------------------------------------------------|
| `projectId`     | `string`  | **Yes**  | Your Sentinel Project ID (found in Dashboard settings).             |
| `endpoint`      | `string`  | No       | Custom Ingest URL (Default: `https://sentinel.bandhannova.in/api/ingest`). |
| `userId`        | `string`  | No       | Unique Identifier for the active user session.                      |
| `sessionReplay` | `boolean` | No       | Enable frontend session replay recordings.                          |

## License

MIT © BandhanNova Platforms
