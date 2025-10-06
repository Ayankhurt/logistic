import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('verify')
  verify(@Headers('authorization') token: string) {
    const isValid = this.authService.verifyToken(token);
    return { valid: isValid };
  }
}
