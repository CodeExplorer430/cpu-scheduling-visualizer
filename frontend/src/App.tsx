import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Process } from '@cpu-vis/shared';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// --- Initial Data ---
const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
  { pid: 'P3', arrival: 2, burst: 1, priority: 3 },
  { pid: 'P4', arrival: 5, burst: 2, priority: 1 },
];

const Playground = lazy(() =>
  import('./pages/Playground').then((m) => ({ default: m.Playground }))
);
const Compare = lazy(() => import('./pages/Compare').then((m) => ({ default: m.Compare })));
const AutoGrader = lazy(() =>
  import('./pages/autograder/AutoGrader').then((m) => ({ default: m.AutoGrader }))
);
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Guide = lazy(() => import('./pages/Guide').then((m) => ({ default: m.Guide })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function App() {
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);

  return (
    <ThemeProvider>
      <Toaster position="bottom-right" reverseOrder={false} />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Suspense fallback={<div className="text-sm text-gray-400">Loading...</div>}>
              <Routes>
                <Route
                  path="/"
                  element={<Playground processes={processes} onProcessesChange={setProcesses} />}
                />
                <Route
                  path="/compare"
                  element={<Compare processes={processes} onProcessesChange={setProcesses} />}
                />
                <Route path="/autograder" element={<AutoGrader />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
