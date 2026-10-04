# Production Smoke Test Procedure

This document outlines the end-to-end verification protocol to validate the SEO + Social Marketing platform in a production environment.

## Overview
Perform these tests manually against the production deployment to verify functionality, database persistence, and strict workspace isolation.

### Part 1: Authentication & Brand Profile (Tests 1-5)
**TEST 1: Login**
- Navigate to the production URL.
- Log in or register an account.
- Verify JWT is set in an HttpOnly cookie and dashboard loads.

**TEST 2: Create/Open Workspace A**
- Create a new workspace (e.g., "Drashti Softechs").
- Switch to this workspace.

**TEST 3: Save Brand Profile**
- Go to **Settings -> Brand Profile**.
- Enter values (Business Name, Industry, Target Audience, Brand Voice, Keywords, Website).
- Click **Save Brand Profile**.
- Verify a success message is displayed (no errors).

**TEST 4: Refresh Page**
- Hard refresh the browser window (\`Cmd/Ctrl + Shift + R\`).

**TEST 5: Confirm Brand Profile Persisted**
- Verify that all previously entered fields load perfectly with identical values.

---

### Part 2: Integrations (Tests 6-10)
**TEST 6: Connect Google Search Console**
- In Settings, confirm GSC does not show "Admin configuration required" (ensuring environment variables are loaded).
- Click **Connect GSC**.
- Complete the Google OAuth flow.

**TEST 7: Select Real GSC Property**
- Select an active domain property (e.g., \`sc-domain:example.com\`).
- Click Connect.

**TEST 8: Run/Import GSC Data**
- Navigate to the Search Console tab and wait for the initial background sync to complete.

**TEST 9: Open Analytics**
- Navigate to **Analytics**.

**TEST 10: Confirm Real Data**
- Verify real numbers for Clicks, Impressions, CTR, and Position appear.
- Verify "No data available" is shown gracefully if the property is brand new.

---

### Part 3: SEO Pipeline (Tests 11-17)
**TEST 11: Run Keyword Research**
- Navigate to **Research**.
- Search for a seed keyword.
- Verify autocomplete, trends, and related queries populate without errors.

**TEST 12: Run Technical SEO Audit**
- Navigate to **SEO Audit**.
- Enter a real public website.
- Verify the crawler successfully crawls up to 100 pages.

**TEST 13: Review SEO Issues**
- Verify the audit generated issues (missing H1s, slow pages, etc.).

**TEST 14: Review Links**
- Verify internal, external, broken, and orphan link counts are reasonable.

**TEST 15: Analyze Page with AI**
- In the SEO Content module, request an AI analysis of a specific crawled URL.
- Verify the structured recommendations are returned.

**TEST 16: Create SEO Content Brief**
- Generate a content brief for a target keyword.
- Verify outline, titles, and metadata suggestions populate.

**TEST 17: Generate Draft**
- Use the brief to generate a full draft. Verify human editing is possible.

---

### Part 4: Social & Instagram (Tests 18-21)
**TEST 18: Create Social Content**
- In **Social Studio**, use AI to repurpose the SEO draft into social posts.

**TEST 19: Verify Instagram Connection**
- Go to Settings, ensure Instagram is "Connected".

**TEST 20: Schedule a Test Post**
- Select a social post.
- Set a future date.
- Click **Schedule**.
- Verify the post state transitions to Scheduled, but is NOT published immediately.

**TEST 21: Analytics Update**
- Verify Analytics reflects the newly scheduled content.

---

### Part 5: AI Agent & Automation (Tests 22-25)
**TEST 22: Open AI Agent**
- Navigate to **Agent**.

**TEST 23: Ask for Performance Summary**
- Prompt: *"Give me an SEO performance summary for this workspace."*
- Verify the agent uses the \`getSeoPerformance\` tool to retrieve actual data.

**TEST 24: Ask for Top Opportunities**
- Prompt: *"What are my top opportunities?"*
- Verify the agent queries the SEO opportunities database.

**TEST 25: Verify Stored Data**
- Ensure the agent's response exactly matches the numbers in the Analytics dashboard.

---

### Part 6: Workspace Isolation (Tests 26-27)
**TEST 26: Test Workspace B**
- Create a new workspace (e.g., "Psychiatrist / Mental Health").
- Switch to Workspace B.

**TEST 27: Verify Isolation**
- **Brand Profile:** Must be completely blank.
- **GSC:** Must show "Not Connected".
- **Analytics:** Must show zeroes or "No data available".
- **Agent:** Prompt the agent to list recent articles or keywords. It must NOT return anything from Workspace A.
