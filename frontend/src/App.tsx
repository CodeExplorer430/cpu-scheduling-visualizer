import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SunIcon, MoonIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Process } from '@cpu-vis/shared';
import { Playground } from './pages/Playground';
import { Compare } from './pages/Compare';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- Initial Data ---
const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
  { pid: 'P3', arrival: 2, burst: 1, priority: 3 },
  { pid: 'P4', arrival: 5, burst: 2, priority: 1 },
];

// --- Layout ---
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const tabs = [
    { name: 'Playground', path: '/' },
    { name: 'Compare', path: '/compare' },
  ];

  return (
    <div className="min-h-screen font-sans flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10 relative transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center overflow-x-auto no-scrollbar">
              <div className="flex-shrink-0 flex items-center mr-4">
                <Link to="/">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                    CPU Scheduling
                  </h1>
                </Link>
              </div>
              <div className="flex space-x-4 sm:space-x-8">
                {tabs.map((tab) => (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    className={`${
                      location.pathname === tab.path
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              {/* Auth Status */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                    {user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Login"
                >
                  <UserCircleIcon className="w-6 h-6" />
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5" />
                ) : (
                  <SunIcon className="w-5 h-5" />
                )}
              </button>

              <a
                href="https://github.com/CodeExplorer430/cpu-scheduling-visualizer"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);

  return (
    <ThemeProvider>
      <Toaster position="bottom-right" reverseOrder={false} />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route
                path="/"
                element={<Playground processes={processes} onProcessesChange={setProcesses} />}
              />
              <Route
                path="/compare"
                element={<Compare processes={processes} onProcessesChange={setProcesses} />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
