import {
  Campus,
  Batch,
  Section,
  Course,
  Topic,
  Question,
  User,
  MonsterSpecies,
  generateAnonymousAlias,
} from '@msot/shared';
import { db } from '../db.js';
import { xpEngine } from '../services/xp-engine.js';
import { cosmeticsService } from '../services/cosmetics-service.js';
import { battlesService } from '../services/battles-service.js';

export async function runSeed(): Promise<{
  studentsCount: number;
  campusesCount: number;
  questionsCount: number;
  topicsCount: number;
}> {
  console.log('🌱 Starting MSOT Quest master database seed...');

  // 1. Initialize Rules & Catalogs
  await xpEngine.initializeDefaultRules();
  await cosmeticsService.initializeDefaultCosmetics();
  await battlesService.initializeDefaultEvents();

  // 2. Campuses (4 Campuses)
  const campuses: Campus[] = [
    { id: 'campus_1', code: 'CAMPUS_MAIN', name: 'MSOT Main Campus', city: 'Bengaluru' },
    { id: 'campus_2', code: 'CAMPUS_CITY', name: 'MSOT City Campus', city: 'New Delhi' },
    { id: 'campus_3', code: 'CAMPUS_NORTH', name: 'MSOT North Tech Campus', city: 'Chandigarh' },
    { id: 'campus_4', code: 'CAMPUS_CYBER', name: 'MSOT Cyber Valley Campus', city: 'Hyderabad' },
  ];
  for (const c of campuses) db.campuses.set(c.id, c);

  // 3. Batches & Sections
  const batches: Batch[] = [];
  const sections: Section[] = [];

  for (const c of campuses) {
    for (const year of [2024, 2025, 2026]) {
      const batchId = `batch_${c.id}_${year}`;
      const batch: Batch = { id: batchId, campusId: c.id, name: `Batch ${year}`, year };
      batches.push(batch);
      db.batches.set(batchId, batch);

      for (const sec of ['A', 'B', 'C']) {
        const secId = `sec_${batchId}_${sec}`;
        const section: Section = { id: secId, batchId, name: `Section ${sec}` };
        sections.push(section);
        db.sections.set(secId, section);
      }
    }
  }

  // 4. Courses & Syllabus Topics
  const courses: Course[] = [
    { id: 'course_dsa', code: 'CS201', title: 'Data Structures & Algorithms', description: 'Mastering arrays, recursion, trees, and dynamic programming' },
    { id: 'course_web', code: 'CS301', title: 'Modern Web Architecture', description: 'Building resilient full-stack distributed web systems' },
    { id: 'course_db', code: 'CS401', title: 'Database Systems & Distributed Storage', description: 'ACID transactions, indexing, sharding, and consensus' },
  ];
  for (const co of courses) db.courses.set(co.id, co);

  const topics: Topic[] = [
    // CS201 Topics
    { id: 'topic_arrays', courseId: 'course_dsa', weekNumber: 1, title: 'Arrays & Two Pointers', description: 'In-place array manipulations and sliding windows', orderIndex: 1, isActive: true },
    { id: 'topic_linked_lists', courseId: 'course_dsa', weekNumber: 2, title: 'Linked Lists & Pointers', description: 'Fast-slow pointers and cycle detection', orderIndex: 2, isActive: true },
    { id: 'topic_stacks', courseId: 'course_dsa', weekNumber: 3, title: 'Stacks, Queues & Monotonic Structures', description: 'LIFO evaluation and next greater element', orderIndex: 3, isActive: true },
    { id: 'topic_recursion', courseId: 'course_dsa', weekNumber: 4, title: 'Recursion & Backtracking', description: 'Call-stack recursion trees, subsets, permutations', orderIndex: 4, isActive: true },
    { id: 'topic_trees', courseId: 'course_dsa', weekNumber: 5, title: 'Binary Trees & BSTs', description: 'DFS/BFS traversals, lowest common ancestor', orderIndex: 5, isActive: false },
    { id: 'topic_graphs', courseId: 'course_dsa', weekNumber: 6, title: 'Graphs & Shortest Paths', description: 'Dijkstra, BFS, topological sorting', orderIndex: 6, isActive: false },

    // CS301 Topics
    { id: 'topic_async_js', courseId: 'course_web', weekNumber: 1, title: 'Asynchronous JavaScript & Event Loop', description: 'Microtasks, macrotasks, and Promises', orderIndex: 1, isActive: true },
    { id: 'topic_http_rest', courseId: 'course_web', weekNumber: 2, title: 'HTTP/2, REST & WebSockets', description: 'Stateless communication and bidirectional streaming', orderIndex: 2, isActive: true },
    { id: 'topic_state_mgmt', courseId: 'course_web', weekNumber: 3, title: 'React Core & State Management', description: 'Reconciliation, hooks, and virtual DOM', orderIndex: 3, isActive: true },

    // CS401 Topics
    { id: 'topic_sql_indexing', courseId: 'course_db', weekNumber: 1, title: 'Relational Schemas & B-Tree Indexing', description: 'Composite indexes, query planners, EXPLAIN', orderIndex: 1, isActive: true },
    { id: 'topic_acid', courseId: 'course_db', weekNumber: 2, title: 'ACID Transactions & Isolation Levels', description: 'Dirty reads, MVCC, and write-ahead logs', orderIndex: 2, isActive: true },
  ];
  for (const t of topics) db.topics.set(t.id, t);

  // 5. Monster Species per Topic
  for (const topic of topics) {
    const speciesCommon: MonsterSpecies = {
      id: `spec_common_${topic.id}`,
      topicId: topic.id,
      name: `${topic.title.split(' ')[0]} Gremlin`,
      title: 'Curriculum Phantom',
      rarity: 'COMMON',
      imageUrl: '/monsters/common-gremlin.svg',
      lore: `A restless spirit spawned by edge cases in ${topic.title}.`,
    };
    const speciesElite: MonsterSpecies = {
      id: `spec_elite_${topic.id}`,
      topicId: topic.id,
      name: `Colossal ${topic.title.split(' ')[0]} Chimera`,
      title: 'Topic Tormentor',
      rarity: 'ELITE',
      imageUrl: '/monsters/elite-chimera.svg',
      lore: `Forged from multiple repeated oversights in ${topic.title}.`,
    };
    const speciesBoss: MonsterSpecies = {
      id: `spec_boss_${topic.id}`,
      topicId: topic.id,
      name: `The Archon of ${topic.title.split(' ')[0]}`,
      title: 'Course End Boss',
      rarity: 'BOSS',
      imageUrl: '/monsters/boss-archon.svg',
      lore: `The ultimate challenge guardian of ${topic.title}.`,
    };
    db.monsterSpecies.set(speciesCommon.id, speciesCommon);
    db.monsterSpecies.set(speciesElite.id, speciesElite);
    db.monsterSpecies.set(speciesBoss.id, speciesBoss);
  }

  // 6. Generate 200+ Curriculum Questions across topics, difficulties, and English/Hinglish
  let questionCount = 0;
  for (const topic of topics) {
    // Generate ~20 questions per topic (11 topics * 20 = 220+ questions)
    for (let i = 1; i <= 20; i++) {
      const qId = `q_${topic.id}_${i}`;
      const isHard = i % 4 === 0;
      const isMedium = i % 2 === 0;
      const difficulty = isHard ? 'HARD' : isMedium ? 'MEDIUM' : 'EASY';
      const isHinglish = i % 3 === 0;

      let promptEn = '';
      let promptHinglish = '';
      let options: string[] = [];
      let explanationEn = '';
      let explanationHinglish = '';

      if (topic.id === 'topic_arrays') {
        promptEn = `In Two-Pointer array partitioning (problem #${i}), what is the primary invariant maintained by the left and right pointers?`;
        promptHinglish = `Two-Pointer partitioning mein (problem #${i}), left aur right pointer ka main invariant kya hota hai?`;
        options = [
          'Elements to the left of the left pointer satisfy condition P; elements to the right of the right pointer satisfy ~P',
          'Pointers must swap values at every single step regardless of condition',
          'Pointers reset to zero on each odd index iteration',
          'The right pointer strictly moves twice as fast as the left pointer',
        ];
        explanationEn = 'Two pointer partitions maintain strict sub-array invariants on both boundaries in O(n) time.';
        explanationHinglish = 'Two-pointer approach boundary invariants maintain karta hai bina extra memory allocation ke.';
      } else if (topic.id === 'topic_recursion') {
        promptEn = `When analyzing recursion trees for Divide & Conquer (scenario #${i}), what prevents stack overflow under degenerate inputs?`;
        promptHinglish = `Recursion tree analysis mein (scenario #${i}), base condition kaise call stack overflow hone se bachati hai?`;
        options = [
          'An explicit, well-ordered base case that terminates the branch and unwinds execution',
          'Increasing the CPU frequency at runtime',
          'Calling System.gc() before every recursive invocation',
          'Allocating all stack frames on external persistent disk storage',
        ];
        explanationEn = 'Base cases provide the termination condition that stops call stack frames from growing infinitely.';
        explanationHinglish = 'Base case recursion ko terminate karta hai taaki infinite stack frame creation na ho.';
      } else {
        promptEn = `Under ${topic.title} principles, which pattern provides optimal throughput for sub-task #${i}?`;
        promptHinglish = `${topic.title} concept mein, sub-task #${i} ke liye sabse optimal approach kaunsi hai?`;
        options = [
          `Leveraging monotonic properties to eliminate redundant passes in ${topic.title}`,
          `Linear scanning with O(n^2) nested fallback loops`,
          `Synchronous busy-waiting polling`,
          `Randomized index lookups without hashing`,
        ];
        explanationEn = `Monotonic reduction guarantees linear time complexity for ${topic.title}.`;
        explanationHinglish = `Monotonic evaluation redundant steps ko eliminate karti hai aur linear runtime deti hai.`;
      }

      const question: Question = {
        id: qId,
        topicId: topic.id,
        prompt: isHinglish ? promptHinglish : promptEn,
        options,
        correctOptionIndex: 0,
        difficulty,
        language: isHinglish ? 'HINGLISH' : 'EN',
        explanation: explanationEn,
        explanationHinglish,
        source: i > 15 ? 'AI' : 'FACULTY',
        status: i > 17 ? 'PENDING' : 'APPROVED',
        reviewerId: i <= 17 ? 'faculty_sarah' : undefined,
        createdAt: new Date('2026-02-01').toISOString(),
      };

      db.questions.set(qId, question);
      questionCount++;
    }
  }

  // 7. Seed 1,000+ Students across campuses and sections
  console.log('👥 Seeding 1,020 realistic students across 4 campuses...');
  const firstNames = [
    'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Rohan',
    'Ishaan', 'Aryan', 'Pooja', 'Sanya', 'Neha', 'Priya', 'Kavya', 'Aditya',
    'Arjun', 'Tanvi', 'Meera', 'Sneha', 'Rahul', 'Varun', 'Dev', 'Kunal',
    'Rhea', 'Anika', 'Zoya', 'Tara', 'Rishi', 'Samarth', 'Dhruv', 'Siddharth'
  ];
  const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Banerjee', 'Iyer', 'Menon', 'Nair',
    'Gupta', 'Singh', 'Choudhury', 'Mukherjee', 'Bose', 'Rao', 'Deshmukh', 'Joshi',
    'Kapoor', 'Malhotra', 'Bhat', 'Agarwal', 'Mehta', 'Kulkarni', 'Pillai', 'Saxena'
  ];

  let studentIdCounter = 1;
  const sectionList = Array.from(db.sections.values());

  for (let cIdx = 0; cIdx < campuses.length; cIdx++) {
    const campus = campuses[cIdx];
    const campusSections = sectionList.filter(s => s.batchId.startsWith(`batch_${campus.id}`));

    // 255 students per campus = 1,020 students total
    for (let i = 0; i < 255; i++) {
      const sid = `student_${studentIdCounter}`;
      const fName = firstNames[(studentIdCounter * 7) % firstNames.length];
      const lName = lastNames[(studentIdCounter * 11) % lastNames.length];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${studentIdCounter}@msot.edu.in`;
      const assignedSection = campusSections[i % campusSections.length];

      const user: User = {
        id: sid,
        email,
        role: 'STUDENT',
        name,
        avatarId: `avatar_${(studentIdCounter % 12) + 1}`,
        anonymousAlias: generateAnonymousAlias(sid),
        isAnonymous: studentIdCounter % 5 === 0, // 20% students in anonymous mode
        campusId: campus.id,
        batchId: assignedSection.batchId,
        sectionId: assignedSection.id,
        createdAt: new Date('2026-01-10').toISOString(),
      };
      db.users.set(sid, user);

      // Seed initial realistic XP ledger entries & streaks
      const basePoints = ((studentIdCounter * 37) % 850) + 150;
      const initialStreak = (studentIdCounter % 14) + 1;

      // Seed 2 initial ledger rows per student
      const entry1Id = `seed_xpe_${sid}_1`;
      db.xpLedger.set(entry1Id, {
        id: entry1Id,
        studentId: sid,
        ruleId: 'rule_attend_class',
        ruleVersion: 1,
        sourceType: 'OFFICIAL_ATTENDANCE',
        sourceRef: `class_lec_${studentIdCounter % 10}`,
        baseAmount: 10,
        finalAmount: 10,
        isDiminished: false,
        reason: 'Verified lecture attendance',
        idempotencyKey: `xp:${sid}:ATTEND_CLASS:lec_1`,
        isVoided: false,
        createdAt: new Date('2026-02-10').toISOString(),
      });

      const entry2Id = `seed_xpe_${sid}_2`;
      db.xpLedger.set(entry2Id, {
        id: entry2Id,
        studentId: sid,
        ruleId: 'rule_daily_quiz_completed',
        ruleVersion: 1,
        sourceType: 'QUIZ_ATTEMPT',
        sourceRef: `quiz_run_${studentIdCounter % 10}`,
        baseAmount: basePoints,
        finalAmount: basePoints,
        isDiminished: false,
        reason: 'Daily micro-challenge runs and test performance',
        idempotencyKey: `xp:${sid}:QUIZ_ATTEMPT:run_1`,
        isVoided: false,
        createdAt: new Date('2026-02-11').toISOString(),
      });

      // Recalculate profile
      const prof = await xpEngine.recalculateProfile(sid);
      prof.currentStreak = initialStreak;
      prof.maxStreak = Math.max(initialStreak, (studentIdCounter % 20) + 1);
      prof.freezeCount = studentIdCounter % 3; // 0, 1, or 2 freezes
      prof.spendableShards = (studentIdCounter % 8) * 50;
      prof.lastActiveDate = new Date().toISOString().split('T')[0];
      await db.saveStudentProfile(prof);

      studentIdCounter++;
    }
  }

  // 8. Seed Faculty and Admin Users
  const facultySarah: User = {
    id: 'faculty_sarah',
    email: 'sarah.jenkins@faculty.msot.edu.in',
    role: 'FACULTY',
    name: 'Prof. Sarah Jenkins',
    avatarId: 'avatar_faculty_1',
    anonymousAlias: 'Mentor Owl 01',
    isAnonymous: false,
    campusId: 'campus_1',
    batchId: 'batch_campus_1_2025',
    sectionId: 'sec_batch_campus_1_2025_A',
    createdAt: new Date('2026-01-01').toISOString(),
  };
  db.users.set(facultySarah.id, facultySarah);

  const adminVance: User = {
    id: 'admin_vance',
    email: 'dean.vance@admin.msot.edu.in',
    role: 'ADMIN',
    name: 'Dean Arthur Vance',
    avatarId: 'avatar_admin_1',
    anonymousAlias: 'Grand Arbiter 00',
    isAnonymous: false,
    campusId: 'campus_1',
    batchId: 'batch_campus_1_2025',
    sectionId: 'sec_batch_campus_1_2025_A',
    createdAt: new Date('2026-01-01').toISOString(),
  };
  db.users.set(adminVance.id, adminVance);

  console.log(`✅ Seed Complete: ${studentIdCounter - 1} students, ${campuses.length} campuses, ${questionCount} questions, ${topics.length} topics.`);

  return {
    studentsCount: studentIdCounter - 1,
    campusesCount: campuses.length,
    questionsCount: questionCount,
    topicsCount: topics.length,
  };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed.ts')) {
  runSeed().catch(console.error);
}
