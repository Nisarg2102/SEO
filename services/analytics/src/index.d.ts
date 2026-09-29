export interface AnalyticsSnapshotData {
    date: Date;
    impressions: number;
    reach: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    conversions: number;
    metadata?: any;
}
export interface PostMetricData extends AnalyticsSnapshotData {
    externalUrl?: string;
    externalId?: string;
}
export interface AnalyticsProvider {
    /**
     * Fetches account-wide aggregated metrics.
     */
    getAccountSnapshots(config: any, startDate: Date, endDate: Date): Promise<AnalyticsSnapshotData[]>;
    /**
     * Fetches metrics for individual posts/URLs.
     */
    getPostMetrics(config: any, startDate: Date, endDate: Date): Promise<PostMetricData[]>;
}
export declare class GscAnalyticsAdapter implements AnalyticsProvider {
    getAccountSnapshots(config: any, startDate: Date, endDate: Date): Promise<AnalyticsSnapshotData[]>;
    getPostMetrics(config: any, startDate: Date, endDate: Date): Promise<PostMetricData[]>;
}
//# sourceMappingURL=index.d.ts.map