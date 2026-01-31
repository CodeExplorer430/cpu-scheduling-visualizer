'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateRandomProcesses = generateRandomProcesses;
exports.exportToCSV = exportToCSV;
exports.parseCSV = parseCSV;
function generateRandomProcesses(config) {
  var processes = [];
  for (var i = 0; i < config.count; i++) {
    var arrival =
      Math.floor(Math.random() * (config.arrivalRange[1] - config.arrivalRange[0] + 1)) +
      config.arrivalRange[0];
    var burst =
      Math.floor(Math.random() * (config.burstRange[1] - config.burstRange[0] + 1)) +
      config.burstRange[0];
    processes.push({
      pid: 'P'.concat(i + 1),
      arrival: arrival,
      burst: burst,
      color: getRandomColor(),
    });
  }
  // Sort by arrival for convenience, though not strictly required
  return processes.sort(function (a, b) {
    return a.arrival - b.arrival;
  });
}
function getRandomColor() {
  var colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f97316',
    '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
function exportToCSV(processes) {
  var header = 'PID,Arrival,Burst,Priority';
  var rows = processes.map(function (p) {
    return ''
      .concat(p.pid, ',')
      .concat(p.arrival, ',')
      .concat(p.burst, ',')
      .concat(p.priority || '');
  });
  return __spreadArray([header], rows, true).join('\n');
}
function parseCSV(csvContent) {
  var lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  // Assume header is first line, skip it
  var processes = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var _a = line.split(','),
      pid = _a[0],
      arrivalStr = _a[1],
      burstStr = _a[2],
      priorityStr = _a[3];
    var arrival = parseInt(arrivalStr, 10);
    var burst = parseInt(burstStr, 10);
    var priority = priorityStr ? parseInt(priorityStr, 10) : undefined;
    if (isNaN(arrival) || isNaN(burst)) {
      console.warn('Skipping invalid CSV line: '.concat(line));
      continue;
    }
    processes.push({
      pid: pid.trim(),
      arrival: arrival,
      burst: burst,
      priority: priority,
      color: getRandomColor(),
    });
  }
  return processes;
}
