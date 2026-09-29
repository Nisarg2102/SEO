import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

const VALID_WORKSPACE_TYPES = ['GENERAL', 'MEDICAL'] as const;
export type WorkspaceType = typeof VALID_WORKSPACE_TYPES[number];

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_WORKSPACE_TYPES)
  type!: string;
}

// Type field removed — users cannot change workspace type post-creation
export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export function validateWorkspaceType(type: string): boolean {
  return (VALID_WORKSPACE_TYPES as readonly string[]).includes(type);
}
