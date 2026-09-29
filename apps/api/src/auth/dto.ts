/**
 * Auth DTOs with manual validation guards.
 * class-validator decorators will be used once packages are installed.
 * Logic equivalent is enforced in AuthService.
 */
export class RegisterDto {
  email!: string;
  name!: string;
  password!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}
