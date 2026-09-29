export class GenerateContentPackDto {
  topic!: string;
  platform!: string;
  audience!: string;
}

export class UpdateContentPackDto {
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
  status?: string;
  scheduledAt?: string | Date;
}
