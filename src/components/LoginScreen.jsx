import { useState } from 'react';
import { adminApi } from '../api/index.js';

function LoginForm({ onLoggedIn, onForgotPassword }) {
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
        className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#C9A24B]"
      />

      <div className="text-right mb-4">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E]"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function ForgotPasswordForm({ onBackToLogin }) {
  const [admin_username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [new_password, setNewPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!admin_username.trim() || !email.trim()) {
      setError('Enter both your username and registered email.');
      return;
    }
    if (new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (new_password !== confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.resetPassword({
        admin_username: admin_username.trim(),
        email: email.trim(),
        new_password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm bg-[#1C1914] border border-[#2A2620] rounded-lg p-8">
        <div className="font-serif text-2xl tracking-wide text-[#E8C88A] mb-1">V Stitch</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A8375] mb-6">Admin Studio</div>
        <div className="mb-6 px-4 py-3 rounded-md bg-[#1F3A24] border border-[#2A5E36] text-[#7FCB8F] text-sm">
          Password updated. Any devices signed in with the old password have been logged out — sign in again below.
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E]"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#1C1914] border border-[#2A2620] rounded-lg p-8">
      <div className="font-serif text-2xl tracking-wide text-[#E8C88A] mb-1">V Stitch</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A8375] mb-6">Reset Admin Password</div>

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

      <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Registered Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#C9A24B]"
      />

      <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">New Password</label>
      <input
        type="password"
        value={new_password}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#C9A24B]"
      />

      <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Confirm New Password</label>
      <input
        type="password"
        value={confirm_password}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm mb-6 focus:outline-none focus:border-[#C9A24B]"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
      >
        {submitting ? 'Updating…' : 'Update password'}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full mt-3 px-4 py-2 rounded-md text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD]"
      >
        Back to sign in
      </button>
    </form>
  );
}

export function LoginScreen({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'

  return (
    <div className="flex h-screen items-center justify-center bg-[#14120F] text-[#EDE7DD]">
      {mode === 'login' ? (
        <LoginForm onLoggedIn={onLoggedIn} onForgotPassword={() => setMode('forgot')} />
      ) : (
        <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
      )}
    </div>
  );
}
