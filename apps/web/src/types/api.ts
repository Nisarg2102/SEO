// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export type WorkspaceType = 'GENERAL' | 'MEDICAL';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStats {
  researchIdeas: number;
  draftContent: number;
  pendingApprovals: number;
  scheduledPosts: number;
}

export interface CreateWorkspacePayload {
  name: string;
  type: WorkspaceType;
}

// ─── Brand Profile ───────────────────────────────────────────────────────────

export interface BrandProfile {
  id: string;
  workspaceId: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  brandVoice?: string;
  primaryKeywords?: string;
  website?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertBrandProfilePayload {
  businessName: string;
  industry: string;
  targetAudience: string;
  brandVoice?: string;
  primaryKeywords?: string;
  website?: string;
  location?: string;
}

// ─── Research ────────────────────────────────────────────────────────────────

export interface ResearchItem {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  sourceUrl?: string;
  sourceName?: string;
  topic?: string;
  confidenceScore?: number;
  suggestedFormats?: string[];
  targetAudience?: string;
  intent?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ResearchFilters {
  sourceId?: string;
  topic?: string;
  search?: string;
  minConfidence?: string;
  fromDate?: string;
  toDate?: string;
}

// ─── SEO Opportunities ───────────────────────────────────────────────────────

export interface SeoOpportunity {
  id: string;
  workspaceId: string;
  keyword: string;
  currentPosition?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  recommendation: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  page?: string;
  createdAt: string;
}

// ─── Content Packs ───────────────────────────────────────────────────────────

export type ContentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'DRAFT'
  | 'CLINICAL_REVIEW_REQUIRED'
  | 'PROFESSIONALLY_REVIEWED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED';

export interface ContentPack {
  id: string;
  workspaceId: string;
  topic: string;
  platform: string;
  audience?: string;
  objective?: string;
  intent?: string;
  hook?: string;
  caption?: string;
  script?: string;
  visualDirection?: string;
  cta?: string;
  hashtags?: string;
  seoTitle?: string;
  metaDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  complianceNotes?: string;
  status: ContentStatus;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateContentPayload {
  topic: string;
  platform: string;
  audience: string;
}

export interface UpdateContentPayload {
  topic?: string;
  objective?: string;
  audience?: string;
  intent?: string;
  platform?: string;
  hook?: string;
  caption?: string;
  script?: string;
  visualDirection?: string;
  cta?: string;
  hashtags?: string;
  seoTitle?: string;
  metaDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  complianceNotes?: string;
  status?: ContentStatus;
  scheduledAt?: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  totalClicks?: number;
  totalImpressions?: number;
  averagePosition?: number;
  averageCtr?: number;
  socialAccounts?: SocialAccount[];
  recentMetrics?: unknown[];
}

export interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export interface Source {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
}

export interface CreateSourcePayload {
  name: string;
  url: string;
  type?: string;
}

export interface UpdateSourcePayload {
  name?: string;
  url?: string;
  isActive?: boolean;
}

// ─── AI Agent ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentChatResponse {
  response: string;
  actions?: AgentAction[];
}

export interface AgentAction {
  type: string;
  description: string;
  data?: unknown;
  requiresConfirmation?: boolean;
}

// ─── Generic API ─────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  message: string;
  statusCode?: number;
  error?: string;
}
