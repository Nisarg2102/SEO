# n8n Automation Workflows

We use [n8n](https://n8n.io/) as our external automation and orchestration engine to handle scheduled tasks, background synchronizations, and generic webhook deliveries.

**Core Principle:** *Our application remains the absolute source of truth.* 
Do not replicate core business logic inside n8n. Instead, n8n acts as the scheduler/trigger, reaching out to our backend webhooks.

## 1. Authentication

All n8n requests to our backend must be secured using a custom HTTP Header:
`X-N8N-API-KEY`

In your `.env` (backend), set the expected secret:
```env
N8N_WEBHOOK_SECRET=your_super_secret_key_here
```
Configure your n8n HTTP Request nodes to pass this exact string.

## 2. Webhook Endpoints

Our backend exposes dedicated webhooks for n8n to call:

* `POST /webhooks/n8n/research-sync`
  - **Purpose:** Synchronizes RSS/Atom feeds across *all active workspaces*.
  - **Idempotency:** Yes. Calling this repeatedly will not create duplicate `ResearchItem` rows due to database-level unique constraints (`workspaceId_url`).

## 3. Workflow #1: Daily Research Sync

This is the primary workflow for automatically parsing RSS feeds and pushing them through the AI classification engine daily.

### n8n Configuration Steps:

1. **Trigger Node:**
   - Type: `Schedule Trigger`
   - Schedule: Daily at `00:00` (or `Cron: 0 0 * * *`)
2. **HTTP Request Node (The Sync Action):**
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://api.yourdomain.com/webhooks/n8n/research-sync`
   - Authentication: Send Headers
   - Headers:
     - Name: `X-N8N-API-KEY`
     - Value: `{{ $env.N8N_WEBHOOK_SECRET }}` (or hardcoded secret)

### What Happens Internally?
1. n8n triggers the `/research-sync` webhook.
2. The `ResearchService.syncAll()` method executes.
3. The backend iterates through all active workspaces and their approved `Source`s.
4. Feeds are downloaded and parsed.
5. Items are validated against the database (skipping duplicates).
6. The AI Provider is invoked to classify the new items.
7. Successfully classified items are stored in PostgreSQL as `ResearchItem`s.

## 4. Future Workflow Opportunities

* **Scheduled Analytics Synchronization:** n8n can periodically call `POST /webhooks/n8n/analytics-sync` to automate Google Search Console token refreshes and data ingestion.
* **Notifications:** Send Slack/Discord alerts when high-priority SEO opportunities are found.
