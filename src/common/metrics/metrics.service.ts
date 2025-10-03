import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private registry = new Registry();

  // HTTP request metrics
  public httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  public httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  // Custom business metrics
  public recordsCreatedTotal = new Counter({
    name: 'logistic_records_created_total',
    help: 'Total number of logistic records created',
    labelNames: ['type'],
    registers: [this.registry],
  });

  public recordsUpdatedTotal = new Counter({
    name: 'logistic_records_updated_total',
    help: 'Total number of logistic records updated',
    labelNames: ['type'],
    registers: [this.registry],
  });

  public socketEventsTotal = new Counter({
    name: 'socket_events_total',
    help: 'Total number of socket events emitted',
    labelNames: ['event_type'],
    registers: [this.registry],
  });

  public activeConnections = new Gauge({
    name: 'active_socket_connections',
    help: 'Number of active socket connections',
    registers: [this.registry],
  });

  onModuleInit() {
    // Register default metrics
    this.registry.registerMetric(this.httpRequestsTotal);
    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.recordsCreatedTotal);
    this.registry.registerMetric(this.recordsUpdatedTotal);
    this.registry.registerMetric(this.socketEventsTotal);
    this.registry.registerMetric(this.activeConnections);
  }

  getMetrics() {
    return this.registry.metrics();
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  recordHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  incrementRecordsCreated(type: string) {
    this.recordsCreatedTotal.inc({ type });
  }

  incrementRecordsUpdated(type: string) {
    this.recordsUpdatedTotal.inc({ type });
  }

  incrementSocketEvents(eventType: string) {
    this.socketEventsTotal.inc({ event_type: eventType });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }
}
