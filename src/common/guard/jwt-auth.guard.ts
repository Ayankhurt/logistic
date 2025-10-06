import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../integrations/auth/auth.service';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    try {
      // Verify token with external auth service
      const isValid = await this.authService.verifyToken(token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Decode token to get user info
      const decoded = this.jwtService.decode(token);
      request.user = decoded;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
