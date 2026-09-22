import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class LeaderboardGateway {
  @WebSocketServer()
  server: Server;

  broadcastLeaderboardUpdate(tournamentId: string, data: any) {
    if (this.server) {
      this.server.emit(`leaderboard:${tournamentId}`, data);
    }
  }

  broadcastScoreUpdate(tournamentId: string, data: any) {
    if (this.server) {
      this.server.emit(`scores:${tournamentId}`, data);
      this.server.emit(`leaderboard:${tournamentId}`, data);
    }
  }
}
