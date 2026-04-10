import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EvolutionService } from '../evolution/evolution.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CollaborationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly evolutionService: EvolutionService) {}

  @SubscribeMessage('content:update')
  handleContentUpdate(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Broadcast content changes to other participants in the same session
    client.to(data.sessionId).emit('content:sync', data);
  }

  @SubscribeMessage('session:join')
  handleJoinSession(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.sessionId);
    console.log(`Client ${client.id} joined session ${data.sessionId}`);
  }

  @SubscribeMessage('ai:suggest')
  async handleAiSuggest(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Call evolution service or a specific suggest function
    // For now, reuse evolveContent with a "suggestion" prompt
    const suggestion = await this.evolutionService.evolveContent(data.contentId, {
      ...data.context,
      researchUpdates: `Teacher requested a suggestion for this part: ${data.selectedText}`,
    });

    client.emit('ai:suggestion', suggestion);
  }
}

// Module definition
import { Module } from '@nestjs/common';

@Module({
  providers: [CollaborationGateway],
  imports: [EvolutionModule],
})
export class CollaborationModule {}
import { EvolutionModule } from '../evolution/evolution.module';
