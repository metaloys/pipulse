'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // The admin password - in production this would be in environment variable
  const ADMIN_PASSWORD = 'pipulse_admin_2024'; // Change this to your preferred password

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!password) {
        setError('Please enter the admin password');
        return;
      }

      if (password === ADMIN_PASSWORD) {
        // Store auth token in localStorage (valid for this session)
        localStorage.setItem('pipulse_admin_token', 'authenticated');
        router.push('/admin/dashboard');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/50 mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-purple-200">PiPulse Management Portal</p>
        </div>

        {/* Login Card */}
        <Card className="glassmorphism border-white/10 p-8 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <AlertDescription className="text-red-400 ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 transition disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login to Dashboard'}
            </Button>
          </form>

          {/* Security Info */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
            <p className="text-sm text-blue-300">
              <strong>Security Note:</strong> This portal is restricted to PiPulse administrators only.
              All actions are logged and monitored.
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>PiPulse © 2024 | Admin Portal v1.0</p>
        </div>
      </div>
    </div>
  );
}
