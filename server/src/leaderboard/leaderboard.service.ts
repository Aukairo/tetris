import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async getTopRecords(limit: number = 20, mode: 'all' | 'permanent' | 'guest' = 'all') {
    const whereClause: any = {};
    if (mode === 'permanent') {
      whereClause.userId = { not: null };
    } else if (mode === 'guest') {
      whereClause.userId = null;
    }

    const records = await this.prisma.matchRecord.findMany({
      where: whereClause,
      orderBy: [
        { aiScore: 'asc' },           // Primary: Lowest AI score wins!
        { durationSeconds: 'asc' },   // Secondary: Fastest sabotage wins
        { piecesPlaced: 'asc' },      // Tertiary: Fewest pieces placed
      ],
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            provider: true,
          },
        },
      },
    });

    return records.map((rec, index) => ({
      rank: index + 1,
      id: rec.id,
      playerName: rec.user?.username || rec.playerName,
      avatarUrl: rec.user?.avatarUrl,
      provider: rec.user?.provider || 'guest',
      aiScore: rec.aiScore,
      durationSeconds: rec.durationSeconds,
      piecesPlaced: rec.piecesPlaced,
      linesCleared: rec.linesCleared,
      sabotagesUsed: rec.sabotagesUsed,
      completedEarly: rec.completedEarly,
      timeoutPenalty: rec.timeoutPenalty,
      createdAt: rec.createdAt,
    }));
  }

  async claimGuestScores(guestSessionId: string, userId: string, username: string) {
    const updated = await this.prisma.matchRecord.updateMany({
      where: {
        guestSessionId,
        userId: null,
      },
      data: {
        userId,
        playerName: username,
      },
    });

    return {
      claimedCount: updated.count,
    };
  }

  async getStats() {
    const totalMatches = await this.prisma.matchRecord.count();
    const bestRecord = await this.prisma.matchRecord.findFirst({
      orderBy: { aiScore: 'asc' },
    });

    return {
      totalMatches,
      lowestScoreRecord: bestRecord?.aiScore ?? 0,
      bestSaboteur: bestRecord?.playerName ?? 'None',
    };
  }
}
