export interface ScheduledPost {
  id: string; // Internal ContentPack ID
  platform: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: Date;
}

export interface SocialProvider {
  createPost(post: ScheduledPost): Promise<string>;
  updatePost(externalId: string, post: ScheduledPost): Promise<void>;
  cancelPost(externalId: string): Promise<void>;
  getPostStatus(externalId: string): Promise<string>;
}

export class PostizAdapter implements SocialProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.POSTIZ_API_URL || 'https://api.postiz.com/v1';
    this.apiKey = process.env.POSTIZ_API_KEY || '';
  }

  private async request(method: string, endpoint: string, body?: any) {
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

  async createPost(post: ScheduledPost): Promise<string> {
    const data = await this.request('POST', '/posts', {
      platform: post.platform,
      content: post.caption,
      scheduled_at: post.scheduledAt.toISOString(),
      metadata: { internalId: post.id }
    });
    return data.id;
  }

  async updatePost(externalId: string, post: ScheduledPost): Promise<void> {
    await this.request('PUT', `/posts/${externalId}`, {
      content: post.caption,
      scheduled_at: post.scheduledAt.toISOString()
    });
  }

  async cancelPost(externalId: string): Promise<void> {
    await this.request('DELETE', `/posts/${externalId}`);
  }

  async getPostStatus(externalId: string): Promise<string> {
    const data = await this.request('GET', `/posts/${externalId}`);
    return data.status; // e.g. 'scheduled', 'published', 'failed'
  }
}
