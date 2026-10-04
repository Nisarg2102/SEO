# Project Architecture

## Overview
The AI Marketing and SEO Assistant is a multi-tenant web application designed to help businesses manage their SEO, social media, and content marketing through AI-driven insights and automation.

The core principle of this architecture is that **the application is the main product**. Third-party services (Free SEO Tools, Instagram, n8n, AI APIs) are supporting services. The system interacts with these services strictly through clean interfaces and adapters to prevent vendor lock-in and decouple business logic from external implementation details.

## High-Level Architecture

```mermaid
flowchart TD
    Client[Next.js Frontend] -->|REST API / GraphQL| Gateway[NestJS Backend API]
    Gateway --> Auth[Auth & Workspace Module]
    Gateway --> AIModule[AI Service Interface]
    Gateway --> SEOModule[SEO Adapter]
    Gateway --> SocialModule[Social Adapter]
    Gateway --> WorkflowModule[Workflow Adapter]
    
    Gateway --> DB[(PostgreSQL + pgvector)]
    
    AIModule -.->|Provider Abstraction| OpenAI/Anthropic/Ollama
    SEOModule -.->|External API| Free SEO Tools
    SocialModule -.->|External API| Instagram
    WorkflowModule -.->|Webhooks/API| n8n
```

## Technology Stack

### Frontend
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context / Zustand / React Query (depending on phase requirements)

### Backend
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Architecture:** Modular Monolith (domain-driven design principles)

### Database
- **Primary Database:** PostgreSQL
- **Vector Store:** pgvector (for AI semantic search, internal knowledge base retrieval)
- **ORM:** TypeORM or Prisma (to be decided in implementation phase)

### Infrastructure
- **Containerization:** Docker & Docker Compose (Local Development environment)
- **Version Control:** Git/GitHub

## Key Architectural Decisions & Patterns

### 1. Strict Workspace Isolation (Multi-tenancy)
Data isolation between workspaces (e.g., *Drashti Softex* vs *Psychiatrist*) is paramount, especially considering medical compliance requirements.
- **Tenant ID Injection:** Every database query MUST filter by `workspace_id`.
- **Database Architecture:** We will use a shared database with a discriminated schema (every table has a `workspace_id` column).
- **Compliance Tiers:** Workspaces will have a `compliance_level` flag. The medical workspace will trigger strict human-in-the-loop (HITL) approval rules for all generated content.

### 2. The Adapter Pattern for External Services
To ensure the app does not tightly couple with Free SEO Tools, Instagram, or n8n, we will define strict internal interfaces:
- `ISocialPublisher` -> Implemented by `InstagramAdapter`
- `ISEOService` -> Implemented by `Free SEO ToolsAdapter`
- `IWorkflowEngine` -> Implemented by `n8nAdapter`

### 3. AI Provider Abstraction
To future-proof the AI capabilities and allow switching to local models (Ollama), AI logic will be abstracted:
- `IAIGenerator` -> Implemented by `CloudAIProvider` and `LocalOllamaProvider`
- Prompts will be managed dynamically per workspace to ensure brand rules and knowledge bases do not bleed across boundaries.

### 4. Backend Module Structure (NestJS)
The NestJS backend will be divided into distinct modules:
- `WorkspaceModule`
- `BrandProfileModule`
- `ContentModule` (Briefs, Captions, Hooks, Scripts)
- `ApprovalModule` (Human review workflows)
- `AnalyticsModule` (GSC, GA, Social Analytics aggregator)
- `IntegrationsModule` (Adapters for external tools)

### 5. Security & Credentials
- **Zero Frontend Secrets:** No API keys or sensitive credentials will ever be exposed to the Next.js frontend.
- **Backend Vault:** Workspace-specific credentials (e.g., a specific workspace's GA OAuth token) will be encrypted at rest in the database.

## System Workflow Example: Content Generation
1. User requests a blog post brief in the Frontend.
2. Frontend calls NestJS Backend with session token.
3. Backend validates Auth and determines the `workspace_id`.
4. Backend retrieves the Workspace's Brand Profile and Knowledge Base.
5. `ContentService` formats a prompt combining the brand rules and user request.
6. `AIAdapter` sends the prompt to the selected LLM provider.
7. Result is saved to the Database with `status = PENDING_APPROVAL`.
8. User is notified to review. If it's a medical workspace, multiple approval tiers may be enforced.
