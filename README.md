# AI Marketing & SEO Assistant

A production-quality, AI-powered platform for SEO and social media marketing. Designed with strict multi-tenancy and clean architecture principles.

## Features
- **Isolated Workspaces:** Strict separation of data, brand rules, and knowledge bases (e.g., standard business vs. highly regulated medical).
- **AI Content Generation:** Brand-aware generation for briefs, captions, hooks, scripts, and SEO metadata.
- **SEO Tools:** Integrated research and analysis via Free SEO Tools.
- **Social Publishing:** Scheduling and distribution via Postiz.
- **Analytics:** Integration with GSC, Google Analytics, and social performance metrics.
- **Approval Workflows:** Configurable human-in-the-loop content review pipelines.
- **Automations:** Internal AI agents and workflow automation via n8n.

## Technology Stack
- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** NestJS, Node.js, TypeScript
- **Database:** PostgreSQL with `pgvector`
- **External Services:** Free SEO Tools, Postiz, n8n, AI Providers (Cloud/Ollama)

## Architecture Principles
1. **The application is the main product:** External services (Free SEO Tools, Postiz, n8n) are integrated via clean adapter patterns.
2. **Incremental Build:** Features are added in strictly verified phases.
3. **Security First:** Strict workspace isolation, zero frontend secrets, robust API validation.

## Documentation
- [Project Architecture](./PROJECT_ARCHITECTURE.md)
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md)

## Getting Started

*(Development setup instructions will be added here in Phase 1)*
