'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Users,
  ListTodo,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Overview', path: '/admin', icon: Home },
    { label: 'Transactions', path: '/admin/transactions', icon: CreditCard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Tasks', path: '/admin/tasks', icon: ListTodo },
    { label: 'Submissions', path: '/admin/submissions', icon: FileText },
    { label: 'Disputes', path: '/admin/disputes', icon: AlertTriangle },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur border-r border-purple-500/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          PiPulse Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-2">
          {navItems.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive(path)
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50'
                  : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => {
            sessionStorage.removeItem('adminAuthenticated');
            window.location.href = '/';
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
