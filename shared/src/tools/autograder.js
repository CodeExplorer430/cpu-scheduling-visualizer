'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.runAutoGrader = void 0;
var fcfs_js_1 = require('../engine/fcfs.js');
var sjf_js_1 = require('../engine/sjf.js');
var ljf_js_1 = require('../engine/ljf.js');
var srtf_js_1 = require('../engine/srtf.js');
var lrtf_js_1 = require('../engine/lrtf.js');
var rr_js_1 = require('../engine/rr.js');
var priority_js_1 = require('../engine/priority.js');
var priority_preemptive_js_1 = require('../engine/priority_preemptive.js');
var hrrn_js_1 = require('../engine/hrrn.js');
var mq_js_1 = require('../engine/mq.js');
var mlfq_js_1 = require('../engine/mlfq.js');
var engineMap = {
  FCFS: fcfs_js_1.runFCFS,
  SJF: sjf_js_1.runSJF,
  LJF: ljf_js_1.runLJF,
  SRTF: srtf_js_1.runSRTF,
  LRTF: lrtf_js_1.runLRTF,
  RR: rr_js_1.runRR,
  PRIORITY: priority_js_1.runPriority,
  PRIORITY_PE: priority_preemptive_js_1.runPriorityPreemptive,
  HRRN: hrrn_js_1.runHRRN,
  MQ: mq_js_1.runMQ,
  MLFQ: mlfq_js_1.runMLFQ,
};
var runAutoGrader = function (testCases) {
  var results = testCases.map(function (testCase) {
    try {
      var engine = engineMap[testCase.algorithm];
      if (!engine) {
        return {
          testCaseId: testCase.id,
          passed: false,
          actualMetrics: { avgTurnaround: 0, avgWaiting: 0 },
          error: 'Algorithm '.concat(testCase.algorithm, ' not supported'),
        };
      }
      // Clone processes to avoid mutation issues between runs if not handled by engine
      var processesCopy = JSON.parse(JSON.stringify(testCase.processes));
      var result = engine(processesCopy, testCase.options);
      var actualTAT = result.metrics.avgTurnaround;
      var actualWT = result.metrics.avgWaiting;
      var passed = true;
      var diff = { turnaroundDiff: 0, waitingDiff: 0 };
      if (testCase.expected) {
        if (testCase.expected.avgTurnaround !== undefined) {
          var expectedTAT = testCase.expected.avgTurnaround;
          // Floating point tolerance
          if (Math.abs(actualTAT - expectedTAT) > 0.01) passed = false;
          diff.turnaroundDiff = actualTAT - expectedTAT;
        }
        if (testCase.expected.avgWaiting !== undefined) {
          var expectedWT = testCase.expected.avgWaiting;
          if (Math.abs(actualWT - expectedWT) > 0.01) passed = false;
          diff.waitingDiff = actualWT - expectedWT;
        }
      }
      return {
        testCaseId: testCase.id,
        passed: passed,
        actualMetrics: { avgTurnaround: actualTAT, avgWaiting: actualWT },
        expectedMetrics: testCase.expected,
        diff: diff,
      };
    } catch (e) {
      return {
        testCaseId: testCase.id,
        passed: false,
        actualMetrics: { avgTurnaround: 0, avgWaiting: 0 },
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  });
  var passedTests = results.filter(function (r) {
    return r.passed;
  }).length;
  var score = testCases.length > 0 ? (passedTests / testCases.length) * 100 : 0;
  return {
    results: results,
    score: score,
    totalTests: testCases.length,
    passedTests: passedTests,
  };
};
exports.runAutoGrader = runAutoGrader;
