'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Engine = void 0;
__exportStar(require('../types.js'), exports);
__exportStar(require('./fcfs.js'), exports);
__exportStar(require('./sjf.js'), exports);
__exportStar(require('./ljf.js'), exports);
__exportStar(require('./srtf.js'), exports);
__exportStar(require('./rr.js'), exports);
__exportStar(require('./priority.js'), exports);
__exportStar(require('./priority_preemptive.js'), exports);
__exportStar(require('./hrrn.js'), exports);
__exportStar(require('./lrtf.js'), exports);
__exportStar(require('./mq.js'), exports);
__exportStar(require('./mlfq.js'), exports);
// Stub for future engine implementations
exports.Engine = {
  version: '1.0.0',
};
