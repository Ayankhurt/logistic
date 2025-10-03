import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  validateToken(
    token: string,
  ): { id: string; name: string; roles: string[] } | null {
    // TODO: Replace with real JWT validation
    // For now, return a mock user
    if (!token) return null;
    return { id: 'user-id-123', name: 'Demo User', roles: [] };
  }
}
