import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateContentPackDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsString()
  @IsNotEmpty()
  platform!: string;

  @IsString()
  @IsNotEmpty()
  audience!: string;
}

export class UpdateContentPackDto {
  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  objective?: string;

  @IsString()
  @IsOptional()
  audience?: string;

  @IsString()
  @IsOptional()
  intent?: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  hook?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  script?: string;

  @IsString()
  @IsOptional()
  visualDirection?: string;

  @IsString()
  @IsOptional()
  cta?: string;

  @IsString()
  @IsOptional()
  hashtags?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  primaryKeyword?: string;

  @IsString()
  @IsOptional()
  secondaryKeywords?: string;

  @IsString()
  @IsOptional()
  complianceNotes?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  scheduledAt?: string | Date;
}
