import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertBrandProfileDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  targetAudience!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  tone!: string;

  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  services?: string;

  @IsString()
  @IsOptional()
  website?: string;
}
