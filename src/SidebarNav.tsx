/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  Sprout, 
  Droplet, 
  History, 
  User, 
  LayoutDashboard, 
  Users, 
  Cpu, 
  Radio, 
  BellRing, 
  FileText, 
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';

interface SidebarNavProps {
  role: 'user' | 'admin' | 'superadmin';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function SidebarNav({ 
  role, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  userName 
}: SidebarNavProps) {
  
  // Define navigation items based on role
  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'cultivation', label: 'My Cultivation', icon: Sprout },
    { id: 'moisture', label: 'Soil Moisture', icon: Droplet },
    { id: 'history', label: 'Watering History', icon: History },
    { id: 'hardware', label: 'ESP32-CAM Setup', icon: Cpu },
    { id: 'guide', label: 'Growing Guide', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Assigned Users', icon: Users },
    { id: 'admin-devices', label: 'IoT Devices', icon: Cpu },
    { id: 'admin-alerts', label: 'Active Alerts', icon: BellRing },
    { id: 'admin-reports', label: 'Report Center', icon: FileText },
    { id: 'guide', label: 'Growing Guide', icon: Sparkles },
    { id: 'admin-settings', label: 'Settings', icon: Settings }
  ];

  const navItems = role === 'user' ? userNavItems : adminNavItems;

  return (
    <>
      {/* DESKTOP SIDEBAR - Hidden on mobile, sticky on desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 text-zinc-100 min-h-screen p-5 shrink-0 select-none border-r border-zinc-800">
        {/* Header Branding */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-emerald-500 text-zinc-900 p-2 rounded-lg font-black">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest text-white uppercase">SmartMedGrow</h1>
            <p className="text-[10px] text-zinc-400 font-mono">PERSONAL WELLNESS + IOT</p>
          </div>
        </div>

        {/* User context banner */}
        <div className="mb-6 px-3 py-2 bg-zinc-800/40 rounded-lg border border-zinc-800 text-xs">
          <div className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Authenticated As</div>
          <div className="font-bold text-zinc-100 truncate mt-0.5">{userName}</div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase mt-1 tracking-wider">
            {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Medical Admin' : 'Grower User'}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions (Logout) */}
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION - Visible only on mobile screens (max-width: 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 px-2 py-1 z-40 flex overflow-x-auto scrollbar-none justify-start md:justify-around items-center text-zinc-400 select-none gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-bold transition-all cursor-pointer shrink-0 ${
                isActive ? 'text-emerald-400 font-extrabold' : 'hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="truncate max-w-[70px]">{item.label}</span>
            </button>
          );
        })}
        
        {/* Simple Logout tab on mobile for UX completeness */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 py-1.5 px-3 text-red-500 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
