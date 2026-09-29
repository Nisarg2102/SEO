export interface ScheduledPost {
    id: string;
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
export declare class PostizAdapter implements SocialProvider {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    private request;
    createPost(post: ScheduledPost): Promise<string>;
    updatePost(externalId: string, post: ScheduledPost): Promise<void>;
    cancelPost(externalId: string): Promise<void>;
    getPostStatus(externalId: string): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map