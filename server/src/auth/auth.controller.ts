import { Controller, Post, Get, Body, Param, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post('guest')
  async createGuest(@Body() body: { username?: string }) {
    return this.authService.createGuestSession(body.username);
  }

  @Post('oauth-login')
  async oauthLogin(
    @Body()
    body: {
      provider: 'google' | 'github';
      email: string;
      username: string;
      avatarUrl?: string;
      providerId?: string;
    },
  ) {
    return this.authService.loginWithOAuth(
      body.provider,
      body.email,
      body.username,
      body.avatarUrl,
      body.providerId,
    );
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return this.authService.getUserProfile(id);
  }
}
