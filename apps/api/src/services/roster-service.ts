import crypto from 'node:crypto';
import {
  RosterEntry,
  parseRosterCsv,
  RosterDryRunPreview,
  RosterRowInput,
} from '@msot/shared';
import { db } from '../db.js';

/**
 * Enterprise Roster Management & Claim Engine
 * Ingests institutional campus rosters, supports dry-run validation previews,
 * provides single-click rollback / undo, and binds accounts to real academic records.
 */

export class RosterService {
  /**
   * Generates a dry-run preview without committing changes to database.
   */
  previewRoster(csvContent: string): RosterDryRunPreview {
    const existingEmails = new Set<string>();
    for (const r of db.rosterEntries.values()) {
      existingEmails.add(r.email.toLowerCase());
    }
    for (const u of db.users.values()) {
      existingEmails.add(u.email.toLowerCase());
    }

    return parseRosterCsv(csvContent, existingEmails);
  }

  /**
   * Commits validated roster rows to the database and archives the import batch for rollback.
   */
  async commitRosterImport(
    rows: RosterRowInput[],
    importedBy: string
  ): Promise<{ batchId: string; importedCount: number }> {
    const batchId = `import_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const importedAt = new Date().toISOString();
    const createdEntries: RosterEntry[] = [];

    for (const row of rows) {
      const entryId = `roster_${crypto.randomBytes(8).toString('hex')}`;
      const claimToken = crypto.randomBytes(16).toString('hex');

      const entry: RosterEntry = {
        id: entryId,
        email: row.email.toLowerCase().trim(),
        fullName: row.fullName.trim(),
        rollNumber: row.rollNumber.trim(),
        campusId: row.campusId,
        batchId: row.batchId,
        sectionId: row.sectionId,
        claimToken,
        isClaimed: false,
        importedAt,
        importBatchId: batchId,
      };

      db.rosterEntries.set(entry.id, entry);
      createdEntries.push(entry);
    }

    db.rosterHistory.push({
      batchId,
      importedAt,
      rowCount: createdEntries.length,
      rows: createdEntries,
    });

    db.logAudit({
      actorId: importedBy,
      action: 'ROSTER_IMPORTED',
      targetType: 'RosterBatch',
      targetId: batchId,
      details: { rowCount: createdEntries.length },
    });

    return {
      batchId,
      importedCount: createdEntries.length,
    };
  }

  /**
   * Undoes the most recent roster import batch (reverts unclaimed entries).
   */
  async undoLastImport(undoneBy: string): Promise<{ batchId: string; revertedCount: number } | null> {
    if (db.rosterHistory.length === 0) return null;

    const lastBatch = db.rosterHistory.pop()!;
    let revertedCount = 0;

    for (const entry of lastBatch.rows) {
      const current = db.rosterEntries.get(entry.id);
      // Only revert if student has not yet claimed the account
      if (current && !current.isClaimed) {
        db.rosterEntries.delete(entry.id);
        revertedCount++;
      }
    }

    db.logAudit({
      actorId: undoneBy,
      action: 'ROSTER_IMPORT_UNDONE',
      targetType: 'RosterBatch',
      targetId: lastBatch.batchId,
      details: { revertedCount },
    });

    return {
      batchId: lastBatch.batchId,
      revertedCount,
    };
  }

  /**
   * Matches an email against the roster.
   */
  findRosterEntryByEmail(email: string): RosterEntry | undefined {
    const clean = email.toLowerCase().trim();
    return Array.from(db.rosterEntries.values()).find(
      r => r.email.toLowerCase() === clean
    );
  }

  /**
   * Matches by claim token.
   */
  findRosterEntryByClaimToken(token: string): RosterEntry | undefined {
    return Array.from(db.rosterEntries.values()).find(
      r => r.claimToken === token && !r.isClaimed
    );
  }

  /**
   * Marks a roster entry as claimed by a user.
   */
  markClaimed(rosterId: string, userId: string): boolean {
    const entry = db.rosterEntries.get(rosterId);
    if (!entry) return false;

    entry.isClaimed = true;
    entry.claimedAt = new Date().toISOString();
    entry.claimedByUserId = userId;
    db.rosterEntries.set(rosterId, entry);
    return true;
  }
}

export const rosterService = new RosterService();
