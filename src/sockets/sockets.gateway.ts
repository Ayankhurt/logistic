import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/logistics',
  cors: { origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean) },
})
export class SocketsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const { tenantId, messengerId } = client.handshake.auth ?? {};
    if (tenantId) client.join(`tenant:${tenantId}`);
    if (messengerId) client.join(`messenger:${messengerId}`);
  }

  emitEvent(
    event: string,
    payload: any & { tenantId: string; messengerId?: string | null },
  ) {
    const { tenantId, messengerId } = payload;
    this.server.to(`tenant:${tenantId}`).emit(event, payload);
    if (messengerId) {
      this.server.to(`messenger:${messengerId}`).emit(event, payload);
    }
  }
}