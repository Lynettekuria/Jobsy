import { Profile, Preferences, Application } from '../types';

export const api = {
  getProfile: async (): Promise<Profile> => {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },
  updateProfile: async (profile: Partial<Profile>): Promise<Profile> => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.json();
  },
  getPreferences: async (): Promise<Preferences> => {
    const res = await fetch('/api/preferences');
    return res.json();
  },
  updatePreferences: async (prefs: Partial<Preferences>): Promise<Preferences> => {
    const res = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    return res.json();
  },
  getApplications: async (): Promise<Application[]> => {
    const res = await fetch('/api/applications');
    return res.json();
  },
  createApplication: async (app: Partial<Application>): Promise<Application> => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    });
    return res.json();
  },
  updateApplicationStatus: async (id: number, status: string): Promise<Application> => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};
