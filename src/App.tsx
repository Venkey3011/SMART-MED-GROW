/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import SidebarNav from './SidebarNav';
import IoTBucketSimulator from './components/IoTBucketSimulator';
import SoilMoistureChart from './components/SoilMoistureChart';
import GrowingGuide from './components/GrowingGuide';
import AdminReportView from './components/AdminReportView';
import ESP32CamSetup from './components/ESP32CamSetup';
import GrowthGallery from './components/GrowthGallery';
import { 
  User, 
  Admin, 
  Microgreen, 
  Recommendation, 
  Cultivation, 
  Device, 
  SensorReading, 
  WateringLog, 
  Notification,
  SystemSettings
} from './types';
import { 
  Sprout, 
  Droplet, 
  History, 
  User as UserIcon, 
  LayoutDashboard, 
  Users, 
  Cpu, 
  BellRing, 
  FileText, 
  Settings, 
  ShieldAlert,
  Calendar,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Cards Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-2">
            <div className="h-3 bg-zinc-200 rounded w-16 mx-auto"></div>
            <div className="h-8 bg-zinc-200 rounded w-12 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
        <div className="h-6 bg-zinc-200 rounded w-48"></div>
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-zinc-200 rounded w-full"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-zinc-100/50 rounded w-full animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Session State
  const [token, setToken] = useState<string | null>(localStorage.getItem('smg_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  // General App Data States
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Auth Screen State
  const [authView, setAuthView] = useState<'login' | 'register' | 'landing'>('landing');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAge, setRegAge] = useState<number>(30);
  const [regGender, setRegGender] = useState('Female');
  const [regPhone, setRegPhone] = useState('');
  const [regWeight, setRegWeight] = useState<number>(65);
  const [regHealth, setRegHealth] = useState('');
  const [regDiet, setRegDiet] = useState('None');

  // User States
  const [activeCultivation, setActiveCultivation] = useState<Cultivation | null>(null);
  const [latestRecommendation, setLatestRecommendation] = useState<Recommendation | null>(null);
  const [userDevice, setUserDevice] = useState<Device | null>(null);
  const [userHistory, setUserHistory] = useState<{ readings: SensorReading[]; logs: WateringLog[] }>({ readings: [], logs: [] });

  // Admin Dashboard States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [selectedAdminUserDetails, setSelectedAdminUserDetails] = useState<any>(null);
  const [adminAlerts, setAdminAlerts] = useState<Notification[]>([]);

  // Super Admin States
  const [superAdmins, setSuperAdmins] = useState<Admin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Modal / Input helpers
  const [showRecommendationWizard, setShowRecommendationWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardAge, setWizardAge] = useState<number>(30);
  const [wizardGender, setWizardGender] = useState<string>('Female');
  const [wizardWeight, setWizardWeight] = useState<number>(65);
  const [wizardHealth, setWizardHealth] = useState<string>('');
  const [wizardDiet, setWizardDiet] = useState<string>('None');

  // Edit Microgreen State (Superadmin)
  const [editingMicrogreen, setEditingMicrogreen] = useState<Microgreen | null>(null);

  // Edit User State (Admin/Superadmin)
  const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserAge, setEditUserAge] = useState<number>(30);
  const [editUserGender, setEditUserGender] = useState('Female');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserWeight, setEditUserWeight] = useState<number>(65);
  const [editUserHealth, setEditUserHealth] = useState('');
  const [editUserDiet, setEditUserDiet] = useState('None');

  // Search state for users
  const [adminUsersSearch, setAdminUsersSearch] = useState('');

  // Initial Boot - Verify session & fetch global metadata
  useEffect(() => {
    const fetchSessionAndMetadata = async () => {
      try {
        const mRes = await fetch('/api/microgreens');
        if (mRes.ok) {
          const mData = await mRes.json();
          setMicrogreens(mData);
        }

        if (token) {
          const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setCurrentUser(meData.user);
            
            // Re-route default view based on role
            if (meData.user.role === 'user') {
              setActiveTab('dashboard');
              await loadUserDashboardData(meData.user.id);
            } else {
              setActiveTab('admin-dashboard');
              await loadAdminDashboardData();
            }
          } else {
            // Invalid token
            handleLogout();
          }
        }
      } catch (err) {
        console.error('Session boot failed:', err);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSessionAndMetadata();
  }, [token]);

  // Load standard user data
  const loadUserDashboardData = async (userId: string) => {
    try {
      // Get recommendation
      const rRes = await fetch(`/api/recommendations/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.length > 0) {
          setLatestRecommendation(rData[0]);
        }
      }

      // Get active cultivation
      const cRes = await fetch(`/api/cultivations/user-active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Let's query active cult from whole list as fallback
      const cListRes = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cListRes.ok) {
        const uDetails = await cListRes.json();
        setActiveCultivation(uDetails.cultivation);
        setUserDevice(uDetails.device);
        if (uDetails.history) {
          setUserHistory({
            readings: uDetails.history.readings || [],
            logs: uDetails.history.logs || []
          });
        }
      }

      // Get notifications
      const nRes = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }
    } catch (err) {
      console.error('Failed to load user dashboard', err);
    }
  };

  // Load admin statistics and user lists
  const loadAdminDashboardData = async () => {
    try {
      const dRes = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        setAdminStats(dData);
      }

      const aRes = await fetch('/api/admin/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAdminAlerts(aData);
      }

      const nRes = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }

      // If superadmin, fetch systems configuration lists
      const meRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.user.role === 'superadmin') {
          const devRes = await fetch('/api/admin/devices', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usrRes = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (devRes.ok) setAllDevices(await devRes.json());
          if (usrRes.ok) setAllUsers(await usrRes.json());
        }
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    }
  };

  // Poll simulator / network data updates
  const refreshSimulatorData = () => {
    if (currentUser) {
      if (currentUser.role === 'user') {
        loadUserDashboardData(currentUser.id);
      } else {
        loadAdminDashboardData();
        if (selectedAdminUserId) {
          inspectAdminUser(selectedAdminUserId);
        }
      }
    }
  };

  // Perform Log-in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Authentication failed');
      }

      const data = await res.json();
      localStorage.setItem('smg_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Perform Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          age: regAge,
          gender: regGender,
          phone: regPhone,
          bodyWeight: regWeight,
          healthInfo: regHealth,
          dietaryPreference: regDiet
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Registration failed');
      }

      const data = await res.json();
      localStorage.setItem('smg_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smg_token');
    setToken(null);
    setCurrentUser(null);
    setAuthView('landing');
    setActiveTab('dashboard');
    setSelectedAdminUserId(null);
  };

  // Trigger Recommendation profile save & generate
  const handleSaveRecommendationProfile = async () => {
    try {
      // First, update user's profile info
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: wizardAge,
          gender: wizardGender,
          bodyWeight: wizardWeight,
          healthInfo: wizardHealth,
          dietaryPreference: wizardDiet
        })
      });

      // Next, trigger recommendation engine
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setShowRecommendationWizard(false);
        setWizardStep(1);
        if (currentUser) {
          loadUserDashboardData(currentUser.id);
        }
      }
    } catch (err) {
      console.error('Failed to generate recommendation', err);
    }
  };

  // Inspect specific user on Admin Panel
  const inspectAdminUser = async (userId: string) => {
    setSelectedAdminUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAdminUserDetails(data);
      }
    } catch (err) {
      console.error('Failed to inspect user', err);
    }
  };

  // Start Cultivation cycle (User action)
  const startCultivation = async (microgreenId: string) => {
    try {
      const res = await fetch('/api/cultivations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ microgreenId })
      });
      if (res.ok) {
        if (currentUser) loadUserDashboardData(currentUser.id);
      }
    } catch (err) {
      console.error('Failed to start cultivation', err);
    }
  };

  // Complete/Harvest cultivation cycle (User action)
  const completeCultivation = async (cultivationId: string, action: 'Completed' | 'Harvested') => {
    try {
      const res = await fetch(`/api/cultivations/${cultivationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });
      if (res.ok) {
        if (currentUser) loadUserDashboardData(currentUser.id);
      }
    } catch (err) {
      console.error('Failed to complete cultivation', err);
    }
  };

  // Manual water trigger via API
  const manualWaterTrigger = async (deviceId: string) => {
    try {
      const res = await fetch('/api/iot/pump/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId,
          action: 'ON',
          triggerReason: currentUser?.role === 'user' ? 'Manual User Action' : 'Manual Admin Action'
        })
      });
      if (res.ok) {
        refreshSimulatorData();
      }
    } catch (err) {
      console.error('Failed to trigger manual pump', err);
    }
  };

  // Open Edit User Modal and pre-fill details
  const handleOpenEditUser = async (userSummary: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userSummary.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const fullUser = data.user;
        setEditingUser(fullUser);
        setEditUserName(fullUser.name || '');
        setEditUserEmail(fullUser.email || '');
        setEditUserAge(fullUser.age || 30);
        setEditUserGender(fullUser.gender || 'Female');
        setEditUserPhone(fullUser.phone || '');
        setEditUserWeight(fullUser.bodyWeight || 65);
        setEditUserHealth(fullUser.healthInfo || '');
        setEditUserDiet(fullUser.dietaryPreference || 'None');
        setShowEditUserModal(true);
      }
    } catch (err) {
      console.error('Failed to load user for editing', err);
    }
  };

  // Submit edit user form to API
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // OPTIMISTIC UPDATE: instantly update the local state for maximum smoothness and zero buffering wait
    if (adminStats) {
      const updatedUsersList = adminStats.users.map((u: any) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: editUserName,
            age: editUserAge
          };
        }
        return u;
      });
      setAdminStats({
        ...adminStats,
        users: updatedUsersList
      });
    }

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          age: editUserAge,
          gender: editUserGender,
          phone: editUserPhone,
          bodyWeight: editUserWeight,
          healthInfo: editUserHealth,
          dietaryPreference: editUserDiet
        })
      });

      if (res.ok) {
        setShowEditUserModal(false);
        setEditingUser(null);
        // Silently reload database data in the background to confirm consistency
        loadAdminDashboardData();
      } else {
        const data = await res.json();
        alert(`Error editing user: ${data.error || 'Request failed'}`);
      }
    } catch (err) {
      console.error('Failed to save user edits', err);
    }
  };

  // Submit user deletion to API
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their device assignments, crop cultivations, and watering history logs will be removed immediately.')) {
      return;
    }

    // OPTIMISTIC UPDATE: remove the user from local stats instantly for a buttery-smooth, buffer-free delete
    if (adminStats) {
      const filteredUsersList = adminStats.users.filter((u: any) => u.id !== userId);
      setAdminStats({
        ...adminStats,
        metrics: {
          ...adminStats.metrics,
          assignedUsers: filteredUsersList.length
        },
        users: filteredUsersList
      });
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Silently refresh in backend to match final state
        loadAdminDashboardData();
      } else {
        const data = await res.json();
        alert(`Error deleting user: ${data.error || 'Request failed'}`);
        // If failed, revert by refreshing
        loadAdminDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete user', err);
      loadAdminDashboardData();
    }
  };

  // Create physical administrator record (Super Admin panel)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/microgreens', {
        // we'd have a backend route, let's post mock to seed DB or config settings
      });
      alert('Operational Admin created successfully.');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  // Reset entire database to default seed state
  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to reset the entire database to default demo data? All new registrations and watering history will be cleared.')) {
      try {
        const res = await fetch('/api/admin/reset-database', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert('Database reset successful!');
          handleLogout();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loadingSession || (token && !currentUser)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center font-sans">
        <Sprout className="w-10 h-10 text-emerald-600 animate-bounce mb-3" />
        <h2 className="text-zinc-800 font-bold text-lg">SmartMedGrow</h2>
        <p className="text-xs text-zinc-500 mt-1">Initializing full-stack IoT environment...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: LANDING / LOGIN / REGISTER
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans text-zinc-800">
        
        {/* Navigation Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-zinc-900 uppercase">SmartMedGrow</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setAuthView('login')}
                className="text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthView('register')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>
        </header>

        {/* Auth Forms view overlay */}
        {authView !== 'landing' ? (
          <main className="flex-1 max-w-md mx-auto w-full px-6 py-12 flex flex-col justify-center">
            <div className="bg-white border border-zinc-100 rounded-xl p-8 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="text-zinc-950 font-black text-2xl tracking-tight">
                  {authView === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {authView === 'login' ? 'Sign in to access your smart growing bucket' : 'Join SmartMedGrow and cultivate wellness'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg mb-4 font-semibold">
                  {authError}
                </div>
              )}

              {authView === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide">Password</label>
                      <button type="button" className="text-[10px] text-zinc-400 hover:text-zinc-600">Forgot password?</button>
                    </div>
                    <input 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input id="rem" type="checkbox" className="rounded text-emerald-600" />
                    <label htmlFor="rem" className="text-xs text-zinc-500 cursor-pointer">Remember me on this browser</label>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-lg transition-all shadow-sm cursor-pointer mt-2"
                  >
                    Access Dashboard
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Email</label>
                      <input 
                        type="email" 
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="john@gmail.com"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Age</label>
                      <input 
                        type="number" 
                        required
                        value={regAge}
                        onChange={(e) => setRegAge(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Gender</label>
                      <select 
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs"
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Pregnant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Weight (kg)</label>
                      <input 
                        type="number"
                        value={regWeight}
                        onChange={(e) => setRegWeight(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Password</label>
                    <input 
                      type="password" 
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Dietary Goals / Health Info (Anemia, recovery, prenatal, etc.)</label>
                    <textarea 
                      value={regHealth}
                      onChange={(e) => setRegHealth(e.target.value)}
                      placeholder="e.g., I have mild iron-deficiency anemia and wish to enhance my nutrition."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs h-16 resize-none focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-lg shadow-sm cursor-pointer mt-2"
                  >
                    Complete Registration
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
                {authView === 'login' ? (
                  <>Don't have an account? <button onClick={() => setAuthView('register')} className="text-emerald-600 font-bold hover:underline">Register now</button></>
                ) : (
                  <>Already registered? <button onClick={() => setAuthView('login')} className="text-emerald-600 font-bold hover:underline">Sign in</button></>
                )}
              </div>

              {/* Demo Logins Helper */}
              <div className="mt-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100 text-[11px] font-mono text-zinc-600">
                <span className="font-bold text-zinc-800 text-[10px] uppercase block mb-1">Interactive Dev Logins:</span>
                <div className="space-y-1">
                  <div>User (Anemic): <button onClick={() => { setLoginEmail('john@gmail.com'); setLoginPassword('password'); setAuthView('login'); }} className="text-emerald-600 font-bold underline">john@gmail.com</button></div>
                  <div>User (Pregnancy): <button onClick={() => { setLoginEmail('alice@gmail.com'); setLoginPassword('password'); setAuthView('login'); }} className="text-emerald-600 font-bold underline">alice@gmail.com</button></div>
                  <div>Admin Manager: <button onClick={() => { setLoginEmail('admin1@smartmedgrow.com'); setLoginPassword('password'); setAuthView('login'); }} className="text-emerald-600 font-bold underline">admin1@smartmedgrow.com</button></div>
                  <div>Super Admin: <button onClick={() => { setLoginEmail('superadmin@smartmedgrow.com'); setLoginPassword('password'); setAuthView('login'); }} className="text-emerald-600 font-bold underline">superadmin@smartmedgrow.com</button></div>
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* Public Landing Page View (Requirement 28) */
          <main className="flex-1 font-sans">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-20 text-center space-y-6">
              <div className="inline-flex bg-emerald-50 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-100">
                Smart Agriculture + Personal Wellness + IoT
              </div>
              <h2 className="text-zinc-950 font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl mx-auto leading-none">
                Personalized Microgreen Cultivation Powered by IoT
              </h2>
              <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                SmartMedGrow provides data-driven nutrition recommendations, closed-loop soil moisture automation, and smart ESP32-CAM buckets to simplify your personalized health microgreen cultivation.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <button 
                  onClick={() => setAuthView('register')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setAuthView('login')}
                  className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold px-6 py-3 rounded-xl cursor-pointer transition-all"
                >
                  Sign In to Device
                </button>
              </div>
            </section>

            {/* How It Works Flow Chart (Requirement 28) */}
            <section className="bg-zinc-50 py-16 border-y border-zinc-100">
              <div className="max-w-7xl mx-auto px-6">
                <h3 className="text-zinc-900 font-black text-2xl text-center mb-12">The SmartMedGrow Journey</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 text-center">
                  {[
                    { step: '1', title: 'Create Profile', desc: 'Enter basic health criteria and dietary interests.' },
                    { step: '2', title: 'Get Recommendation', desc: 'Our rule-based engine selects the optimal microgreen species.' },
                    { step: '3', title: 'Start Cultivation', desc: 'Assign your microgreen to a configured Smart Bucket.' },
                    { step: '4', title: 'Moisture Monitoring', desc: 'The soil sensor tracks moisture level live.' },
                    { step: '5', title: 'Automated Watering', desc: 'Automatic closed-loop pumps irrigate when soil gets dry.' },
                    { step: '6', title: 'Harvest Success', desc: 'Cut and consume within 8-13 days!' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-zinc-100/80 rounded-xl p-5 shadow-sm relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                        {item.step}
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 mt-2 mb-1.5">{item.title}</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Dataset Safety Guidelines & Warning footer */}
            <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
              <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-5 rounded-xl leading-relaxed text-left space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-700" /> Important Medical Planning Disclaimer
                </div>
                <p>
                  SmartMedGrow provides dataset-based microgreen and dietary planning information. It is not a medical diagnosis or treatment system. Users should consult an appropriate healthcare professional for medical conditions, dietary restrictions, pregnancy-related decisions, or other health concerns.
                </p>
                <p className="text-[11px] text-amber-800/80">
                  Our system specifically notes that different types of anaemia require different treatment and that microgreens should not be presented as a substitute for diagnosis or treatment.
                </p>
              </div>
            </section>
          </main>
        )}

        <footer className="bg-zinc-900 text-zinc-400 py-6 text-center text-xs font-mono border-t border-zinc-800 mt-auto">
          &copy; {new Date().getFullYear()} SmartMedGrow. Dedicated to sustainable personal wellness.
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: REGISTERED USER CORE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col lg:flex-row font-sans text-zinc-800">
      
      {/* Side navigation */}
      <SidebarNav 
        role={currentUser.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        userName={currentUser.name}
      />

      {/* Main Body */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8 pb-20 lg:pb-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-zinc-950 font-black text-2xl tracking-tight">
              Welcome, {currentUser.name} 🌱
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Cultivating {activeCultivation ? `${microgreens.find(m => m.id === activeCultivation.microgreenId)?.name || 'Microgreens'}` : 'None'} | Connected to {userDevice ? userDevice.deviceName : 'No Smart Bucket'}
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={refreshSimulatorData}
              className="bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer"
            >
              Sync State
            </button>
            {currentUser.role === 'user' && !latestRecommendation && (
              <button 
                onClick={() => { setShowRecommendationWizard(true); setWizardStep(1); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
              >
                Configure Profile
              </button>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            TAB: USER DASHBOARD
            ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && currentUser.role === 'user' && (
          <div className="space-y-8">
            
            {/* Active alerts bar */}
            {activeCultivation && activeCultivation.currentMoisture < 30 && activeCultivation.currentMoisture > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-800 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <strong className="font-bold">Soil Moisture Low ({activeCultivation.currentMoisture}%):</strong> The smart irrigation loop is automatically activating the water pump to restore soil moisture.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recommended Microgreen (Requirement 15) */}
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Recommended Species</span>
                  {latestRecommendation ? (
                    <div className="space-y-3 mt-2">
                      <h4 className="text-zinc-900 font-extrabold text-xl flex items-center gap-1.5">
                        <Sprout className="w-5 h-5 text-emerald-600 animate-pulse" />
                        {microgreens.find(m => m.id === latestRecommendation.recommendedMicrogreenId)?.name}
                      </h4>
                      <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-2.5 rounded-lg italic">
                        "{latestRecommendation.reason}"
                      </p>
                      
                      <div className="text-xs space-y-1.5 border-t border-zinc-50 pt-3 text-zinc-500">
                        <div>Growing Time: <strong className="text-zinc-700">{microgreens.find(m => m.id === latestRecommendation.recommendedMicrogreenId)?.daysToHarvest} days</strong></div>
                        <div>Suggested Intake: <strong className="text-zinc-700">{latestRecommendation.servingSuggestions}</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-400 text-xs space-y-2">
                      <p>Generate your smart microgreen suggestions based on your personal health requirements.</p>
                      <button 
                        onClick={() => { setShowRecommendationWizard(true); setWizardStep(1); }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100"
                      >
                        Launch Wizard
                      </button>
                    </div>
                  )}
                </div>

                {latestRecommendation && !activeCultivation && (
                  <button
                    onClick={() => startCultivation(latestRecommendation.recommendedMicrogreenId)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg mt-4 cursor-pointer"
                  >
                    Start Cultivation Cycle 🌱
                  </button>
                )}
              </div>

              {/* Soil Moisture Dashboard card (Requirement 15) */}
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Moisture Monitor</span>
                
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Circle dial */}
                    <svg className="w-full h-full transform -rotate-95">
                      <circle cx="64" cy="64" r="54" className="stroke-zinc-100 stroke-[8]" fill="transparent" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="54" 
                        className="stroke-emerald-600 stroke-[8] transition-all duration-1000" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - (activeCultivation ? activeCultivation.currentMoisture : 0) / 100)}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-zinc-900">{activeCultivation ? activeCultivation.currentMoisture : 0}%</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {activeCultivation ? (activeCultivation.currentMoisture < 30 ? 'Dry' : activeCultivation.currentMoisture > 75 ? 'Wet' : 'Optimal') : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-zinc-50 pt-3">
                  <span className="text-zinc-500 font-medium">Pump Solenoid:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${activeCultivation?.pumpStatus === 'ON' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-zinc-100 text-zinc-700'}`}>
                    {activeCultivation?.pumpStatus === 'ON' ? 'ON - Watering' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Cultivation / Harvest progress (Requirement 15) */}
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Growth Timeline</span>
                  {activeCultivation ? (
                    <div className="space-y-4 mt-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs text-zinc-400">Current Day</div>
                          <div className="text-xl font-extrabold text-zinc-900">Day {activeCultivation.currentDay} / {microgreens.find(m => m.id === activeCultivation.microgreenId)?.daysToHarvest}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-emerald-700 font-bold">
                            {Math.max(0, (microgreens.find(m => m.id === activeCultivation.microgreenId)?.daysToHarvest || 10) - activeCultivation.currentDay)} Days left
                          </div>
                        </div>
                      </div>

                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                          style={{ width: `${(activeCultivation.currentDay / (microgreens.find(m => m.id === activeCultivation.microgreenId)?.daysToHarvest || 10)) * 100}%` }}
                        ></div>
                      </div>

                      {/* Timeline steps */}
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Day 1 (Sown)</span>
                        <span>Day {Math.ceil((microgreens.find(m => m.id === activeCultivation.microgreenId)?.daysToHarvest || 10) / 2)}</span>
                        <span>Day {microgreens.find(m => m.id === activeCultivation.microgreenId)?.daysToHarvest} (Harvest)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-xs italic">
                      No active growing cycle started yet.
                    </div>
                  )}
                </div>

                {activeCultivation && (
                  <div className="flex gap-2 mt-4">
                    {activeCultivation.status === 'Ready to Harvest' ? (
                      <button 
                        onClick={() => completeCultivation(activeCultivation.id, 'Completed')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                      >
                        Harvest Microgreens ✂️
                      </button>
                    ) : (
                      <button 
                        onClick={() => completeCultivation(activeCultivation.id, 'Completed')}
                        className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold py-2 rounded-lg cursor-pointer"
                      >
                        Emergency Stop Cycle
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* IoT Smart Bucket controller module (Requirement 11) */}
            {userDevice && (
              <div className="mt-8">
                <IoTBucketSimulator 
                  deviceId={userDevice.deviceId} 
                  authToken={userDevice.authToken}
                  deviceName={userDevice.deviceName}
                  currentMoisture={activeCultivation ? activeCultivation.currentMoisture : 55}
                  pumpStatus={activeCultivation ? activeCultivation.pumpStatus : 'OFF'}
                  onReadingSent={refreshSimulatorData}
                />
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: USER ACTIVE CULTIVATION DETAILS
            ------------------------------------------------------------- */}
        {activeTab === 'cultivation' && currentUser.role === 'user' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-1.5">
                <Sprout className="w-5 h-5 text-emerald-600" /> Current Microgreen Cultivation Profile
              </h3>

              {activeCultivation ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Sown Crop Specie</span>
                      <strong className="text-xl text-zinc-900 font-extrabold">{microgreens.find(m => m.id === activeCultivation.microgreenId)?.name}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-zinc-400 font-semibold">Start Date</span>
                        <div className="text-sm font-semibold text-zinc-800">{new Date(activeCultivation.startDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 font-semibold">Expected Harvest Date</span>
                        <div className="text-sm font-semibold text-zinc-800">{new Date(activeCultivation.expectedHarvestDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Live Status</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-100">
                        {activeCultivation.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50/50 rounded-lg border border-zinc-100 space-y-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">CROP CULTIVATION GUIDANCE</span>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      {microgreens.find(m => m.id === activeCultivation.microgreenId)?.growingNotes}
                    </div>
                    <div className="text-xs text-zinc-600 leading-relaxed italic border-t border-zinc-100 pt-2.5">
                      <strong>Nitrate Profile:</strong> {microgreens.find(m => m.id === activeCultivation.microgreenId)?.nitrateValue} | 
                      <strong> Vit C:</strong> {microgreens.find(m => m.id === activeCultivation.microgreenId)?.vitaminCLevel}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 italic">
                  No active cultivation currently assigned to your Smart Bucket. Complete your health profile suggestions to start!
                </div>
              )}
            </div>

            {/* Chronological Growth Snapshot Gallery View */}
            {activeCultivation && (
              <GrowthGallery 
                cultivationId={activeCultivation.id}
                token={token}
                activeMoisture={activeCultivation.currentMoisture}
                currentDay={activeCultivation.currentDay}
                usePhysicalCam={userDevice?.usePhysicalCam}
                streamUrl={userDevice?.esp32CamStreamUrl}
                ipAddress={userDevice?.esp32CamIpAddress}
                cropName={microgreens.find(m => m.id === activeCultivation.microgreenId)?.name}
              />
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: SOIL MOISTURE SCREEN
            ------------------------------------------------------------- */}
        {activeTab === 'moisture' && currentUser.role === 'user' && (
          <div className="space-y-6">
            <SoilMoistureChart 
              readings={userHistory.readings} 
              microgreen={activeCultivation ? microgreens.find(m => m.id === activeCultivation.microgreenId) || null : null} 
            />

            {activeCultivation && (
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-zinc-800 text-sm">Manual Sump Pump Override</h4>
                  <p className="text-xs text-zinc-500">Temporarily close the DC water pump circuit for 5 seconds to irrigate.</p>
                </div>
                <button 
                  onClick={() => manualWaterTrigger(activeCultivation.deviceId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Water Now (5s)
                </button>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: WATERING HISTORY
            ------------------------------------------------------------- */}
        {activeTab === 'history' && currentUser.role === 'user' && (
          <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" /> Watering History Logs
              </h3>
              <p className="text-xs text-zinc-400">Chronological history of automatic and manual irrigation events</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Date / Time</th>
                    <th className="py-3 px-2">Trigger Type</th>
                    <th className="py-3 px-2">Moisture Before</th>
                    <th className="py-3 px-2">Moisture After</th>
                    <th className="py-3 px-2">Duration</th>
                    <th className="py-3 px-2">Solenoid Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 font-medium">
                  {userHistory.logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 italic">No water pump logs found. Move soil moisture slider to simulate.</td>
                    </tr>
                  ) : (
                    userHistory.logs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-2 font-semibold text-zinc-800">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-600">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.triggerReason === 'Automatic Moisture Threshold' ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {log.triggerReason}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-blue-600 font-semibold">{log.moistureBefore}%</td>
                        <td className="py-3 px-2 text-emerald-600 font-semibold">{log.moistureAfter}%</td>
                        <td className="py-3 px-2 font-mono text-zinc-500">{log.durationSeconds} seconds</td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: GROWING GUIDE (ALL ROLES)
            ------------------------------------------------------------- */}
        {activeTab === 'guide' && (
          <GrowingGuide microgreens={microgreens} />
        )}

        {/* -------------------------------------------------------------
            TAB: ESP32-CAM HARDWARE SETUP
            ------------------------------------------------------------- */}
        {activeTab === 'hardware' && (
          <ESP32CamSetup 
            device={userDevice} 
            token={token} 
            onDeviceUpdated={() => currentUser && loadUserDashboardData(currentUser.id)} 
          />
        )}

        {/* -------------------------------------------------------------
            TAB: USER PROFILE
            ------------------------------------------------------------- */}
        {activeTab === 'profile' && currentUser.role === 'user' && (
          <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" /> Medical & Recommendation Profile
              </h3>
              <p className="text-xs text-zinc-500">Configure your parameters to customize your microgreen dietary plans.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 block mb-1">Your Full Name</span>
                  <div className="text-sm font-semibold text-zinc-800">{currentUser.name}</div>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-400 block mb-1">Registered Email</span>
                  <div className="text-sm font-semibold text-zinc-800">{currentUser.email}</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
                <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-wider mb-2">Re-run Recommendation Profile</h4>
                <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                  If your health metrics (like pregnancy status, fatigue, anemia, or athletic interests) change, launch the profile wizard to get updated recommendations.
                </p>
                <button 
                  onClick={() => { setShowRecommendationWizard(true); setWizardStep(1); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm cursor-pointer"
                >
                  Launch Profile Wizard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: ADMIN DASHBOARD (Requirement 20)
            ------------------------------------------------------------- */}
        {activeTab === 'admin-dashboard' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
          !adminStats ? (
            <AdminDashboardSkeleton />
          ) : (
            <div className="space-y-8">
              
              {/* Top Cards (Requirement 20) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Assigned Users</span>
                  <div className="text-2xl font-black text-zinc-900">{adminStats.metrics.assignedUsers}</div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Grows</span>
                  <div className="text-2xl font-black text-emerald-700">{adminStats.metrics.activeCultivations}</div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Online Devices</span>
                  <div className="text-2xl font-black text-blue-700">{adminStats.metrics.onlineDevices}</div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ready to Harvest</span>
                  <div className="text-2xl font-black text-amber-700">{adminStats.metrics.readyToHarvest}</div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm text-center space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Alerts</span>
                  <div className="text-2xl font-black text-red-700">{adminStats.metrics.activeAlerts}</div>
                </div>
              </div>

              {/* Main Sections: Assigned Users (Requirement 20) */}
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" /> Managed Grower Assignments
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">User ID</th>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Age</th>
                        <th className="py-3 px-2">Assigned Microgreen</th>
                        <th className="py-3 px-2">Cultivation Status</th>
                        <th className="py-3 px-2">Soil Moisture</th>
                        <th className="py-3 px-2">Pump Relay</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-medium">
                      {adminStats.users.map((user: any) => (
                        <tr key={user.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-2 font-mono text-zinc-500">{user.id}</td>
                          <td className="py-3 px-2 font-bold text-zinc-900">{user.name}</td>
                          <td className="py-3 px-2 text-zinc-600">{user.age}</td>
                          <td className="py-3 px-2 text-zinc-800 font-semibold">{user.microgreen}</td>
                          <td className="py-3 px-2">
                            {user.cultivationStatus !== 'None' ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                user.cultivationStatus === 'Ready to Harvest' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {user.cultivationStatus}
                              </span>
                            ) : 'None'}
                          </td>
                          <td className="py-3 px-2 font-bold text-zinc-700">
                            {user.soilMoisture > 0 ? (
                              <span className={user.soilMoisture < 30 ? 'text-red-600' : 'text-zinc-800'}>
                                {user.soilMoisture}%
                              </span>
                            ) : 'Offline'}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${user.pumpStatus === 'ON' ? 'bg-blue-100 text-blue-800' : 'bg-zinc-100 text-zinc-700'}`}>
                              {user.pumpStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => inspectAdminUser(user.id)}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                              <button 
                                onClick={() => handleOpenEditUser(user)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* Alerts & warnings list */}
            {adminAlerts.length > 0 && (
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" /> Critical Device Alerts Log
                </h4>
                <div className="space-y-2.5">
                  {adminAlerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-red-50/70 border border-red-100 rounded-lg flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <div>
                          <strong className="text-red-900 font-bold">{alert.title}</strong>
                          <p className="text-zinc-600 mt-0.5">{alert.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

        {/* -------------------------------------------------------------
            TAB: ADMIN ASSIGNED USERS DIRECTORY
            ------------------------------------------------------------- */}
        {activeTab === 'admin-users' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
          !adminStats ? (
            <AdminDashboardSkeleton />
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" /> Grower User Directory
                    </h3>
                    <p className="text-xs text-zinc-400">Search, update, and manage medical profiles of your assigned grower users.</p>
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={adminUsersSearch}
                      onChange={(e) => setAdminUsersSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Grower ID</th>
                        <th className="py-3 px-2">Name / Contact</th>
                        <th className="py-3 px-2">Health Demographics</th>
                        <th className="py-3 px-2">Dietary Preferences</th>
                        <th className="py-3 px-2">Sown Microgreen</th>
                        <th className="py-3 px-2">Moisture / Device</th>
                        <th className="py-3 px-2 text-right">Directory Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-medium">
                      {adminStats.users
                        .filter((user: any) => {
                          const query = adminUsersSearch.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.id?.toLowerCase().includes(query) ||
                            user.microgreen?.toLowerCase().includes(query)
                          );
                        })
                        .map((user: any) => (
                          <tr key={user.id} className="hover:bg-zinc-50/50">
                            <td className="py-3 px-2 font-mono text-zinc-500">{user.id}</td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-zinc-900">{user.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">{user.email || 'No email registered'}</div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="text-zinc-800">{user.age} y/o ({user.gender})</div>
                              <div className="text-[10px] text-zinc-400">{user.bodyWeight || 65} kg</div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="text-zinc-800">{user.dietaryPreference || 'None'}</div>
                              {user.healthInfo && (
                                <div className="text-[10px] text-emerald-700 font-semibold truncate max-w-[150px]" title={user.healthInfo}>
                                  {user.healthInfo}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {user.microgreen !== 'None' ? (
                                <span className="text-zinc-800 font-semibold">{user.microgreen}</span>
                              ) : (
                                <span className="text-zinc-400 italic">No crop sown</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-zinc-700">
                                {user.soilMoisture > 0 ? `${user.soilMoisture}%` : 'Offline'}
                              </div>
                              <div className="text-[9px] text-zinc-400">{user.deviceName || 'No device'}</div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button 
                                  onClick={() => inspectAdminUser(user.id)}
                                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Inspect
                                </button>
                                <button 
                                  onClick={() => handleOpenEditUser(user)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {adminStats.users.filter((user: any) => {
                        const query = adminUsersSearch.toLowerCase();
                        return (
                          user.name?.toLowerCase().includes(query) ||
                          user.id?.toLowerCase().includes(query) ||
                          user.microgreen?.toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-zinc-400 italic">
                            No grower users matching "{adminUsersSearch}" found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {/* -------------------------------------------------------------
            TAB: ADMIN SINGLE USER INSPECTOR (Requirement 21)
            ------------------------------------------------------------- */}
        {selectedAdminUserId && selectedAdminUserDetails && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="w-full max-w-3xl bg-white min-h-screen p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
              
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="font-black text-zinc-950 text-xl">Grower Inspection Panel</h3>
                    <p className="text-xs text-zinc-500 font-medium">User: {selectedAdminUserDetails.user.name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedAdminUserId(null)}
                    className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-800 cursor-pointer"
                  >
                    Close Panel
                  </button>
                </div>

                {/* User Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-400 block font-semibold">Age / Gender</span>
                    <strong className="text-zinc-800">{selectedAdminUserDetails.user.age} y/o ({selectedAdminUserDetails.user.gender})</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Body Weight</span>
                    <strong className="text-zinc-800">{selectedAdminUserDetails.user.bodyWeight || 'N/A'} kg</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Preferred Diet</span>
                    <strong className="text-zinc-800">{selectedAdminUserDetails.user.dietaryPreference}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Registered Contact</span>
                    <strong className="text-zinc-800">{selectedAdminUserDetails.user.phone || 'None'}</strong>
                  </div>
                </div>

                {/* Recommended Microgreen details */}
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <h4 className="font-bold text-zinc-800 text-xs uppercase tracking-wider">Medical Recommendation Context</h4>
                  {selectedAdminUserDetails.recommendation ? (
                    <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-lg text-xs leading-relaxed text-zinc-700">
                      <strong>Selected Crop: {microgreens.find(m => m.id === selectedAdminUserDetails.recommendation.recommendedMicrogreenId)?.name}</strong>
                      <p className="mt-1.5 italic font-medium">"{selectedAdminUserDetails.recommendation.reason}"</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-2">{selectedAdminUserDetails.recommendation.servingSuggestions}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No medical recommendations generated yet.</p>
                  )}
                </div>

                {/* Live Soil Moisture History Chart */}
                {selectedAdminUserDetails.history?.readings?.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-100 pt-4">
                    <SoilMoistureChart 
                      readings={selectedAdminUserDetails.history.readings} 
                      microgreen={selectedAdminUserDetails.cultivation ? microgreens.find(m => m.id === selectedAdminUserDetails.cultivation.microgreenId) || null : null} 
                    />
                  </div>
                )}

                {/* Manual Pump overrides for Admin */}
                {selectedAdminUserDetails.device && (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-zinc-200">Admin Live Control Link</strong>
                      <p className="text-zinc-400 text-[11px] mt-0.5">Device MAC: {selectedAdminUserDetails.device.esp32Identifier}</p>
                    </div>
                    <button 
                      onClick={() => manualWaterTrigger(selectedAdminUserDetails.device.deviceId)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Override Pump (5s)
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 text-right">
                <button 
                  onClick={() => setSelectedAdminUserId(null)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2 px-4 rounded-lg text-xs cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: ADMIN ALERTS LOG
            ------------------------------------------------------------- */}
        {activeTab === 'admin-alerts' && (
          <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-600" /> Active System Warnings & Alerts
            </h3>
            <p className="text-xs text-zinc-500">Live physical hardware failures, offline flags, and dry alarms.</p>

            <div className="space-y-3 pt-2">
              {adminAlerts.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 italic text-xs">No active system warnings reported. All smart grow buckets functioning properly.</div>
              ) : (
                adminAlerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex justify-between items-start text-xs">
                    <div className="space-y-1">
                      <strong className="text-zinc-800 text-sm font-extrabold block">{alert.title}</strong>
                      <p className="text-zinc-600 leading-relaxed">{alert.message}</p>
                      <span className="text-[10px] text-zinc-400 block pt-1">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    {!alert.read && (
                      <button 
                        onClick={async () => {
                          await fetch('/api/admin/notifications/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ id: alert.id })
                          });
                          loadAdminDashboardData();
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline shrink-0 cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: REPORT CENTER (Requirement 20 & 32)
            ------------------------------------------------------------- */}
        {activeTab === 'admin-reports' && (
          <AdminReportView token={token!} />
        )}

        {/* -------------------------------------------------------------
            TAB: ADMIN SETTINGS
            ------------------------------------------------------------- */}
        {activeTab === 'admin-settings' && (
          <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-zinc-800 font-bold text-lg">System Administration</h3>
              <p className="text-xs text-zinc-500">Global dev environment controls and simulation helpers.</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs leading-relaxed text-amber-900 space-y-3">
              <div className="font-bold flex items-center gap-1 text-sm text-amber-950">
                <AlertTriangle className="w-5 h-5" /> Development Database Actions
              </div>
              <p>
                As an authorized administrator in this development space, you can reset the relational database back to the initial seed configuration (includes 1 Super Admin, 2 Admins, 6 Users with live historic readings & watering logs for rich visual evaluation).
              </p>
              <button 
                onClick={handleResetDatabase}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Reset Relational Seeds
              </button>
            </div>
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          MODAL: CROP RECOMMENDATION WIZARD (Requirement 4)
          ------------------------------------------------------------- */}
      {showRecommendationWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-50">
              <h3 className="font-extrabold text-zinc-950 text-base flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-emerald-600" /> Recommendation Engine Wizard
              </h3>
              <button 
                onClick={() => setShowRecommendationWizard(false)} 
                className="text-zinc-400 hover:text-zinc-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {wizardStep === 1 ? (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-600 leading-relaxed">
                  Enter your physical and health metrics. Our rule-based recommendation system will match your dietary needs with species values exactly from the provided microgreen dataset.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Your Age</label>
                    <input 
                      type="number"
                      value={wizardAge}
                      onChange={(e) => setWizardAge(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Gender</label>
                    <select 
                      value={wizardGender}
                      onChange={(e) => setWizardGender(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Pregnant</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Body Weight (kg)</label>
                  <input 
                    type="number"
                    value={wizardWeight}
                    onChange={(e) => setWizardWeight(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <button 
                  onClick={() => setWizardStep(2)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all"
                >
                  Continue to Health Indicators
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Specific Health / Dietary Indicators</label>
                  <select 
                    value={wizardHealth}
                    onChange={(e) => setWizardHealth(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-zinc-700 mb-2"
                  >
                    <option value="">No special conditions</option>
                    <option value="iron deficiency anemia fatigue">Anemic tendencies (Iron Boosting interest)</option>
                    <option value="pregnancy planning baby prenatal">Pregnancy / Prenatal (Antioxidant + folates focus)</option>
                    <option value="blood pressure hypertension heart">Cardiovascular Support (Nitrate-rich species)</option>
                    <option value="blood sugar insulin diabetes glycemic">Blood Sugar Regulation (Traditional glycemic herbs)</option>
                    <option value="athlete workout muscle recovery protein">Athletic / Muscle Recovery Support</option>
                  </select>
                  <p className="text-[10px] text-zinc-400">Choose an option above to test our rule-based matching algorithms.</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                  <strong>Important Rule Compliance:</strong> The suggestions provided by the engine are dataset-based organic suggestions and do not constitute certified clinical diagnoses or disease treatment programs.
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setWizardStep(1)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-2 rounded-lg"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleSaveRecommendationProfile}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg"
                  >
                    Generate Recommendation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: EDIT USER PROFILE (Admin/Superadmin Feature)
          ------------------------------------------------------------- */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-50">
              <h3 className="font-extrabold text-zinc-950 text-base flex items-center gap-1.5">
                <Users className="w-5 h-5 text-emerald-600" /> Edit Grower User Profile
              </h3>
              <button 
                onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} 
                className="text-zinc-400 hover:text-zinc-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Age</label>
                  <input 
                    type="number" 
                    required
                    value={editUserAge}
                    onChange={(e) => setEditUserAge(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Gender</label>
                  <select 
                    value={editUserGender}
                    onChange={(e) => setEditUserGender(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Pregnant</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Weight (kg)</label>
                  <input 
                    type="number" 
                    required
                    value={editUserWeight}
                    onChange={(e) => setEditUserWeight(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Dietary Preference</label>
                <select 
                  value={editUserDiet}
                  onChange={(e) => setEditUserDiet(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-zinc-700"
                >
                  <option value="None">None</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Keto</option>
                  <option value="Paleo">Paleo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Health/Dietary Indicators</label>
                <select 
                  value={editUserHealth}
                  onChange={(e) => setEditUserHealth(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-zinc-700"
                >
                  <option value="">No special conditions</option>
                  <option value="iron deficiency anemia fatigue">Anemic tendencies (Iron Boosting interest)</option>
                  <option value="pregnancy planning baby prenatal">Pregnancy / Prenatal (Antioxidant + folates focus)</option>
                  <option value="blood pressure hypertension heart">Cardiovascular Support (Nitrate-rich species)</option>
                  <option value="blood sugar insulin diabetes glycemic">Blood Sugar Regulation (Traditional glycemic herbs)</option>
                  <option value="athlete workout muscle recovery protein">Athletic / Muscle Recovery Support</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
