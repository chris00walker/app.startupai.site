import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<3000'], // API p95 ≤ 3s
  },
  vus: 1,
  duration: '30s',
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3000';
  const res = http.get(`${base}/api/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
