import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold dark:text-white">CPU Scheduling Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            &times;
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
