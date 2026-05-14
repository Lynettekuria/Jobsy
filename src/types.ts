export interface Profile {
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
  id: number;
  title: string;
  company: string;
  date: string;
  status: string;
  sentTo?: string;
}
