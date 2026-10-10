import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // Stage 1: 100 concurrent users
    stage_100_users: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      startTime: '0s',
    },
    // Stage 2: 300 concurrent users (Team Battle burst)
    stage_300_users: {
      executor: 'constant-vus',
      vus: 300,
      duration: '30s',
      startTime: '35s',
    },
    // Stage 3: 500 concurrent users (Campus-wide surge)
    stage_500_users: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30s',
      startTime: '70s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'], // p95 latency under 1.5s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000';

export default function () {
  const vuId = __VU;

  // 1. Fetch Today's Run Quiz
  const quizRes = http.get(`${BASE_URL}/api/quiz/today?studentId=student_${vuId}`);
  check(quizRes, {
    'quiz status is 200': (r) => r.status === 200,
    'quiz has questions': (r) => JSON.parse(r.body).questions.length > 0,
  });

  sleep(0.5);

  // 2. Submit Battle Points (Team Clash)
  const battlePayload = JSON.stringify({
    eventId: 'event_battle_1',
    studentId: `student_${vuId}`,
    teamId: vuId % 2 === 0 ? 'team_sec_a' : 'team_sec_b',
    points: 10,
  });

  const battleRes = http.post(`${BASE_URL}/api/battles/submit`, battlePayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(battleRes, {
    'battle submit status is 200': (r) => r.status === 200,
    'battle points awarded': (r) => JSON.parse(r.body).pointsAwarded === 10,
  });

  sleep(0.5);

  // 3. Fetch Live Weekly League Leaderboard
  const leagueRes = http.get(`${BASE_URL}/api/leagues/weekly?studentId=student_${vuId}`);
  check(leagueRes, {
    'league status is 200': (r) => r.status === 200,
    'league has standings': (r) => JSON.parse(r.body).standings.length > 0,
  });

  sleep(1);
}
