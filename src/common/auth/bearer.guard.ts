import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');

    // MOCK: accept any token, parse tenant from header for now
    req.user = { id: 'user-1', name: 'Mock User', tenantId: req.headers['x-tenant-id'] ?? 'tenant-1' };
    if (!req.user.tenantId) throw new UnauthorizedException('Missing tenant');
    return true;
  }
}