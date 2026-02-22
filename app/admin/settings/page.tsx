'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlatformSettings {
  platform_name: string;
  commission_rate: number;
  min_task_reward: number;
  max_task_reward: number;
  task_approval_timeout: number;
  dispute_resolution_timeout: number;
  feature_tasks_enabled: boolean;
  referral_bonus_enabled: boolean;
  maintenance_mode: boolean;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'PiPulse',
    commission_rate: 10,
    min_task_reward: 1,
    max_task_reward: 100,
    task_approval_timeout: 48,
    dispute_resolution_timeout: 72,
    feature_tasks_enabled: true,
    referral_bonus_enabled: true,
    maintenance_mode: false,
  });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('adminAuthenticated');
      if (!isAuth) {
        router.push('/admin');
      }
    };
    checkAuth();
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData || settings);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);
    setSuccessMessage('');
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setUnsavedChanges(false);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure platform settings and features</p>
        </div>

        {/* Stats Bar */}
        <AdminStatsBar stats={stats || undefined} loading={loading} />

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
            <p className="text-gray-400">Loading settings...</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* General Settings */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>⚙️</span> General Settings
              </h3>

              <div className="space-y-6">
                {/* Platform Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
                  <Input
                    type="text"
                    value={settings.platform_name}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Commission Rate (%)</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.commission_rate}
                      onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                      className="flex-1 bg-slate-700/50 border-slate-600 text-white"
                    />
                    <span className="text-gray-400 text-sm">Currently {settings.commission_rate}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Task Settings */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>📝</span> Task Settings
              </h3>

              <div className="space-y-6">
                {/* Min Task Reward */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Task Reward (π)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings.min_task_reward}
                    onChange={(e) => handleChange('min_task_reward', parseFloat(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                {/* Max Task Reward */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Task Reward (π)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings.max_task_reward}
                    onChange={(e) => handleChange('max_task_reward', parseFloat(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                {/* Task Approval Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Approval Timeout (hours)</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.task_approval_timeout}
                    onChange={(e) => handleChange('task_approval_timeout', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Dispute Settings */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>⚖️</span> Dispute Settings
              </h3>

              <div className="space-y-6">
                {/* Dispute Resolution Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dispute Resolution Timeout (hours)</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.dispute_resolution_timeout}
                    onChange={(e) => handleChange('dispute_resolution_timeout', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Feature Flags */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>🚀</span> Feature Flags
              </h3>

              <div className="space-y-4">
                {/* Featured Tasks */}
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Featured Tasks</p>
                    <p className="text-sm text-gray-400">Allow employers to feature tasks for visibility</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.feature_tasks_enabled}
                      onChange={(e) => handleChange('feature_tasks_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>

                {/* Referral Bonus */}
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Referral Bonus</p>
                    <p className="text-sm text-gray-400">Enable referral rewards for new user signups</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.referral_bonus_enabled}
                      onChange={(e) => handleChange('referral_bonus_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-red-500/10 border-red-500/30 p-6">
              <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h3>

              <div className="space-y-4">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div>
                    <p className="font-medium text-white">Maintenance Mode</p>
                    <p className="text-sm text-gray-400">Disable platform access for all non-admin users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
                  </label>
                </div>

                {settings.maintenance_mode && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                    ⚠️ Maintenance mode is enabled. Users cannot access the platform.
                  </div>
                )}
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={saveSettings}
                disabled={!unsavedChanges}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button
                onClick={() => {
                  fetchData();
                  setUnsavedChanges(false);
                }}
                variant="outline"
                className="flex-1 border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
              >
                Discard Changes
              </Button>
            </div>

            {unsavedChanges && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                <span>You have unsaved changes. Remember to save before leaving.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
