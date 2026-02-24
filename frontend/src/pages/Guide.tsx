import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpenIcon,
  BeakerIcon,
  ArrowsRightLeftIcon,
  AcademicCapIcon,
  PlusIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';

type Tab = 'platform' | 'algorithms';
type AlgorithmCard = {
  title: string;
  shortName: string;
  classification: string;
  summary: string;
  selectionRule: string;
  complexity: string;
  strengths: string;
  tradeoffs: string;
  bestFor: string;
  quantixNotes: string;
};

type AlgorithmSection = {
  title: string;
  accentClass: string;
  borderClass: string;
  cards: AlgorithmCard[];
};

export const Guide: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('platform');

  const algorithmSections: AlgorithmSection[] = [
    {
      title: 'Core Scheduling Algorithms',
      accentClass: 'text-indigo-600 dark:text-indigo-400',
      borderClass: 'border-indigo-200 dark:border-indigo-900',
      cards: [
        {
          title: 'First-Come, First-Served',
          shortName: 'FCFS',
          classification: 'Non-preemptive',
          summary: 'Executes processes in ready-queue arrival order (FIFO).',
          selectionRule: 'Pick earliest-arrived ready process and run until completion.',
          complexity: 'Selection O(n) per dispatch (or O(1) with queue).',
          strengths: 'Simple, deterministic, low scheduler overhead.',
          tradeoffs: 'Convoy effect and poor responsiveness for short interactive jobs.',
          bestFor: 'Batch-like workloads with limited interactivity.',
          quantixNotes: 'Multi-core supported with context-switch and energy metrics.',
        },
        {
          title: 'Shortest Job First',
          shortName: 'SJF',
          classification: 'Non-preemptive',
          summary: 'Runs the shortest burst among currently ready processes.',
          selectionRule: 'On each dispatch, choose smallest burst time among ready jobs.',
          complexity: 'O(n log n) if repeatedly sorting the ready set.',
          strengths: 'Minimizes average waiting time when burst estimates are accurate.',
          tradeoffs: 'Starvation risk for long jobs when short jobs keep arriving.',
          bestFor: 'Workloads where CPU burst estimates are predictable.',
          quantixNotes: 'Tie-breakers use arrival order for deterministic traces.',
        },
        {
          title: 'Shortest Remaining Time First',
          shortName: 'SRTF',
          classification: 'Preemptive',
          summary: 'Preemptive SJF using smallest remaining runtime.',
          selectionRule: 'At each decision point, run process with minimum remaining time.',
          complexity: 'O(n log n) per scheduling decision in simple implementations.',
          strengths: 'Very low average waiting/turnaround under mixed burst distributions.',
          tradeoffs: 'Frequent preemption can increase context-switch overhead.',
          bestFor: 'Latency-sensitive systems with dynamic arrivals.',
          quantixNotes: 'Quantix step logs show explicit preemption reasons.',
        },
        {
          title: 'Round Robin',
          shortName: 'RR',
          classification: 'Preemptive',
          summary: 'Time-slice scheduling where each ready process gets a fixed quantum.',
          selectionRule: 'Run queue head for min(quantum, remaining), then requeue if unfinished.',
          complexity: 'O(1) queue operations per time slice.',
          strengths: 'Fair CPU sharing and predictable response for interactive users.',
          tradeoffs: 'Too-small quantum causes high switch overhead; too-large trends toward FCFS.',
          bestFor: 'General-purpose time-sharing workloads.',
          quantixNotes: 'Use Optimize for heuristic quantum selection in Playground/Compare.',
        },
        {
          title: 'Priority Scheduling',
          shortName: 'PRIORITY / PRIORITY_PE',
          classification: 'Both non-preemptive and preemptive variants',
          summary: 'Runs highest-priority process (lower numeric value means higher priority).',
          selectionRule:
            'Choose minimum priority value; preemptive mode interrupts on higher priority arrival.',
          complexity: 'O(n) scan or O(log n) with priority queue.',
          strengths: 'Direct policy control for critical workloads.',
          tradeoffs: 'Low-priority starvation without aging or fairness controls.',
          bestFor: 'Systems with explicit criticality classes.',
          quantixNotes:
            'Priority field is shared by other algorithms but interpreted here directly.',
        },
      ],
    },
    {
      title: 'Advanced & Hybrid Algorithms',
      accentClass: 'text-purple-600 dark:text-purple-400',
      borderClass: 'border-purple-200 dark:border-purple-900',
      cards: [
        {
          title: 'Multilevel Queue',
          shortName: 'MLQ (key: MQ)',
          classification: 'Hybrid (queue-specific policies)',
          summary: 'Partitions ready processes into fixed queues with different scheduling rules.',
          selectionRule:
            'Select highest-priority non-empty queue, then schedule within that queue.',
          complexity:
            'Depends on per-queue policy; usually O(1) queue selection + local policy cost.',
          strengths: 'Strong isolation for workload classes.',
          tradeoffs: 'Static queue assignment can starve lower queues.',
          bestFor: 'Systems separating foreground and background classes.',
          quantixNotes: 'Quantix key is MQ; UI label is MLQ for terminology clarity.',
        },
        {
          title: 'Multilevel Feedback Queue',
          shortName: 'MLFQ',
          classification: 'Preemptive hybrid',
          summary: 'Adapts priority by process behavior via promotions/demotions across queues.',
          selectionRule: 'Run highest-priority queue first; demote jobs that consume full quanta.',
          complexity: 'Policy-dependent; typically O(1) queue ops with small queue count.',
          strengths: 'Balances responsiveness and throughput while reducing starvation.',
          tradeoffs: 'More knobs and tuning complexity than single-queue algorithms.',
          bestFor: 'General-purpose OS schedulers with mixed interactive/batch behavior.',
          quantixNotes: 'Included as deterministic multi-queue engine with step-by-step traces.',
        },
        {
          title: 'Highest Response Ratio Next',
          shortName: 'HRRN',
          classification: 'Non-preemptive',
          summary: 'Chooses max response ratio R = (wait + burst) / burst.',
          selectionRule:
            'At dispatch, compute response ratio for each ready process and pick maximum.',
          complexity: 'O(n) ratio recomputation per dispatch.',
          strengths: 'Reduces starvation while keeping short-job preference.',
          tradeoffs: 'Not preemptive, so urgent arrivals may wait for current job to finish.',
          bestFor: 'Batch systems seeking better fairness than pure SJF.',
          quantixNotes: 'Ratios evolve with wait time, visible in decision traces.',
        },
      ],
    },
    {
      title: 'Proportional/Fair-Share Algorithms',
      accentClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-200 dark:border-amber-900',
      cards: [
        {
          title: 'Fair-Share Scheduling',
          shortName: 'FAIR_SHARE',
          classification: 'Preemptive proportional-share',
          summary: 'Allocates CPU across groups according to configured share weights.',
          selectionRule:
            'Select group with lowest served/weight ratio, then FCFS within that group.',
          complexity: 'O(g + n_g) per decision (groups plus selected-group queue).',
          strengths: 'Prevents one group from monopolizing CPU.',
          tradeoffs: 'Slightly higher scheduling overhead than single-queue policies.',
          bestFor: 'Multi-tenant usage by users, teams, or projects.',
          quantixNotes: 'Uses `shareGroup` and `shareWeight`; defaults are `default` and `1`.',
        },
        {
          title: 'Lottery Scheduling',
          shortName: 'LOTTERY',
          classification: 'Preemptive probabilistic proportional-share',
          summary: 'Randomly chooses runnable process proportionally to ticket count.',
          selectionRule: 'Draw one ticket among all ready-ticket totals each scheduling tick.',
          complexity: 'O(n) per draw in direct-scan implementation.',
          strengths: 'Simple proportional fairness and easy dynamic weighting.',
          tradeoffs: 'Short-term variance can look unfair without enough scheduling samples.',
          bestFor: 'Systems where probabilistic fairness is acceptable.',
          quantixNotes:
            'Uses deterministic seeded RNG (`randomSeed`) for reproducible simulations.',
        },
      ],
    },
    {
      title: 'Real-Time Scheduling Algorithms',
      accentClass: 'text-green-600 dark:text-green-400',
      borderClass: 'border-green-200 dark:border-green-900',
      cards: [
        {
          title: 'Earliest Deadline First',
          shortName: 'EDF',
          classification: 'Preemptive dynamic-priority real-time',
          summary: 'Always runs the ready task with the nearest absolute deadline.',
          selectionRule: 'Pick minimum absolute deadline among ready tasks.',
          complexity: 'O(n) scan or O(log n) with deadline heap.',
          strengths: 'High theoretical schedulability for uniprocessor periodic task sets.',
          tradeoffs: 'Missed deadlines can cascade under overload.',
          bestFor: 'Soft/hard real-time workloads with explicit deadlines.',
          quantixNotes: 'Uses `deadline`; if omitted, defaults to `arrival + burst`.',
        },
        {
          title: 'Rate-Monotonic Scheduling',
          shortName: 'RMS',
          classification: 'Preemptive fixed-priority real-time',
          summary: 'Assigns static priority by period; shorter period means higher priority.',
          selectionRule: 'Choose ready task with smallest period.',
          complexity: 'O(n) scan or O(log n) priority queue operations.',
          strengths: 'Simple and analyzable fixed-priority policy.',
          tradeoffs: 'Can underutilize CPU compared with EDF in some task sets.',
          bestFor: 'Periodic control workloads needing static-priority behavior.',
          quantixNotes: 'Uses `period`; if omitted, defaults to `burst`.',
        },
      ],
    },
    {
      title: 'Experimental/Extended',
      accentClass: 'text-slate-600 dark:text-slate-300',
      borderClass: 'border-slate-200 dark:border-slate-700',
      cards: [
        {
          title: 'Longest Job First',
          shortName: 'LJF',
          classification: 'Non-preemptive (experimental)',
          summary: 'Picks the largest burst among ready tasks.',
          selectionRule: 'Choose maximum burst process at each dispatch.',
          complexity: 'O(n) scan per dispatch.',
          strengths: 'Useful for studying worst-case fairness behaviors.',
          tradeoffs: 'Usually poor average response/waiting times.',
          bestFor: 'Pedagogical comparison and stress experiments.',
          quantixNotes: 'Kept for compatibility and educational contrast.',
        },
        {
          title: 'Longest Remaining Time First',
          shortName: 'LRTF',
          classification: 'Preemptive (experimental)',
          summary: 'Preemptive counterpart of LJF based on remaining time.',
          selectionRule: 'Run process with largest remaining runtime.',
          complexity: 'O(n) selection at each decision point.',
          strengths: 'Highlights behavior opposite to SRTF.',
          tradeoffs: 'Can heavily penalize short/interactive jobs.',
          bestFor: 'Educational analysis of policy tradeoffs.',
          quantixNotes: 'Retained as extended option, not a default production policy.',
        },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpenIcon className="w-10 h-10 text-blue-600" />
          {t('nav.guide')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Master the Quantix platform with this step-by-step tutorial on scheduling simulations and
          analysis.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex justify-center">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('platform')}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'platform'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <BeakerIcon
              className={`
                -ml-0.5 mr-2 h-5 w-5
                ${
                  activeTab === 'platform'
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                }
              `}
            />
            {t('guidePage.tabs.platform')}
          </button>
          <button
            onClick={() => setActiveTab('algorithms')}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'algorithms'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <CpuChipIcon
              className={`
                -ml-0.5 mr-2 h-5 w-5
                ${
                  activeTab === 'algorithms'
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                }
              `}
            />
            {t('guidePage.tabs.algorithms')}
          </button>
        </nav>
      </div>

      {activeTab === 'platform' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Playground Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
              <BeakerIcon className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Using the Playground
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
                    1
                  </span>
                  Define Your Processes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the <strong>Process List</strong> table to add tasks. Click the{' '}
                  <PlusIcon className="w-4 h-4 inline" /> <strong>Add Process</strong> button to
                  create new rows.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-500 ml-4 space-y-1">
                  <li>
                    <strong>PID:</strong> A unique identifier for the process.
                  </li>
                  <li>
                    <strong>Arrival:</strong> When the process enters the ready queue.
                  </li>
                  <li>
                    <strong>Burst:</strong> Total CPU time required.
                  </li>
                  <li>
                    <strong>Priority:</strong> Used by priority-based algorithms (lower = higher).
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
                    2
                  </span>
                  Configure & Run
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select an algorithm from the dropdown in the <strong>Simulation Control</strong>{' '}
                  panel. Adjust cores and context switch overhead as needed.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  <strong>Tip:</strong> For Round Robin, click "Optimize" to let Quantix find the
                  best Time Quantum for your process set!
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
                    3
                  </span>
                  Analyze Step-by-Step
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Once you click <PlayIcon className="w-4 h-4 inline" />{' '}
                  <strong>Run Simulation</strong>, use the <strong>Time Control</strong> slider or
                  buttons to step through execution.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Watch the <strong>Algorithm Decision Logic</strong> (Step Explainer) to understand
                  exactly <em>why</em> a specific process was chosen at every millisecond.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
                    4
                  </span>
                  Persistence
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Logged-in users can <strong>Save</strong> and <strong>Load</strong> scenarios
                  using the cloud buttons at the top of the process table. Never lose your test
                  cases again!
                </p>
              </div>
            </div>
          </section>

          {/* Comparison Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
              <ArrowsRightLeftIcon className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Comparing Algorithms
              </h2>
            </div>

            <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    The <strong>Compare</strong> page allows you to evaluate all supported
                    algorithms simultaneously on the exact same dataset.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>
                        <strong>Visual Stack:</strong> View multiple Gantt charts stacked
                        vertically, perfectly aligned in time.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>
                        <strong>Metrics Table:</strong> Compare Average Waiting Time, Turnaround
                        Time, and Context Switches in a single table.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>
                        <strong>Export:</strong> Download your entire comparison as a{' '}
                        <strong>PNG</strong> or <strong>PDF</strong> for assignments or
                        documentation.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col justify-center items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                  <DocumentArrowDownIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Exportable Reports
                  </span>
                </div>
              </div>
            </Card>
          </section>

          {/* Auto-Grader Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
              <AcademicCapIcon className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Auto-Grader for Students
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">How it works</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Verification at scale. The Auto-Grader takes a JSON file of test cases, runs them
                  through the deterministic engine, and compares the actual results against your
                  expectations.
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-2">
                  <li>
                    Download the <strong>Example JSON</strong> to see the required format.
                  </li>
                  <li>Add your processes and expected average metrics.</li>
                  <li>
                    Upload the file and click <strong>Run Tests</strong>.
                  </li>
                </ol>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-green-400 overflow-x-auto shadow-2xl">
                <p className="text-gray-500 mb-2">// Sample Test Case</p>
                <pre>{`{
  "id": "tc-1",
  "algorithm": "RR",
  "processes": [...],
  "expected": {
    "avgTurnaround": 7.5,
    "avgWaiting": 3.0
  }
}`}</pre>
              </div>
            </div>
          </section>

          {/* Closing Card */}
          <Card className="text-center bg-blue-600 text-white p-8">
            <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
            <p className="opacity-90 mb-6">
              Head over to the playground and start experimenting with scheduling logic.
            </p>
            <a
              href="/"
              className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              Go to Playground
            </a>
          </Card>
        </div>
      )}

      {activeTab === 'algorithms' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Algorithms Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
              <CpuChipIcon className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                CPU Scheduling Algorithms Guide
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              CPU scheduling algorithms decide which ready process executes next. In Quantix, they
              are grouped by behavior: core policies, hybrid/multi-queue policies,
              proportional-share policies, and real-time policies. Use this section to understand
              how each algorithm makes decisions, what tradeoffs it introduces, and which process
              fields affect the simulation.
            </p>

            <div className="space-y-8 mt-4">
              {algorithmSections.map((section) => (
                <div key={section.title}>
                  <h3
                    className={`text-xl font-bold mb-4 border-b pb-2 ${section.accentClass} ${section.borderClass}`}
                  >
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.cards.map((card) => (
                      <Card
                        key={card.shortName}
                        className="border border-gray-200 dark:border-gray-700 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {card.title}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                            {card.shortName}
                          </span>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {card.classification}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{card.summary}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Selection Rule:</strong> {card.selectionRule}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Complexity:</strong> {card.complexity}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Strengths:</strong> {card.strengths}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Tradeoffs:</strong> {card.tradeoffs}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Best For:</strong> {card.bestFor}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Quantix Notes:</strong> {card.quantixNotes}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trace Logs Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
              <DocumentTextIcon className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('guidePage.trace.title')}
              </h2>
            </div>

            <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{t('guidePage.trace.desc')}</p>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    {t('guidePage.trace.formats')}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>{t('guidePage.trace.json')}</li>
                    <li>{t('guidePage.trace.ftrace')}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
};
