import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { xpEngine } from '../../apps/api/dist/services/xp-engine.js';

describe('Non-Negotiable Principle #3: Grade Immutability Suite', () => {
  beforeEach(async () => {
    await xpEngine.initializeDefaultRules();
  });
  it('Guarantees official academic grades are deeply immutable and read-only', () => {
    const grades = db.getReadOnlyOfficialGrades();
    assert.ok(Array.isArray(grades));
    assert.ok(Object.isFrozen(grades), 'Grade list must be frozen');

    for (const record of grades) {
      assert.ok(Object.isFrozen(record), `Grade record for ${record.studentId} must be frozen`);

      // Attempt mutation and assert TypeError in strict mode
      assert.throws(
        () => {
          record.officialMark = 100;
        },
        /TypeError|Cannot assign to read only property/,
        'Mutating official mark must throw TypeError'
      );

      assert.throws(
        () => {
          record.gpa = 4.0;
        },
        /TypeError|Cannot assign to read only property/,
        'Mutating GPA must throw TypeError'
      );
    }
  });

  it('Proves no database method exists to write, update, or delete official academic grades', () => {
    const dbPrototype = Object.getPrototypeOf(db);
    const dbMethods = Object.getOwnPropertyNames(dbPrototype);

    const forbiddenMethods = dbMethods.filter(method =>
      /updateGrade|writeGrade|setGrade|modifyMark|editMark|deleteGrade/i.test(method)
    );

    assert.equal(
      forbiddenMethods.length,
      0,
      `Forbidden grade write methods detected: ${forbiddenMethods.join(', ')}`
    );
  });

  it('Proves awarding 10,000 XP in game engine leaves official marks exactly unchanged', async () => {
    const gradesBefore = db.getReadOnlyOfficialGrades().map(g => ({ ...g }));

    // Award huge XP in game
    await xpEngine.awardXP({
      studentId: 'student_1',
      actionType: 'DAILY_QUIZ_COMPLETED',
      sourceType: 'TEST_SPIKE',
      sourceRef: 'spike_1',
      customAmount: 500,
      reason: 'Game reward test',
    });

    const gradesAfter = db.getReadOnlyOfficialGrades();

    assert.deepEqual(
      gradesBefore,
      gradesAfter,
      'Official academic grades and GPAs must remain 100% identical after game XP actions'
    );
  });
});
