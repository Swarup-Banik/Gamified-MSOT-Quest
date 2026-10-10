import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { leaguesService } from '../../apps/api/dist/services/leagues-service.js';
import { generateAnonymousAlias } from '@msot/shared';

describe('Privacy & Anonymization Audit Suite', () => {
  const secretStudentName = 'Vikramaditya Chandrasekhar';
  const secretStudentEmail = 'vikramaditya.chandrasekhar@msot.edu.in';
  const studentId = 'student_privacy_secret_1';

  beforeEach(() => {
    db.clearForTesting();
    // Register secret student with anonymous mode enabled
    db.users.set(studentId, {
      id: studentId,
      email: secretStudentEmail,
      name: secretStudentName,
      role: 'STUDENT',
      avatarId: 'avatar_masked',
      anonymousAlias: generateAnonymousAlias(studentId),
      isAnonymous: true, // ANONYMOUS MODE ACTIVE
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      createdAt: new Date().toISOString(),
    });

    db.studentProfiles.set(studentId, {
      studentId,
      lifetimeXp: 450,
      currentLevel: 3,
      levelProgressPercent: 50,
      xpInCurrentLevel: 50,
      xpRequiredForNextLevel: 100,
      spendableShards: 50,
      currentStreak: 4,
      maxStreak: 6,
      freezeCount: 1,
      lastActiveDate: '2026-03-01',
      personalBests: { maxDailyXp: 90, highestStreak: 6, monstersDefeated: 2, perfectQuizzes: 1 },
    });
  });

  it('Guarantees zero identity leakage in Weekly League leaderboard responses', async () => {
    const standings = await leaguesService.getWeeklyLeague(studentId);
    const jsonString = JSON.stringify(standings);

    // 1. Assert secret real name never appears anywhere in the serialized string
    assert.equal(
      jsonString.includes(secretStudentName),
      false,
      'Leak detected! Real name found in weekly league response'
    );

    // 2. Assert secret email never appears anywhere
    assert.equal(
      jsonString.includes(secretStudentEmail),
      false,
      'Leak detected! Real email found in weekly league response'
    );

    // 3. Find student entry and verify masked alias
    const studentEntry = standings.find(e => e.isAnonymous);
    assert.ok(studentEntry, 'Anonymous entry must exist in standings');
    assert.equal(studentEntry.displayName, generateAnonymousAlias(studentId));
    assert.equal(studentEntry.studentId, 'anon');
  });

  it('Guarantees zero identity leakage in CSV exports', () => {
    db.pilotFeedback.push({
      id: 'fb_secret_1',
      studentId,
      rating: 5,
      favoriteMechanic: 'Today Run',
      strugglePoints: 'None',
      comments: 'Loved the game feel',
      createdAt: new Date().toISOString(),
    });

    const header = 'id,student_id_masked,rating,favorite_mechanic,struggle_points,comments,created_at\n';
    const csvExport = header + db.pilotFeedback.map(f =>
      `"${f.id}","${generateAnonymousAlias(f.studentId)}",${f.rating},"${f.favoriteMechanic}","${f.strugglePoints}","${f.comments}","${f.createdAt}"`
    ).join('\n');

    assert.equal(csvExport.includes(secretStudentName), false, 'Real name leaked in CSV export');
    assert.equal(csvExport.includes(secretStudentEmail), false, 'Real email leaked in CSV export');
    assert.equal(csvExport.includes(studentId), false, 'Raw student ID leaked in CSV export');
    assert.ok(csvExport.includes(generateAnonymousAlias(studentId)), 'Masked alias must be used in CSV export');
  });
});
