import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Process } from '@cpu-vis/shared';
import { Playground } from './pages/Playground';
import { Compare } from './pages/Compare';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AutoGrader } from './pages/autograder/AutoGrader';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// --- Initial Data ---
const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
  { pid: 'P3', arrival: 2, burst: 1, priority: 3 },
  { pid: 'P4', arrival: 5, burst: 2, priority: 1 },
];

// --- Layout ---
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
      <Footer />
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
              <Route path="/autograder" element={<AutoGrader />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
