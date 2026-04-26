import { useState } from 'react';
import { Sparkles, Mail, Lock, User, PawPrint, Calendar, Weight } from 'lucide-react';

interface ProfilePageProps {
  onNavigate?: (view: string) => void;
  onLogin?: (email?: string, name?: string) => Promise<void>;
}

export function ProfilePage({ onNavigate, onLogin }: ProfilePageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    petName: '',
    petType: 'dog',
    breed: '',
    age: '',
    weight: '',
    healthNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin?.(formData.email, formData.name);
    onNavigate?.('home');
  };

  const handleGuest = async () => {
    await onLogin?.('alex.chen@example.com', 'Alex Chen');
    onNavigate?.('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--cream-white)] via-[var(--light-sage)] to-[var(--muted-orange)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--deep-blue)]">
              Pet-Friendly Travel Planner
            </h1>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Plan safer, smarter trips with your pet
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden">
          {/* Mode Toggle */}
          <div className="border-b border-[var(--border)] p-2 bg-[var(--soft-grey)]">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-white text-[var(--deep-blue)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--deep-blue)]'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-white text-[var(--deep-blue)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--deep-blue)]'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {mode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex.chen@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" strokeWidth={2} />
                    Your Information
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create password"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                  </div>
                </div>

                {/* Pet Info */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3 flex items-center gap-2">
                    <PawPrint className="w-4 h-4" strokeWidth={2} />
                    Pet Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.petName}
                      onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                      placeholder="Pet name"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                    <select
                      value={formData.petType}
                      onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      placeholder="Breed"
                      className="col-span-2 w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                type="submit"
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all"
              >
                Continue as Guest
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
