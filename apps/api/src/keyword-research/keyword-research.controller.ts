import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { KeywordResearchService } from './keyword-research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

/**
 * Keyword research endpoints.
 *
 * All workspace-scoped endpoints enforce:
 *  - JWT authentication (JwtAuthGuard)
 *  - Workspace membership check (WorkspaceGuard)
 *
 * No Google credentials are exposed.
 * User input is validated before being forwarded to providers.
 */
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/keyword-research')
export class KeywordResearchController {
  constructor(private readonly keywordResearchService: KeywordResearchService) {}

  /**
   * Full keyword research for a workspace.
   * Combines suggestions, trend data, and existing GSC data.
   *
   * GET /workspaces/:workspaceId/keyword-research?q=computer+repair&lang=en&country=us
   */
  @Get()
  async research(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('lang') lang?: string,
    @Query('country') country?: string,
  ) {
    if (!q || typeof q !== 'string' || !q.trim()) {
      throw new BadRequestException('Query parameter "q" is required and cannot be empty');
    }
    // Validate and sanitise lang/country — only accept [a-z]{2} codes
    const safeLang = /^[a-zA-Z]{2}$/.test(lang || '') ? lang!.toLowerCase() : 'en';
    const safeCountry = /^[a-zA-Z]{2}$/.test(country || '') ? country!.toLowerCase() : 'us';

    return this.keywordResearchService.research(workspaceId, q.slice(0, 200), {
      language: safeLang,
      country: safeCountry,
    });
  }

  /**
   * Google Autocomplete suggestions only.
   *
   * GET /workspaces/:workspaceId/keyword-research/suggestions?q=seo+tool&lang=en&country=us
   */
  @Get('suggestions')
  async suggestions(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('lang') lang?: string,
    @Query('country') country?: string,
  ) {
    if (!q || !q.trim()) throw new BadRequestException('"q" is required');
    const safeLang = /^[a-zA-Z]{2}$/.test(lang || '') ? lang!.toLowerCase() : 'en';
    const safeCountry = /^[a-zA-Z]{2}$/.test(country || '') ? country!.toLowerCase() : 'us';
    return this.keywordResearchService.getSuggestions(q.slice(0, 200), {
      language: safeLang,
      country: safeCountry,
    });
  }

  /**
   * Google Trends interest over time for a keyword.
   *
   * GET /workspaces/:workspaceId/keyword-research/trends?q=seo+tool&country=us&days=90
   *
   * NOTE: Returns 0–100 relative interest, NOT monthly search volume.
   */
  @Get('trends')
  async trends(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('country') country?: string,
    @Query('days') days?: string,
  ) {
    if (!q || !q.trim()) throw new BadRequestException('"q" is required');
    const safeCountry = /^[a-zA-Z]{2}$/.test(country || '') ? country!.toLowerCase() : 'us';
    const safeDays = Math.min(365, Math.max(7, parseInt(days || '90', 10) || 90));
    return this.keywordResearchService.getTrend(q.slice(0, 200), {
      country: safeCountry,
      days: safeDays,
    });
  }

  /**
   * Related and rising queries from Google Trends.
   *
   * GET /workspaces/:workspaceId/keyword-research/related?q=seo+tool&country=us
   */
  @Get('related')
  async related(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('country') country?: string,
  ) {
    if (!q || !q.trim()) throw new BadRequestException('"q" is required');
    const safeCountry = /^[a-zA-Z]{2}$/.test(country || '') ? country!.toLowerCase() : 'us';
    return this.keywordResearchService.getRelatedQueries(q.slice(0, 200), { country: safeCountry });
  }

  /**
   * Compare multiple keywords by Trends interest.
   *
   * GET /workspaces/:workspaceId/keyword-research/compare?kw=seo+tool&kw=keyword+research&country=us
   */
  @Get('compare')
  async compare(
    @Param('workspaceId') workspaceId: string,
    @Query('kw') kw: string | string[],
    @Query('country') country?: string,
  ) {
    const keywords = Array.isArray(kw) ? kw : [kw];
    const safe = keywords
      .filter((k) => k && k.trim())
      .map((k) => k.slice(0, 200))
      .slice(0, 5);
    if (!safe.length) throw new BadRequestException('At least one "kw" parameter is required');
    const safeCountry = /^[a-zA-Z]{2}$/.test(country || '') ? country!.toLowerCase() : 'us';
    return this.keywordResearchService.compareKeywords(safe, { country: safeCountry });
  }
}
