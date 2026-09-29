# Google Search Console Integration

## Overview
This document outlines the architecture, configuration, and testing procedures for the Google Search Console (GSC) integration within the AI Marketing/SEO Assistant.

## Google Cloud Project Setup
To use this integration in production, you must set up a Google Cloud project with the necessary OAuth credentials.

### Required API
- Enable the **Google Search Console API** in your Google Cloud Console.

### OAuth Credentials
1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Application type: **Web application**.

### Redirect URL
Configure the following Authorized Redirect URIs based on your environment:
- Local: `http://localhost:3001/workspaces/:workspaceId/gsc/callback` (Note: The actual implementation passes `workspaceId` via the OAuth `state` parameter and uses a generic global callback URL, e.g., `http://localhost:3001/gsc/callback` which redirects the user back to the frontend).
- Production: `https://your-domain.com/gsc/callback`

### Required Scopes
The application requires read-only access to Search Console:
- `https://www.googleapis.com/auth/webmasters.readonly`

## Environment Variables
Add the following to your `.env` file (Backend):
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/gsc/callback
```
*Note: If `GOOGLE_CLIENT_ID` is omitted or `NODE_ENV=test`, the application automatically operates in mock mode for local development.*

## Local Development (Mock Mode)
To simplify development without needing real Google accounts or properties, the `GscService` provides mock data when no `GOOGLE_CLIENT_ID` is provided.
- Connecting a property creates a dummy OAuth token.
- Fetching properties returns `https://example.com`.
- Synchronizing returns realistic dummy metrics (Impressions, Clicks, CTR, Position).

## Connection Process
1. **OAuth Initiation**: User clicks "Sign in with Google" on the Search Console page (`/workspaces/:id/search-console`).
2. **Authorization**: The user approves read-only access to their Search Console data.
3. **Callback & Token Storage**: Google redirects to the callback endpoint. The `code` is exchanged for an `access_token` and `refresh_token`. These tokens are securely saved in the `Integration` table (bound strictly to the `workspaceId`). **Access tokens are never sent to the frontend.**
4. **Property Selection**: The application lists all verified properties for the user. The user selects a property, which is saved in the integration `config`.

## Synchronization Process
1. **Trigger**: User clicks "Sync Now" (optionally selecting a date range: 7, 28, or 90 days).
2. **Queueing**: The API controller responds instantly with `202 Accepted` and enqueues a `sync-gsc` job in BullMQ (`analytics` queue).
3. **Processing**: `AnalyticsProcessor` picks up the job and calls `GscService.sync()`.
4. **Data Retrieval**: The service queries the Google Search Console API for the specified date range.
5. **Persistence**: The raw metrics (date, query, page, clicks, impressions, ctr, position) are securely upserted into the `GscMetric` table, maintaining a strict `workspaceId` relationship.
6. **AI Analysis**: Upon successful sync, the metrics are immediately pipelined to the `SeoOpportunitiesService` (the SEO Opportunity Engine) for programmatic and AI-driven opportunity detection (e.g., finding High Impression / Low CTR pages).
7. **Completion**: The `Integration.lastSyncAt` timestamp is updated.

## Workspace Security
- **Strict Isolation**: `workspaceId` is strictly enforced on all Database queries (using `findUnique` with compound indexes: `workspaceId_provider`).
- **OAuth State**: The `workspaceId` is embedded in the OAuth `state` parameter to prevent CSRF and cross-workspace token leakage.
- **Frontend Security**: The UI never receives or handles OAuth tokens.
