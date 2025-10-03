import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[] = []) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { roles?: string[] } }>();
    const user = request.user;

    if (!user) return false;
    if (!this.roles.length) return true;

    return this.roles.some((role) => (user.roles ?? []).includes(role));
  }
}
