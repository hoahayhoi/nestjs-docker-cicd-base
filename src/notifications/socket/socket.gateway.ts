import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { UserEvents } from './socket.event';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  // Sử dụng Map<number, Socket> thay vì Map<string, Socket>
  private clients: Map<number, Socket> = new Map();

  handleConnection(client: Socket) {
    try {
      // Parse userId sang number
      const userId = parseInt(client.handshake.query.userId as string);

      if (!isNaN(userId)) {
        this.clients.set(userId, client);
        console.log(`Client connected: ${userId}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      client.disconnect();
    }
  }

  sendToUser(userId: number, event: UserEvents, data: any) {
    const client = this.clients.get(userId);

    if (client) {
      client.emit(event, data);
    }
  }
}
