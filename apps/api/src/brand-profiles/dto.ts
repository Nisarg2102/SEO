export class UpsertBrandProfileDto {
  businessName!: string;
  description!: string;
  targetAudience!: string;
  location!: string;
  tone!: string;
  language!: string;
  industry?: string;
  services?: string;
  website?: string;
}
