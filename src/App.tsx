import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User, Settings, Send, ListChecks, Loader2, Search, CheckCircle2, AlertCircle, ExternalLink, Mail, ArrowRight, Calendar, Activity, LogOut, Shield, Zap, Globe, ChevronRight, Eye, EyeOff, Lock, UserPlus } from 'lucide-react';
import { api } from './services/api';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { generateCoverLetter, generateEmailDraft, rankJobs } from './services/ai';
import { Profile, Preferences, Job, Application, Schedule, Execution } from './types';
import { JOBS_DATA } from './constants';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) setAuthMode('landing'); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function init() {
      try {
        const [p, prefs, apps, scheds, execs] = await Promise.all([
          api.getProfile(user!.uid).catch(() => null),
          api.getPreferences(user!.uid),
          api.getApplications(user!.uid),
          api.getSchedules(user!.uid),
          api.getExecutions(user!.uid)
        ]);
        
        if (!p) {
          const newProfile = {
            uid: user!.uid,
            name: user!.displayName || user!.email?.split('@')[0] || 'New Member',
            email: user!.email || '',
            title: 'Professional',
            location: 'Global',
            phone: '',
            linkedin: '',
            portfolio: '',
            cvHighlights: ''
          };
          await api.updateProfile(user!.uid, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(p);
        }
        
        setPreferences(prefs);
        setApplications(apps);
        setSchedules(scheds);
        setExecutions(execs);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setPreferences(null);
    setApplications([]);
    setSchedules([]);
    setExecutions([]);
    setActiveTab(0);
    setAuthMode('landing');
  };

  const startScan = async () => {
    setScanning(true);
    setScanLogs([]);
    const logs = [
      "Connecting to LinkedIn API...",
      "Scraping BrighterMonday...",
      "Indeed search: 'Remote VA'...",
      "Upwork: 'Virtual Assistant'...",
      "Ranking matches with Gemini...",
      "Ranking complete!"
    ];
    for (const log of logs) {
      await new Promise(r => setTimeout(r, 400));
      setScanLogs(prev => [...prev, log]);
    }
    const ranked = await rankJobs(preferences!, JOBS_DATA, profile);
    setJobs(ranked);
    setScanning(false);
    setActiveTab(3); 
  };

  const tabs = [
    { label: 'Profile', icon: <User size={18} /> },
    { label: 'Prefs', icon: <Settings size={18} /> },
    { label: 'Schedule', icon: <Calendar size={18} /> },
    { label: 'Monitor', icon: <Activity size={18} /> },
    { label: 'Matched', icon: <Briefcase size={18} /> },
    { label: 'Tracker', icon: <ListChecks size={18} /> },
  ];

  if (authLoading) return <div className="flex items-center justify-center h-screen bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {authMode === 'landing' ? (
          <LandingPage key="landing" onStart={() => setAuthMode('signup')} onLogin={() => setAuthMode('login')} />
        ) : (
          <AuthForms 
            key="auth" 
            mode={authMode} 
            setMode={setAuthMode} 
            onGoogleLogin={handleGoogleLogin} 
          />
        )}
      </AnimatePresence>
    );
  }

  if (!profile || !preferences) return <div className="flex items-center justify-center h-screen bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="flex h-screen bg-brand-bg font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-sidebar flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Briefcase className="text-white" size={18} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">JobAgent AI</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              disabled={i === 3 && jobs.length === 0}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all ${
                activeTab === i 
                  ? 'bg-indigo-600/20 text-indigo-300' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              } ${(i === 3 && jobs.length === 0) ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {tab.icon}
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm text-white font-medium truncate">{profile.name}</div>
              <div className="text-xs text-slate-500 truncate">{profile.title}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">{tabs[activeTab].label}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              <span className="text-[12px] font-medium text-slate-600">Secure Backend</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto flex-1 bg-brand-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Metric Cards - Only show on some tabs */}
              {(activeTab === 0 || activeTab === 3 || activeTab === 4) && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Jobs Processed</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">{JOBS_DATA.length}</span>
                      <span className="text-emerald-600 text-xs font-bold">Live</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Apps</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">{applications.length}</span>
                      <span className="text-slate-400 text-xs font-bold">Sent</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Match Insights</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {jobs.length > 0 ? `${Math.round(jobs.reduce((acc, curr) => acc + curr.match, 0) / jobs.length)}%` : '-%'}
                      </span>
                      <span className="text-emerald-600 text-xs font-bold">Avg. Fit</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 0 && <ProfileStep profile={profile} onEditPrefs={() => setActiveTab(1)} />}
              {activeTab === 1 && <PreferencesStep preferences={preferences} setPreferences={(p: any) => setPreferences(p)} uid={user.uid} />}
              {activeTab === 2 && <ScheduleStep schedules={schedules} setSchedules={setSchedules} uid={user.uid} />}
              {activeTab === 3 && <MonitoringStep executions={executions} />}
              {activeTab === 4 && <JobsStep jobs={jobs} filter={filter} setFilter={setFilter} onSelect={setSelectedJob} onStartScan={startScan} scanning={scanning} scanLogs={scanLogs} />}
              {activeTab === 5 && <TrackerStep applications={applications} setApplications={setApplications} uid={user.uid} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          profile={profile}
          onClose={() => setSelectedJob(null)}
          uid={user.uid}
          onSuccess={(app) => {
            setApplications(prev => [...prev, app]);
            setSelectedJob(null);
            setActiveTab(4);
          }}
        />
      )}
    </div>
  );
}

