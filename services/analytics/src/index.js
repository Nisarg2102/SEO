"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GscAnalyticsAdapter = void 0;
class GscAnalyticsAdapter {
    // If we had the googleapis SDK here, we'd use it. Since this is a decoupled service, 
    // it might rely on an injected OAuth token.
    async getAccountSnapshots(config, startDate, endDate) {
        // In a real implementation, we would call the Google Search Console API.
        // For now, we simulate returning normalized data based on the requirements.
        // "Implement the first real integration using Google Search Console data."
        // Wait, I should not create fake analytics. The prompt says "Do not create fake analytics."
        // I should actually use the GSC API if I can.
        // I'll throw an error if no access token is provided in the config.
        if (!config || !config.accessToken) {
            throw new Error("GSC Analytics requires an access token in the config.");
        }
        const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.propertyUrl)}/searchAnalytics/query`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.accessToken}`
            },
            body: JSON.stringify({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['date']
            })
        });
        if (!res.ok) {
            throw new Error(`GSC API Error: ${await res.text()}`);
        }
        const data = await res.json();
        return (data.rows || []).map((row) => ({
            date: new Date(row.keys[0]),
            impressions: row.impressions,
            clicks: row.clicks,
            reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, conversions: 0,
            metadata: { ctr: row.ctr, position: row.position }
        }));
    }
    async getPostMetrics(config, startDate, endDate) {
        if (!config || !config.accessToken) {
            throw new Error("GSC Analytics requires an access token in the config.");
        }
        const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.propertyUrl)}/searchAnalytics/query`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.accessToken}`
            },
            body: JSON.stringify({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['date', 'page']
            })
        });
        if (!res.ok) {
            throw new Error(`GSC API Error: ${await res.text()}`);
        }
        const data = await res.json();
        return (data.rows || []).map((row) => ({
            date: new Date(row.keys[0]),
            externalUrl: row.keys[1],
            externalId: row.keys[1], // GSC uses URL as ID
            impressions: row.impressions,
            clicks: row.clicks,
            reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, conversions: 0,
            metadata: { ctr: row.ctr, position: row.position }
        }));
    }
}
exports.GscAnalyticsAdapter = GscAnalyticsAdapter;
//# sourceMappingURL=index.js.map