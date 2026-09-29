# Development Roadmap

This roadmap defines the incremental development strategy for the AI Marketing and SEO Assistant. We will complete, test, and verify each phase before moving to the next.

## Phase 1: Foundation & Infrastructure Setup
**Goal:** Establish the baseline project structure and local development environment.
- [ ] Setup Git repository.
- [ ] Configure `docker-compose.yml` for PostgreSQL with `pgvector`.
- [ ] Initialize NestJS backend with strict TypeScript configuration.
- [ ] Initialize Next.js frontend with Tailwind CSS.
- [ ] Establish basic API communication between frontend and backend.
- [ ] Setup linting, formatting (Prettier/ESLint), and basic testing frameworks (Jest).

## Phase 2: Core Platform & Workspace Isolation
**Goal:** Build a robust multi-tenant foundation.
- [ ] Implement database schema for Users, Workspaces, and Roles.
- [ ] Create authentication and authorization flow (JWT).
- [ ] Implement strict `workspace_id` isolation logic in the backend.
- [ ] Create UI for Workspace creation and switching.
- [ ] Implement initial target workspaces: "Drashti Softex" and "Psychiatrist".
- [ ] Add `compliance_level` settings for workspaces (enabling strict medical rules).

## Phase 3: Brand Profiles & AI Foundation
**Goal:** Abstract AI providers and establish brand voices.
- [ ] Implement `BrandProfile` database schema (voice, tone, rules).
- [ ] Build the AI Provider Abstraction Interface (`IAIService`).
- [ ] Integrate an initial cloud LLM provider (e.g., OpenAI/Gemini/Anthropic).
- [ ] Build UI to manage Brand Profiles per workspace.
- [ ] Build vector ingestion (pgvector) for custom workspace knowledge bases.
- [ ] Test isolation to ensure AI doesn't mix knowledge between workspaces.

## Phase 4: Content Generation & Human Approval Workflow
**Goal:** Generate multi-format content with strict human-in-the-loop review.
- [ ] Build Content modules (Briefs, Captions, Hooks, Scripts).
- [ ] Implement AI prompt orchestration integrating brand rules.
- [ ] Build the Approval Queue database schema and UI.
- [ ] Implement conditional approval logic (strict multi-step approval for the "Psychiatrist" workspace).
- [ ] Implement Content Calendar UI.

## Phase 5: SEO Integration
**Goal:** Integrate SEO capabilities via abstraction.
- [ ] Define the `ISEOService` interface.
- [ ] Build the `OpenSEOAdapter` for the external OpenSEO service.
- [ ] Implement Website SEO Analysis feature.
- [ ] Implement SEO Keyword Research and tracking features.
- [ ] Generate SEO titles and meta descriptions via AI.

## Phase 6: Social Publishing Integration
**Goal:** Integrate social scheduling capabilities via abstraction.
- [ ] Define the `ISocialPublisher` interface.
- [ ] Build the `PostizAdapter` for the external Postiz service.
- [ ] Connect the approved Content Calendar items to the publishing engine.
- [ ] Build UI to monitor scheduled posts.

## Phase 7: Analytics & Automation Integration
**Goal:** Close the loop with data and internal AI automation.
- [ ] Integrate Google Search Console & Google Analytics.
- [ ] Integrate Social Media Analytics via Postiz.
- [ ] Build performance dashboard aggregating metrics.
- [ ] Implement AI recommendations based on historical performance data.
- [ ] Define `IWorkflowEngine` and build `n8nAdapter` for background automation.
- [ ] Build the "Internal AI Agent" capable of triggering n8n workflows based on analytics triggers.

## Phase 8: Hardening & Production Readiness
**Goal:** Prepare for production deployment.
- [ ] Comprehensive security audit (ensure no secrets leaked, complete workspace isolation).
- [ ] Performance tuning and database indexing.
- [ ] E2E testing of the full content lifecycle.
- [ ] Finalize documentation.
- [ ] Prepare deployment manifests.
