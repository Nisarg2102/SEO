import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertBrandProfileDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  industry!: string;

  @IsString()
  @IsNotEmpty()
  targetAudience!: string;

  @IsString()
  @IsOptional()
  brandVoice?: string;

  @IsString()
  @IsOptional()
  primaryKeywords?: string;

  @IsString()
  @IsOptional()
  website?: string;
}
