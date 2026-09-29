import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async checkDatabaseConnection(): Promise<string> {
    if (!process.env.DATABASE_URL) {
      return 'DATABASE_URL not configured';
    }
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return 'connected';
    } catch (error) {
      this.logger.error('Database connection failed', error);
      return 'disconnected';
    }
  }
}
