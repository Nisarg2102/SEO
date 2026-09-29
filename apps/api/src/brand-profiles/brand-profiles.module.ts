import { Module } from '@nestjs/common';
import { BrandProfilesService } from './brand-profiles.service';
import { BrandProfilesController } from './brand-profiles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrandProfilesController],
  providers: [BrandProfilesService],
})
export class BrandProfilesModule {}
