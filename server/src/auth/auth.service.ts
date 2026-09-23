import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async createGuestSession(requestedName?: string) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestId = `guest_${Date.now()}_${randomSuffix.toLowerCase()}`;
    const username = requestedName?.trim() || `Agent_${randomSuffix}`;

    return {
      token: `token_${guestId}`,
      user: {
        id: guestId,
        username,
        provider: 'guest',
        isGuest: true,
      },
    };
  }

  async loginWithOAuth(provider: 'google' | 'github', email: string, username: string, avatarUrl?: string, providerId?: string) {
    const pId = providerId || `${provider}_${email || username}`;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { providerId: pId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email || null,
          username,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          provider,
          providerId: pId,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    }

    return {
      token: `auth_${user.id}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        isGuest: false,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        matches: {
          orderBy: { aiScore: 'asc' },
          take: 5,
        },
      },
    });

    return user;
  }
}
