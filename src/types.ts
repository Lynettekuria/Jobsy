export interface Profile {
  uid?: string;
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  cvHighlights: string;
}

export interface Preferences {
  roles: string[];
  location: string;
  salary: string;
  type: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  source: string;
  sourceType: 'popular' | 'freelance' | 'hidden';
  applyVia: 'email' | 'form';
  email?: string;
  formUrl?: string;
  match: number;
  tags: string[];
  tip?: string;
}

export interface Application {
  id: string;
  title: string;
  company: string;
  date: string;
  status: string;
  sentTo?: string;
}

export interface Schedule {
  id: string;
  role: string;
  frequency: 'daily' | 'weekly' | 'hourly';
  cronExpression: string;
  active: boolean;
  createdAt: any;
}

export interface Execution {
  id: string;
  scheduleId: string;
  timestamp: any;
  status: 'success' | 'failure' | 'running';
  logs: string[];
  resultCount: number;
}
