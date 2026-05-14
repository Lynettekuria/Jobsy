import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Profile, Preferences, Application, Schedule, Execution } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  getProfile: async (uid: string): Promise<Profile> => {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, path));
      if (!snap.exists()) throw new Error('Profile not found');
      return { ...snap.data(), uid: snap.id } as Profile;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }
  },
  updateProfile: async (uid: string, profile: Partial<Profile>): Promise<void> => {
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, path), profile, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
  getPreferences: async (uid: string): Promise<Preferences> => {
    const path = `users/${uid}/preferences/main`;
    try {
      const snap = await getDoc(doc(db, path));
      if (!snap.exists()) return { roles: [], location: '', salary: '', type: '' };
      return snap.data() as Preferences;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }
  },
  updatePreferences: async (uid: string, prefs: Partial<Preferences>): Promise<void> => {
    const path = `users/${uid}/preferences/main`;
    try {
      await setDoc(doc(db, path), prefs, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
  getApplications: async (uid: string): Promise<Application[]> => {
    const path = `users/${uid}/applications`;
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Application[];
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }
  },
  createApplication: async (uid: string, app: Partial<Application>): Promise<Application> => {
    const path = `users/${uid}/applications`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...app,
        createdAt: serverTimestamp()
      });
      return { ...app, id: docRef.id } as Application;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      throw e;
    }
  },
  updateApplicationStatus: async (uid: string, appId: string, status: string): Promise<void> => {
    const path = `users/${uid}/applications/${appId}`;
    try {
      await updateDoc(doc(db, path), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
  // New Scheduling API
  getSchedules: async (uid: string): Promise<Schedule[]> => {
    const path = `users/${uid}/schedules`;
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Schedule[];
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }
  },
  createSchedule: async (uid: string, schedule: Partial<Schedule>): Promise<Schedule> => {
    const path = `users/${uid}/schedules`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...schedule,
        createdAt: serverTimestamp()
      });
      return { ...schedule, id: docRef.id } as Schedule;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      throw e;
    }
  },
  updateSchedule: async (uid: string, scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
    const path = `users/${uid}/schedules/${scheduleId}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
  // New Executions (Monitoring) API
  getExecutions: async (uid: string): Promise<Execution[]> => {
    const path = `users/${uid}/executions`;
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Execution[];
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }
  },
};
