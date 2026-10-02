import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignUpForm({ onSignUp, onGoToSignIn }) {
  const { registerWithEmail, loginWithGoogle, user, showToast } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in your name, email and password');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(name.trim(), email.trim(), password);
      showToast(`Welcome to AI Study Assistant!`, 'success');
      if (onSignUp) onSignUp(user);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      if (onSignUp) onSignUp(user);
    } catch (err) {
      setErrorMessage(err.message || 'Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#faf7f2] text-stone-900 flex flex-col justify-between p-5 sm:p-7 lg:p-8 select-none relative overflow-hidden font-sans border-l border-stone-200">
      <div className="relative z-10 pt-0.5">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-500">
          Registration
        </span>
        <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight mt-0.5 text-stone-900">
          Create Account
        </h2>
        <p className="text-[11px] sm:text-xs mt-0.5 font-normal leading-relaxed text-stone-600">
          Join AI Study Assistant to upload notes and practice.
        </p>
      </div>

      <div className="relative z-10 my-auto py-0.5 space-y-2">
        {errorMessage && (
          <div className="p-2 rounded-xl border bg-red-50 border-red-200 text-red-700 text-[11px] font-medium">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">or</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="space-y-0.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-stone-700">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-3.5 h-3.5 pointer-events-none text-stone-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-stone-700">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-3.5 h-3.5 pointer-events-none text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-stone-700">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-3.5 h-3.5 pointer-events-none text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-9 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 bg-stone-900 hover:bg-stone-800 text-white"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="relative z-10 text-center pt-2 border-t border-stone-200">
        <p className="text-xs text-stone-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGoToSignIn();
            }}
            className="font-bold hover:underline ml-1 cursor-pointer text-stone-900"
          >
            Sign In →
          </button>
        </p>
      </div>
    </div>
  );
}
