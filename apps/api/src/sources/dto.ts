import { IsString, IsUrl, IsIn, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export const VALID_SOURCE_TYPES = ['rss', 'atom', 'website', 'news', 'other'] as const;
export const VALID_SOURCE_TIERS = ['tier1', 'tier2', 'tier3'] as const;

export class CreateSourceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsUrl({}, { message: 'url must be a valid URL starting with http:// or https://' })
  @MaxLength(2048)
  url!: string;

  @IsIn(VALID_SOURCE_TYPES, { message: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}` })
  sourceType!: string;

  @IsIn(VALID_SOURCE_TIERS, { message: `sourceTier must be one of: ${VALID_SOURCE_TIERS.join(', ')}` })
  sourceTier!: string;
}

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'url must be a valid URL' })
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsIn(VALID_SOURCE_TIERS)
  sourceTier?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  active?: boolean;
}
