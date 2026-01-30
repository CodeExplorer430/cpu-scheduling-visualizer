import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AuthCard } from '../components/auth/AuthCard';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleVerifyMagicLink = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/magic-link/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Magic link verification failed');

        login(data.token, data.user);
        toast.success('Successfully logged in!');
        navigate('/');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Magic link expired or invalid');
      } finally {
        setLoading(false);
      }
    },
    [login, navigate]
  );

  useEffect(() => {
    const magicToken = searchParams.get('magicToken');
    if (magicToken) {
      handleVerifyMagicLink(magicToken);
    }
  }, [searchParams, handleVerifyMagicLink]);

  const handleRequestMagicLink = useCallback(async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setMagicLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send magic link');

      toast.success(data.message, { duration: 6000 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error sending magic link');
    } finally {
      setMagicLoading(false);
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = '/api/auth/login';
      const body = { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Enter your details below."
      footerLinkText="Don't have an account? Sign up"
      footerLinkTo="/register"
      onSubmit={handleLogin}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <button
            type="button"
            onClick={handleRequestMagicLink}
            disabled={magicLoading}
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 disabled:opacity-50 transition-colors"
          >
            {magicLoading ? 'Sending...' : 'Email me a login link'}
          </button>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-all shadow-md"
        >
          {loading ? 'Processing...' : 'Sign in'}
        </button>
      </div>
    </AuthCard>
  );
};