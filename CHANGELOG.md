# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-01

### Added
- Initial release of @bandhannova/sentinel-js
- Automatic error capture for unhandled exceptions and promise rejections
- Manual error and message reporting with `captureError()` and `captureMessage()`
- Core Web Vitals tracking (LCP, FID, CLS, FCP)
- API key authentication for secure data ingestion
- Exponential backoff retry mechanism for network failures
- Request queueing with localStorage persistence for offline support
- Sampling rate configuration to reduce data volume
- User context tracking with `userId`
- PII masking for email addresses in error messages
- Multi-format build support (CJS, ESM, IIFE)
- TypeScript definitions included
- Browser and Node.js runtime auto-detection

### Changed
- Fixed endpoint to use `/api/ingest/error` for error ingestion
- Fixed web vitals endpoint to use `/api/vitals`
- Removed placeholder session replay feature
- Replaced `@ts-ignore` with proper TypeScript type definitions

### Security
- Added API key authentication via `X-API-Key` header
- Improved PII masking for sensitive data

### Fixed
- Fixed endpoint mismatch between SDK and backend
- Fixed missing `/api/vitals` route in backend
- Fixed TypeScript type safety issues with web vitals
