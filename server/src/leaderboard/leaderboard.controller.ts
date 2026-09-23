import { Controller, Get, Post, Body, Query, Inject } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(
    @Inject(LeaderboardService)
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get()
  async getLeaderboard(
    @Query('limit') limit?: string,
    @Query('mode') mode?: 'all' | 'permanent' | 'guest',
  ) {
    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    return this.leaderboardService.getTopRecords(parsedLimit, mode || 'all');
  }

  @Get('stats')
  async getStats() {
    return this.leaderboardService.getStats();
  }

  @Post('claim')
  async claimGuestScores(
    @Body() body: { guestSessionId: string; userId: string; username: string },
  ) {
    return this.leaderboardService.claimGuestScores(body.guestSessionId, body.userId, body.username);
  }
}
