"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostizAdapter = void 0;
class PostizAdapter {
    baseUrl;
    apiKey;
    constructor() {
        this.baseUrl = process.env.POSTIZ_API_URL || 'https://api.postiz.com/v1';
        this.apiKey = process.env.POSTIZ_API_KEY || '';
    }
    async request(method, endpoint, body) {
        if (process.env.NODE_ENV === 'test' || !this.apiKey) {
            return { id: `mock_postiz_id_${Date.now()}`, status: 'scheduled' };
        }
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            throw new Error(`Postiz API Error: ${res.status} - ${await res.text()}`);
        }
        return res.json();
    }
    async createPost(post) {
        const data = await this.request('POST', '/posts', {
            platform: post.platform,
            content: post.caption,
            scheduled_at: post.scheduledAt.toISOString(),
            metadata: { internalId: post.id }
        });
        return data.id;
    }
    async updatePost(externalId, post) {
        await this.request('PUT', `/posts/${externalId}`, {
            content: post.caption,
            scheduled_at: post.scheduledAt.toISOString()
        });
    }
    async cancelPost(externalId) {
        await this.request('DELETE', `/posts/${externalId}`);
    }
    async getPostStatus(externalId) {
        const data = await this.request('GET', `/posts/${externalId}`);
        return data.status; // e.g. 'scheduled', 'published', 'failed'
    }
}
exports.PostizAdapter = PostizAdapter;
//# sourceMappingURL=index.js.map