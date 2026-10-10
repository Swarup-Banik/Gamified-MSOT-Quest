import { TeamEvent, BattleEventType } from '@msot/shared';
import { db } from '../db.js';
import { redis } from '../redis.js';

export interface BattleSubmissionPayload {
  eventId: string;
  studentId: string;
  teamId: string;
  points: number;
}

export class BattlesService {
  /**
   * Initializes starter team battle and co-op raid boss events
   */
  async initializeDefaultEvents(): Promise<void> {
    const defaultEvents: TeamEvent[] = [
      {
        id: 'event_battle_1',
        title: 'Section Clash: Algorithms Sprint',
        type: 'SECTION_VS_SECTION',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        minParticipationRate: 0.6, // 60% floor
        teams: [
          {
            id: 'team_sec_a',
            name: 'Section A Cyberhawks',
            score: 1240,
            participantCount: 18,
            totalEligibleCount: 25,
            participationRate: 0.72,
            isQualifiedForBonus: true,
          },
          {
            id: 'team_sec_b',
            name: 'Section B Code Titans',
            score: 1180,
            participantCount: 12,
            totalEligibleCount: 25,
            participationRate: 0.48,
            isQualifiedForBonus: false, // Under 60% participation floor!
          },
        ],
      },
      {
        id: 'event_raid_boss_1',
        title: 'Class Raid: The Distributed Monolith',
        type: 'RAID_BOSS',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        minParticipationRate: 0.5,
        bossMaxHp: 50000,
        bossCurrentHp: 34200,
        teams: [
          {
            id: 'team_cohort_main',
            name: 'Batch 2025 Combined Vanguard',
            score: 15800,
            participantCount: 142,
            totalEligibleCount: 200,
            participationRate: 0.71,
            isQualifiedForBonus: true,
          },
        ],
      },
    ];

    for (const evt of defaultEvents) {
      if (!db.teamEvents.has(evt.id)) {
        db.teamEvents.set(evt.id, evt);
      }
    }
  }

  /**
   * Submits points to a team battle or inflicts damage on the class raid boss.
   * Broadcasts live scoreboard updates via Redis / WebSockets within sub-2-second target.
   */
  async submitBattlePoints(payload: BattleSubmissionPayload): Promise<{
    event: TeamEvent;
    pointsAwarded: number;
    teamQualified: boolean;
    bossRemainingHp?: number;
  }> {
    const event = db.teamEvents.get(payload.eventId);
    if (!event) throw new Error('Battle event not found');

    const team = event.teams.find(t => t.id === payload.teamId);
    if (!team) throw new Error('Team not found in this battle event');

    // Add points
    team.score += payload.points;
    team.participantCount = Math.min(team.totalEligibleCount, team.participantCount + 1);
    team.participationRate = Math.round((team.participantCount / team.totalEligibleCount) * 100) / 100;
    team.isQualifiedForBonus = team.participationRate >= event.minParticipationRate;

    // If Raid Boss mode, reduce boss HP
    if (event.type === 'RAID_BOSS' && event.bossCurrentHp !== undefined) {
      event.bossCurrentHp = Math.max(0, event.bossCurrentHp - payload.points);
    }

    db.teamEvents.set(event.id, event);

    // Broadcast live event update to WebSocket subscribers (< 2000ms latency)
    await redis.publish(
      `scoreboard:event:${event.id}`,
      JSON.stringify({
        eventId: event.id,
        teamId: team.id,
        newScore: team.score,
        participationRate: team.participationRate,
        isQualified: team.isQualifiedForBonus,
        bossCurrentHp: event.bossCurrentHp,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      event,
      pointsAwarded: payload.points,
      teamQualified: team.isQualifiedForBonus,
      bossRemainingHp: event.bossCurrentHp,
    };
  }
}

export const battlesService = new BattlesService();
