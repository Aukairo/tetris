import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [GameModule, LeaderboardModule, AuthModule],
  providers: [PrismaService],
})
export class AppModule {}
