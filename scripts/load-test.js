/**
 * Simple Load Test Script
 * Usage: node scripts/load-test.js
 */

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/api/simulate';
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 500;

const samplePayload = {
  algorithm: 'FCFS',
  processes: [
    { pid: 'P1', arrival: 0, burst: 10 },
    { pid: 'P2', arrival: 5, burst: 5 },
    { pid: 'P3', arrival: 10, burst: 8 },
    { pid: 'P4', arrival: 12, burst: 2 },
    { pid: 'P5', arrival: 15, burst: 6 }
  ]
};

async function runTest() {
  console.log(`🚀 Starting load test on ${TARGET_URL}`);
  console.log(`📊 Parameters: ${TOTAL_REQUESTS} total requests, ${CONCURRENT_REQUESTS} concurrent`);
  
  const start = Date.now();
  let completed = 0;
  let failed = 0;
  const latencies = [];

  const runBatch = async (size) => {
    const tasks = Array.from({ length: size }, async () => {
      const reqStart = Date.now();
      try {
        const res = await fetch(TARGET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(samplePayload)
        });
        latencies.push(Date.now() - reqStart);
        if (res.ok) completed++;
        else failed++;
      } catch (e) {
        failed++;
      }
    });
    await Promise.all(tasks);
  };

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    await runBatch(Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i));
    process.stdout.write(`⏳ Progress: ${completed + failed}/${TOTAL_REQUESTS}\r`);
  }

  const duration = (Date.now() - start) / 1000;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  
  console.log('\n\n✅ Load Test Complete');
  console.log('---------------------------');
  console.log(`Total Time:     ${duration.toFixed(2)}s`);
  console.log(`Throughput:     ${(TOTAL_REQUESTS / duration).toFixed(2)} req/s`);
  console.log(`Avg Latency:    ${avgLatency.toFixed(2)}ms`);
  console.log(`Success Rate:   ${((completed / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  console.log(`Failed:         ${failed}`);
  console.log('---------------------------');
}

runTest().catch(console.error);
