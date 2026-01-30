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
import { Layout } from './components/layout/Layout';

// --- Initial Data ---

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
