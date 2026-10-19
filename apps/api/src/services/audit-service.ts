import crypto from 'node:crypto';
import { AuthAuditEvent } from '@msot/shared';
import { db } from '../db.js';

/**
 * Enterprise Audit Logging Service
 * Records every authentication event, privilege escalation, role modification,
 * and faculty view of sensitive student records with complete data hygiene.
 */

export interface LogAuditEventParams {
  userId?: string;
  actorId?: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Sanitizes metadata to strictly ensure credentials and raw tokens are never persisted in logs.
   */
  private sanitizeMetadata(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('credential') ||
        lower.includes('recoverycode')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Records an immutable audit log entry.
   */
  logEvent(params: LogAuditEventParams): AuthAuditEvent {
    const event: AuthAuditEvent = {
      id: `audit_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
      timestamp: new Date().toISOString(),
      userId: params.userId,
      actorId: params.actorId || params.userId,
      action: params.action,
      status: params.status,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Unknown Device',
      metadata: this.sanitizeMetadata(params.metadata),
    };

    db.authAuditEvents.push(event);
    return event;
  }

  /**
   * Retrieves audit logs with comprehensive filtering for Admin compliance review.
   */
  queryEvents(filters: {
    userId?: string;
    action?: string;
    status?: 'SUCCESS' | 'FAILURE';
    sinceDate?: string;
    limit?: number;
    offset?: number;
  }): { events: AuthAuditEvent[]; total: number } {
    let list = db.authAuditEvents.slice();

    if (filters.userId) {
      list = list.filter(
        e => e.userId === filters.userId || e.actorId === filters.userId
      );
    }

    if (filters.action) {
      list = list.filter(e => e.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }

    if (filters.status) {
      list = list.filter(e => e.status === filters.status);
    }

    if (filters.sinceDate) {
      const sinceMs = new Date(filters.sinceDate).getTime();
      list = list.filter(e => new Date(e.timestamp).getTime() >= sinceMs);
    }

    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = list.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { events: paginated, total };
  }
}

export const auditService = new AuditService();
