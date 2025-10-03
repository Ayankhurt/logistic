// src/logistic/interfaces/logistic.interface.ts

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

export interface LogisticItem {
  id: string;
  recordId: string;
  originItemId?: string;
  sku?: string;
  name?: string;
  qtyExpected: number;
  qtyVerified: number;
  selected: boolean;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  recordId: string;
  action: string;
  payload?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

export interface LogisticRecord {
  id: string;
  tenantId: string;
  type: LogisticType;
  guideNumber: string;
  originType?: string;
  originId?: string;
  senderContactId: string;
  recipientContactId: string;
  carrierId?: string;
  messengerId?: string;
  state: LogisticState;
  labels: string[];
  extra?: Record<string, any>;
  summary?: Record<string, any>;
  fileUri?: string;
  parentRecordId?: string;
  children?: LogisticRecord[];
  items: LogisticItem[];
  audit: AuditLog[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  checkStartedAt?: Date;
  checkFinalizedAt?: Date;
  checkFinalizedBy?: string;
}
