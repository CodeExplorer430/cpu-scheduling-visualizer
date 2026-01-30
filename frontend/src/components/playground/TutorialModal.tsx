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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trace Playback</h3>
            <p className="text-sm mb-2">
              You can import real-world scheduling traces to visualize execution flow.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Quantix Native (JSON):</strong> The default format exported by this
                application.
              </li>
              <li>
                <strong>Trace Event Format (JSON):</strong> Standard format used by Chrome Tracing
                and Perfetto. Looks for <code>"ph": "X"</code> (Complete) or{' '}
                <code>"ph": "B/E"</code> (Begin/End) events.
              </li>
              <li>
                <strong>Linux ftrace (Text):</strong> Raw text logs containing{' '}
                <code>sched_switch</code> events. Generated via{' '}
                <code>cat /sys/kernel/debug/tracing/trace</code>.
              </li>
            </ul>
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
