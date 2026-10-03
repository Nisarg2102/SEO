# AI Production Setup

## Configuration

The API requires the following environment variables to communicate with OpenAI. You **must** add these to your Vercel Project under **Settings > Environment Variables**:

- `AI_API_KEY`: Your OpenAI API Key (e.g. `sk-...`). **Required**.
- `AI_MODEL`: The OpenAI model to use. Defaults to `gpt-4o` if not provided. **Optional but Recommended**.

### How to set them in Vercel:
1. Go to your Vercel Dashboard for the `seo` project.
2. Click **Settings**.
3. Click **Environment Variables** in the left sidebar.
4. Add `AI_API_KEY` and paste your key.
5. Hit **Save**.
6. **Important:** Go to the **Deployments** tab and click **Redeploy** on the latest commit. (Environment variables do not take effect until the next deployment).

## Root Cause Analysis

### Why did it fail with HTTP 500?
Both the `ContentPacksController` and `AiAgentController` endpoints depend on `AiService`, which interfaces with the `@ai-marketing/ai` SDK (`OpenAIProvider`). 

When the `AI_API_KEY` is completely missing in a production environment, or if the provided key is invalid/rejected by OpenAI (e.g. 401 Unauthorized, 429 Rate Limit), the `OpenAIProvider` throws a native JavaScript `Error` (e.g. `OpenAI generateStructuredOutput failed: ...`). 

Because this error was not explicitly caught by the controllers to throw a recognized NestJS `HttpException`, NestJS's default global exception filter automatically wrapped the unknown error into a generic `500 Internal Server Error`, effectively hiding the underlying OpenAI failure from the client to prevent sensitive leaks. 

Furthermore, if the `AI_API_KEY` was completely missing, the `AiService` fallback to `MockAIProvider` triggered a Prisma validation error (`Argument topic for data.topic is missing`) because the mock provider returned an empty object `{}` instead of the required structured schema.

### The Fix
I have added proper NestJS `HttpException` wrappers and explicit safe server-side logging. 
Now, if OpenAI rejects the request, the API will log the exact error type safely without exposing the key, and it will return a clean JSON error response (`{ message: "AI Generation failed", details: "..." }`) back to the frontend instead of a silent 500 crash.
