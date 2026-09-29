import { Injectable, Logger } from '@nestjs/common';
import { PostizAdapter, SocialProvider, ScheduledPost } from '@ai-marketing/social';

@Injectable()
export class SocialService {
  private readonly provider: SocialProvider;
  private readonly logger = new Logger(SocialService.name);

  constructor() {
    this.provider = new PostizAdapter();
  }

  async schedulePost(post: ScheduledPost): Promise<string> {
    try {
      this.logger.log(`Scheduling post ${post.id} via Postiz`);
      return await this.provider.createPost(post);
    } catch (e) {
      this.logger.error(`Failed to schedule post ${post.id}`, e);
      throw e;
    }
  }

  async updatePost(externalId: string, post: ScheduledPost): Promise<void> {
    try {
      this.logger.log(`Updating post ${externalId} via Postiz`);
      await this.provider.updatePost(externalId, post);
    } catch (e) {
      this.logger.error(`Failed to update post ${externalId}`, e);
      throw e;
    }
  }

  async cancelPost(externalId: string): Promise<void> {
    try {
      this.logger.log(`Canceling post ${externalId} via Postiz`);
      await this.provider.cancelPost(externalId);
    } catch (e) {
      this.logger.error(`Failed to cancel post ${externalId}`, e);
      throw e;
    }
  }

  async syncStatus(externalId: string): Promise<string> {
    try {
      return await this.provider.getPostStatus(externalId);
    } catch (e) {
      this.logger.error(`Failed to get status for ${externalId}`, e);
      throw e;
    }
  }
}
