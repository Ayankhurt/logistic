import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface SocketPayload {
  id: string;
  tenantId: string;
  guideNumber: string;
  type: 'TRACKING' | 'PICKING';
  state: string;
  messengerId?: string;
  etiquetas?: any;
  resumen?: any;
  changedBy: string;
  timestamp: string;
}

@WebSocketGateway({ namespace: '/logistics', cors: { origin: '*' } })
export class SocketsService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketsService.name);

  afterInit(): void {
    this.logger.log('Sockets Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- Join rooms dynamically ---
  @SubscribeMessage('joinTenant')
  handleJoinTenant(client: Socket, tenantId: string): void {
    void client.join(`tenant:${tenantId}`);
    this.logger.log(
      `Client ${client.id} joined tenant room: tenant:${tenantId}`,
    );
  }

  @SubscribeMessage('joinMessenger')
  handleJoinMessenger(client: Socket, messengerId: string): void {
    void client.join(`messenger:${messengerId}`);
    this.logger.log(
      `Client ${client.id} joined messenger room: messenger:${messengerId}`,
    );
  }

  @SubscribeMessage('leaveTenant')
  handleLeaveTenant(client: Socket, tenantId: string): void {
    void client.leave(`tenant:${tenantId}`);
    this.logger.log(`Client ${client.id} left tenant room: tenant:${tenantId}`);
  }

  @SubscribeMessage('leaveMessenger')
  handleLeaveMessenger(client: Socket, messengerId: string): void {
    void client.leave(`messenger:${messengerId}`);
    this.logger.log(
      `Client ${client.id} left messenger room: messenger:${messengerId}`,
    );
  }

  // --- Emit events to tenant room ---
  emitToTenant(tenantId: string, event: string, payload: SocketPayload) {
    this.server.to(`tenant:${tenantId}`).emit(event, payload);
    this.logger.log(`Event emitted: ${event} to tenant:${tenantId}`);
  }

  // --- Emit events to messenger room ---
  emitToMessenger(messengerId: string, event: string, payload: SocketPayload) {
    this.server.to(`messenger:${messengerId}`).emit(event, payload);
    this.logger.log(`Event emitted: ${event} to messenger:${messengerId}`);
  }

  // --- Specific event emitters with payload contract ---
  emitLogisticCreated(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.created', payload);
  }

  emitLogisticUpdated(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.updated', payload);
  }

  emitLogisticStateChanged(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.state.changed', payload);
  }

  emitLogisticLabelsUpdated(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.labels.updated', payload);
  }

  emitLogisticMessengerAssigned(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.messenger.assigned', payload);
    if (payload.messengerId) {
      this.emitToMessenger(payload.messengerId, 'messenger.assigned', payload);
    }
  }

  emitLogisticCheckUpdated(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.check.updated', payload);
  }

  emitLogisticCheckFinalized(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.check.finalized', payload);
  }

  emitLogisticPrinted(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.printed', payload);
  }

  emitLogisticNotificationSent(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.notification.sent', payload);
  }

  emitLogisticDuplicated(payload: SocketPayload) {
    this.emitToTenant(payload.tenantId, 'logistic.duplicated', payload);
  }
}
