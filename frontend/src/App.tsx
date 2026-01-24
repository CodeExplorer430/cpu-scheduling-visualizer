import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Process } from '@cpu-vis/shared';
import { Playground } from './pages/Playground';
import { Compare } from './pages/Compare';

const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 4 },
  { pid: 'P2', arrival: 1, burst: 3 },
  { pid: 'P3', arrival: 2, burst: 1 },
  { pid: 'P4', arrival: 5, burst: 2 },
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const tabs = [
    { name: 'Playground', path: '/' },
    { name: 'Compare', path: '/compare' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <header className="bg-white shadow-sm z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">CPU Scheduling Visualizer</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {tabs.map((tab) => (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    className={`${
                      location.pathname === tab.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
               <a href="https://github.com" target="_blank" className="text-gray-400 hover:text-gray-500">
                  {/* GitHub Icon Placeholder or simple text */}
                  <span className="text-sm">GitHub</span>
               </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={
            <Playground processes={processes} onProcessesChange={setProcesses} />
          } />
          <Route path="/compare" element={
            <Compare processes={processes} onProcessesChange={setProcesses} />
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
