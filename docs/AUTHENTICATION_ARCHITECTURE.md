# Authentication & Authorization Architecture

## Overview
The AI Marketing & SEO Assistant utilizes a robust, stateless JWT-based authentication system built with NestJS, Passport, and bcrypt. The frontend acts as a decoupled client that stores tokens and interacts with the API via the `Authorization: Bearer <token>` header.

## Database Additions
- **User Model:** Added `password_hash` (bcrypt) and `role` (default: 'USER', can be 'ADMIN').
- **WorkspaceMember Model:** Uses `role` to specify access levels ('OWNER', 'EDITOR', 'VIEWER').

## Security Practices
- **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using `bcrypt` (10 rounds) before being persisted.
- **Stateless Sessions:** JWTs are issued upon successful login/registration. The backend verifies them symmetrically using `JWT_SECRET`.
- **Zero Frontend Secrets:** Passwords and secrets never leak to the Next.js frontend. The frontend only receives the JWT and non-sensitive user identity details.

## Backend Implementation (`apps/api`)

### `AuthModule`
Encapsulates all authentication logic.
- **`AuthService`**: Handles business logic for `register(dto)` and `login(dto)`. Throws standard HTTP exceptions for invalid passwords or duplicate users.
- **`AuthController`**: Exposes POST endpoints for `/auth/register` and `/auth/login`.

### Guards & Strategies
1. **`JwtStrategy`**: Validates the incoming JWT and attaches the `{ userId, email, role }` payload to the Request object (`req.user`).
2. **`JwtAuthGuard`**: Applied to protected routes to ensure the request contains a valid JWT.
3. **`WorkspaceGuard`**: Extracts `workspaceId` from the route params/query and verifies that the `req.user.userId` has a valid membership in `workspace_members`. If valid, it allows access and attaches the specific workspace role (e.g., 'EDITOR') to `req.workspaceRole` for finer-grained RBAC controls.

## Frontend Implementation (`apps/web`)
The Next.js frontend acts as the consumer.
1. The user fills out the login/register forms.
2. The frontend makes a POST request to `/auth/login` or `/auth/register`.
3. Upon success, the frontend stores the returned `accessToken` in a secure context (e.g., memory, secure HTTP-only cookies via Next.js server actions, or `localStorage` depending on strict CSRF requirements).
4. The frontend attaches the token as a `Bearer` header on all subsequent API requests.
5. **Logout** is handled by simply destroying the token on the client.

## Testing Strategy
Comprehensive tests have been added to the codebase:
- **Registration**: Verifies successful user creation and prevents duplicate emails.
- **Login**: Verifies successful login and explicitly asserts that invalid passwords or unknown users trigger `UnauthorizedException`.
- **Workspace Access**: `WorkspaceGuard` unit tests verify that members are correctly allowed access and non-members are explicitly blocked with `ForbiddenException`.
