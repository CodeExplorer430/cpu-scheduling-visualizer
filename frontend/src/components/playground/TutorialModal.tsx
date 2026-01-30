import React from 'react';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <BookOpenIcon className="w-8 h-8 text-blue-600" />
            CPU Scheduling Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
              FCFS (First-Come, First-Served)
            </h3>
            <p className="text-sm">
              The simplest algorithm. Processes are executed in the order they arrive.
              Non-preemptive.
              <br />
              <em>Pros:</em> Simple, fair.
              <br />
              <em>Cons:</em> Convoy effect (short process waits for long process).
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-green-600 dark:text-green-400">
              SJF (Shortest Job First)
            </h3>
            <p className="text-sm">
              Selects the waiting process with the smallest execution time. Non-preemptive.
              <br />
              <em>Pros:</em> Minimizes average waiting time.
              <br />
              <em>Cons:</em> Starvation for long processes. Hard to predict burst time.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
              SRTF (Shortest Remaining Time First)
            </h3>
            <p className="text-sm">
              Preemptive version of SJF. If a new process arrives with a shorter burst than the
              current remaining time, it preempts the CPU.
              <br />
              <em>Pros:</em> Optimal average waiting time.
              <br />
              <em>Cons:</em> High context switch overhead potential. Starvation.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400">
              RR (Round Robin)
            </h3>
            <p className="text-sm">
              Each process gets a small unit of CPU time (Time Quantum). If it doesn't finish, it
              goes to the back of the queue.
              <br />
              <em>Pros:</em> Responsive, fair. Good for time-sharing.
              <br />
              <em>Cons:</em> Performance depends heavily on quantum size. High overhead.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Priority</h3>
            <p className="text-sm">
              Processes are scheduled based on priority (Number). Lower number usually means higher
              priority here.
              <br />
              <em>Pros:</em> Handles important tasks first.
              <br />
              <em>Cons:</em> Indefinite blocking (starvation) of low priority processes.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
              Priority (Preemptive)
            </h3>
            <p className="text-sm">
              Similar to Priority scheduling, but if a new process arrives with a higher priority
              than the currently running process, the CPU is preempted.
              <br />
              <em>Pros:</em> Responsive to high-priority tasks.
              <br />
              <em>Cons:</em> Frequent context switching.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              LJF (Longest Job First)
            </h3>
            <p className="text-sm">
              Selects the waiting process with the largest execution time. Non-preemptive.
              <br />
              <em>Pros:</em> Prevents short processes from dominating CPU (rarely used).
              <br />
              <em>Cons:</em> Convoy effect, reduced system throughput.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">
              LRTF (Longest Remaining Time First)
            </h3>
            <p className="text-sm">
              Preemptive version of LJF.
              <br />
              <em>Pros:</em> Forces context switches to share CPU among long tasks.
              <br />
              <em>Cons:</em> High average waiting time and turnaround time.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-teal-600 dark:text-teal-400">
              HRRN (Highest Response Ratio Next)
            </h3>
            <p className="text-sm">
              Non-preemptive. Calculates Response Ratio = (Waiting Time + Burst Time) / Burst Time.
              Selects highest ratio.
              <br />
              <em>Pros:</em> Prevents starvation (aging), balances short and long jobs.
              <br />
              <em>Cons:</em> Overhead of calculating ratios at every step.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
              MQ (Multilevel Queue)
            </h3>
            <p className="text-sm">
              Partitions the ready queue into separate queues (e.g., Foreground/Interactive,
              Background/Batch). Processes are permanently assigned to one queue based on
              properties.
              <br />
              <em>Pros:</em> Customized scheduling for different process types.
              <br />
              <em>Cons:</em> Inflexible (fixed assignment), potential starvation for lower-level
              queues.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              MLFQ (Multilevel Feedback Queue)
            </h3>
            <p className="text-sm">
              Processes can move between queues. New processes start at high priority (short
              quantum). If they use their full quantum, they degrade to lower priority queues.
              <br />
              <em>Pros:</em> Flexible, adaptive. Good for interactive tasks (short bursts stay high
              priority).
              <br />
              <em>Cons:</em> Complex to tune (number of queues, quantums, aging rules).
            </p>
          </section>

          <section className="border-t dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trace Playback</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">
                  1. Perfetto (Protobuf) – Top Priority
                </h4>
                <p className="text-sm">
                  The modern standard for system-wide profiling on Android (10+), Linux, and Chrome.
                  <br />
                  <em>Why it's good:</em> Captures high-frequency scheduling activity, task
                  switching latency, and CPU frequency.
                  <br />
                  <em>Implementation:</em> Uses a protocol buffer binary stream. Please use
                  Perfetto’s Trace Processor to convert these into JSON/CSV for this visualizer.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-green-600 dark:text-green-400">
                  2. Trace Event Format (JSON)
                </h4>
                <p className="text-sm">
                  Originally created for the Chrome Tracing tool, this is the easiest format to
                  implement for a web app.
                  <br />
                  <em>Why it's good:</em> Human-readable and structured as a JSON array.
                  <br />
                  <em>Key Events:</em> Visualizes <code>ph: "B"</code> (begin) /{' '}
                  <code>"E"</code> (end) or <code>"X"</code> (complete) events with duration.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-orange-600 dark:text-orange-400">
                  3. Linux ftrace (Textual/Raw)
                </h4>
                <p className="text-sm">
                  Internal tracer for the Linux kernel, available on almost every Linux
                  distribution.
                  <br />
                  <em>Why it's good:</em> Generate logs without extra tools via{' '}
                  <code>cat /sys/kernel/debug/tracing/trace</code>.
                  <br />
                  <em>Parsing:</em> Parses lines containing <code>sched_switch</code> events to show
                  task preemption.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-600 dark:text-gray-400">
                  4. Common Trace Format (CTF)
                </h4>
                <p className="text-sm">
                  Binary format designed for extremely low overhead (LTTng, Zephyr RTOS).
                  <br />
                  <em>Why it's good:</em> Standard for high-performance tracing in non-Android Linux.
                  <br />
                  <em>Note:</em> This is a binary format requiring metadata to decode. Please
                  convert to JSON or Text first.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-purple-600 dark:text-purple-400">
                  5. Event Trace Log (ETL)
                </h4>
                <p className="text-sm">
                  Used primarily in the Windows ecosystem. Native format for Event Tracing for
                  Windows (ETW).
                  <br />
                  <em>Properties:</em> Binary files (.etl) recording system or application events.
                  Viewable with Windows Performance Analyzer.
                  <br />
                  <em>Note:</em> Like CTF, this is a binary format. Please convert to JSON/Text for
                  use here.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