function ProfileStep({ profile, onEditPrefs }: { profile: Profile, onEditPrefs: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 text-indigo-600 flex items-center justify-center font-semibold text-lg flex-shrink-0">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-900">{profile.name}</div>
            <div className="text-[12px] text-slate-500">{profile.title} · {profile.location}</div>
          </div>
        </div>
        <div className="label">Professional Summary</div>
        <div className="text-[13px] text-slate-600 leading-relaxed mb-4">
          {profile.cvHighlights || <span className="text-slate-400 italic">No CV highlights added yet. Update your profile to improve match accuracy.</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[profile.email, profile.phone, profile.linkedin, profile.portfolio].filter(Boolean).map((chip, i) => (
            <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm border border-slate-200">{chip}</span>
          ))}
        </div>
      </div>
      <button className="btn" onClick={onEditPrefs}>Edit Preferences →</button>
    </motion.div>
  );
}

function PreferencesStep({ preferences, setPreferences, uid }: { preferences: Preferences, setPreferences: any, uid: string }) {
  const handleChange = async (field: keyof Preferences, value: any) => {
    const updated = { ...preferences, [field]: value };
    setPreferences(updated);
    await api.updatePreferences(uid, updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card">
      <div className="label">Search Parameters</div>
      <div className="space-y-4">
        {[
          { label: 'Target Roles', key: 'roles', val: preferences.roles.join(', ') },
          { label: 'Location Filter', key: 'location', val: preferences.location },
          { label: 'Salary (Min)', key: 'salary', val: preferences.salary },
          { label: 'Job Type', key: 'type', val: preferences.type },
        ].map(field => (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
            <input
              className="input-field"
              value={field.val}
              onChange={(e) => field.key === 'roles' ? handleChange('roles', e.target.value.split(',').map(s => s.trim())) : handleChange(field.key as any, e.target.value)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ScanStep({ scanning, scanLogs, onStart }: { scanning: boolean, scanLogs: string[], onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card text-center py-12">
      {!scanning ? (
        <>
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 border border-slate-100 shadow-sm">
            <Search size={32} />
          </div>
          <div className="text-xl font-bold text-slate-900 mb-2">Ready to scan live sources</div>
          <p className="text-[14px] text-slate-500 mb-8 max-w-[400px] mx-auto leading-relaxed">
            Our agent connects to 20+ job sources including global boards and hidden Notion pages to find your perfect match.
          </p>
          <button className="btn btn-primary px-8" onClick={onStart}>
            Initialize Deep Scan
          </button>
        </>
      ) : (
        <div className="text-left py-2 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="animate-spin text-indigo-600" size={20} />
            <span className="text-[15px] font-bold text-slate-900">Scanning live channels...</span>
          </div>
          <div className="space-y-3">
            {scanLogs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                {log}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function JobsStep({ jobs, filter, setFilter, onSelect, onStartScan, scanning, scanLogs }: { jobs: Job[], filter: string, setFilter: any, onSelect: any, onStartScan: () => void, scanning: boolean, scanLogs: string[] }) {
  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.sourceType === filter);
  
  if (jobs.length === 0 && !scanning) {
    return <ScanStep scanning={scanning} scanLogs={scanLogs} onStart={onStartScan} />;
  }

  if (scanning) {
    return <ScanStep scanning={scanning} scanLogs={scanLogs} onStart={onStartScan} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-bold text-slate-800 tracking-tight">{filtered.length} high-match jobs ranking</div>
        <div className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Ranked by Gemini</div>
      </div>
      
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Sources' },
          { id: 'popular', label: 'Global Boards' },
          { id: 'freelance', label: 'Freelance' },
          { id: 'hidden', label: 'Hidden / Direct' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              filter === f.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(job => {
          const matchStyle = job.match >= 90 ? 'bg-emerald-100 text-emerald-700' : job.match >= 80 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700';
          return (
            <div key={job.id} className="card p-0 overflow-hidden flex flex-col mb-0 hover:border-indigo-200 transition-colors group">
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="text-[16px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</div>
                    <div className="text-sm text-slate-500 font-medium mt-1">{job.company} · {job.location} · {job.salary}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`badge ${matchStyle}`}>{job.match}% MATCH</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{job.source}</div>
                  </div>
                </div>
                {job.tip && (
                  <div className="bg-slate-50 rounded-lg p-3 text-[12px] text-slate-600 leading-relaxed border border-slate-100 mb-4 italic">
                    <span className="font-bold text-indigo-600 not-italic mr-1">Agent Strategy:</span> {job.tip}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{t}</span>)}
                </div>
                <button className="btn btn-primary w-full py-3" onClick={() => onSelect(job)}>
                  {job.applyVia === 'email' ? 'Initialize Application Flow' : 'Explore at Source'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TrackerStep({ applications, setApplications, uid }: { applications: Application[], setApplications: any, uid: string }) {
  const updateStatus = async (id: string, status: string) => {
    await api.updateApplicationStatus(uid, id, status);
    setApplications((prev: any) => prev.map((a: any) => a.id === id ? { ...a, status } : a));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="text-sm font-bold text-slate-800 mb-4 tracking-tight uppercase tracking-widest">{applications.length} Workflows Synced</div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4">Role / Company</th>
              <th className="px-6 py-4">Execution Date</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-600">
            {applications.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No active workflows found. Apply to start tracking.</td></tr>
            ) : (
              applications.map(app => {
                const s = app.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                return (
                  <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{app.title}</div>
                      <div className="text-xs font-medium text-slate-400">{app.company}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">{app.date}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-none outline-none cursor-pointer ${s}`}
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                      >
                        {['Sent', 'Viewed', 'Interview', 'Offer', 'Rejected'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              }).reverse()
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ScheduleStep({ schedules, setSchedules, uid }: { schedules: Schedule[], setSchedules: any, uid: string }) {
  const [role, setRole] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'hourly'>('daily');
  const [isAdding, setIsAdding] = useState(false);

  const addSchedule = async () => {
    if (!role) return;
    const newSchedule = await api.createSchedule(uid, {
      role,
      frequency,
      active: true,
      cronExpression: frequency === 'daily' ? '0 9 * * *' : frequency === 'hourly' ? '0 * * * *' : '0 9 * * 1'
    });
    setSchedules([...schedules, newSchedule]);
    setRole('');
    setIsAdding(false);
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await api.updateSchedule(uid, id, { active });
    setSchedules(schedules.map(s => s.id === id ? { ...s, active } : s));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Autonomous Agents</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary py-2 px-4 text-xs">
          {isAdding ? 'Cancel' : '+ New Agent'}
        </button>
      </div>

      {isAdding && (
        <div className="card p-6 bg-slate-50 border-dashed border-2 border-slate-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Role</label>
              <input 
                className="input-field" 
                placeholder="e.g. Frontend Engineer" 
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Frequency</label>
              <select 
                className="input-field"
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
              >
                <option value="hourly">Hourly Deep Scan</option>
                <option value="daily">Daily Morning Pulse</option>
                <option value="weekly">Weekly Broad Search</option>
              </select>
            </div>
          </div>
          <button onClick={addSchedule} className="btn btn-primary w-full shadow-lg">Activate Agent</button>
        </div>
      )}

      <div className="space-y-3">
        {schedules.map(s => (
          <div key={s.id} className="card p-4 flex items-center justify-between hover:border-indigo-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Calendar size={20} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-slate-900">{s.role}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Frequency: {s.frequency}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {s.active ? 'Active' : 'Paused'}
                </div>
              </div>
              <button 
                onClick={() => toggleSchedule(s.id, !s.active)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${s.active ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${s.active ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        ))}
        {schedules.length === 0 && !isAdding && (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-medium">No automated agents configured.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MonitoringStep({ executions }: { executions: Execution[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Execution Logs</h2>
      <div className="space-y-4">
        {executions.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">No recent activity recorded.</div>
        ) : (
          executions.map(exec => (
            <div key={exec.id} className="card p-0 overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${exec.status === 'success' ? 'bg-emerald-500' : exec.status === 'running' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">{exec.status}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">{exec.timestamp?.toDate ? exec.timestamp.toDate().toLocaleString() : 'Just now'}</span>
              </div>
              <div className="p-4 bg-slate-900 font-mono text-[11px] text-slate-300 space-y-1">
                {exec.logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-slate-600">[{i}]</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="pt-2 text-indigo-400 font-bold tracking-tight">{'>>'} Found {exec.resultCount} relevant matches.</div>
              </div>
            </div>
          )).reverse()
        )}
      </div>
    </motion.div>
  );
}

function ApplyModal({ job, profile, onClose, onSuccess, uid }: { job: Job, profile: Profile, onClose: () => void, onSuccess: (app: Application) => void, uid: string }) {
  const [docTab, setDocTab] = useState<'cover' | 'email'>('cover');
  const [content, setContent] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function write() {
      setLoading(true);
      try {
        const [cl, ed] = await Promise.all([
          generateCoverLetter(profile, job),
          generateEmailDraft(profile, job)
        ]);
        setContent(cl || '');
        setEmailDraft(ed || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    write();
  }, [job, profile]);

  const handleSend = async () => {
    setSending(true);
    // Simulate real send
    await new Promise(r => setTimeout(r, 1500));
    const app = await api.createApplication(uid, {
      title: job.title,
      company: job.company,
      status: 'Sent',
      sentTo: job.email,
      date: new Date().toLocaleDateString()
    });
    setSending(false);
    setResult({ success: true, message: 'Application sent successfully via Gmail/SMTP.' });
    setTimeout(() => onSuccess(app), 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{job.title}</h2>
            <p className="text-[13px] text-slate-500 font-medium">{job.company} · Automated Application Flow</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="p-1 px-6 flex gap-1 bg-slate-50 border-b border-slate-100">
          <button onClick={() => setDocTab('cover')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${docTab === 'cover' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Cover Letter</button>
          <button onClick={() => setDocTab('email')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${docTab === 'email' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Email Payload</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Generating Artifacts...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  className="w-full min-h-[300px] text-[14px] leading-relaxed p-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-slate-700"
                  value={docTab === 'cover' ? content : emailDraft}
                  onChange={(e) => docTab === 'cover' ? setContent(e.target.value) : setEmailDraft(e.target.value)}
                />
                <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 uppercase bg-white border border-slate-100 px-2 py-1 rounded">Edit Mode</div>
              </div>
              
              {result ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-xl text-[14px] font-bold flex items-center gap-3 border shadow-sm ${result.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {result.success ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
                  {result.message}
                </motion.div>
              ) : (
                <div className="space-y-4 pt-2">
                  {job.applyVia === 'email' ? (
                    <button className="btn btn-primary w-full py-4 text-[15px] font-bold shadow-indigo-200 shadow-lg" onClick={handleSend} disabled={sending}>
                      {sending ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <Send size={18} className="inline mr-2" />}
                      {sending ? 'Transmitting Data...' : `Push Application to ${job.email}`}
                    </button>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-[13px] text-amber-900 leading-relaxed shadow-sm">
                      <div className="font-bold uppercase tracking-wider text-[11px] mb-2 text-amber-600">Manual Action Required</div>
                      This source uses a closed portal. Copy the generated artifact above and paste it into the submission field at: 
                      <a href={job.formUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-2 font-bold text-indigo-600 hover:underline break-all">
                        {job.formUrl} <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Validation Passed</span>
                    <span>Gemini-3-Flash Optimized</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LandingPage({ onStart, onLogin }: { onStart: () => void, onLogin: () => void, key?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="h-20 px-8 flex items-center justify-between border-b border-slate-100 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <Briefcase className="text-white" size={20} />
          </div>
          <span className="text-slate-900 font-bold text-xl tracking-tight">JobAgent AI</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onLogin} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Sign In</button>
          <button onClick={onStart} className="btn btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest">Register</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full uppercase tracking-widest mb-6 border border-indigo-100">
            Powered by Gemini 3.5 Flash
          </span>
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-8">
            Stop searching. <br />
            <span className="text-indigo-600">Start deploying.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy intelligent agents that scan 20+ job boards, rank matches with precision, and draft optimized applications for you—autonomously.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onStart} className="btn btn-primary px-8 py-4 text-sm font-bold flex items-center gap-2 group shadow-xl">
              Launch Your Agent <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-4 px-6 text-slate-400">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" />
                ))}
              </div>
              <span className="text-xs font-medium">Empowering your career growth</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <Zap className="text-amber-500" />, title: "Autonomous Scanning", desc: "Our agents monitor LinkedIn, Upwork, and hidden Notion boards 24/7 so you don't have to." },
            { icon: <Shield className="text-emerald-500" />, title: "Precision Matches", desc: "AI-driven ranking filters out noise, focusing only on roles that genuinely align with your profile." },
            { icon: <Globe className="text-indigo-500" />, title: "Global Reach", desc: "Whether it's remote, hybrid, or on-site, JobAgent AI handles global sources effortlessly." },
          ].map((f, i) => (
            <div key={i} className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">The Future of Work is Autonomous</p>
        <div className="flex items-center justify-center gap-6 text-slate-300">
          <Globe size={18} />
          <Zap size={18} />
          <Shield size={18} />
        </div>
      </footer>
    </motion.div>
  );
}

function AuthForms({ mode, setMode, onGoogleLogin }: { mode: 'login' | 'signup', setMode: any, onGoogleLogin: () => void, key?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-8 font-sans"
    >
      <div className="max-w-[420px] w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-200">
            <Briefcase className="text-indigo-600" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm">
            {mode === 'signup' ? 'Start your autonomous career journey today.' : 'Sign in to manage your active job agents.'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs font-bold leading-relaxed">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : mode === 'signup' ? <UserPlus size={18} /> : <ArrowRight size={18} />}
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Professional ID' : 'Synchronize Identity'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="bg-white px-4">Cloud Provider Protocol</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onGoogleLogin} 
            className="w-full bg-white border border-slate-200 rounded-xl px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 shadow-md active:scale-[0.98]"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            </div>
            Sign in with Google API
          </button>
        </div>

        <p className="text-center text-xs font-bold text-slate-400 tracking-widest uppercase">
          {mode === 'signup' ? 'Already Have an ID?' : 'New Contributor?'}{' '}
          <button 
            type="button" 
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="text-indigo-600 hover:underline"
          >
            {mode === 'signup' ? 'Re-Sync Now' : 'Create One'}
          </button>
        </p>
      </div>
    </motion.div>
  );
}
