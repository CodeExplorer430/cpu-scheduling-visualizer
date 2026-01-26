/**
 * Advanced Load & Stress Test Script
 * Usage: node scripts/load-test.js [mode]
 * Modes:
 *   - smoke:  Quick check (10 requests)
 *   - load:   Standard load test (500 requests, 50 concurrent)
 *   - stress: High intensity (2000 requests, 100 concurrent)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/simulate';
const mode = process.argv[2] || 'load';

const CONFIG = {
  smoke: { total: 10, concurrent: 2, batch: false },
  load: { total: 500, concurrent: 50, batch: false },
  stress: { total: 2000, concurrent: 100, batch: true }, // Stress mode tests the expensive batch endpoint
};

const settings = CONFIG[mode] || CONFIG.load;

const singlePayload = {
  algorithm: 'SRTF', // Preemptive algorithms are slightly more CPU intensive
  processes: Array.from({ length: 10 }, (_, i) => ({
    pid: `P${i}`,
    arrival: Math.floor(Math.random() * 20),
    burst: Math.floor(Math.random() * 15) + 1,
  })),
};

const batchPayload = {
  algorithms: ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY'],
  processes: singlePayload.processes,
  timeQuantum: 2,
};

async function runTest() {
  const url = settings.batch ? `${BASE_URL}/batch` : BASE_URL;
  const payload = settings.batch ? batchPayload : singlePayload;

  console.log(`\n🚀 CPU Scheduling Visualizer - ${mode.toUpperCase()} TEST`);
  console.log(`--------------------------------------------------`);
  console.log(`Target URL:  ${url}`);
  console.log(`Payload:     ${settings.batch ? 'Multi-Algorithm Batch' : 'Single Algorithm'}`);
  console.log(`Total Req:   ${settings.total}`);
  console.log(`Concurrency: ${settings.concurrent}`);
  console.log(`--------------------------------------------------\n`);

  const start = Date.now();
  let completed = 0;
  let failed = 0;
  const latencies = [];

  const runBatch = async (size) => {
    const tasks = Array.from({ length: size }, async () => {
      const reqStart = Date.now();
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const end = Date.now();
        latencies.push(end - reqStart);
        if (res.ok) completed++;
        else failed++;
      } catch (e) {
        failed++;
      }
    });
    await Promise.all(tasks);
  };

  for (let i = 0; i < settings.total; i += settings.concurrent) {
    await runBatch(Math.min(settings.concurrent, settings.total - i));
    const progress = Math.round(((completed + failed) / settings.total) * 100);
    process.stdout.write(`⏳ Progress: ${progress}% (${completed + failed}/${settings.total})\r`);
  }

  const duration = (Date.now() - start) / 1000;
  latencies.sort((a, b) => a - b);

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  console.log('\n\n📊 RESULTS');
  console.log('---------------------------');
  console.log(
    `Success Rate:   ${((completed / settings.total) * 100).toFixed(2)}% (${completed}/${settings.total})`
  );
  console.log(`Failed:         ${failed}`);
  console.log(`Total Time:     ${duration.toFixed(2)}s`);
  console.log(`Throughput:     ${(settings.total / duration).toFixed(2)} req/s`);
  console.log(`\nLATENCY`);
  console.log(`Min:            ${latencies[0]}ms`);
  console.log(`Avg:            ${avg.toFixed(2)}ms`);
  console.log(`P50 (Median):   ${p50}ms`);
  console.log(`P95:            ${p95}ms`);
  console.log(`P99:            ${p99}ms`);
  console.log(`Max:            ${latencies[latencies.length - 1]}ms`);
  console.log('---------------------------');

  if (failed > 0) {
    console.log('❌ Test failed with errors.');
    process.exit(1);
  } else {
    console.log('✅ System healthy under load.');
  }
}

runTest().catch(console.error);
