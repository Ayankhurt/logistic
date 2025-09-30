export interface LogisticRecord {
  id: string;
  tenantId: string;
  type: 'TRACKING' | 'PICKING';
  guideNumber: string;
  originType?: string | null;
  originId?: string | null;
  senderContactId: string;
  recipientContactId: string;
  carrierId?: string | null;
  messengerId?: string | null;
  state: LogisticState;
  labels: string;
  extra?: any;
  summary?: any;
  fileUri?: string | null;
  parentRecordId?: string | null;
  parent?: LogisticRecord;
  children?: LogisticRecord[];
  items?: LogisticItem[];
  audit?: AuditLog[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  checkStartedAt?: Date | null;
  checkFinalizedAt?: Date | null;
  checkFinalizedBy?: string | null;
}

export interface LogisticItem {
  id: string;
  recordId: string;
  originItemId?: string | null;
  sku?: string | null;
  name?: string | null;
  qtyExpected: number;
  qtyVerified: number;
  selected: boolean;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  recordId: string;
  action: AuditAction;
  payload?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

export type LogisticType = 'TRACKING' | 'PICKING';

export type LogisticState = 
  | 'DRAFT'
  | 'CHECK_PENDING'
  | 'CHECK_IN_PROGRESS'
  | 'CHECK_FINALIZED'
  | 'READY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type AuditAction = 
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'DUPLICATED'
  | 'STATE_CHANGED'
  | 'CHECK_VERIFIED'
  | 'CHECK_FINALIZED'
  | 'MESSENGER_ASSIGNED'
  | 'PRINTED'
  | 'NOTIFICATION_SENT';

export interface SocketPayload {
  id: string;
  tenantId: string;
  guideNumber: string;
  type: LogisticType;
  state: LogisticState;
  messengerId?: string | null;
  etiquetas: string[];
  resumen?: Record<string, any> | null;
  changedBy?: string;
  timestamp: string;
}
