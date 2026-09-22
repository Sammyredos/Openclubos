import { Controller, Inject, forwardRef } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ScoresService } from './scores.service';

@Controller()
export class LeaderboardGrpcController {
  constructor(
    @Inject(forwardRef(() => ScoresService))
    private readonly scoresService: ScoresService,
  ) {}

  @GrpcMethod('LeaderboardService', 'GetLeaderboard')
  async getLeaderboard(data: { tournamentId: string }) {
    const scores = await this.scoresService.findByTournament(data.tournamentId);
    return {
      tournamentId: data.tournamentId,
      scores: [],
    };
  }
}
