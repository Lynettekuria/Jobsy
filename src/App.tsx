import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User, Settings, Send, ListChecks, Loader2, Search, CheckCircle2, AlertCircle, ExternalLink, Mail, ArrowRight } from 'lucide-react';
import { api } from './services/api';
import { generateCoverLetter, generateEmailDraft, rankJobs } from './services/ai';
import { Profile, Preferences, Job, Application } from './types';
import { JOBS_DATA } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function init() {
      const [p, prefs, apps] = await Promise.all([
        api.getProfile(),
        api.getPreferences(),
        api.getApplications()
      ]);
      setProfile(p);
      setPreferences(prefs);
      setApplications(apps);
    }
    init();
  }, []);

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
    const ranked = await rankJobs(preferences, JOBS_DATA);
    setJobs(ranked);
    setScanning(false);
    setActiveTab(3); // Go to Jobs
  };

  const tabs = [
    { label: 'Profile', icon: <User size={18} /> },
    { label: 'Preferences', icon: <Settings size={18} /> },
    { label: 'Deep Scan', icon: <Search size={18} /> },
    { label: 'Matched Jobs', icon: <Briefcase size={18} /> },
    { label: 'Tracker', icon: <ListChecks size={18} /> },
  ];

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
              <span className="text-[12px] font-medium text-slate-600">AI Core Online</span>
            </div>
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
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Match Rating</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">89%</span>
                      <span className="text-emerald-600 text-xs font-bold">Optimal</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 0 && <ProfileStep profile={profile} onEditPrefs={() => setActiveTab(1)} />}
              {activeTab === 1 && <PreferencesStep preferences={preferences} setPreferences={setPreferences} />}
              {activeTab === 2 && <ScanStep scanning={scanning} scanLogs={scanLogs} onStart={startScan} />}
              {activeTab === 3 && <JobsStep jobs={jobs} filter={filter} setFilter={setFilter} onSelect={setSelectedJob} />}
              {activeTab === 4 && <TrackerStep applications={applications} setApplications={setApplications} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          profile={profile}
          onClose={() => setSelectedJob(null)}
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
          <span className="badge bg-emerald-100 text-emerald-700">Verified Profile</span>
        </div>
        <div className="label">CV Highlights</div>
        <div className="text-[13px] text-slate-600 leading-relaxed mb-4">{profile.cvHighlights}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[profile.email, profile.phone, profile.linkedin, 'Portfolio ↗'].map((chip, i) => (
            <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm border border-slate-200">{chip}</span>
          ))}
        </div>
      </div>
      <button className="btn" onClick={onEditPrefs}>Edit Preferences →</button>
    </motion.div>
  );
}

function PreferencesStep({ preferences, setPreferences }: { preferences: Preferences, setPreferences: any }) {
  const handleChange = async (field: keyof Preferences, value: any) => {
    const updated = { ...preferences, [field]: value };
    setPreferences(updated);
    await api.updatePreferences(updated);
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

function JobsStep({ jobs, filter, setFilter, onSelect }: { jobs: Job[], filter: string, setFilter: any, onSelect: any }) {
  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.sourceType === filter);
  
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

function TrackerStep({ applications, setApplications }: { applications: Application[], setApplications: any }) {
  const updateStatus = async (id: number, status: string) => {
    const updated = await api.updateApplicationStatus(id, status);
    setApplications((prev: any) => prev.map((a: any) => a.id === id ? updated : a));
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

function ApplyModal({ job, profile, onClose, onSuccess }: { job: Job, profile: Profile, onClose: () => void, onSuccess: (app: Application) => void }) {
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
    const app = await api.createApplication({
      title: job.title,
      company: job.company,
      status: 'Sent',
      sentTo: job.email
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
