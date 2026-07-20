import { useState } from 'react';
import { adminApi } from '../api/index.js';

export function LoginScreen({ onLoggedIn }) {
  const [admin_username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!admin_username.trim() || !password) {
      setError('Enter both username and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.login({ admin_username: admin_username.trim(), password });
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#14120F] text-[#EDE7DD]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#1C1914] border border-[#2A2620] rounded-lg p-8">
        <div className="font-serif text-2xl tracking-wide text-[#E8C88A] mb-1">V Stitch</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A8375] mb-6">Admin Studio</div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">{error}</div>
        )}

        <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Username</label>
        <input
          autoFocus
          value={admin_username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#C9A24B]"
        />

        <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-6 focus:outline-none focus:border-[#C9A24B]"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
