import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { SabotageService } from './sabotage.service';
import { AiClientService } from './ai-client.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [GameGateway, SabotageService, AiClientService, PrismaService],
  exports: [GameGateway, SabotageService, AiClientService],
})
export class GameModule {}
