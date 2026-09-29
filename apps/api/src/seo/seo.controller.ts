import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('health')
  async health() {
    const isHealthy = await this.seoService.healthCheck();
    return {
      status: isHealthy ? 'ok' : 'error',
      service: 'openseo'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('keywords')
  async keywordResearch(@Query('q') query: string) {
    return this.seoService.keywordResearch(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('audit')
  async siteAudit(@Body('url') url: string) {
    return this.seoService.siteAudit(url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('competitors')
  async competitorResearch(@Query('domain') domain: string) {
    return this.seoService.competitorResearch(domain);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rank')
  async rankTracking(@Body() data: { domain: string, keywords: string[] }) {
    return this.seoService.rankTracking(data.domain, data.keywords);
  }
}
